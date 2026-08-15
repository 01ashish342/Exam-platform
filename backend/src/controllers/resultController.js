const prisma = require("../config/db");

// @route GET /api/results/:attemptId
// Full breakdown: overall score/accuracy/time + per-question detail
// (selected option, correct option, correct/wrong/skipped, time taken).
const getResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        responses: {
          include: {
            question: { include: { options: true } },
            selectedOption: true,
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
      include: { options: true },
      orderBy: { order: "asc" },
    });

    const responseByQ = new Map(attempt.responses.map((r) => [r.questionId, r]));

    const questionBreakdown = allQuestions.map((q) => {
      const r = responseByQ.get(q.id);
      const correctOption = q.options.find((o) => o.id === q.correctOptionId);
      return {
        questionId: q.id,
        questionText: q.questionText,
        section: q.section,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
        correctOptionId: q.correctOptionId,
        correctOptionText: correctOption ? correctOption.text : null,
        selectedOptionId: r ? r.selectedOptionId : null,
        selectedOptionText: r && r.selectedOption ? r.selectedOption.text : null,
        status: !r || !r.selectedOptionId ? "skipped" : r.isCorrect ? "correct" : "wrong",
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
// Ranked list — score desc, then total time asc (faster = better tiebreak),
// which mirrors how most competitive-exam selection processes rank candidates.
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