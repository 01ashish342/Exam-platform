const prisma = require("../config/db");

// @route POST /api/exams   (ADMIN)
const createExam = async (req, res, next) => {
  try {
    const { title, description, durationMinutes, marksPerQ, negativeMarks } = req.body;
    if (!title || !durationMinutes) {
      return res.status(400).json({ message: "title and durationMinutes are required" });
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        durationMinutes,
        marksPerQ: marksPerQ ?? 1,
        negativeMarks: negativeMarks ?? 0,
        totalMarks: 0,
        createdById: req.user.id,
      },
    });
    res.status(201).json(exam);
  } catch (err) {
    next(err);
  }
};

// @route GET /api/exams
const listExams = async (req, res, next) => {
  try {
    const where =
      req.user.role === "ADMIN"
        ? { createdById: req.user.id }
        : { isPublished: true };

    const exams = await prisma.exam.findMany({
      where,
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(exams);
  } catch (err) {
    next(err);
  }
};

// @route GET /api/exams/:id  (admin view - includes correct answers, for editing)
const getExamAdmin = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.createdById !== req.user.id) {
      return res.status(403).json({ message: "Not your exam" });
    }
    res.json(exam);
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/exams/:id/publish   (ADMIN)
const publishExam = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (exam.createdById !== req.user.id) {
      return res.status(403).json({ message: "Not your exam" });
    }

    const questionCount = await prisma.question.count({ where: { examId: exam.id } });
    if (questionCount === 0) {
      return res.status(400).json({ message: "Cannot publish an exam with no questions" });
    }

    const updated = await prisma.exam.update({
      where: { id: exam.id },
      data: { isPublished: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { createExam, listExams, getExamAdmin, publishExam };