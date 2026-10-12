import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getErrorMessage } from "../api/client";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@demo.com", password: "Admin123!" },
  { label: "Pelapor 1", email: "pelapor1@demo.com", password: "Pelapor123!" },
  { label: "Pelapor 2", email: "pelapor2@demo.com", password: "Pelapor123!" },
  { label: "Approver", email: "approver@demo.com", password: "Approver123!" },
];

export default function LoginPage() {
  useDocumentTitle("Masuk");
  const { user, loading, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    return <Navigate to="/reports" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      toast.success("Login berhasil. Selamat datang!");
      navigate("/reports", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>Masuk</h1>
        <p className="muted">Field Report Management</p>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@demo.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting && <span className="spinner spinner-xs" aria-hidden="true" />}
            {submitting ? "Memproses..." : "Login"}
          </button>
        </form>
        <div className="demo-box">
          <h2>Akun demo</h2>
          <p className="muted small">Klik untuk mengisi form otomatis.</p>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="demo-item"
                onClick={() => fillDemo(acc.email, acc.password)}
              >
                <strong>{acc.label}</strong>
                <span>{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
