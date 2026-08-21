const prisma = require("../config/db");

// @route GET /api/results/:attemptId
// Full breakdown: overall score/accuracy/time + per-question detail.
// Handles all four question types — SINGLE_CORRECT, MULTI_CORRECT,
// TRUE_FALSE (all via options/isCorrect) and FILL_BLANK (via answerText).
const getResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        responses: {
          include: {
            selectedOptions: { include: { option: true } },
          },
        },
      },
    });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (attempt.status === "IN_PROGRESS") {
      return res.status(400).json({ message: "Attempt not submitted yet" });
    }

    // All questions of the exam, so skipped ones show up too (they have no Response row)
    const allQuestions = await prisma.question.findMany({
      where: { examId: attempt.examId },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });

    const responseByQ = new Map(attempt.responses.map((r) => [r.questionId, r]));

    const questionBreakdown = allQuestions.map((q) => {
      const r = responseByQ.get(q.id);
      const correctOptions = q.options.filter((o) => o.isCorrect);
      const selectedOptions = r ? r.selectedOptions.map((so) => so.option) : [];

      const hasAnswer =
        q.type === "FILL_BLANK" ? Boolean(r?.answerText) : selectedOptions.length > 0;

      return {
        questionId: q.id,
        questionText: q.questionText,
        type: q.type,
        section: q.section,
        options: q.type === "FILL_BLANK" ? [] : q.options.map((o) => ({ id: o.id, text: o.text })),
        correctOptionIds: correctOptions.map((o) => o.id),
        correctOptionTexts: correctOptions.map((o) => o.text),
        correctAnswerText: q.type === "FILL_BLANK" ? q.correctAnswerText : null,
        selectedOptionIds: selectedOptions.map((o) => o.id),
        selectedOptionTexts: selectedOptions.map((o) => o.text),
        answerText: r ? r.answerText : null,
        status: !r || !hasAnswer ? "skipped" : r.isCorrect ? "correct" : "wrong",
        timeTakenSec: r ? r.timeTakenSec : 0,
      };
    });

    // Simple time-based insight: which questions ate the most time
    const slowest = [...questionBreakdown].sort((a, b) => b.timeTakenSec - a.timeTakenSec).slice(0, 5);

    res.json({
      attemptId: attempt.id,
      exam: { id: attempt.exam.id, title: attempt.exam.title, totalMarks: attempt.exam.totalMarks },
      summary: {
        totalScore: attempt.totalScore,
        totalMarks: attempt.exam.totalMarks,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        accuracy: attempt.accuracy,
        totalTimeSec: attempt.totalTimeSec,
        avgTimePerQuestionSec: allQuestions.length
          ? Number((attempt.totalTimeSec / allQuestions.length).toFixed(1))
          : 0,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      },
      questionBreakdown,
      slowestQuestions: slowest,
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/results/exam/:examId/leaderboard
// Ranked list — score desc, then total time asc (faster = better tiebreak).
// Unaffected by question types since it only reads Attempt-level totals.
const getLeaderboard = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const attempts = await prisma.attempt.findMany({
      where: { examId, status: { not: "IN_PROGRESS" } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ totalScore: "desc" }, { totalTimeSec: "asc" }],
    });

    const leaderboard = attempts.map((a, idx) => ({
      rank: idx + 1,
      attemptId: a.id,
      userName: a.user.name,
      score: a.totalScore,
      accuracy: a.accuracy,
      totalTimeSec: a.totalTimeSec,
      submittedAt: a.submittedAt,
    }));

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
};

module.exports = { getResult, getLeaderboard };
