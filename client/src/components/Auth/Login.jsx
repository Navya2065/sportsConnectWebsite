import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const HIGHLIGHTS = [
  { icon: '🎯', text: 'AI-powered athlete-brand matching' },
  { icon: '📊', text: 'Real-time deal analytics dashboard' },
  { icon: '📄', text: 'One-click digital contracts' },
  { icon: '💬', text: 'Built-in messaging & negotiation' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* ── Left visual panel ─────────────────────────────── */}
      <div className="auth-visual">
        <div className="auth-visual-bg" />
        <div className="auth-visual-lines" />
        <div className="auth-visual-grid" />

        <div className="auth-logo">SPORTSCONNECT</div>

        <div className="auth-visual-content">
          <div className="auth-visual-tag">Platform Features</div>
          <h2 className="auth-visual-headline">
            DEALS THAT<br />
            <span>MOVE FAST.</span>
          </h2>
          <p className="auth-visual-sub">
            The platform where serious athletes meet ambitious brands.
            Close deals, earn more, grow your name.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
            {HIGHLIGHTS.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.1rem' }}>{h.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{h.text}</span>
              </div>
            ))}
          </div>
          <div className="auth-visual-stats">
            <div className="auth-vis-stat">
              <div className="auth-vis-num">2,400+</div>
              <div className="auth-vis-lbl">Athletes</div>
            </div>
            <div className="auth-vis-stat">
              <div className="auth-vis-num">₹50L+</div>
              <div className="auth-vis-lbl">Deals Closed</div>
            </div>
            <div className="auth-vis-stat">
              <div className="auth-vis-num">180+</div>
              <div className="auth-vis-lbl">Brands</div>
            </div>
          </div>
        </div>

        <div className="auth-visual-footer">© 2025 SportsConnect · Built for the serious ones.</div>
      </div>

      {/* ── Right form panel ──────────────────────────────── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <div className="auth-form-tag">Welcome Back</div>
            <h1 className="auth-form-title">SIGN IN</h1>
            <p className="auth-form-sub">Enter your credentials to access your account.</p>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-fields">
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width:18,height:18,borderWidth:2 }} /> Signing In…</>
                : 'Sign In →'}
            </button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Don't have an account?</span>
            <div className="auth-divider-line" />
          </div>

          <div className="auth-switch">
            <span
              className="auth-switch-link"
              onClick={() => navigate('/register')}
            >
              Create your free account →
            </span>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span
              style={{ fontSize:12, color:'var(--text-muted)', cursor:'pointer' }}
              onClick={() => navigate('/')}
            >
              ← Back to home
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
