import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const searchRef = useRef(null);

  const load = async () => {
    try {
      setError("");

      const { data } = await api.get("/exams");
      setExams(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load exams. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Press "/" anywhere to jump into the search box.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "/") return;

      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      event.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handlePublish = async (id) => {
    try {
      setPublishingId(id);
      setError("");

      await api.patch(`/exams/${id}/publish`);

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to publish the exam. Please try again."
      );
    } finally {
      setPublishingId(null);
    }
  };

  const publishedCount = exams.filter((exam) => exam.isPublished).length;
  const draftCount = exams.filter((exam) => !exam.isPublished).length;

  const totalQuestions = exams.reduce(
    (total, exam) => total + (exam._count?.questions || 0),
    0
  );

  /* =========================================
     SEARCH + FILTER
  ========================================= */

  const normalizedQuery = query.trim().toLowerCase();

  const filteredExams = useMemo(() => {
    const words = normalizedQuery ? normalizedQuery.split(/\s+/) : [];

    return exams.filter((exam) => {
      if (statusFilter === "published" && !exam.isPublished) return false;
      if (statusFilter === "draft" && exam.isPublished) return false;

      if (words.length === 0) return true;

      const haystack = `${exam.title || ""} ${
        exam.description || ""
      }`.toLowerCase();

      return words.every((word) => haystack.includes(word));
    });
  }, [exams, statusFilter, normalizedQuery]);

  const isFiltering = normalizedQuery !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    searchRef.current?.focus();
  };

  return (
    <div className="page admin-dashboard">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">ADMINISTRATION</span>

          <h1 className="page-title">Exam Dashboard</h1>

          <p className="page-subtitle">
            Create, manage, publish and monitor your exams.
          </p>
        </div>

        <Link to="/admin/create-exam" className="btn create-exam-btn">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Exam
        </Link>
      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="dashboard-error" role="alert">
          <span className="error-icon">!</span>

          <span>{error}</span>

          <button type="button" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* =========================================
          STATS
      ========================================= */}

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
          </div>

          <div>
            <span className="stat-label">Total Exams</span>
            <strong>{loading ? "—" : exams.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div>
            <span className="stat-label">Published</span>
            <strong>{loading ? "—" : publishedCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-yellow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </div>

          <div>
            <span className="stat-label">Drafts</span>
            <strong>{loading ? "—" : draftCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h16v16H4z" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
          </div>

          <div>
            <span className="stat-label">Questions</span>
            <strong>{loading ? "—" : totalQuestions}</strong>
          </div>
        </div>
      </div>

      {/* =========================================
          EXAMS
      ========================================= */}

      <section className="exams-section">
        <div className="section-heading">
          <div>
            <h2>Your Exams</h2>
            <p>Manage questions, publishing and leaderboards.</p>
          </div>

          {!loading && exams.length > 0 && (
            <span className="exam-count">
              {isFiltering
                ? `${filteredExams.length} of ${exams.length}`
                : `${exams.length} ${
                    exams.length === 1 ? "exam" : "exams"
                  }`}
            </span>
          )}
        </div>

        {/* =========================================
            SEARCH BAR
        ========================================= */}

        {!loading && exams.length > 0 && (
          <div className="exam-toolbar">
            <div className="exam-search">
              <svg
                className="exam-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>

              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setQuery("");
                }}
                placeholder="Search exams by title or description"
                aria-label="Search exams"
              />

              {query && (
                <button
                  type="button"
                  className="exam-search-clear"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <div className="exam-filter-group" role="group" aria-label="Filter by status">
              {[
                { value: "all", label: "All", count: exams.length },
                { value: "published", label: "Published", count: publishedCount },
                { value: "draft", label: "Drafts", count: draftCount },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`exam-filter-btn ${
                    statusFilter === option.value ? "is-active" : ""
                  }`}
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={statusFilter === option.value}
                >
                  {option.label}
                  <span className="exam-filter-count">{option.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="exam-grid">
            {[1, 2, 3].map((item) => (
              <div className="exam-card skeleton-card" key={item}>
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-actions" />
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="empty-state admin-empty-state">
            <div className="empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              </svg>
            </div>

            <h3>No exams yet</h3>

            <p>
              Create your first exam using the button above to get started.
            </p>

            <Link to="/admin/create-exam" className="btn create-exam-btn">
              Create New Exam
            </Link>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="empty-state admin-empty-state">
            <div className="empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
            </div>

            <h3>No matching exams</h3>

            <p>
              {query
                ? `Nothing matches “${query.trim()}”. Try a different word or clear the filters.`
                : "No exams in this status yet."}
            </p>

            <button type="button" className="btn" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="exam-grid">
            {filteredExams.map((exam) => {
              const questionCount = exam._count?.questions || 0;
              const isPublishing = publishingId === exam.id;

              return (
                <article className="exam-card" key={exam.id}>
                  <div className="exam-card-top">
                    <span
                      className={`badge ${
                        exam.isPublished
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {exam.isPublished ? "Published" : "Draft"}
                    </span>

                    <span className="question-count">
                      {questionCount}{" "}
                      {questionCount === 1 ? "question" : "questions"}
                    </span>
                  </div>

                  <h3>{exam.title}</h3>

                  {exam.description ? (
                    <p className="exam-description">
                      {exam.description}
                    </p>
                  ) : (
                    <p className="exam-description muted">
                      No description provided.
                    </p>
                  )}

                  <div className="exam-meta">
                    <div className="exam-meta-item">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="12 7 12 12 15 14" />
                      </svg>

                      <span>{exam.durationMinutes} min</span>
                    </div>

                    <div className="exam-meta-item">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7" />
                      </svg>

                      <span>{exam.marksPerQ ?? 1} mark / Q</span>
                    </div>
                  </div>

                  <div className="exam-card-actions">
                    <Link
                      to={`/admin/exam/${exam.id}`}
                      className="exam-manage-btn"
                    >
                      Manage Questions
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>

                    {!exam.isPublished && (
                      <button
                        type="button"
                        className="exam-publish-btn"
                        onClick={() => handlePublish(exam.id)}
                        disabled={questionCount === 0 || isPublishing}
                        title={
                          questionCount === 0
                            ? "Add at least one question before publishing"
                            : "Publish exam"
                        }
                      >
                        {isPublishing ? (
                          <>
                            <span className="button-spinner" />
                            Publishing...
                          </>
                        ) : (
                          "Publish"
                        )}
                      </button>
                    )}

                    {exam.isPublished && (
                      <Link
                        to={`/admin/exam/${exam.id}/leaderboard`}
                        className="exam-leaderboard-btn"
                      >
                        Leaderboard
                      </Link>
                    )}
                  </div>

                  {!exam.isPublished && questionCount === 0 && (
                    <div className="publish-hint">
                      Add at least one question to publish this exam.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
