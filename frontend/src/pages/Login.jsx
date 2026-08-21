import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      navigate(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">

        {/* Left / Branding Section */}
        <section className="auth-showcase">
          <div className="auth-showcase-content">
            <div className="auth-brand-mark">
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
            </div>

            <h1>
              Welcome back to <span>ExamPro</span>
            </h1>

            <p>
              Practice smarter, track your performance, and prepare
              yourself for your next exam.
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 3v18" />
                    <path d="M3 12h18" />
                  </svg>
                </span>

                <div>
                  <strong>Practice Tests</strong>
                  <span>Take realistic mock exams</span>
                </div>
              </div>

              <div className="auth-feature">
                <span className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 3v18h18" />
                    <path d="m7 16 4-5 3 3 5-7" />
                  </svg>
                </span>

                <div>
                  <strong>Track Performance</strong>
                  <span>Understand your strengths</span>
                </div>
              </div>

              <div className="auth-feature">
                <span className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>

                <div>
                  <strong>Exam Ready</strong>
                  <span>Build confidence before the real test</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Login Card */}
        <section className="auth-form-section">
          <form className="auth-card login-card" onSubmit={handleSubmit}>

            <div className="auth-card-header">
              <div className="mobile-auth-logo">
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
              </div>

              <h2>Sign in</h2>

              <p className="auth-description">
                Enter your details to access your account.
              </p>
            </div>

            {error && (
              <div className="error auth-error" role="alert">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">Email address</label>

              <div className="input-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <polyline points="3 7 12 13 21 7" />
                </svg>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
              </div>

              <div className="input-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>New to ExamPro?</span>
            </div>

            <Link to="/register" className="register-link">
              Create an account
            </Link>

            <div className="demo-credentials">
              <div className="demo-header">
                <span>Demo credentials</span>
              </div>

              <div className="demo-row">
                <span>Admin</span>
                <code>admin@example.com</code>
              </div>

              <div className="demo-row">
                <span>Student</span>
                <code>student@example.com</code>
              </div>

              <p>Password: <code>password123</code></p>
            </div>

          </form>
        </section>
      </div>
    </main>
  );
}