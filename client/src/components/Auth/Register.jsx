import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const SPORTS = ['Cricket','Football','Basketball','Tennis','Athletics','Swimming',
  'Badminton','Hockey','Kabaddi','Wrestling','Boxing','Cycling','Other'];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params]  = useSearchParams();

  const [role, setRole] = useState(params.get('role') || 'athlete');
  const [form, setForm] = useState({ name:'', email:'', password:'', sport:'', companyName:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register({ ...form, role });
      toast.success('Account created! Welcome to SportsConnect 🚀');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* ── Left visual ───────────────────────────────────── */}
      <div className="auth-visual">
        <div className="auth-visual-bg" />
        <div className="auth-visual-lines" />
        <div className="auth-visual-grid" />

        <div className="auth-logo">SPORTSCONNECT</div>

        <div className="auth-visual-content">
          <div className="auth-visual-tag">
            {role === 'athlete' ? '🏅 Athlete Account' : '💼 Brand Account'}
          </div>
          <h2 className="auth-visual-headline">
            {role === 'athlete' ? <>YOUR BRAND<br /><span>STARTS HERE.</span></> : <>FIND YOUR<br /><span>ATHLETES.</span></>}
          </h2>
          <p className="auth-visual-sub">
            {role === 'athlete'
              ? 'Build a media-kit-grade profile. Get discovered by top brands. Close deals on your terms.'
              : 'Create targeted campaigns. Access 2,400+ verified athletes. Track ROI in real time.'}
          </p>

          {role === 'athlete' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {['Build a verified athlete profile','Get matched to brands by AI','Apply to campaigns or get invited','Track all your deals and earnings'].map((t,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--text-secondary)' }}>
                  <span style={{ color:'var(--accent)', fontWeight:700 }}>✓</span> {t}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {['Post campaigns with budget & deliverables','AI matches you with ideal athletes','Manage all offers in one deal center','Download contracts instantly'].map((t,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--text-secondary)' }}>
                  <span style={{ color:'var(--accent-gold)', fontWeight:700 }}>✓</span> {t}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="auth-visual-footer">Free to join · No credit card required</div>
      </div>

      {/* ── Right form ────────────────────────────────────── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <div className="auth-form-tag">Create Account</div>
            <h1 className="auth-form-title">JOIN THE PLATFORM</h1>
            <p className="auth-form-sub">Already have an account?{' '}
              <span className="auth-switch-link" onClick={() => navigate('/login')}>Sign In →</span>
            </p>
          </div>

          {/* Role picker */}
          <div className="auth-role-picker">
            <button type="button"
              className={`auth-role-btn${role === 'athlete' ? ' active' : ''}`}
              onClick={() => setRole('athlete')}>
              <span className="auth-role-icon">🏅</span>
              <span className="auth-role-label">Athlete</span>
              <span className="auth-role-sub">I compete & create</span>
            </button>
            <button type="button"
              className={`auth-role-btn${role === 'sponsor' ? ' active' : ''}`}
              onClick={() => setRole('sponsor')}>
              <span className="auth-role-icon">💼</span>
              <span className="auth-role-label">Brand / Sponsor</span>
              <span className="auth-role-sub">I fund & market</span>
            </button>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-fields">
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input className="input" placeholder="Arjun Mehta"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              {role === 'sponsor' && (
                <div className="auth-field">
                  <label className="auth-label">Company / Brand Name</label>
                  <input className="input" placeholder="SportsBrand Co."
                    value={form.companyName} onChange={e => set('companyName', e.target.value)} />
                </div>
              )}
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              {role === 'athlete' && (
                <div className="auth-field">
                  <label className="auth-label">Primary Sport</label>
                  <select className="input" value={form.sport} onChange={e => set('sport', e.target.value)}>
                    <option value="">Select your sport…</option>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input className="input" type="password" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width:18,height:18,borderWidth:2 }} /> Creating Account…</>
                : `Create ${role === 'athlete' ? 'Athlete' : 'Brand'} Account →`}
            </button>
          </form>

          <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:16, lineHeight:1.6 }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', cursor:'pointer' }}
              onClick={() => navigate('/')}>← Back to home</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
