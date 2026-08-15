import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

const emptyQ = { questionText: "", section: "", options: ["", "", "", ""], correctIndex: 0 };

export default function AdminExamDetail() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [form, setForm] = useState(emptyQ);

  const load = async () => {
    const { data } = await api.get(`/exams/${id}`);
    setExam(data);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleOptionChange = (idx, value) => {
    const options = [...form.options];
    options[idx] = value;
    setForm({ ...form, options });
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    await api.post(`/exams/${id}/questions`, form);
    setForm(emptyQ);
    load();
  };

  const handleDelete = async (qId) => {
    await api.delete(`/questions/${qId}`);
    load();
  };

  if (!exam) return <p className="center">Loading...</p>;

  return (
    <div className="page">
      <h2>{exam.title}</h2>
      <p className="meta">{exam.questions.length} questions · Total marks: {exam.totalMarks}</p>

      <form className="card form-card" onSubmit={handleAddQuestion}>
        <h3>Add Question</h3>
        <textarea
          placeholder="Question text"
          value={form.questionText}
          onChange={(e) => setForm({ ...form, questionText: e.target.value })}
          required
        />
        <input
          placeholder="Section (optional, e.g. Reasoning)"
          value={form.section}
          onChange={(e) => setForm({ ...form, section: e.target.value })}
        />
        {form.options.map((opt, idx) => (
          <div className="row" key={idx}>
            <input
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
            />
            <label>
              <input
                type="radio"
                name="correct"
                checked={form.correctIndex === idx}
                onChange={() => setForm({ ...form, correctIndex: idx })}
              />
              Correct
            </label>
          </div>
        ))}
        <button type="submit" className="btn">Add Question</button>
      </form>

      <h3>Questions</h3>
      {exam.questions.map((q, idx) => (
        <div className="card question-item" key={q.id}>
          <p><b>Q{idx + 1}.</b> {q.questionText}</p>
          <ul>
            {q.options.map((o) => (
              <li key={o.id} className={o.id === q.correctOptionId ? "correct-option" : ""}>
                {o.text}
              </li>
            ))}
          </ul>
          <button onClick={() => handleDelete(q.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}