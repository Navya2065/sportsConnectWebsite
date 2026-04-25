import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

// ── Animated counter ─────────────────────────────────────────────────────────
const Counter = ({ target, suffix = '', prefix = '' }) => {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = target / 60;
      const tick = () => {
        start = Math.min(start + step, target);
        setVal(Math.floor(start));
        if (start < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{val.toLocaleString('en-IN')}{suffix}</span>;
};

// ── How it works steps ───────────────────────────────────────────────────────
const STEPS = [
  { num: '01', icon: '🏅', title: 'Create Your Profile', desc: 'Athletes build media-kit-grade profiles with stats, social reach, and portfolio. Brands set up verified company pages in minutes.' },
  { num: '02', icon: '🎯', title: 'AI Matches You', desc: 'Our Smart Match engine scores compatibility across sport, budget, engagement, and reputation — surfacing the best fits instantly.' },
  { num: '03', icon: '📣', title: 'Launch or Apply', desc: 'Brands create campaigns. Athletes apply with a pitch. Or brands directly invite. Every step is tracked in real-time.' },
  { num: '04', icon: '💸', title: 'Close Deals', desc: 'Negotiate offers, sign digital contracts, and manage active deals — all in one platform. Track earnings. Scale fast.' },
];

// ── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Arjun Mehta', role: 'Pro Cricketer · 280K Followers', quote: 'I closed 3 brand deals within my first week. The match scoring is genuinely scary accurate.', avatar: '🏏' },
  { name: 'Priya Dynamics', role: 'Head of Marketing · SportsBrand Co.', quote: 'We found 12 athlete partners for our campaign in 48 hours. The ROI tracking alone is worth it.', avatar: '💼' },
  { name: 'Rahul Singh', role: 'Marathon Runner · 95K Followers', quote: 'Finally a platform that treats athletes like professionals, not influencers. Game-changing.', avatar: '🏃' },
];

// ── Featured sports ──────────────────────────────────────────────────────────
const SPORTS = ['Cricket', 'Football', 'Athletics', 'Tennis', 'Basketball', 'Swimming', 'Badminton', 'Kabaddi', 'Boxing', 'Wrestling', 'Cycling', 'Hockey'];

// ─────────────────────────────────────────────────────────────────────────────
const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSport, setActiveSport] = useState(0);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const t = setInterval(() => setActiveSport(i => (i + 1) % SPORTS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landing">

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="ln-nav">
        <div className="ln-nav-inner">
          <div className="ln-logo">
            <span className="ln-logo-mark">SPORTSCONNECT</span>
            <span className="ln-logo-tag">BETA</span>
          </div>
          <div className="ln-nav-links">
            <a href="#how-it-works" className="ln-nav-link">How It Works</a>
            <a href="#features"     className="ln-nav-link">Features</a>
            <a href="#testimonials" className="ln-nav-link">Stories</a>
          </div>
          <div className="ln-nav-cta">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Get Started →</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="ln-hero">
        {/* Background atmosphere */}
        <div className="ln-hero-glow" />
        <div className="ln-hero-glow ln-hero-glow--2" />
        <div className="ln-hero-lines" />

        <div className="ln-hero-inner">
          <div className="ln-hero-overline">
            <span className="ln-dot" />
            The #1 Sports Sponsorship Platform in India
          </div>

          <h1 className="ln-hero-title">
            <span className="ln-hero-line">WHERE ATHLETES</span>
            <span className="ln-hero-line ln-hero-line--accent">MEET BRANDS</span>
            <span className="ln-hero-line">THAT WIN.</span>
          </h1>

          <p className="ln-hero-sub">
            AI-powered matching. Real-time deal tracking. Digital contracts.
            <br />The platform serious athletes and ambitious brands choose.
          </p>

          {/* Sport ticker */}
          <div className="ln-sport-ticker">
            <span className="ln-ticker-label">Now active in</span>
            <span className="ln-ticker-sport" key={activeSport}>{SPORTS[activeSport]}</span>
          </div>

          <div className="ln-hero-ctas">
            <button className="btn btn-primary btn-xl ln-cta-main" onClick={() => navigate('/register?role=athlete')}>
              <span>🏅</span> I'm an Athlete
            </button>
            <button className="btn btn-gold btn-xl" onClick={() => navigate('/register?role=sponsor')}>
              <span>💼</span> I'm a Brand
            </button>
          </div>

          <p className="ln-hero-note">Free to join · No credit card required</p>
        </div>

        {/* Hero visual — mock dashboard card */}
        <div className="ln-hero-visual">
          <div className="ln-mock-card">
            <div className="ln-mock-header">
              <div className="ln-mock-dots">
                <span /><span /><span />
              </div>
              <span className="ln-mock-title">Live Deals</span>
              <span className="badge badge-active">● Live</span>
            </div>
            <div className="ln-mock-stats">
              <div className="ln-mock-stat">
                <div className="ln-mock-num">₹4.2L</div>
                <div className="ln-mock-lbl">Active Deal</div>
              </div>
              <div className="ln-mock-stat">
                <div className="ln-mock-num ln-mock-num--gold">92%</div>
                <div className="ln-mock-lbl">Match Score</div>
              </div>
              <div className="ln-mock-stat">
                <div className="ln-mock-num ln-mock-num--green">+18</div>
                <div className="ln-mock-lbl">New Offers</div>
              </div>
            </div>
            <div className="ln-mock-bar-row">
              <div className="ln-mock-bar-label">Cricket</div>
              <div className="ln-mock-bar"><div className="ln-mock-bar-fill" style={{ width: '82%' }} /></div>
              <span>82%</span>
            </div>
            <div className="ln-mock-bar-row">
              <div className="ln-mock-bar-label">Football</div>
              <div className="ln-mock-bar"><div className="ln-mock-bar-fill ln-mock-bar-fill--gold" style={{ width: '64%' }} /></div>
              <span>64%</span>
            </div>
            <div className="ln-mock-bar-row">
              <div className="ln-mock-bar-label">Athletics</div>
              <div className="ln-mock-bar"><div className="ln-mock-bar-fill ln-mock-bar-fill--blue" style={{ width: '47%' }} /></div>
              <span>47%</span>
            </div>
            <div className="ln-mock-footer">
              <div className="ln-mock-athletes">
                {['🏏','⚽','🏃','🏸','🎾'].map((e,i) => (
                  <div key={i} className="ln-mock-athlete-dot">{e}</div>
                ))}
                <span className="ln-mock-more">+240 online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <section className="ln-stats">
        <div className="ln-stats-inner">
          {[
            { val: 2400, suffix: '+', label: 'Athletes', icon: '🏅' },
            { val: 180,  suffix: '+', label: 'Brand Partners', icon: '💼' },
            { val: 50,   prefix: '₹', suffix: 'L+', label: 'Deals Closed', icon: '💸' },
            { val: 98,   suffix: '%', label: 'Satisfaction', icon: '⭐' },
          ].map((s, i) => (
            <div key={i} className="ln-stat">
              <span className="ln-stat-icon">{s.icon}</span>
              <div className="ln-stat-num">
                <Counter target={s.val} suffix={s.suffix} prefix={s.prefix} />
              </div>
              <div className="ln-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="ln-section" id="how-it-works">
        <div className="ln-section-inner">
          <div className="ln-section-header">
            <div className="overline">How It Works</div>
            <h2 className="ln-section-title">From Profile to Payday<br /><span className="accent-text">in 4 Steps</span></h2>
          </div>
          <div className="ln-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="ln-step">
                <div className="ln-step-num">{s.num}</div>
                <div className="ln-step-icon">{s.icon}</div>
                <h3 className="ln-step-title">{s.title}</h3>
                <p className="ln-step-desc">{s.desc}</p>
                {i < STEPS.length - 1 && <div className="ln-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="ln-section ln-features-section" id="features">
        <div className="ln-section-inner">
          <div className="ln-section-header">
            <div className="overline">Platform Features</div>
            <h2 className="ln-section-title">Everything You Need to<br /><span className="accent-text">Dominate Deals</span></h2>
          </div>
          <div className="ln-features">
            {[
              { icon: '🎯', title: 'AI Smart Matching', desc: 'Our algorithm scores athlete-brand compatibility across 5 dimensions. Stop guessing, start closing.', tag: 'Powered by AI' },
              { icon: '📣', title: 'Campaign Management', desc: 'Brands post campaigns with budgets, slots, and deliverables. Athletes apply or get directly invited.', tag: 'Real-time' },
              { icon: '📄', title: 'Digital Contracts', desc: 'Generate and manage legally-formatted PDF contracts in one click. No lawyers, no delays.', tag: 'Instant' },
              { icon: '⭐', title: 'Review & Reputation', desc: 'After every deal, both parties leave verified reviews. Build a track record that compounds.', tag: 'Verified' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Track earnings, acceptance rates, sports distribution, and monthly activity — all visualized.', tag: 'Live data' },
              { icon: '💬', title: 'Integrated Messaging', desc: 'Real-time chat built into every deal flow. Negotiate, clarify, and confirm without leaving the platform.', tag: 'Socket.IO' },
            ].map((f, i) => (
              <div key={i} className="ln-feature-card">
                <div className="ln-feature-top">
                  <span className="ln-feature-icon">{f.icon}</span>
                  <span className="badge badge-orange">{f.tag}</span>
                </div>
                <h3 className="ln-feature-title">{f.title}</h3>
                <p className="ln-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPORTS ───────────────────────────────────────────────────── */}
      <section className="ln-sports-section">
        <div className="ln-section-inner">
          <div className="overline" style={{ textAlign: 'center', marginBottom: 16 }}>Sports We Cover</div>
          <div className="ln-sports-grid">
            {SPORTS.map((s, i) => (
              <div key={i} className="ln-sport-chip">{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="ln-section" id="testimonials">
        <div className="ln-section-inner">
          <div className="ln-section-header">
            <div className="overline">Real Stories</div>
            <h2 className="ln-section-title">Athletes & Brands<br /><span className="accent-text">Love It Here</span></h2>
          </div>
          <div className="ln-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="ln-testimonial">
                <div className="ln-testimonial-quote">"{t.quote}"</div>
                <div className="ln-testimonial-author">
                  <div className="ln-testimonial-avatar">{t.avatar}</div>
                  <div>
                    <div className="ln-testimonial-name">{t.name}</div>
                    <div className="ln-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="ln-cta-section">
        <div className="ln-cta-glow" />
        <div className="ln-cta-inner">
          <h2 className="ln-cta-title">
            READY TO PLAY<br />
            <span className="accent-text">AT THE TOP LEVEL?</span>
          </h2>
          <p className="ln-cta-sub">Join 2,400+ athletes and 180+ brands already on the platform.</p>
          <div className="ln-cta-btns">
            <button className="btn btn-primary btn-xl ln-cta-main" onClick={() => navigate('/register')}>
              Create Your Free Account →
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="ln-footer">
        <div className="ln-footer-inner">
          <div className="ln-logo">
            <span className="ln-logo-mark">SPORTSCONNECT</span>
          </div>
          <p className="ln-footer-copy">© 2025 SportsConnect. Built for the serious ones.</p>
          <div className="ln-footer-links">
            <a href="#" className="ln-footer-link">Privacy</a>
            <a href="#" className="ln-footer-link">Terms</a>
            <a href="#" className="ln-footer-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
