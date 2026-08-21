import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const statusColor = {
  correct: "#16a34a",
  wrong: "#dc2626",
  skipped: "#94a3b8",
};

const statusClass = {
  correct: "badge badge-success",
  wrong: "badge badge-danger",
  skipped: "badge",
};

const QUESTION_TYPE_LABELS = {
  SINGLE_CORRECT: "Single Correct",
  MULTI_CORRECT: "Multi Correct",
  TRUE_FALSE: "True / False",
  FILL_BLANK: "Fill in the Blank",
};

// SINGLE_CORRECT / MULTI_CORRECT / TRUE_FALSE answers arrive as
// selectedOptionTexts / correctOptionTexts (string arrays).
// FILL_BLANK answers arrive as answerText / correctAnswerText (plain strings,
// correctAnswerText may hold several "|"-separated accepted spellings).
const formatYourAnswer = (q) => {
  if (q.type === "FILL_BLANK") {
    return q.answerText && q.answerText.trim() ? q.answerText : null;
  }
  return q.selectedOptionTexts && q.selectedOptionTexts.length
    ? q.selectedOptionTexts.join(", ")
    : null;
};

const formatCorrectAnswer = (q) => {
  if (q.type === "FILL_BLANK") {
    return q.correctAnswerText
      ? q.correctAnswerText.split("|").map((a) => a.trim()).join(" / ")
      : null;
  }
  return q.correctOptionTexts && q.correctOptionTexts.length
    ? q.correctOptionTexts.join(", ")
    : null;
};

