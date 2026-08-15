const express = require("express");
const { getResult, getLeaderboard } = require("../controllers/resultController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/:attemptId", getResult);
router.get("/exam/:examId/leaderboard", getLeaderboard);

module.exports = router;