import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [examsRes, attemptsRes] = await Promise.all([
        api.get("/exams"),
        api.get("/attempts/my"),
      ]);
      setExams(examsRes.data);
      setAttempts(attemptsRes.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="center">Loading...</p>;

  return (
    <div className="page">
      <h2>Available Mock Exams</h2>
      <div className="grid">
        {exams.map((exam) => (
          <div className="card" key={exam.id}>
            <h3>{exam.title}</h3>
            <p>{exam.description}</p>
            <p className="meta">
              {exam._count.questions} Questions · {exam.durationMinutes} min · {exam.totalMarks} marks
            </p>
            <Link className="btn" to={`/exam/${exam.id}`}>
              Start Test
            </Link>
          </div>
        ))}
        {exams.length === 0 && <p>No exams published yet.</p>}
      </div>

      <h2>Your Past Attempts</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Exam</th>
            <th>Score</th>
            <th>Accuracy</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id}>
              <td>{a.exam.title}</td>
              <td>{a.totalScore} / {a.exam.totalMarks}</td>
              <td>{a.accuracy}%</td>
              <td>{a.status}</td>
              <td>
                <Link to={`/result/${a.id}`}>View Result</Link>
              </td>
            </tr>
          ))}
          {attempts.length === 0 && (
            <tr>
              <td colSpan="5">No attempts yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}