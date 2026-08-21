import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

const QUESTION_TYPES = [
  { value: "SINGLE_CORRECT", label: "Single Correct", icon: "◉" },
  { value: "MULTI_CORRECT", label: "Multi Correct", icon: "☑" },
  { value: "TRUE_FALSE", label: "True / False", icon: "⚖" },
  { value: "FILL_BLANK", label: "Fill in the Blank", icon: "✎" },
];

const QUESTION_TYPE_LABELS = QUESTION_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {});

const createEmptyQuestion = () => ({
  type: "SINGLE_CORRECT",
  questionText: "",
  section: "",
  options: ["", "", "", ""],
  correctIndexes: [0],
  correctAnswerText: "",
});

export default function AdminExamDetail() {
  const { id } = useParams();

  const [exam, setExam] = useState(null);
  const [form, setForm] = useState(createEmptyQuestion());

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(`/exams/${id}`);
      setExam(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load exam details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleTypeChange = (type) => {
    setForm((prev) => {
      if (type === "TRUE_FALSE") {
        return { ...prev, type, correctIndexes: [0] };
      }
      if (type === "FILL_BLANK") {
        return { ...prev, type, correctAnswerText: prev.correctAnswerText || "" };
      }
      // SINGLE_CORRECT / MULTI_CORRECT
      return {
        ...prev,
        type,
        options: prev.options.length >= 2 ? prev.options : ["", "", "", ""],
        correctIndexes: type === "SINGLE_CORRECT" ? [0] : [],
      };
    });
  };

  const handleOptionChange = (index, value) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = value;

      return {
        ...prev,
        options,
      };
    });
  };

  const addOption = () => {
    setForm((prev) => {
      if (prev.options.length >= 6) return prev;
      return { ...prev, options: [...prev.options, ""] };
    });
  };

  const removeOption = (index) => {
    setForm((prev) => {
      if (prev.options.length <= 2) return prev;

      const options = prev.options.filter((_, i) => i !== index);
      const correctIndexes = prev.correctIndexes
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));

      return { ...prev, options, correctIndexes };
    });
  };

  const toggleCorrectIndex = (index) => {
    setForm((prev) => {
      if (prev.type === "MULTI_CORRECT") {
        const exists = prev.correctIndexes.includes(index);
        const correctIndexes = exists
          ? prev.correctIndexes.filter((i) => i !== index)
          : [...prev.correctIndexes, index];
        return { ...prev, correctIndexes };
      }
      // SINGLE_CORRECT — acts like a radio button
      return { ...prev, correctIndexes: [index] };
    });
  };

  const setTrueFalseAnswer = (index) => {
    setForm((prev) => ({ ...prev, correctIndexes: [index] }));
  };

  const validateForm = () => {
    if (!form.questionText.trim()) {
      return "Question text is required.";
    }

    if (form.type === "SINGLE_CORRECT" || form.type === "MULTI_CORRECT") {
      if (form.options.length < 2) {
        return "At least 2 options are required.";
      }
      if (form.options.some((o) => !o.trim())) {
        return "Every option must be filled in.";
      }
      if (form.correctIndexes.length === 0) {
        return "Select at least one correct option.";
      }
      if (form.type === "SINGLE_CORRECT" && form.correctIndexes.length !== 1) {
        return "Single-correct questions need exactly one correct option.";
      }
    }

    if (form.type === "TRUE_FALSE" && form.correctIndexes.length !== 1) {
      return "Choose whether True or False is correct.";
    }

    if (form.type === "FILL_BLANK" && !form.correctAnswerText.trim()) {
      return "Provide the accepted answer text.";
    }

    return null;
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      type: form.type,
      questionText: form.questionText.trim(),
      section: form.section.trim() || undefined,
    };

    if (form.type === "SINGLE_CORRECT" || form.type === "MULTI_CORRECT") {
      payload.options = form.options.map((o) => o.trim());
      payload.correctIndexes = form.correctIndexes;
    } else if (form.type === "TRUE_FALSE") {
      payload.correctIndexes = form.correctIndexes;
    } else if (form.type === "FILL_BLANK") {
      payload.correctAnswerText = form.correctAnswerText.trim();
    }

    try {
      setAdding(true);
      setError("");

      await api.post(`/exams/${id}/questions`, payload);

      setForm(createEmptyQuestion());

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to add this question."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (questionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(questionId);
      setError("");

      await api.delete(`/questions/${questionId}`);

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to delete this question."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="admin-loading">
          <span className="loading-spinner" />
          <p>Loading exam...</p>
        </div>
      </main>
    );
  }

  if (!exam) {
    return (
      <main className="page">
        <div className="empty-state">
          <h3>Exam not found</h3>
          <p>The exam you're looking for doesn't exist.</p>
          <Link to="/admin" className="btn">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const questionCount = exam.questions?.length || 0;
  const totalMarks = exam.totalMarks ?? 0;

  return (
    <main className="page exam-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/admin">Dashboard</Link>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>

        <span>{exam.title}</span>
      </div>

      {/* Header */}
      <div className="exam-detail-header">
        <div>
          <div className="detail-title-row">
            <h1 className="page-title">{exam.title}</h1>

            <span
              className={`badge ${
                exam.isPublished
                  ? "badge-success"
                  : "badge-warning"
              }`}
            >
              {exam.isPublished ? "Published" : "Draft"}
            </span>
          </div>

          {exam.description && (
            <p className="page-subtitle">
              {exam.description}
            </p>
          )}
        </div>

        <Link to="/admin" className="btn btn-secondary">
          Back to Exams
        </Link>
      </div>

      {error && (
        <div className="error admin-error">
          <span>{error}</span>

          <button type="button" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* Exam stats */}
      <section className="detail-stats">
        <div>
          <span>Questions</span>
          <strong>{questionCount}</strong>
        </div>

        <div>
          <span>Duration</span>
          <strong>{exam.durationMinutes} min</strong>
        </div>

        <div>
          <span>Marks / Question</span>
          <strong>{exam.marksPerQ}</strong>
        </div>

        <div>
          <span>Total Marks</span>
          <strong>{totalMarks}</strong>
        </div>

        <div>
          <span>Negative Marks</span>
          <strong>{exam.negativeMarks || 0}</strong>
        </div>
      </section>

      {/* Add question */}
      <section className="question-builder-section">
        <div className="section-heading">
          <div>
            <h2>Add Question</h2>
            <p>Choose a question type, then fill in the details.</p>
          </div>
        </div>

        <form
          className="question-builder-card"
          onSubmit={handleAddQuestion}
        >
          {/* Type selector */}
          <div className="type-selector">
            {QUESTION_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                className={`type-tab ${
                  form.type === t.value ? "active" : ""
                }`}
                onClick={() => handleTypeChange(t.value)}
              >
                <span className="type-tab-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label htmlFor="questionText">
              Question
            </label>

            <textarea
              id="questionText"
              placeholder="Write your question here..."
              value={form.questionText}
              onChange={(e) =>
                setForm({
                  ...form,
                  questionText: e.target.value,
                })
              }
              rows={4}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="section">
              Section
              <span className="optional-label">
                Optional
              </span>
            </label>

            <input
              id="section"
              placeholder="e.g. Quantitative Aptitude"
              value={form.section}
              onChange={(e) =>
                setForm({
                  ...form,
                  section: e.target.value,
                })
              }
            />
          </div>

          {/* SINGLE_CORRECT / MULTI_CORRECT — editable options list */}
          {(form.type === "SINGLE_CORRECT" ||
            form.type === "MULTI_CORRECT") && (
            <>
              <div className="options-heading">
                <div>
                  <h3>Answer Options</h3>
                  <p>
                    {form.type === "MULTI_CORRECT"
                      ? "Select every option that's correct."
                      : "Select the one correct answer."}
                  </p>
                </div>

                <span>{form.options.length} options</span>
              </div>

              <div className="question-options">
                {form.options.map((option, index) => {
                  const selected = form.correctIndexes.includes(index);

                  return (
                    <div
                      className={`question-option ${
                        selected ? "correct" : ""
                      }`}
                      key={index}
                    >
                      <div
                        className={`option-number ${
                          selected ? "active" : ""
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>

                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(
                          65 + index
                        )}`}
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            e.target.value
                          )
                        }
                        required
                      />

                      <label
                        className={`correct-selector ${
                          form.type === "MULTI_CORRECT" ? "multi" : ""
                        } ${selected ? "selected" : ""}`}
                      >
                        <input
                          type={
                            form.type === "MULTI_CORRECT"
                              ? "checkbox"
                              : "radio"
                          }
                          name="correct"
                          checked={selected}
                          onChange={() => toggleCorrectIndex(index)}
                        />

                        <span className="custom-radio" />

                        <span>
                          {selected
                            ? "Correct answer"
                            : "Mark correct"}
                        </span>
                      </label>

                      {form.options.length > 2 && (
                        <button
                          type="button"
                          className="remove-option-btn"
                          onClick={() => removeOption(index)}
                          aria-label="Remove option"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {form.options.length < 6 && (
                <button
                  type="button"
                  className="add-option-btn"
                  onClick={addOption}
                >
                  + Add Option
                </button>
              )}
            </>
          )}

          {/* TRUE_FALSE — pick True or False */}
          {form.type === "TRUE_FALSE" && (
            <div className="tf-builder">
              <div className="options-heading">
                <div>
                  <h3>Correct Answer</h3>
                  <p>Choose whether this statement is True or False.</p>
                </div>
              </div>

              <div className="tf-toggle-group">
                <button
                  type="button"
                  className={`tf-toggle-btn tf-true ${
                    form.correctIndexes[0] === 0 ? "active" : ""
                  }`}
                  onClick={() => setTrueFalseAnswer(0)}
                >
                  <span className="tf-toggle-icon">✓</span>
                  True
                </button>

                <button
                  type="button"
                  className={`tf-toggle-btn tf-false ${
                    form.correctIndexes[0] === 1 ? "active" : ""
                  }`}
                  onClick={() => setTrueFalseAnswer(1)}
                >
                  <span className="tf-toggle-icon">✕</span>
                  False
                </button>
              </div>
            </div>
          )}

          {/* FILL_BLANK — accepted answer text */}
          {form.type === "FILL_BLANK" && (
            <div className="input-group">
              <label htmlFor="correctAnswerText">
                Accepted Answer(s)
              </label>

              <input
                id="correctAnswerText"
                placeholder="e.g. paris"
                value={form.correctAnswerText}
                onChange={(e) =>
                  setForm({
                    ...form,
                    correctAnswerText: e.target.value,
                  })
                }
                required
              />

              <span className="field-hint">
                Matching is case-insensitive. Separate multiple accepted
                spellings with a "|", e.g. colour|color.
              </span>
            </div>
          )}

          <div className="question-builder-footer">
            <p>
              Make sure the question is complete before adding it.
            </p>

            <button
              type="submit"
              className="btn"
              disabled={adding}
            >
              {adding ? (
                <>
                  <span className="button-spinner" />
                  Adding...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Question
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Questions */}
      <section className="questions-section">
        <div className="section-heading">
          <div>
            <h2>Questions</h2>
            <p>
              Review and manage questions in this exam.
            </p>
          </div>

          <span className="exam-count">
            {questionCount}{" "}
            {questionCount === 1
              ? "question"
              : "questions"}
          </span>
        </div>

        {questionCount === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M8 5h8M8 9h8M8 13h5" />
                <path d="M5 3h14v18H5z" />
              </svg>
            </div>

            <h3>No questions yet</h3>

            <p>
              Use the question builder above to add the first
              question.
            </p>
          </div>
        ) : (
          <div className="question-list">
            {exam.questions.map((question, index) => (
              <article
                className="admin-question-card"
                key={question.id}
              >
                <div className="admin-question-header">
                  <div className="question-number-label">
                    Question {index + 1}
                  </div>

                  <div className="admin-question-badges">
                    <span className="badge question-type-badge">
                      {QUESTION_TYPE_LABELS[question.type] || question.type}
                    </span>

                    {question.section && (
                      <span className="badge badge-info">
                        {question.section}
                      </span>
                    )}
                  </div>
                </div>

                <div className="admin-question-body">
                  <h3>{question.questionText}</h3>

                  {question.type === "FILL_BLANK" ? (
                    <div className="fill-blank-answer-preview">
                      <span className="fill-blank-label">
                        Accepted answer(s):
                      </span>
                      <span className="fill-blank-value">
                        {question.correctAnswerText
                          ?.split("|")
                          .map((a) => a.trim())
                          .join(", ")}
                      </span>
                    </div>
                  ) : (
                    <div className="admin-options-list">
                      {question.options.map(
                        (option, optionIndex) => (
                          <div
                            className={`admin-option ${
                              option.isCorrect ? "correct" : ""
                            }`}
                            key={option.id}
                          >
                            <span className="admin-option-letter">
                              {String.fromCharCode(
                                65 + optionIndex
                              )}
                            </span>

                            <span className="admin-option-text">
                              {option.text}
                            </span>

                            {option.isCorrect && (
                              <span className="correct-label">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="m5 12 4 4L19 6" />
                                </svg>
                                Correct
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="admin-question-footer">
                  <span>
                    {question.type === "FILL_BLANK"
                      ? "Text answer"
                      : `${question.options.length} options`}
                  </span>

                  <button
                    type="button"
                    className="delete-question-button"
                    disabled={
                      deletingId === question.id
                    }
                    onClick={() =>
                      handleDelete(question.id)
                    }
                  >
                    {deletingId === question.id ? (
                      <>
                        <span className="button-spinner danger-spinner" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 15H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
