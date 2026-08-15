const express = require("express");
const {
  startAttempt,
  submitAnswer,
  submitAttempt,
  myAttempts,
} = require("../controllers/attemptController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/start/:examId", authorize("STUDENT"), startAttempt);
router.post("/:attemptId/answer", authorize("STUDENT"), submitAnswer);
router.post("/:attemptId/submit", authorize("STUDENT"), submitAttempt);
router.get("/my", authorize("STUDENT"), myAttempts);

module.exports = router;