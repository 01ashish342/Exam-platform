import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const getInitials = (name = "") => {
    return name
      .trim()
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="brand" onClick={closeMobileMenu}>
          <span className="brand-icon">
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
          </span>

          <span className="brand-text">
            Exam<span>Pro</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links">
          {user?.role === "ADMIN" && (
            <Link to="/admin" className="nav-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Dashboard
            </Link>
          )}

          {user?.role === "STUDENT" && (
            <Link to="/" className="nav-link">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              </svg>
              My Exams
            </Link>
          )}

          {user ? (
            <div className="user-menu">
              <div className="user-profile">
                <div className="user-avatar">
                  {getInitials(user.name)}
                </div>

                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">
                    {user.role === "ADMIN" ? "Administrator" : "Student"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                title="Logout"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-button">
              Login
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${mobileMenuOpen ? "open" : ""}`}>
        {user?.role === "ADMIN" && (
          <Link to="/admin" className="mobile-nav-link" onClick={closeMobileMenu}>
            Dashboard
          </Link>
        )}

        {user?.role === "STUDENT" && (
          <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
            My Exams
          </Link>
        )}

        {user ? (
          <>
            <div className="mobile-user">
              <div className="user-avatar">{getInitials(user.name)}</div>

              <div>
                <div className="user-name">{user.name}</div>
                <div className="user-role">
                  {user.role === "ADMIN" ? "Administrator" : "Student"}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="mobile-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="mobile-login"
            onClick={closeMobileMenu}
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}