import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [examsRes, attemptsRes] = await Promise.all([
          api.get("/exams"),
          api.get("/attempts/my"),
        ]);

        if (!mounted) return;

        setExams(examsRes.data || []);
        setAttempts(attemptsRes.data || []);
      } catch (err) {
        if (!mounted) return;

        console.error("Failed to load exam dashboard:", err);
        setError(
          err?.response?.data?.message ||
            "Unable to load your exams. Please try again."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const completed = attempts.filter(
      (attempt) =>
        attempt.status === "COMPLETED" ||
        attempt.status === "SUBMITTED"
    ).length;

    const averageAccuracy =
      attempts.length > 0
        ? Math.round(
            attempts.reduce(
              (sum, attempt) => sum + Number(attempt.accuracy || 0),
              0
            ) / attempts.length
          )
        : 0;

    const bestScore =
      attempts.length > 0
        ? Math.max(
            ...attempts.map((attempt) => Number(attempt.totalScore || 0))
          )
        : 0;

    return {
      available: exams.length,
      attempted: attempts.length,
      completed,
      averageAccuracy,
      bestScore,
    };
  }, [exams, attempts]);

  const getStatusClass = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (
      normalized === "COMPLETED" ||
      normalized === "SUBMITTED" ||
      normalized === "PASSED"
    ) {
      return "badge badge-success";
    }

    if (normalized === "FAILED") {
      return "badge badge-danger";
    }

    if (normalized === "IN_PROGRESS") {
      return "badge badge-warning";
    }

    return "badge badge-info";
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return String(status)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="exam-dashboard-loading">
          <div className="loading-spinner" />
          <h3>Loading your dashboard</h3>
          <p>Fetching available exams and your previous attempts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-state">
          <div className="error-state-icon">!</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button
            className="btn"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page exam-dashboard">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            <span className="eyebrow-dot" />
            Student Dashboard
          </span>

          <h1 className="page-title">Ready for your next challenge?</h1>

          <p className="page-subtitle">
            Choose an exam, test your knowledge, and track your progress.
          </p>
        </div>

        <div className="dashboard-header-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z" />
            <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
          </svg>
        </div>
      </section>

      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="stat-icon stat-icon-blue">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
          </div>

          <div>
            <span className="stat-label">Available Exams</span>
            <strong>{stats.available}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon stat-icon-purple">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>

          <div>
            <span className="stat-label">Attempts</span>
            <strong>{stats.attempted}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon stat-icon-green">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>

          <div>
            <span className="stat-label">Avg. Accuracy</span>
            <strong>{stats.averageAccuracy}%</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon stat-icon-orange">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 21h8" />
              <path d="M12 17v4" />
              <path d="M17 3h3a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5" />
              <path d="M7 3H4a1 1 0 0 0-1 1v2a5 5 0 0 0 5 5" />
              <path d="M12 17a7 7 0 0 0 7-7V3H5v7a7 7 0 0 0 7 7Z" />
            </svg>
          </div>

          <div>
            <span className="stat-label">Best Score</span>
            <strong>{stats.bestScore}</strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          AVAILABLE EXAMS
      ===================================================== */}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Available Mock Exams</h2>
            <p>
              Practice with timed exams and improve your preparation.
            </p>
          </div>

          {exams.length > 0 && (
            <span className="section-count">
              {exams.length} {exams.length === 1 ? "exam" : "exams"}
            </span>
          )}
        </div>

        {exams.length > 0 ? (
          <div className="exam-card-grid">
            {exams.map((exam) => (
              <article className="exam-card" key={exam.id}>
                <div className="exam-card-top">
                  <div className="exam-card-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z" />
                      <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
                    </svg>
                  </div>

                  <span className="badge badge-info">Mock Test</span>
                </div>

                <div className="exam-card-content">
                  <h3>{exam.title}</h3>

                  <p className="exam-description">
                    {exam.description ||
                      "Test your knowledge with this practice examination."}
                  </p>
                </div>

                <div className="exam-meta-grid">
                  <div className="exam-meta-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z" />
                      <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
                    </svg>

                    <div>
                      <span>Questions</span>
                      <strong>{exam._count?.questions ?? 0}</strong>
                    </div>
                  </div>

                  <div className="exam-meta-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15 14" />
                    </svg>

                    <div>
                      <span>Duration</span>
                      <strong>{exam.durationMinutes} min</strong>
                    </div>
                  </div>

                  <div className="exam-meta-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 1v22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                    </svg>

                    <div>
                      <span>Total Marks</span>
                      <strong>{exam.totalMarks}</strong>
                    </div>
                  </div>
                </div>

                <div className="exam-card-footer">
                  <span className="exam-footer-note">
                    <span className="status-dot" />
                    Ready to attempt
                  </span>

                  <Link
                    className="btn exam-start-btn"
                    to={`/exam/${exam.id}`}
                  >
                    Start Test
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z" />
                <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
              </svg>
            </div>

            <h3>No exams available</h3>
            <p>
              There are no published mock exams available right now.
              Check back later.
            </p>
          </div>
        )}
      </section>

      {/* =====================================================
          PAST ATTEMPTS
      ===================================================== */}

      <section className="dashboard-section attempts-section">
        <div className="section-heading">
          <div>
            <h2>Your Past Attempts</h2>
            <p>Review your previous performance and results.</p>
          </div>

          {attempts.length > 0 && (
            <span className="section-count">
              {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}
            </span>
          )}
        </div>

        {attempts.length > 0 ? (
          <div className="table-wrapper attempts-table-wrapper">
            <table className="table attempts-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Status</th>
                  <th>Result</th>
                </tr>
              </thead>

              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>
                      <div className="attempt-exam">
                        <div className="attempt-exam-icon">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z" />
                            <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
                          </svg>
                        </div>

                        <div>
                          <strong>{attempt.exam?.title || "Unknown Exam"}</strong>
                          <span>
                            {attempt.exam?.totalMarks ?? 0} total marks
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {formatDate(
                        attempt.createdAt ||
                          attempt.submittedAt ||
                          attempt.completedAt
                      )}
                    </td>

                    <td>
                      <strong className="score-value">
                        {attempt.totalScore}
                      </strong>
                      <span className="score-total">
                        / {attempt.exam?.totalMarks ?? 0}
                      </span>
                    </td>

                    <td>
                      <div className="accuracy-cell">
                        <strong>{attempt.accuracy ?? 0}%</strong>

                        <div className="accuracy-bar">
                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(attempt.accuracy || 0))
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={getStatusClass(attempt.status)}>
                        {formatStatus(attempt.status)}
                      </span>
                    </td>

                    <td>
                      <Link
                        className="result-link"
                        to={`/result/${attempt.id}`}
                      >
                        View Result
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state attempts-empty">
            <div className="empty-state-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>

            <h3>No attempts yet</h3>

            <p>
              You haven't completed any exams yet. Start your first mock test
              to see your performance here.
            </p>

            {exams.length > 0 && (
              <Link to="#available-exams" className="btn">
                Browse Exams
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}