export default function Result() {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(`/results/${attemptId}`);
        setResult(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your result. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [attemptId]);

  const chartData = useMemo(() => {
    if (!result?.questionBreakdown) return [];

    return result.questionBreakdown.map((q, idx) => ({
      name: `Q${idx + 1}`,
      time: q.timeTakenSec || 0,
      status: q.status,
    }));
  }, [result]);

  if (loading) {
    return (
      <div className="page">
        <div className="result-loading">
          <div className="loading-spinner" />
          <h3>Loading your result...</h3>
          <p>Please wait while we prepare your performance report.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="result-error">
          <div className="result-error-icon">!</div>
          <h2>Unable to load result</h2>
          <p>{error}</p>

          <Link to="/" className="btn">
            Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { exam, summary, questionBreakdown } = result;

  const scorePercentage =
    summary.totalMarks > 0
      ? Math.round((summary.totalScore / summary.totalMarks) * 100)
      : 0;

  const performanceClass =
    scorePercentage >= 75
      ? "performance-excellent"
      : scorePercentage >= 50
      ? "performance-good"
      : "performance-low";

  return (
    <div className="page result-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="result-header">
        <div>
          <div className="result-eyebrow">EXAM RESULT</div>

          <h1 className="page-title">{exam.title}</h1>

          <p className="page-subtitle">
            Here's a detailed breakdown of your exam performance.
          </p>
        </div>

        <Link to="/" className="btn btn-secondary">
          ← Back to Exams
        </Link>
      </div>

      {/* =====================================================
          PERFORMANCE HERO
      ===================================================== */}

      <section className={`result-hero ${performanceClass}`}>
        <div className="result-score-circle">
          <div className="result-score-value">
            {scorePercentage}
            <span>%</span>
          </div>

          <div className="result-score-label">Score</div>
        </div>

        <div className="result-hero-content">
          <span className="result-status-label">
            {scorePercentage >= 75
              ? "Excellent Performance"
              : scorePercentage >= 50
              ? "Good Performance"
              : "Keep Practicing"}
          </span>

          <h2>
            {summary.totalScore}{" "}
            <span>/ {summary.totalMarks} marks</span>
          </h2>

          <p>
            You answered{" "}
            <strong>{summary.correctCount}</strong> questions correctly out of{" "}
            {questionBreakdown.length}.
          </p>
        </div>
      </section>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="result-section">
        <div className="section-heading">
          <div>
            <h2>Performance Overview</h2>
            <p>Your key performance metrics from this attempt.</p>
          </div>
        </div>

        <div className="summary-grid result-summary-grid">
          <div className="summary-card result-card">
            <div className="result-card-icon score-icon">★</div>

            <div>
              <h4>Score</h4>
              <p>
                {summary.totalScore}
                <span> / {summary.totalMarks}</span>
              </p>
            </div>
          </div>

          <div className="summary-card result-card">
            <div className="result-card-icon accuracy-icon">%</div>

            <div>
              <h4>Accuracy</h4>
              <p>{summary.accuracy}%</p>
            </div>
          </div>

          <div className="summary-card result-card">
            <div className="result-card-icon correct-icon">✓</div>

            <div>
              <h4>Correct</h4>
              <p className="green">{summary.correctCount}</p>
            </div>
          </div>

          <div className="summary-card result-card">
            <div className="result-card-icon wrong-icon">×</div>

            <div>
              <h4>Wrong</h4>
              <p className="red">{summary.wrongCount}</p>
            </div>
          </div>

          <div className="summary-card result-card">
            <div className="result-card-icon skipped-icon">—</div>

            <div>
              <h4>Skipped</h4>
              <p className="grey">{summary.skippedCount}</p>
            </div>
          </div>

          <div className="summary-card result-card">
            <div className="result-card-icon time-icon">◷</div>

            <div>
              <h4>Total Time</h4>
              <p>{Math.round(summary.totalTimeSec / 60)} min</p>
            </div>
          </div>

          <div className="summary-card result-card">
            <div className="result-card-icon avg-icon">⏱</div>

            <div>
              <h4>Avg. Time / Q</h4>
              <p>{summary.avgTimePerQuestionSec}s</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ANSWER DISTRIBUTION
      ===================================================== */}

      <section className="result-section">
        <div className="section-heading">
          <div>
            <h2>Answer Summary</h2>
            <p>How you performed across all questions.</p>
          </div>
        </div>

        <div className="answer-summary-card">
          <div className="answer-summary-item">
            <div className="answer-summary-top">
              <span className="answer-dot correct-dot" />
              <span>Correct</span>
              <strong>{summary.correctCount}</strong>
            </div>

            <div className="answer-progress">
              <div
                className="answer-progress-fill correct-fill"
                style={{
                  width: `${
                    questionBreakdown.length
                      ? (summary.correctCount / questionBreakdown.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="answer-summary-item">
            <div className="answer-summary-top">
              <span className="answer-dot wrong-dot" />
              <span>Wrong</span>
              <strong>{summary.wrongCount}</strong>
            </div>

            <div className="answer-progress">
              <div
                className="answer-progress-fill wrong-fill"
                style={{
                  width: `${
                    questionBreakdown.length
                      ? (summary.wrongCount / questionBreakdown.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="answer-summary-item">
            <div className="answer-summary-top">
              <span className="answer-dot skipped-dot" />
              <span>Skipped</span>
              <strong>{summary.skippedCount}</strong>
            </div>

            <div className="answer-progress">
              <div
                className="answer-progress-fill skipped-fill"
                style={{
                  width: `${
                    questionBreakdown.length
                      ? (summary.skippedCount / questionBreakdown.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TIME CHART
      ===================================================== */}

      <section className="result-section">
        <div className="section-heading">
          <div>
            <h2>Time Spent per Question</h2>
            <p>
              See how much time you spent on each question during the exam.
            </p>
          </div>
        </div>

        <div className="chart-card">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />

                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                  }}
                  formatter={(value) => [`${value} sec`, "Time"]}
                />

                <Bar
                  dataKey="time"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={statusColor[entry.status] || "#4f46e5"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <h3>No timing data available</h3>
              <p>Question timing information isn't available for this attempt.</p>
            </div>
          )}
        </div>

        <div className="chart-legend">
          <span>
            <i className="legend-dot correct-dot" />
            Correct
          </span>

          <span>
            <i className="legend-dot wrong-dot" />
            Wrong
          </span>

          <span>
            <i className="legend-dot skipped-dot" />
            Skipped
          </span>
        </div>
      </section>

      {/* =====================================================
          QUESTION BREAKDOWN
      ===================================================== */}

      <section className="result-section">
        <div className="section-heading">
          <div>
            <h2>Question-wise Breakdown</h2>
            <p>Review your answers and compare them with the correct answers.</p>
          </div>

          <span className="question-count-badge">
            {questionBreakdown.length} Questions
          </span>
        </div>

        {/* Desktop Table */}

        <div className="table-wrapper result-table-wrapper">
          <table className="table result-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Your Answer</th>
                <th>Correct Answer</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {questionBreakdown.map((q, idx) => {
                const yourAnswer = formatYourAnswer(q);
                const correctAnswer = formatCorrectAnswer(q);

                return (
                  <tr key={q.questionId}>
                    <td>
                      <span className="question-number">{idx + 1}</span>
                    </td>

                    <td>
                      <div className="result-question">
                        {q.questionText}
                      </div>

                      <span className="question-type-tag">
                        {QUESTION_TYPE_LABELS[q.type] || q.type}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          q.status === "correct"
                            ? "answer-text correct-answer"
                            : q.status === "wrong"
                            ? "answer-text wrong-answer"
                            : "answer-text skipped-answer"
                        }
                      >
                        {yourAnswer || "Not answered"}
                      </span>
                    </td>

                    <td>
                      <span className="answer-text correct-answer">
                        {correctAnswer}
                      </span>
                    </td>

                    <td>
                      <span className={statusClass[q.status] || "badge"}>
                        {q.status === "correct"
                          ? "Correct"
                          : q.status === "wrong"
                          ? "Wrong"
                          : "Skipped"}
                      </span>
                    </td>

                    <td>
                      <span className="time-value">
                        {q.timeTakenSec}s
                      </span>
                    </td>
                  </tr>
                );
              })}

              {questionBreakdown.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <h3>No question data</h3>
                      <p>No question breakdown is available.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          FOOTER ACTION
      ===================================================== */}

      {isStudent && (
        <div className="result-footer">
          <div>
            <h3>Want to improve your score?</h3>
            <p>Try another mock exam and keep practicing.</p>
          </div>

          <Link to="/" className="btn">
            Take Another Exam →
          </Link>
        </div>
      )}
    </div>
  );
}
