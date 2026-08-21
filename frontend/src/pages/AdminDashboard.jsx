import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const INITIAL_FORM = {
  title: "",
  description: "",
  durationMinutes: 30,
  marksPerQ: 1,
  negativeMarks: 0,
};

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [error, setError] = useState("");

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      await api.post("/exams", {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        marksPerQ: Number(form.marksPerQ),
        negativeMarks: Number(form.negativeMarks),
      });

      setForm(INITIAL_FORM);

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create the exam. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

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
          CREATE EXAM
      ========================================= */}

      <section className="create-exam-section">
        <div className="section-heading">
          <div>
            <h2>Create New Exam</h2>
            <p>Set up the basic details for your next examination.</p>
          </div>
        </div>

        <form className="create-exam-card" onSubmit={handleCreate}>
          <div className="form-field form-field-full">
            <label htmlFor="title">
              Exam Title
              <span>*</span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. JavaScript Fundamentals"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="description">Description</label>

            <textarea
              id="description"
              name="description"
              placeholder="Briefly describe what this exam covers..."
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="exam-settings-grid">
            <div className="form-field">
              <label htmlFor="durationMinutes">
                Duration
                <span>*</span>
              </label>

              <div className="input-with-suffix">
                <input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min="1"
                  value={form.durationMinutes}
                  onChange={handleChange}
                  required
                />
                <span>min</span>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="marksPerQ">
                Marks / Question
                <span>*</span>
              </label>

              <input
                id="marksPerQ"
                name="marksPerQ"
                type="number"
                min="0"
                step="0.5"
                value={form.marksPerQ}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="negativeMarks">Negative Marks</label>

              <input
                id="negativeMarks"
                name="negativeMarks"
                type="number"
                min="0"
                step="0.25"
                value={form.negativeMarks}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-footer">
            <span className="form-helper">
              You can add questions after creating the exam.
            </span>

            <button
              type="submit"
              className="btn create-exam-btn"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="button-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Exam
                </>
              )}
            </button>
          </div>
        </form>
      </section>

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
              {exams.length} {exams.length === 1 ? "exam" : "exams"}
            </span>
          )}
        </div>

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
              Create your first exam using the form above to get started.
            </p>
          </div>
        ) : (
          <div className="exam-grid">
            {exams.map((exam) => {
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