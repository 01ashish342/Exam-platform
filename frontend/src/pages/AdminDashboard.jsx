import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", durationMinutes: 30, marksPerQ: 1, negativeMarks: 0 });

  const load = async () => {
    const { data } = await api.get("/exams");
    setExams(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post("/exams", {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      marksPerQ: Number(form.marksPerQ),
      negativeMarks: Number(form.negativeMarks),
    });
    setForm({ title: "", description: "", durationMinutes: 30, marksPerQ: 1, negativeMarks: 0 });
    load();
  };

  const handlePublish = async (id) => {
    await api.patch(`/exams/${id}/publish`);
    load();
  };

  return (
    <div className="page">
      <h2>Admin — Manage Exams</h2>

      <form className="card form-card" onSubmit={handleCreate}>
        <h3>Create New Exam</h3>
        <input name="title" placeholder="Exam title" value={form.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <div className="row">
          <label>
            Duration (min)
            <input name="durationMinutes" type="number" min="1" value={form.durationMinutes} onChange={handleChange} required />
          </label>
          <label>
            Marks / Question
            <input name="marksPerQ" type="number" step="0.5" value={form.marksPerQ} onChange={handleChange} required />
          </label>
          <label>
            Negative Marks
            <input name="negativeMarks" type="number" step="0.25" value={form.negativeMarks} onChange={handleChange} />
          </label>
        </div>
        <button type="submit" className="btn">Create Exam</button>
      </form>

      <h3>Your Exams</h3>
      <div className="grid">
        {exams.map((exam) => (
          <div className="card" key={exam.id}>
            <h4>{exam.title}</h4>
            <p className="meta">
              {exam._count.questions} questions · {exam.durationMinutes} min · {exam.isPublished ? "Published" : "Draft"}
            </p>
            <div className="card-actions">
              <Link to={`/admin/exam/${exam.id}`}>Manage Questions</Link>
              {!exam.isPublished && (
                <button onClick={() => handlePublish(exam.id)} disabled={exam._count.questions === 0}>
                  Publish
                </button>
              )}
              {exam.isPublished && <Link to={`/admin/exam/${exam.id}/leaderboard`}>Leaderboard</Link>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}