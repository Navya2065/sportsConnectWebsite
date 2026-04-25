import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Analytics.css';

// ─── Tiny helpers ────────────────────────────────────────────────────────────
const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

const pct = (v, max) => Math.min(100, Math.round(((v || 0) / (max || 1)) * 100));

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KPI = ({ icon, label, value, sub, accent }) => (
  <div className={`an-kpi${accent ? ' an-kpi--accent' : ''}`}>
    <span className="an-kpi-icon">{icon}</span>
    <div className="an-kpi-body">
      <div className="an-kpi-value">{value}</div>
      <div className="an-kpi-label">{label}</div>
      {sub && <div className="an-kpi-sub">{sub}</div>}
    </div>
  </div>
);

// ─── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({ title, children, className = '' }) => (
  <div className={`an-section ${className}`}>
    <h3 className="an-section-title">{title}</h3>
    {children}
  </div>
);

// ─── Donut Chart (SVG) ───────────────────────────────────────────────────────
const DONUT_COLORS = {
  pending:   '#fbbf24',
  active:    '#34d399',
  completed: '#a855f7',
  rejected:  '#f87171',
};
const DONUT_LABELS = { pending: 'Pending', active: 'Active', completed: 'Completed', rejected: 'Rejected' };

const DonutChart = ({ byStatus }) => {
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  if (!total) return <div className="an-empty">No deals yet</div>;

  const r = 54, cx = 70, cy = 70, stroke = 20;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const slices = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([key, v]) => {
      const dash = (v / total) * circ;
      const gap  = circ - dash;
      const slice = { key, v, dash, gap, offset, color: DONUT_COLORS[key] };
      offset += dash;
      return slice;
    });

  return (
    <div className="an-donut-wrap">
      <svg viewBox="0 0 140 140" className="an-donut-svg">
        {/* background circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {slices.map(s => (
          <circle key={s.key} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={circ / 4 - s.offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="an-donut-num">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="an-donut-sub">deals</text>
      </svg>
      <div className="an-donut-legend">
        {Object.entries(byStatus).map(([key, v]) => (
          <div key={key} className="an-legend-item">
            <span className="an-legend-dot" style={{ background: DONUT_COLORS[key] }} />
            <span className="an-legend-label">{DONUT_LABELS[key]}</span>
            <span className="an-legend-val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Bar Chart (CSS) ─────────────────────────────────────────────────────────
const BarChart = ({ data, color = 'var(--accent)' }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="an-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="an-bar-col">
          <div className="an-bar-track">
            <div
              className="an-bar-fill"
              style={{ height: `${pct(d.count, max)}%`, background: color,
                animationDelay: `${i * 0.07}s` }}
            />
          </div>
          <div className="an-bar-val">{d.count}</div>
          <div className="an-bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Progress bar row ────────────────────────────────────────────────────────
const ProgressRow = ({ label, value, max, suffix = '', color }) => (
  <div className="an-progress-row">
    <div className="an-progress-meta">
      <span className="an-progress-label">{label}</span>
      <span className="an-progress-val">{value}{suffix}</span>
    </div>
    <div className="an-progress-track">
      <div className="an-progress-fill" style={{ width: `${pct(value, max)}%`,
        background: color || 'var(--accent)' }} />
    </div>
  </div>
);

// ─── Star row (read-only) ────────────────────────────────────────────────────
const StarRow = ({ rating }) => (
  <div className="an-stars">
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : 'var(--border)',
        fontSize: '1.2rem' }}>★</span>
    ))}
  </div>
);

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Av = ({ src, name, size = 36 }) => (
  src
    ? <img src={src} alt={name} className="an-avatar" style={{ width: size, height: size }} />
    : <div className="an-avatar an-avatar--init" style={{ width: size, height: size }}>
        {name?.charAt(0).toUpperCase()}
      </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const Analytics = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get('/analytics')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="analytics an-loading">
      <div className="an-spinner" />
      <p>Loading analytics…</p>
    </div>
  );

  if (error) return (
    <div className="analytics an-error">
      <span>⚠️</span>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="analytics">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="an-header">
        <div>
          <h1 className="an-title">Analytics</h1>
          <p className="an-sub">
            {data.role === 'athlete'
              ? 'Your sponsorship performance & profile metrics'
              : 'Your sponsorship outreach & investment overview'}
          </p>
        </div>
        <div className="an-header-badge">
          {data.role === 'athlete' ? '🏅 Athlete' : '💼 Sponsor'}
        </div>
      </div>

      {data.role === 'athlete'
        ? <AthleteAnalytics data={data} />
        : <SponsorAnalytics data={data} />
      }
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ATHLETE VIEW
// ─────────────────────────────────────────────────────────────────────────────
const AthleteAnalytics = ({ data }) => {
  const { byStatus, totalEarnings, avgDealValue, totalDeals,
          averageRating, reviewCount, profileScore, monthly, recent } = data;

  return (
    <>
      {/* KPI Row */}
      <div className="an-kpi-grid">
        <KPI icon="🤝" label="Total Deals"    value={totalDeals}              sub={`${byStatus.active} active`} />
        <KPI icon="💰" label="Total Earnings" value={fmt(totalEarnings)}       sub={`${byStatus.completed} completed`} accent />
        <KPI icon="📊" label="Avg Deal Value" value={fmt(avgDealValue)}        sub="per completed deal" />
        <KPI icon="⭐" label="Avg Rating"     value={averageRating ? averageRating.toFixed(1) : '—'}
             sub={`${reviewCount} review${reviewCount !== 1 ? 's' : ''}`} />
      </div>

      <div className="an-grid-2">
        {/* Deal Status Donut */}
        <Section title="Deal Status Breakdown">
          <DonutChart byStatus={byStatus} />
        </Section>

        {/* Profile Completeness */}
        <Section title="Profile Completeness">
          <div className="an-profile-score-wrap">
            <div className="an-score-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={profileScore >= 80 ? '#34d399' : profileScore >= 50 ? '#a855f7' : '#fbbf24'}
                  strokeWidth="10"
                  strokeDasharray={`${(profileScore / 100) * 264} 264`}
                  strokeDashoffset="66"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
                <text x="50" y="54" textAnchor="middle" className="an-score-num">{profileScore}%</text>
              </svg>
            </div>
            <div className="an-score-tips">
              {profileScore < 100 && (
                <p className="an-score-hint">
                  {profileScore < 40 ? '🔴 Profile needs attention' :
                   profileScore < 70 ? '🟡 Good progress — keep going' :
                   '🟢 Almost complete!'}
                </p>
              )}
              <div className="an-score-items">
                {[
                  ['Avatar', 15], ['Bio', 15], ['Location', 10], ['Sport', 10],
                  ['Followers', 10], ['Achievements', 15], ['Media Kit', 10], ['Portfolio', 10], ['Social Links', 5],
                ].map(([name, pts]) => (
                  <div key={name} className="an-score-item">
                    <span>{name}</span><span className="an-score-pts">{pts}pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Monthly Activity */}
      <Section title="Monthly Deal Activity" className="an-full">
        <BarChart data={monthly} color="var(--accent)" />
      </Section>

      <div className="an-grid-2">
        {/* Rating */}
        <Section title="Reputation">
          {reviewCount > 0 ? (
            <div className="an-rating-block">
              <div className="an-rating-big">{averageRating.toFixed(1)}</div>
              <StarRow rating={averageRating} />
              <p className="an-rating-count">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
              <div className="an-rating-note">
                {averageRating >= 4.5 ? '🏆 Outstanding reputation' :
                 averageRating >= 4   ? '⭐ Excellent reviews' :
                 averageRating >= 3   ? '👍 Good standing' :
                 '📈 Building reputation'}
              </div>
            </div>
          ) : (
            <div className="an-empty">No reviews yet.<br />Complete a deal to earn reviews.</div>
          )}
        </Section>

        {/* Recent Deals */}
        <Section title="Recent Deals">
          {recent.length === 0 ? (
            <div className="an-empty">No deals yet.</div>
          ) : (
            <div className="an-recent-list">
              {recent.map(d => (
                <div key={d.id} className="an-recent-item">
                  <div className="an-recent-left">
                    <Av src={d.sponsor?.avatar} name={d.sponsor?.name} />
                    <div>
                      <div className="an-recent-name">{d.sponsor?.name}</div>
                      <div className="an-recent-deal">{d.title}</div>
                    </div>
                  </div>
                  <div className="an-recent-right">
                    <div className="an-recent-val">{fmt(d.value, d.currency)}</div>
                    <span className={`badge badge-${d.status === 'active' ? 'active' : d.status === 'completed' ? 'completed' : d.status === 'rejected' ? 'rejected' : 'yellow'}`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SPONSOR VIEW
// ─────────────────────────────────────────────────────────────────────────────
const SponsorAnalytics = ({ data }) => {
  const { byStatus, totalSpent, avgDealValue, totalDeals,
          acceptanceRate, sportsBreakdown, monthly, topAthletes } = data;

  const maxSport = sportsBreakdown[0]?.count || 1;
  const SPORT_COLORS = ['#a855f7','#34d399','#fbbf24','#60a5fa','#f87171','#fb923c'];

  return (
    <>
      {/* KPI Row */}
      <div className="an-kpi-grid">
        <KPI icon="📤" label="Deals Sent"     value={totalDeals}                sub={`${byStatus.pending} pending`} />
        <KPI icon="💸" label="Total Invested"  value={fmt(totalSpent)}            sub={`${byStatus.active + byStatus.completed} accepted`} accent />
        <KPI icon="📊" label="Avg Deal Value"  value={fmt(avgDealValue)}           sub="per deal" />
        <KPI icon="✅" label="Acceptance Rate" value={`${acceptanceRate}%`}        sub={`${byStatus.completed} completed`} />
      </div>

      <div className="an-grid-2">
        {/* Deal Status Donut */}
        <Section title="Deal Status Breakdown">
          <DonutChart byStatus={byStatus} />
        </Section>

        {/* Sports Breakdown */}
        <Section title="Sports Distribution">
          {sportsBreakdown.length === 0 ? (
            <div className="an-empty">No data yet.</div>
          ) : (
            <div className="an-sports-list">
              {sportsBreakdown.map((s, i) => (
                <ProgressRow key={s.sport} label={s.sport} value={s.count}
                  max={maxSport} suffix=" deals" color={SPORT_COLORS[i % SPORT_COLORS.length]} />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Monthly Activity */}
      <Section title="Monthly Outreach" className="an-full">
        <BarChart data={monthly} color="#60a5fa" />
      </Section>

      {/* Top Athletes */}
      <Section title="Top Athletes by Deal Value" className="an-full">
        {topAthletes.length === 0 ? (
          <div className="an-empty">No deals with set values yet.</div>
        ) : (
          <div className="an-top-athletes">
            {topAthletes.map((a, i) => (
              <div key={a.id} className="an-athlete-row">
                <div className="an-athlete-rank">#{i + 1}</div>
                <Av src={a.avatar} name={a.name} size={40} />
                <div className="an-athlete-info">
                  <div className="an-athlete-name">{a.name}</div>
                  <div className="an-athlete-sport">{a.sport}</div>
                </div>
                <div className="an-athlete-right">
                  <div className="an-athlete-val">{fmt(a.value, a.currency)}</div>
                  <span className={`badge badge-${a.status === 'active' ? 'active' : a.status === 'completed' ? 'completed' : a.status === 'rejected' ? 'rejected' : 'yellow'}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
};

export default Analytics;
