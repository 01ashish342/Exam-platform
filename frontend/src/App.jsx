import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ExamList from "./pages/ExamList";
import TakeExam from "./pages/TakeExam";
import Result from "./pages/Result";
import AdminDashboard from "./pages/AdminDashboard";
import AdminExamDetail from "./pages/AdminExamDetail";
import Leaderboard from "./pages/Leaderboard";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute role="STUDENT">
              <ExamList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:examId"
          element={
            <ProtectedRoute role="STUDENT">
              <TakeExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result/:attemptId"
          element={
            <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exam/:id"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminExamDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exam/:id/leaderboard"
          element={
            <ProtectedRoute role="ADMIN">
              <Leaderboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}