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
          // IMPORTANT: select only the fields students should see.
          // Question.correctAnswerText (FILL_BLANK) and Option.isCorrect
          // must never reach the client before submission.
          select: {
            id: true,
            type: true,
            questionText: true,
            section: true,
            order: true,
            options: {
              orderBy: { order: "asc" },
              select: { id: true, text: true },
            },
          },
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
//
// body:
//   { questionId, selectedOptionIds: ["optId1", "optId2"], timeTakenSec }
//     for SINGLE_CORRECT / MULTI_CORRECT / TRUE_FALSE
//   { questionId, answerText: "paris", timeTakenSec }
//     for FILL_BLANK
//
// Sending an empty selectedOptionIds array / empty answerText clears the
// answer (treated as skipped) without erroring, so "Clear answer" in the
// UI keeps working the same way it did before.
const submitAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptionIds, answerText, timeTakenSec } = req.body;

    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.userId !== req.user.id) return res.status(403).json({ message: "Not your attempt" });
    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "Attempt already submitted" });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    if (!question) return res.status(404).json({ message: "Question not found" });

    const optionIds = Array.isArray(selectedOptionIds)
      ? [...new Set(selectedOptionIds.filter(Boolean))]
      : [];
    const trimmedAnswerText = typeof answerText === "string" ? answerText.trim() : "";

    let isCorrect = null;
    let hasAnswer = false;

    if (question.type === "FILL_BLANK") {
      hasAnswer = Boolean(trimmedAnswerText);
      if (hasAnswer) {
        const accepted = (question.correctAnswerText || "")
          .split("|")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        isCorrect = accepted.includes(trimmedAnswerText.toLowerCase());
      }
    } else {
      // SINGLE_CORRECT, MULTI_CORRECT, TRUE_FALSE
      // Reject option ids that don't belong to this question (defense in depth)
      const validIds = new Set(question.options.map((o) => o.id));
      const cleanIds = optionIds.filter((id) => validIds.has(id));

      hasAnswer = cleanIds.length > 0;
      if (hasAnswer) {
        const correctIds = question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id)
          .sort();
        const selectedSorted = [...cleanIds].sort();
        isCorrect =
          correctIds.length === selectedSorted.length &&
          correctIds.every((id, idx) => id === selectedSorted[idx]);
      }
    }

    const response = await prisma.$transaction(async (tx) => {
      const existing = await tx.response.findUnique({
        where: { attemptId_questionId: { attemptId, questionId } },
      });

      let saved;
      if (existing) {
        saved = await tx.response.update({
          where: { id: existing.id },
          data: {
            answerText: question.type === "FILL_BLANK" ? trimmedAnswerText || null : null,
            isCorrect,
            timeTakenSec: { increment: timeTakenSec || 0 },
            answeredAt: hasAnswer ? new Date() : null,
          },
        });
        // Reset previously selected options; we re-create below from scratch
        await tx.responseOption.deleteMany({ where: { responseId: saved.id } });
      } else {
        saved = await tx.response.create({
          data: {
            attemptId,
            questionId,
            answerText: question.type === "FILL_BLANK" ? trimmedAnswerText || null : null,
            isCorrect,
            timeTakenSec: timeTakenSec || 0,
            answeredAt: hasAnswer ? new Date() : null,
          },
        });
      }

      if (question.type !== "FILL_BLANK" && optionIds.length > 0) {
        const validIds = new Set(question.options.map((o) => o.id));
        const cleanIds = optionIds.filter((id) => validIds.has(id));
        if (cleanIds.length > 0) {
          await tx.responseOption.createMany({
            data: cleanIds.map((optionId) => ({ responseId: saved.id, optionId })),
          });
        }
      }

      return tx.response.findUnique({
        where: { id: saved.id },
        include: { selectedOptions: { include: { option: true } } },
      });
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
