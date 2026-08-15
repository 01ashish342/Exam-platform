import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function Leaderboard() {
  const { id } = useParams();
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
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="5">No attempts yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}