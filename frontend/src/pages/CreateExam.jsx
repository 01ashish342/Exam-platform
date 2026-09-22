import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const INITIAL_FORM = {
  title: "",
  description: "",
  durationMinutes: 30,
  marksPerQ: 1,
  negativeMarks: 0,
};

export default function CreateExam() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

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

      const { data } = await api.post("/exams", {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        marksPerQ: Number(form.marksPerQ),
        negativeMarks: Number(form.negativeMarks),
      });

      // Exam create hote hi seedha uske "Manage Questions" page par bhej do.
      // Agar aap chahte hain ki wapas dashboard par jaaye, to neeche wali line
      // ko `navigate("/admin")` se replace kar dein.
      navigate(`/admin/exam/${data.id}`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create the exam. Please try again."
      );
      setCreating(false);
    }
  };

  return (
    <div className="page create-exam-page">
      <div className="dashboard-header">
        <div>
          <div className="back-link-row">
            <Link to="/admin" className="back-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          <span className="dashboard-eyebrow">ADMINISTRATION</span>

          <h1 className="page-title">Create New Exam</h1>

          <p className="page-subtitle">
            Set up the basic details for your next examination.
          </p>
        </div>
      </div>

      {error && (
        <div className="dashboard-error" role="alert">
          <span className="error-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      <section className="create-exam-section">
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
    </div>
  );
}
