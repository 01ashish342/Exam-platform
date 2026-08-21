import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const user = await register(
        form.name,
        form.email,
        form.password,
        form.role
      );

      navigate(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create your account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout register-layout">

        {/* Left Showcase */}
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
              Start your journey with <span>ExamPro</span>
            </h1>

            <p>
              Create your account and get access to mock exams,
              performance tracking, and a smarter way to prepare.
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
                  <strong>Practice Anywhere</strong>
                  <span>Take mock exams whenever you want</span>
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
                  <strong>Track Your Progress</strong>
                  <span>See scores and improve over time</span>
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
                  <strong>Prepare With Confidence</strong>
                  <span>Know where you stand before exam day</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section className="auth-form-section">
          <form
            className="auth-card register-card"
            onSubmit={handleSubmit}
          >

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

              <h2>Create your account</h2>

              <p className="auth-description">
                Fill in your details to get started with ExamPro.
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

            {/* Name */}
            <div className="form-field">
              <label htmlFor="name">Full name</label>

              <div className="input-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-field">
              <label htmlFor="register-email">Email address</label>

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
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-field">
              <label htmlFor="register-password">Password</label>

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
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <span className="field-hint">
                Use at least 6 characters.
              </span>
            </div>

            {/* Role */}
            <div className="form-field">
              <label htmlFor="role">Account type</label>

              <div className="role-options">

                <label
                  className={`role-option ${
                    form.role === "STUDENT" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="STUDENT"
                    checked={form.role === "STUDENT"}
                    onChange={handleChange}
                  />

                  <span className="role-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                    </svg>
                  </span>

                  <span className="role-content">
                    <strong>Student</strong>
                    <small>Take exams and track results</small>
                  </span>

                  <span className="role-check">
                    <span />
                  </span>
                </label>

                <label
                  className={`role-option ${
                    form.role === "ADMIN" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="ADMIN"
                    checked={form.role === "ADMIN"}
                    onChange={handleChange}
                  />

                  <span className="role-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="3" />
                      <path d="M8 9h8" />
                      <path d="M8 13h5" />
                    </svg>
                  </span>

                  <span className="role-content">
                    <strong>Administrator</strong>
                    <small>Create and manage exams</small>
                  </span>

                  <span className="role-check">
                    <span />
                  </span>
                </label>

              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-submit register-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account

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

            {/* Login */}
            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <Link to="/login" className="register-link">
              Sign in to your account
            </Link>

          </form>
        </section>

      </div>
    </main>
  );
}