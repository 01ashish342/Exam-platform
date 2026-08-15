import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import api from "../api/axios";

const statusColor = { correct: "#16a34a", wrong: "#dc2626", skipped: "#9ca3af" };

export default function Result() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/results/${attemptId}`);
      setResult(data);
    })();
  }, [attemptId]);

  if (!result) return <p className="center">Loading result...</p>;

  const { exam, summary, questionBreakdown } = result;

  const chartData = questionBreakdown.map((q, idx) => ({
    name: `Q${idx + 1}`,
    time: q.timeTakenSec,
    status: q.status,
  }));

  return (
    <div className="page">
      <h2>{exam.title} — Result</h2>

      <div className="summary-grid">
        <div className="summary-card"><h4>Score</h4><p>{summary.totalScore} / {summary.totalMarks}</p></div>
        <div className="summary-card"><h4>Accuracy</h4><p>{summary.accuracy}%</p></div>
        <div className="summary-card"><h4>Correct</h4><p className="green">{summary.correctCount}</p></div>
        <div className="summary-card"><h4>Wrong</h4><p className="red">{summary.wrongCount}</p></div>
        <div className="summary-card"><h4>Skipped</h4><p className="grey">{summary.skippedCount}</p></div>
        <div className="summary-card"><h4>Total Time</h4><p>{Math.round(summary.totalTimeSec / 60)} min</p></div>
        <div className="summary-card"><h4>Avg Time/Q</h4><p>{summary.avgTimePerQuestionSec}s</p></div>
      </div>

      <h3>Time Spent per Question</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: "seconds", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Bar dataKey="time">
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={statusColor[entry.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <h3>Question-wise Breakdown</h3>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Your Answer</th>
            <th>Correct Answer</th>
            <th>Status</th>
            <th>Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {questionBreakdown.map((q, idx) => (
            <tr key={q.questionId}>
              <td>{idx + 1}</td>
              <td>{q.questionText}</td>
              <td>{q.selectedOptionText || "—"}</td>
              <td>{q.correctOptionText}</td>
              <td className={q.status}>{q.status}</td>
              <td>{q.timeTakenSec}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}