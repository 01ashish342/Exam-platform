const prisma = require("../config/db");

// @route POST /api/attempts/start/:examId  (STUDENT)
const startAttempt = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: { select: { id: true, text: true } } },
        },
      },
    });
    if (!exam || !exam.isPublished) {
      return res.status(404).json({ message: "Exam not found or not published" });
    }

    const existing = await prisma.attempt.findFirst({
      where: { userId: req.user.id, examId, status: "IN_PROGRESS" },
    });
    if (existing) {
      return res.json({ attemptId: existing.id, exam, resumed: true });
    }

    const attempt = await prisma.attempt.create({
      data: { userId: req.user.id, examId },
    });

    res.status(201).json({ attemptId: attempt.id, exam, resumed: false });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/attempts/:attemptId/answer  (STUDENT)
const submitAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptionId, timeTakenSec } = req.body;

    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.userId !== req.user.id) return res.status(403).json({ message: "Not your attempt" });
    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "Attempt already submitted" });
    }

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ message: "Question not found" });

    let isCorrect = null;
    if (selectedOptionId) {
      isCorrect = selectedOptionId === question.correctOptionId;
    }

    const response = await prisma.response.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: {
        selectedOptionId: selectedOptionId || null,
        isCorrect,
        timeTakenSec: { increment: timeTakenSec || 0 },
        answeredAt: selectedOptionId ? new Date() : null,
      },
      create: {
        attemptId,
        questionId,
        selectedOptionId: selectedOptionId || null,
        isCorrect,
        timeTakenSec: timeTakenSec || 0,
        answeredAt: selectedOptionId ? new Date() : null,
      },
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
};

// @route POST /api/attempts/:attemptId/submit  (STUDENT)
const submitAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { autoSubmitted } = req.body;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { exam: true, responses: true },
    });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.userId !== req.user.id) return res.status(403).json({ message: "Not your attempt" });
    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "Attempt already submitted" });
    }

    const totalQuestions = await prisma.question.count({ where: { examId: attempt.examId } });

    const correctCount = attempt.responses.filter((r) => r.isCorrect === true).length;
    const wrongCount = attempt.responses.filter((r) => r.isCorrect === false).length;
    const attemptedCount = correctCount + wrongCount;
    const skippedCount = totalQuestions - attemptedCount;

    const totalScore =
      correctCount * attempt.exam.marksPerQ - wrongCount * attempt.exam.negativeMarks;

    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    const totalTimeSec = attempt.responses.reduce((sum, r) => sum + r.timeTakenSec, 0);

    const updated = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: autoSubmitted ? "AUTO_SUBMITTED" : "SUBMITTED",
        submittedAt: new Date(),
        totalScore: Math.max(0, Number(totalScore.toFixed(2))),
        correctCount,
        wrongCount,
        skippedCount,
        accuracy: Number(accuracy.toFixed(2)),
        totalTimeSec,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// @route GET /api/attempts/my  (STUDENT)
const myAttempts = async (req, res, next) => {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { userId: req.user.id, status: { not: "IN_PROGRESS" } },
      include: { exam: { select: { title: true, totalMarks: true } } },
      orderBy: { submittedAt: "desc" },
    });
    res.json(attempts);
  } catch (err) {
    next(err);
  }
};

module.exports = { startAttempt, submitAnswer, submitAttempt, myAttempts };