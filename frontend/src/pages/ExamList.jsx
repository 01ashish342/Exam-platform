import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import Timer from "../components/Timer";

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [exam, setExam] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: optionId }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tracks when the user landed on the currently visible question,
  // so we can compute exact time-spent when they navigate away.
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    (async () => {
      const { data } = await api.post(`/attempts/start/${examId}`);
      setAttemptId(data.attemptId);
      setExam(data.exam);
      setLoading(false);
      questionStartRef.current = Date.now();
    })();
  }, [examId]);

  // Sends the answer (or skip) for the question currently being left,
  // along with how many seconds were spent on it.
  const flushCurrentQuestion = useCallback(
    async (indexToFlush) => {
      if (!exam) return;
      const question = exam.questions[indexToFlush];
      if (!question) return;
      const timeTakenSec = Math.round((Date.now() - questionStartRef.current) / 1000);
      const selectedOptionId = answers[question.id] || null;
      try {
        await api.post(`/attempts/${attemptId}/answer`, {
          questionId: question.id,
          selectedOptionId,
          timeTakenSec,
        });
      } catch (e) {
        console.error("Failed to save answer", e);
      }
    },
    [attemptId, exam, answers]
  );

  const goTo = async (index) => {
    if (index < 0 || index >= exam.questions.length) return;
    await flushCurrentQuestion(current);
    questionStartRef.current = Date.now();
    setCurrent(index);
  };

  const selectOption = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleFinalSubmit = useCallback(
    async (autoSubmitted = false) => {
      if (submitting) return;
      setSubmitting(true);
      await flushCurrentQuestion(current);
      const { data } = await api.post(`/attempts/${attemptId}/submit`, { autoSubmitted });
      navigate(`/result/${data.id}`);
    },
    [attemptId, current, flushCurrentQuestion, navigate, submitting]
  );

  const handleExpire = useCallback(() => {
    handleFinalSubmit(true);
  }, [handleFinalSubmit]);

  if (loading) return <p className="center">Loading exam...</p>;

  const question = exam.questions[current];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="exam-page">
      <div className="exam-header">
        <h3>{exam.title}</h3>
        <Timer seconds={exam.durationMinutes * 60} onExpire={handleExpire} />
      </div>

      <div className="exam-body">
        <div className="question-panel">
          <p className="q-count">
            Question {current + 1} of {exam.questions.length}
            {question.section ? ` · ${question.section}` : ""}
          </p>
          <h3>{question.questionText}</h3>
          <div className="options">
            {question.options.map((opt) => (
              <label key={opt.id} className={`option ${answers[question.id] === opt.id ? "selected" : ""}`}>
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[question.id] === opt.id}
                  onChange={() => selectOption(question.id, opt.id)}
                />
                {opt.text}
              </label>
            ))}
          </div>

          <div className="nav-buttons">
            <button disabled={current === 0} onClick={() => goTo(current - 1)}>
              ← Previous
            </button>
            <button
              onClick={() =>
                setAnswers((prev) => {
                  const copy = { ...prev };
                  delete copy[question.id];
                  return copy;
                })
              }
            >
              Clear Selection
            </button>
            {current < exam.questions.length - 1 ? (
              <button onClick={() => goTo(current + 1)}>Next →</button>
            ) : (
              <button className="submit-btn" onClick={() => handleFinalSubmit(false)} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Exam"}
              </button>
            )}
          </div>
        </div>

        <div className="palette">
          <p>Answered: {answeredCount}/{exam.questions.length}</p>
          <div className="palette-grid">
            {exam.questions.map((q, idx) => (
              <button
                key={q.id}
                className={`palette-btn ${answers[q.id] ? "done" : ""} ${idx === current ? "current" : ""}`}
                onClick={() => goTo(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button className="submit-btn full" onClick={() => handleFinalSubmit(false)} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}