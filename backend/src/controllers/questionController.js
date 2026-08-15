const prisma = require("../config/db");

// @route POST /api/exams/:examId/questions   (ADMIN)
// body: { questionText, section, options: ["a","b","c","d"], correctIndex: 0 }
const addQuestion = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { questionText, section, options, correctIndex } = req.body;

    if (!questionText || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "questionText and at least 2 options are required" });
    }
    if (correctIndex === undefined || !options[correctIndex]) {
      return res.status(400).json({ message: "A valid correctIndex is required" });
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.createdById !== req.user.id) {
      return res.status(403).json({ message: "Not your exam" });
    }

    const order = await prisma.question.count({ where: { examId } });

    // Create question with nested options in one transaction, then set correctOptionId
    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          examId,
          questionText,
          section,
          order,
          options: { create: options.map((text) => ({ text })) },
        },
        include: { options: true },
      });

      const correctOption = q.options[correctIndex];
      const updatedQ = await tx.question.update({
        where: { id: q.id },
        data: { correctOptionId: correctOption.id },
        include: { options: true },
      });

      // Keep exam.totalMarks in sync with question count * marksPerQ
      const qCount = await tx.question.count({ where: { examId } });
      await tx.exam.update({
        where: { id: examId },
        data: { totalMarks: qCount * exam.marksPerQ },
      });

      return updatedQ;
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
    res.json({ message: "Question deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { addQuestion, deleteQuestion };