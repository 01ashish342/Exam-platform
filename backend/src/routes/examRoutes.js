const express = require("express");
const { createExam, listExams, getExamAdmin, publishExam } = require("../controllers/examController");
const { addQuestion } = require("../controllers/questionController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", authorize("ADMIN"), createExam);
router.get("/", listExams);
router.get("/:id", authorize("ADMIN"), getExamAdmin);
router.patch("/:id/publish", authorize("ADMIN"), publishExam);
router.post("/:examId/questions", authorize("ADMIN"), addQuestion);

module.exports = router;