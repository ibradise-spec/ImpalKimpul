import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const { admin, loading, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && admin) {
    return <Navigate to={location.state?.from || '/admin'} replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <div className="brand">
          <div className="brand-name">LostNFound</div>
          <div className="brand-sub">Telkom University Surabaya</div>
        </div>
        <h1>Masuk Admin</h1>
        <p className="login-note">Halaman ini khusus petugas logistik.</p>

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && (
          <p className="alert-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Memeriksa...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
