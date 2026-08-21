const prisma = require("../config/db");

const VALID_TYPES = ["SINGLE_CORRECT", "MULTI_CORRECT", "TRUE_FALSE", "FILL_BLANK"];

// @route POST /api/exams/:examId/questions   (ADMIN)
//
// body varies by type:
//
// SINGLE_CORRECT / MULTI_CORRECT:
//   { type, questionText, section, options: ["a","b","c","d"], correctIndexes: [0] }
//   (SINGLE_CORRECT must send exactly one index; MULTI_CORRECT can send several)
//
// TRUE_FALSE:
//   { type, questionText, section, correctIndexes: [0] }   // 0 = True, 1 = False
//   (options are generated automatically as ["True", "False"])
//
// FILL_BLANK:
//   { type, questionText, section, correctAnswerText: "paris" }
//   (correctAnswerText can hold multiple accepted spellings separated by "|",
//    e.g. "colour|color")
const addQuestion = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const {
      type = "SINGLE_CORRECT",
      questionText,
      section,
      options,
      correctIndexes,
      correctAnswerText,
    } = req.body;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid question type" });
    }
    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ message: "questionText is required" });
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.createdById !== req.user.id) {
      return res.status(403).json({ message: "Not your exam" });
    }

    // Build the option list + which indexes are correct, per type
    let optionTexts = [];
    let correctSet = new Set();
    let normalizedAnswerText = null;

    if (type === "SINGLE_CORRECT" || type === "MULTI_CORRECT") {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: "At least 2 options are required" });
      }
      if (options.some((o) => !o || !String(o).trim())) {
        return res.status(400).json({ message: "Options cannot be empty" });
      }
      if (!Array.isArray(correctIndexes) || correctIndexes.length === 0) {
        return res.status(400).json({ message: "At least one correctIndex is required" });
      }
      if (type === "SINGLE_CORRECT" && correctIndexes.length !== 1) {
        return res
          .status(400)
          .json({ message: "Single-correct questions need exactly one correct option" });
      }
      const invalid = correctIndexes.some((i) => options[i] === undefined);
      if (invalid) {
        return res.status(400).json({ message: "correctIndexes must reference valid options" });
      }
      optionTexts = options.map((o) => String(o).trim());
      correctSet = new Set(correctIndexes);
    } else if (type === "TRUE_FALSE") {
      optionTexts = ["True", "False"];
      const idx = correctIndexes?.[0];
      if (idx !== 0 && idx !== 1) {
        return res.status(400).json({ message: "correctIndexes[0] must be 0 (True) or 1 (False)" });
      }
      correctSet = new Set([idx]);
    } else if (type === "FILL_BLANK") {
      if (!correctAnswerText || !String(correctAnswerText).trim()) {
        return res
          .status(400)
          .json({ message: "correctAnswerText is required for fill-in-the-blank questions" });
      }
      normalizedAnswerText = String(correctAnswerText).trim();
    }

    const order = await prisma.question.count({ where: { examId } });

    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          examId,
          type,
          questionText: questionText.trim(),
          section: section || null,
          order,
          correctAnswerText: normalizedAnswerText,
          options:
            type === "FILL_BLANK"
              ? undefined
              : {
                  create: optionTexts.map((text, idx) => ({
                    text,
                    isCorrect: correctSet.has(idx),
                    order: idx,
                  })),
                },
        },
        include: { options: { orderBy: { order: "asc" } } },
      });

      // Keep exam.totalMarks in sync with question count * marksPerQ
      const qCount = await tx.question.count({ where: { examId } });
      await tx.exam.update({
        where: { id: examId },
        data: { totalMarks: qCount * exam.marksPerQ },
      });

      return q;
    });

    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/questions/:id (ADMIN)
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { exam: true },
    });
    if (!question) return res.status(404).json({ message: "Question not found" });
    if (question.exam.createdById !== req.user.id) {
      return res.status(403).json({ message: "Not your exam" });
    }
    await prisma.question.delete({ where: { id: question.id } });

    // Keep exam.totalMarks in sync after deletion too
    const qCount = await prisma.question.count({ where: { examId: question.examId } });
    await prisma.exam.update({
      where: { id: question.examId },
      data: { totalMarks: qCount * question.exam.marksPerQ },
    });

    res.json({ message: "Question deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { addQuestion, deleteQuestion };
