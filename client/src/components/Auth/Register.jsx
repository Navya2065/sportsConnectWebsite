import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'athlete',
    sport: '', company: '', industry: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-text">SPORTSCONNECT</div>
      </div>
      <div className="auth-container fade-in">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">⚡</span>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-sub">Join as an athlete or sponsor</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">I am a</label>
              <div className="role-selector">
                {['athlete', 'sponsor'].map((r) => (
                  <button
                    key={r} type="button"
                    className={`role-btn ${form.role === r ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, role: r })}
                  >
                    <span className="role-icon">{r === 'athlete' ? '🏃' : '🏢'}</span>
                    <span className="role-label">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" className="form-input" placeholder="Your name"
                value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange} required />
            </div>

            {form.role === 'athlete' && (
              <div className="form-group">
                <label className="form-label">Sport</label>
                <input type="text" name="sport" className="form-input" placeholder="e.g. Football, Swimming"
                  value={form.sport} onChange={handleChange} />
              </div>
            )}

            {form.role === 'sponsor' && (
              <>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input type="text" name="company" className="form-input" placeholder="Company name"
                    value={form.company} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input type="text" name="industry" className="form-input" placeholder="e.g. Sports, Tech"
                    value={form.industry} onChange={handleChange} />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <><div className="spinner" />Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
