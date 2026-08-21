import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Leaderboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/results/exam/${id}/leaderboard`);
      setRows(data);
    })();
  }, [id]);

  return (
    <div className="page">
      <h2>Leaderboard</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
            <th>Accuracy</th>
            <th>Total Time (s)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank}>
              <td>{r.rank}</td>
              <td>{r.userName}</td>
              <td>{r.score}</td>
              <td>{r.accuracy}%</td>
              <td>{r.totalTimeSec}</td>
              <td>
                <button onClick={() => navigate(`/result/${r.attemptId}`)}>
                  View Details
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="6">No attempts yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}