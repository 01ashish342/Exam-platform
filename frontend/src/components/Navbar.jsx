import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">ExamPro</Link>
      <div className="nav-links">
        {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}
        {user?.role === "STUDENT" && <Link to="/">My Exams</Link>}
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}