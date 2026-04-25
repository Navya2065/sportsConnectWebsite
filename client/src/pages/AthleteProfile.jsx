import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import SponsorOfferModal from '../components/Shared/SponsorOfferModal';
import './AthleteProfile.css';

/* ─── Helpers ────────────────────────────────────────────────── */
const fmtNum = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K';
  return String(n);
};

const socialIcon = (platform) =>
  ({ instagram: '📸', twitter: '🐦', youtube: '▶️' })[platform] || '🔗';

/* ─── Stat Block ─────────────────────────────────────────────── */
const StatBlock = ({ icon, label, value }) => (
  <div className="ap-stat">
    <span className="ap-stat-icon">{icon}</span>
    <span className="ap-stat-value">{value}</span>
    <span className="ap-stat-label">{label}</span>
  </div>
);

/* ─── Stars display (read-only) ──────────────────────────────── */
const Stars = ({ rating, size = '1.2rem' }) => (
  <span style={{ fontSize: size, lineHeight: 1, letterSpacing: 1 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} style={{ color: s <= Math.round(rating) ? '#f59e0b' : 'var(--border)' }}>★</span>
    ))}
  </span>
);

/* ─── ReviewsTab ─────────────────────────────────────────────── */
const ReviewsTab = ({ athleteId }) => {
  const [reviews,     setReviews]     = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    api.get(`/reviews/user/${athleteId}`)
      .then(({ data }) => {
        setReviews(data.reviews);
        setStats({ count: data.count, avg: data.averageRating, distribution: data.distribution });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [athleteId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  if (!stats?.count) return (
    <div className="empty-state">
      <div className="empty-state-icon">⭐</div>
      <h3>No reviews yet</h3>
      <p>Reviews appear here after completed sponsorship deals</p>
    </div>
  );

  return (
    <div className="ap-reviews">

      {/* Summary card */}
      <div className="card ap-rv-summary">
        <div className="ap-rv-avg-block">
          <div className="ap-rv-big-num">{stats.avg.toFixed(1)}</div>
          <Stars rating={stats.avg} size="1.5rem" />
          <div className="ap-rv-count">{stats.count} review{stats.count !== 1 ? 's' : ''}</div>
        </div>

        {/* Distribution bars */}
        <div className="ap-rv-dist">
          {stats.distribution.map(({ star, count }) => {
            const pct = stats.count ? Math.round((count / stats.count) * 100) : 0;
            return (
              <div key={star} className="ap-rv-dist-row">
                <span className="ap-rv-dist-label">{star}★</span>
                <div className="ap-rv-bar-wrap">
                  <div className="ap-rv-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="ap-rv-dist-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="ap-rv-list">
        {reviews.map((r) => {
          const initials = r.reviewer?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
          return (
            <div key={r._id} className="card ap-rv-card">
              <div className="ap-rv-card-header">
                <div className="ap-rv-reviewer">
                  {r.reviewer?.avatar
                    ? <img src={r.reviewer.avatar} alt={r.reviewer.name} className="ap-rv-avatar" />
                    : <div className="avatar avatar-sm">{initials}</div>
                  }
                  <div>
                    <div className="ap-rv-reviewer-name">
                      {r.reviewer?.name}
                      {r.reviewer?.isVerified && <span className="verified-badge" title="Verified" style={{ marginLeft: 4 }}>✓</span>}
                    </div>
                    <div className="ap-rv-reviewer-meta">
                      {r.reviewer?.role === 'sponsor'
                        ? (r.reviewer?.company || 'Sponsor')
                        : (r.reviewer?.sport || 'Athlete')}
                      {' · '}
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <Stars rating={r.rating} size="1rem" />
              </div>

              {r.highlights?.length > 0 && (
                <div className="ap-rv-chips">
                  {r.highlights.map((h) => (
                    <span key={h} className="rm-chip rm-chip--selected ap-rv-chip">{h}</span>
                  ))}
                </div>
              )}

              {r.review && (
                <p className="ap-rv-text">"{r.review}"</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Match Breakdown Panel ──────────────────────────────────── */
const MATCH_COLORS = {
  green:  { bg: 'rgba(16,185,129,0.1)',  text: '#10b981', border: 'rgba(16,185,129,0.25)' },
  blue:   { bg: 'rgba(99,102,241,0.1)',  text: '#6366f1', border: 'rgba(99,102,241,0.25)' },
  yellow: { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  muted:  { bg: 'var(--bg-hover)',       text: 'var(--text-muted)', border: 'var(--border)' },
};

const BREAKDOWN_LABELS = {
  sportMatch:        { label: 'Sport Match',   max: 30, icon: '🏅' },
  budgetFit:         { label: 'Budget Fit',    max: 25, icon: '💰' },
  engagementQuality: { label: 'Engagement',    max: 20, icon: '📈' },
  profileQuality:    { label: 'Profile',       max: 15, icon: '📋' },
  reputation:        { label: 'Reputation',    max: 10, icon: '⭐' },
};

const MatchBreakdown = ({ matchScore }) => {
  if (!matchScore) return null;
  const c = MATCH_COLORS[matchScore.color] || MATCH_COLORS.muted;

  return (
    <div className="ap-match-panel card" style={{ borderColor: c.border }}>
      {/* Header */}
      <div className="ap-match-header">
        <div className="ap-match-title-row">
          <span className="ap-match-ai-badge">🤖 AI Match Score</span>
          <span className="ap-match-sub">Based on your profile & this athlete</span>
        </div>
        <div className="ap-match-score-circle" style={{ background: c.bg, color: c.text, border: `2px solid ${c.border}` }}>
          <span className="ap-match-big">{matchScore.score}</span>
          <span className="ap-match-pct">%</span>
        </div>
      </div>

      <div className="ap-match-label-row">
        <span style={{ color: c.text, fontWeight: 700, fontSize: '1rem' }}>
          {matchScore.emoji} {matchScore.label}
        </span>
      </div>

      {/* Breakdown bars */}
      <div className="ap-match-breakdown">
        {Object.entries(BREAKDOWN_LABELS).map(([key, meta]) => {
          const pts = matchScore.breakdown[key] || 0;
          const pct = Math.round((pts / meta.max) * 100);
          return (
            <div key={key} className="ap-match-row">
              <span className="ap-match-row-icon">{meta.icon}</span>
              <span className="ap-match-row-label">{meta.label}</span>
              <div className="ap-match-bar-wrap">
                <div className="ap-match-bar-fill" style={{ width: `${pct}%`, background: c.text }} />
              </div>
              <span className="ap-match-row-pts">{pts}<span className="ap-match-row-max">/{meta.max}</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── AthleteProfile ─────────────────────────────────────────── */
const AthleteProfile = () => {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [athlete, setAthlete]         = useState(null);
  const [completedDeals, setCompletedDeals] = useState([]);
  const [matchScore, setMatchScore]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [following, setFollowing]     = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState('overview');
  const [showOffer, setShowOffer]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/users/${id}/profile`);
        setAthlete(data.user);
        setCompletedDeals(data.completedDeals || []);
        if (data.matchScore) setMatchScore(data.matchScore);
        // Check if current user is following this athlete
        const followResp = await api.get(`/follow/${me._id}/following`);
        const ids = followResp.data.following.map((u) => u._id);
        setFollowing(ids.includes(id));
      } catch {
        toast.error('Could not load profile');
        navigate('/explore');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, me._id, navigate]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const { data } = await api.put(`/follow/${id}`);
      setFollowing(data.following);
      setAthlete((prev) => ({
        ...prev,
        followers: data.following
          ? [...(prev.followers || []), me._id]
          : (prev.followers || []).filter((fid) => fid !== me._id),
      }));
      toast.success(data.following ? 'Following!' : 'Unfollowed');
    } catch {
      toast.error('Failed to follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const { data } = await api.post('/conversations', { recipientId: id });
      navigate(`/messages?c=${data.conversation._id}`);
    } catch {
      toast.error('Could not open conversation');
    }
  };

  if (loading) return (
    <div className="page-loader" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!athlete) return null;

  const initials     = athlete.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const followerCount = athlete.followers?.length || 0;
  const totalSponsors = completedDeals.length + (athlete.previousSponsors?.length || 0);

  const TABS = [
    { key: 'overview',  label: '📋 Overview' },
    { key: 'mediakit',  label: '🎯 Media Kit' },
    { key: 'sponsors',  label: `🤝 Past Sponsors${totalSponsors > 0 ? ` (${totalSponsors})` : ''}` },
    { key: 'portfolio', label: `📸 Portfolio${athlete.portfolioMedia?.length > 0 ? ` (${athlete.portfolioMedia.length})` : ''}` },
    { key: 'reviews',   label: `⭐ Reviews${athlete.reviewCount > 0 ? ` (${athlete.reviewCount})` : ''}` },
  ];

  return (
    <>
      {showOffer && (
        <SponsorOfferModal
          athlete={athlete}
          onClose={() => setShowOffer(false)}
        />
      )}

      <div className="athlete-profile fade-in">
        <div className="container">

          {/* Back */}
          <button className="btn btn-ghost btn-sm ap-back" onClick={() => navigate(-1)}>
            ← Back
          </button>

          {/* ── Hero ──────────────────────────────────────────────── */}
          <div className="ap-hero card">
            <div className="ap-hero-top">
              <div className="ap-avatar-wrap">
                {athlete.avatar
                  ? <img src={athlete.avatar} alt={athlete.name} className="ap-avatar-img" />
                  : <div className="avatar ap-avatar-initials">{initials}</div>
                }
              </div>
              <div className="ap-hero-info">
                <div className="ap-name-row">
                  <h1 className="ap-name">{athlete.name}</h1>
                  {athlete.isVerified && <span className="verified-badge-lg" title="Verified">✓</span>}
                </div>
                <div className="ap-tags">
                  <span className="badge badge-athlete">athlete</span>
                  {athlete.sport     && <span className="ap-tag">🏅 {athlete.sport}</span>}
                  {athlete.location  && <span className="ap-tag">📍 {athlete.location}</span>}
                </div>
                {/* Rating line */}
                {athlete.reviewCount > 0 && (
                  <div className="ap-rating-line">
                    <span style={{ color: '#f59e0b', fontSize: '0.95rem' }}>
                      {'★'.repeat(Math.round(athlete.averageRating))}{'☆'.repeat(5 - Math.round(athlete.averageRating))}
                    </span>
                    <span className="ap-rating-num">{athlete.averageRating.toFixed(1)}</span>
                    <span className="ap-rating-count">({athlete.reviewCount} review{athlete.reviewCount !== 1 ? 's' : ''})</span>
                  </div>
                )}
                {athlete.bio && <p className="ap-bio">{athlete.bio}</p>}
                {athlete.mediaKit?.headline && (
                  <p className="ap-headline">{athlete.mediaKit.headline}</p>
                )}
              </div>
              <div className="ap-hero-actions">
                {me._id !== id && (
                  <>
                    <button
                      className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading
                        ? <span className="spinner" style={{ width: 14, height: 14 }} />
                        : following ? '✓ Following' : '+ Follow'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handleMessage}>
                      💬 Message
                    </button>
                    {me.role === 'sponsor' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setShowOffer(true)}>
                        🤝 Send Offer
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="ap-stats-row">
              <StatBlock icon="👥" label="Followers"   value={fmtNum(followerCount)} />
              <StatBlock icon="👣" label="Following"   value={fmtNum(athlete.following?.length || 0)} />
              {athlete.stats?.engagementRate > 0 && (
                <StatBlock icon="📈" label="Engagement" value={`${athlete.stats.engagementRate}%`} />
              )}
              {athlete.stats?.monthlyViews > 0 && (
                <StatBlock icon="👁" label="Monthly Views" value={fmtNum(athlete.stats.monthlyViews)} />
              )}
              {totalSponsors > 0 && (
                <StatBlock icon="🤝" label="Past Sponsors" value={totalSponsors} />
              )}
              {athlete.achievements?.length > 0 && (
                <StatBlock icon="🏆" label="Achievements" value={athlete.achievements.length} />
              )}
              {athlete.reviewCount > 0 && (
                <StatBlock icon="⭐" label="Avg Rating" value={`${athlete.averageRating.toFixed(1)}/5`} />
              )}
            </div>
          </div>

          {/* ── AI Match Score (sponsors only) ───────────────────── */}
          {me.role === 'sponsor' && me._id !== id && matchScore && (
            <MatchBreakdown matchScore={matchScore} />
          )}

          {/* ── Tabs ──────────────────────────────────────────────── */}
          <div className="ap-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`ap-tab ${activeTab === t.key ? 'ap-tab--active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ──────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="ap-section-grid">

              {/* Achievements */}
              {athlete.achievements?.length > 0 && (
                <div className="card ap-panel">
                  <h2 className="ap-panel-title">🏆 Achievements</h2>
                  <ul className="ap-achievement-list">
                    {athlete.achievements.map((a, i) => (
                      <li key={i} className="ap-achievement-item">
                        <span className="ap-ach-dot" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Asking Price */}
              {(athlete.askingPriceMin > 0 || athlete.askingPriceMax > 0) && (
                <div className="card ap-panel">
                  <h2 className="ap-panel-title">💰 Asking Price</h2>
                  <div className="ap-price">
                    {athlete.priceCurrency}{' '}
                    {athlete.askingPriceMin > 0 ? athlete.askingPriceMin.toLocaleString() : '0'}
                    {athlete.askingPriceMax > 0 ? ` – ${athlete.priceCurrency} ${athlete.askingPriceMax.toLocaleString()}` : '+'}
                    <span className="ap-price-sub"> per campaign</span>
                  </div>
                  {athlete.mediaKit?.pricing && (
                    <p className="ap-price-note">{athlete.mediaKit.pricing}</p>
                  )}
                </div>
              )}

              {/* Social Links */}
              {(athlete.socialLinks?.instagram || athlete.socialLinks?.twitter || athlete.socialLinks?.youtube) && (
                <div className="card ap-panel">
                  <h2 className="ap-panel-title">🔗 Social Links</h2>
                  <div className="ap-socials">
                    {Object.entries(athlete.socialLinks || {}).map(([platform, handle]) =>
                      handle ? (
                        <a
                          key={platform}
                          href={handle.startsWith('http') ? handle : `https://${platform}.com/${handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ap-social-link"
                        >
                          {socialIcon(platform)}
                          <span>{handle}</span>
                        </a>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Bio (if nothing else is shown) */}
              {!athlete.achievements?.length && !athlete.socialLinks?.instagram && (
                <div className="card ap-panel ap-empty-overview">
                  <span className="empty-state-icon">👤</span>
                  <p>This athlete hasn't filled in their full profile yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Media Kit Tab ─────────────────────────────────────── */}
          {activeTab === 'mediakit' && (
            <div className="ap-mediakit">
              {!athlete.mediaKit?.headline && !athlete.mediaKit?.highlights?.length && !athlete.mediaKit?.availability ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No media kit yet</h3>
                  <p>This athlete hasn't published their media kit</p>
                </div>
              ) : (
                <>
                  {athlete.mediaKit?.headline && (
                    <div className="card ap-panel ap-mk-headline">
                      {athlete.mediaKit.headline}
                    </div>
                  )}

                  {athlete.mediaKit?.highlights?.length > 0 && (
                    <div className="card ap-panel">
                      <h2 className="ap-panel-title">✨ Highlights</h2>
                      <ul className="ap-highlights-list">
                        {athlete.mediaKit.highlights.map((h, i) => (
                          <li key={i} className="ap-highlight-item">
                            <span className="ap-hl-dot">▸</span>{h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="ap-mk-row">
                    {athlete.mediaKit?.pricing && (
                      <div className="card ap-panel">
                        <h2 className="ap-panel-title">💰 Pricing</h2>
                        <p className="ap-mk-text">{athlete.mediaKit.pricing}</p>
                      </div>
                    )}
                    {athlete.mediaKit?.availability && (
                      <div className="card ap-panel">
                        <h2 className="ap-panel-title">📅 Availability</h2>
                        <p className="ap-mk-text">{athlete.mediaKit.availability}</p>
                      </div>
                    )}
                  </div>

                  {me.role === 'sponsor' && me._id !== id && (
                    <div className="ap-mk-cta">
                      <button className="btn btn-primary" onClick={() => setShowOffer(true)}>
                        🤝 Send Sponsorship Offer
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Past Sponsors Tab ─────────────────────────────────── */}
          {activeTab === 'sponsors' && (
            <div className="ap-sponsors">
              {/* Platform-verified (completed deals) */}
              {completedDeals.length > 0 && (
                <>
                  <div className="ap-sponsors-section-label">
                    <span className="verified-badge" />
                    Platform-verified
                  </div>
                  <div className="ap-sponsor-grid">
                    {completedDeals.map((deal) => {
                      const sp = deal.sponsor;
                      const spInitials = sp?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <div key={deal._id} className="card ap-sponsor-card">
                          {sp?.avatar
                            ? <img src={sp.avatar} alt={sp.name} className="ap-sp-avatar" />
                            : <div className="avatar avatar-md">{spInitials}</div>
                          }
                          <div className="ap-sp-info">
                            <div className="ap-sp-name">{sp?.company || sp?.name}</div>
                            {sp?.industry && <div className="ap-sp-meta">{sp.industry}</div>}
                            {deal.deal?.title && <div className="ap-sp-deal">"{deal.deal.title}"</div>}
                          </div>
                          <span className="badge badge-completed">✓ Verified</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Manually added previous sponsors */}
              {athlete.previousSponsors?.length > 0 && (
                <>
                  <div className="ap-sponsors-section-label" style={{ marginTop: completedDeals.length ? 24 : 0 }}>
                    Self-reported
                  </div>
                  <div className="ap-sponsor-grid">
                    {athlete.previousSponsors.map((sp, i) => (
                      <div key={i} className="card ap-sponsor-card">
                        <div className="avatar avatar-md ap-sp-brand-initial">
                          {sp.brandName?.[0]?.toUpperCase()}
                        </div>
                        <div className="ap-sp-info">
                          <div className="ap-sp-name">{sp.brandName}</div>
                          {sp.year && <div className="ap-sp-meta">{sp.year}</div>}
                          {sp.description && <div className="ap-sp-deal">{sp.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {totalSponsors === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🤝</div>
                  <h3>No past sponsors yet</h3>
                  <p>Be the first to sponsor this athlete!</p>
                  {me.role === 'sponsor' && me._id !== id && (
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowOffer(true)}>
                      🤝 Send Offer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Portfolio Tab ──────────────────────────────────────── */}
          {activeTab === 'portfolio' && (
            <div className="ap-portfolio">
              {!athlete.portfolioMedia?.length ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📸</div>
                  <h3>No portfolio yet</h3>
                  <p>This athlete hasn't uploaded any media yet</p>
                </div>
              ) : (
                <div className="ap-media-grid">
                  {athlete.portfolioMedia.map((m, i) => (
                    <div key={i} className="ap-media-item">
                      {m.mediaType === 'video' ? (
                        <video src={m.url} controls className="ap-media-asset" />
                      ) : (
                        <img src={m.url} alt={m.caption || `Photo ${i + 1}`} className="ap-media-asset" />
                      )}
                      {m.caption && <p className="ap-media-caption">{m.caption}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Reviews Tab ───────────────────────────────────────── */}
          {activeTab === 'reviews' && (
            <ReviewsTab athleteId={id} />
          )}

        </div>
      </div>
    </>
  );
};

export default AthleteProfile;
