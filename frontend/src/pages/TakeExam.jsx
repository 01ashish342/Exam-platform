import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import Timer from "../components/Timer";

const isQuestionAnswered = (question, answer) => {
  if (!question) return false;
  if (question.type === "FILL_BLANK") {
    return typeof answer === "string" && answer.trim().length > 0;
  }
  if (question.type === "MULTI_CORRECT") {
    return Array.isArray(answer) && answer.length > 0;
  }
  return Boolean(answer);
};

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [exam, setExam] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    let mounted = true;

    const startExam = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.post(`/attempts/start/${examId}`);

        if (!mounted) return;

        setAttemptId(data.attemptId);
        setExam(data.exam);
        questionStartRef.current = Date.now();
      } catch (err) {
        if (!mounted) return;

        setError(
          err.response?.data?.message ||
            "Unable to start this exam. Please try again."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    startExam();

    return () => {
      mounted = false;
    };
  }, [examId]);

  const flushCurrentQuestion = useCallback(
    async (indexToFlush) => {
      if (!exam || !attemptId) return;

      const question = exam.questions[indexToFlush];

      if (!question) return;

      const timeTakenSec = Math.max(
        0,
        Math.round((Date.now() - questionStartRef.current) / 1000)
      );

      const answer = answers[question.id];

      const payload = { questionId: question.id, timeTakenSec };

      if (question.type === "FILL_BLANK") {
        payload.answerText = typeof answer === "string" ? answer : "";
      } else if (question.type === "MULTI_CORRECT") {
        payload.selectedOptionIds = Array.isArray(answer) ? answer : [];
      } else {
        // SINGLE_CORRECT / TRUE_FALSE
        payload.selectedOptionIds = answer ? [answer] : [];
      }

      try {
        await api.post(`/attempts/${attemptId}/answer`, payload);
      } catch (err) {
        console.error("Failed to save answer:", err);
      }
    },
    [attemptId, exam, answers]
  );

  const goTo = async (index) => {
    if (
      !exam ||
      index < 0 ||
      index >= exam.questions.length ||
      index === current
    ) {
      return;
    }

    await flushCurrentQuestion(current);

    questionStartRef.current = Date.now();
    setCurrent(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Handles SINGLE_CORRECT, MULTI_CORRECT (toggle) and TRUE_FALSE selections
  const selectOption = (question, optionId) => {
    if (submitting) return;

    setAnswers((prev) => {
      if (question.type === "MULTI_CORRECT") {
        const current = Array.isArray(prev[question.id])
          ? prev[question.id]
          : [];
        const exists = current.includes(optionId);
        const next = exists
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];

        return { ...prev, [question.id]: next };
      }

      return { ...prev, [question.id]: optionId };
    });
  };

  const setAnswerText = (questionId, text) => {
    if (submitting) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const clearSelection = () => {
    const question = exam?.questions[current];

    if (!question) return;

    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[question.id];
      return copy;
    });
  };

  const handleFinalSubmit = useCallback(
    async (autoSubmitted = false) => {
      if (submitting || !attemptId || !exam) return;

      setSubmitting(true);

      try {
        await flushCurrentQuestion(current);

        const { data } = await api.post(
          `/attempts/${attemptId}/submit`,
          { autoSubmitted }
        );

        navigate(`/result/${data.id}`, { replace: true });
      } catch (err) {
        console.error("Failed to submit exam:", err);

        setSubmitting(false);

        alert(
          err.response?.data?.message ||
            "Failed to submit the exam. Please try again."
        );
      }
    },
    [
      attemptId,
      current,
      exam,
      flushCurrentQuestion,
      navigate,
      submitting,
    ]
  );

  const handleExpire = useCallback(() => {
    handleFinalSubmit(true);
  }, [handleFinalSubmit]);

  if (loading) {
    return (
      <div className="exam-loading-page">
        <div className="exam-loading-card">
          <div className="loading-spinner" />
          <h3>Preparing your exam</h3>
          <p>
            Please wait while we load the questions...
          </p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="exam-error-page">
        <div className="exam-error-card">
          <div className="error-icon">!</div>

          <h2>Unable to start exam</h2>

          <p>
            {error || "Something went wrong while loading the exam."}
          </p>

          <button
            className="btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => navigate("/")}
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[current];

  if (!question) {
    return (
      <div className="exam-error-page">
        <div className="exam-error-card">
          <h2>No questions available</h2>
          <p>This exam currently has no questions.</p>

          <button
            className="btn"
            onClick={() => navigate("/")}
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = exam.questions.filter((q) =>
    isQuestionAnswered(q, answers[q.id])
  ).length;
  const totalQuestions = exam.questions.length;
  const progress = Math.round(
    ((current + 1) / totalQuestions) * 100
  );

  const isLastQuestion = current === totalQuestions - 1;
  const isFirstQuestion = current === 0;
  const currentAnswer = answers[question.id];
  const currentAnswered = isQuestionAnswered(question, currentAnswer);

  const instructionByType = {
    MULTI_CORRECT: "Select all correct answers that apply.",
    TRUE_FALSE: "Choose True or False.",
    FILL_BLANK: "Type your answer in the box below.",
  };

  return (
    <div className="exam-page">
      {/* =========================
          EXAM HEADER
      ========================== */}
      <header className="exam-header">
        <div className="exam-title-wrapper">
          <div className="exam-title-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z" />
              <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
            </svg>
          </div>

          <div>
            <h1>{exam.title}</h1>

            <div className="exam-meta">
              <span>
                {totalQuestions} Questions
              </span>

              <span className="meta-dot">•</span>

              <span>
                {exam.totalMarks} Marks
              </span>
            </div>
          </div>
        </div>

        <div className="exam-timer-wrapper">
          <span className="timer-label">
            Time Remaining
          </span>

          <Timer
            seconds={exam.durationMinutes * 60}
            onExpire={handleExpire}
          />
        </div>
      </header>

      {/* =========================
          PROGRESS
      ========================== */}
      <div className="exam-progress">
        <div className="progress-info">
          <span>
            Question <strong>{current + 1}</strong> of{" "}
            <strong>{totalQuestions}</strong>
          </span>

          <span>{progress}% completed</span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* =========================
          MAIN EXAM AREA
      ========================== */}
      <div className="exam-body">
        {/* QUESTION */}
        <main className="question-panel">
          <div className="question-top">
            <div className="question-number">
              Question {current + 1}
            </div>

            {question.section && (
              <span className="question-section">
                {question.section}
              </span>
            )}
          </div>

          <div className="question-content">
            <h2>{question.questionText}</h2>

            <p className="question-instruction">
              {instructionByType[question.type] ||
                "Select the correct answer from the options below."}
            </p>
          </div>

          {/* ANSWER INPUT — varies by question type */}
          {question.type === "FILL_BLANK" ? (
            <div className="fill-blank-answer">
              <input
                type="text"
                className="fill-blank-input"
                placeholder="Type your answer here..."
                value={typeof currentAnswer === "string" ? currentAnswer : ""}
                onChange={(e) =>
                  setAnswerText(question.id, e.target.value)
                }
                disabled={submitting}
              />
            </div>
          ) : question.type === "TRUE_FALSE" ? (
            <div className="true-false-options">
              {question.options.map((opt) => {
                const selected = currentAnswer === opt.id;
                const isTrue = opt.text === "True";

                return (
                  <button
                    type="button"
                    key={opt.id}
                    className={`tf-option ${
                      isTrue ? "tf-true" : "tf-false"
                    } ${selected ? "selected" : ""}`}
                    onClick={() => selectOption(question, opt.id)}
                    disabled={submitting}
                  >
                    <span className="tf-icon">
                      {isTrue ? "✓" : "✕"}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="options">
              {question.options.map((opt, index) => {
                const isMulti = question.type === "MULTI_CORRECT";
                const selected = isMulti
                  ? Array.isArray(currentAnswer) &&
                    currentAnswer.includes(opt.id)
                  : currentAnswer === opt.id;

                return (
                  <label
                    key={opt.id}
                    className={`option ${
                      isMulti ? "option-checkbox-style" : ""
                    } ${selected ? "selected" : ""}`}
                  >
                    <input
                      type={isMulti ? "checkbox" : "radio"}
                      name={
                        isMulti ? `${question.id}-${opt.id}` : question.id
                      }
                      value={opt.id}
                      checked={selected}
                      onChange={() => selectOption(question, opt.id)}
                    />

                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="option-text">
                      {opt.text}
                    </span>

                    <span className="option-check">
                      {selected && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* NAVIGATION */}
          <div className="nav-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isFirstQuestion || submitting}
              onClick={() => goTo(current - 1)}
            >
              <span>←</span>
              Previous
            </button>

            {currentAnswered && (
              <button
                type="button"
                className="clear-answer-btn"
                disabled={submitting}
                onClick={clearSelection}
              >
                Clear answer
              </button>
            )}

            <div className="nav-spacer" />

            {!isLastQuestion ? (
              <button
                type="button"
                className="btn"
                disabled={submitting}
                onClick={() => goTo(current + 1)}
              >
                Save & Next
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
              >
                {submitting ? (
                  <>
                    <span className="button-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Exam
                    <span>✓</span>
                  </>
                )}
              </button>
            )}
          </div>
        </main>

        {/* =========================
            QUESTION PALETTE
        ========================== */}
        <aside className="palette">
          <div className="palette-header">
            <div>
              <h3>Question Navigator</h3>
              <p>
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="palette-legend">
            <div>
              <span className="legend-dot answered" />
              Answered
            </div>

            <div>
              <span className="legend-dot current" />
              Current
            </div>

            <div>
              <span className="legend-dot unanswered" />
              Unanswered
            </div>
          </div>

          {/* Question buttons */}
          <div className="palette-grid">
            {exam.questions.map((q, idx) => {
              const isAnswered = isQuestionAnswered(q, answers[q.id]);
              const isCurrent = idx === current;

              return (
                <button
                  key={q.id}
                  type="button"
                  aria-label={`Question ${idx + 1}`}
                  className={`
                    palette-btn
                    ${isAnswered ? "done" : ""}
                    ${isCurrent ? "current" : ""}
                  `}
                  onClick={() => goTo(idx)}
                  disabled={submitting}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Progress */}
          <div className="palette-progress">
            <div className="palette-progress-top">
              <span>Completion</span>
              <strong>
                {answeredCount}/{totalQuestions}
              </strong>
            </div>

            <div className="palette-progress-track">
              <div
                className="palette-progress-fill"
                style={{
                  width: `${
                    totalQuestions
                      ? (answeredCount / totalQuestions) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            className="submit-btn full"
            onClick={() => handleFinalSubmit(false)}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>

          <p className="submit-warning">
            Make sure you have reviewed all your answers before
            submitting.
          </p>
        </aside>
      </div>
    </div>
  );
}
