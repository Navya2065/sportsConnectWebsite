import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import SponsorOfferModal from '../components/Shared/SponsorOfferModal';
import './Explore.css';

/* ─── Follower count presets ─────────────────────────────────── */
const FOLLOWER_OPTIONS = [
  { label: 'Any',  value: '' },
  { label: '100+', value: '100' },
  { label: '1K+',  value: '1000' },
  { label: '5K+',  value: '5000' },
  { label: '10K+', value: '10000' },
  { label: '50K+', value: '50000' },
  { label: '100K+',value: '100000' },
];

/* ─── Format big numbers ─────────────────────────────────────── */
const fmtNum = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K';
  return String(n);
};

/* ─── Match Score chip ────────────────────────────────────────── */
const MATCH_COLORS = {
  green:  { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.3)' },
  blue:   { bg: 'rgba(99,102,241,0.12)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
  yellow: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  muted:  { bg: 'var(--bg-hover)',       text: 'var(--text-muted)', border: 'var(--border)' },
};

const MatchChip = ({ matchScore }) => {
  if (!matchScore) return null;
  const c = MATCH_COLORS[matchScore.color] || MATCH_COLORS.muted;
  return (
    <div
      className="uc-match-chip"
      style={{ background: c.bg, color: c.text, border: `1.5px solid ${c.border}` }}
      title={`Sport: ${matchScore.breakdown.sportMatch}/30 · Budget: ${matchScore.breakdown.budgetFit}/25 · Engagement: ${matchScore.breakdown.engagementQuality}/20 · Profile: ${matchScore.breakdown.profileQuality}/15 · Rating: ${matchScore.breakdown.reputation}/10`}
    >
      <span className="uc-match-score">{matchScore.score}%</span>
      <span className="uc-match-label">{matchScore.emoji} {matchScore.label}</span>
    </div>
  );
};

/* ─── User Card ───────────────────────────────────────────────── */
const UserCard = ({ user, onMessage, onSponsor, onViewProfile, currentRole }) => {
  const initials = user.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const followerCount = user.followers?.length || 0;

  return (
    <div className="user-card card card-hover fade-in">
      <div className="uc-header">
        {user.avatar
          ? <img src={user.avatar} alt={user.name} className="avatar avatar-lg uc-img" />
          : <div className="avatar avatar-lg">{initials}</div>
        }
        <div className="uc-info">
          <div className="uc-name-row">
            <h3 className="uc-name">{user.name}</h3>
            {user.isVerified && <span className="verified-badge" title="Verified">✓</span>}
          </div>
          <span className={`badge badge-${user.role}`}>{user.role}</span>
        </div>
      </div>

      {/* AI Match Score — sponsors only */}
      {currentRole === 'sponsor' && user.role === 'athlete' && user.matchScore && (
        <MatchChip matchScore={user.matchScore} />
      )}

      <div className="uc-details">
        {user.sport     && <div className="uc-detail"><span>🏅</span>{user.sport}</div>}
        {user.company   && <div className="uc-detail"><span>🏢</span>{user.company}</div>}
        {user.industry  && <div className="uc-detail"><span>💼</span>{user.industry}</div>}
        {user.location  && <div className="uc-detail"><span>📍</span>{user.location}</div>}
      </div>

      {/* Stats chips for athletes */}
      {user.role === 'athlete' && (
        <div className="uc-stats">
          <span className="uc-stat">👥 {fmtNum(followerCount)}</span>
          {user.stats?.engagementRate > 0 && (
            <span className="uc-stat">📈 {user.stats.engagementRate}%</span>
          )}
          {user.stats?.monthlyViews > 0 && (
            <span className="uc-stat">👁 {fmtNum(user.stats.monthlyViews)}/mo</span>
          )}
          {user.achievements?.length > 0 && (
            <span className="uc-stat uc-stat--gold">🏆 {user.achievements.length} {user.achievements.length === 1 ? 'achievement' : 'achievements'}</span>
          )}
          {user.reviewCount > 0 && (
            <span className="uc-stat uc-stat--star">⭐ {user.averageRating?.toFixed(1)} ({user.reviewCount})</span>
          )}
        </div>
      )}

      {user.bio && (
        <p className="uc-bio">
          {user.bio.slice(0, 90)}{user.bio.length > 90 ? '...' : ''}
        </p>
      )}

      {/* Media kit preview */}
      {user.role === 'athlete' && user.mediaKit?.headline && (
        <div className="uc-kit-preview">
          <span className="uc-kit-icon">📋</span>
          <span className="uc-kit-text">{user.mediaKit.headline.slice(0, 60)}{user.mediaKit.headline.length > 60 ? '...' : ''}</span>
        </div>
      )}

      <div className="uc-actions">
        {user.role === 'athlete' && (
          <button className="btn btn-ghost btn-sm w-full" onClick={() => onViewProfile(user._id)}>
            👤 View Profile
          </button>
        )}
        <button className="btn btn-secondary btn-sm w-full" onClick={() => onMessage(user._id)}>
          💬 Message
        </button>
        {currentRole === 'sponsor' && user.role === 'athlete' && (
          <button className="btn btn-primary btn-sm w-full" onClick={() => onSponsor(user)}>
            🤝 Send Offer
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Active filter tags ─────────────────────────────────────── */
const FilterTag = ({ label, onRemove }) => (
  <span className="filter-tag">
    {label}
    <button onClick={onRemove}>✕</button>
  </span>
);

/* ─── Explore Page ────────────────────────────────────────────── */
const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Basic search
  const [search, setSearch]       = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sport: '',
    city: '',
    minFollowers: '',
    achievement: '',
    minEngagement: '',
    budgetMax: '',
  });

  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  // Modal
  const [modalAthlete, setModalAthlete] = useState(null);

  const setFilter = (key) => (e) =>
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  const clearFilter = (key) =>
    setFilters((prev) => ({ ...prev, [key]: '' }));

  const clearAllFilters = () => {
    setFilters({ sport: '', city: '', minFollowers: '', achievement: '', minEngagement: '', budgetMax: '' });
    setSearch('');
    setFilterRole('');
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length
    + (search ? 1 : 0)
    + (filterRole ? 1 : 0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search)                  params.append('search', search);
      if (filterRole)              params.append('role', filterRole);
      if (filters.sport)           params.append('sport', filters.sport);
      if (filters.city)            params.append('city', filters.city);
      if (filters.minFollowers)    params.append('minFollowers', filters.minFollowers);
      if (filters.achievement)     params.append('achievement', filters.achievement);
      if (filters.minEngagement)   params.append('minEngagement', filters.minEngagement);
      if (filters.budgetMax)       params.append('budgetMax', filters.budgetMax);

      const { data } = await api.get(`/users?${params}`);
      setUsers(data.users);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filters, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleMessage = async (recipientId) => {
    try {
      const { data } = await api.post('/conversations', { recipientId });
      navigate(`/messages?c=${data.conversation._id}`);
    } catch {
      toast.error('Could not open conversation');
    }
  };

  const handleViewProfile = (athleteId) => {
    navigate(`/athletes/${athleteId}`);
  };

  return (
    <>
      {modalAthlete && (
        <SponsorOfferModal
          athlete={modalAthlete}
          onClose={() => setModalAthlete(null)}
        />
      )}

      <div className="explore fade-in">
        <div className="container">
          {/* Page Header */}
          <div className="explore-header">
            <h1 className="explore-title">
              {user?.role === 'athlete' ? 'Find Sponsors' : 'Discover Athletes'}
            </h1>
            <p className="explore-sub">
              {user?.role === 'athlete'
                ? 'Connect with sponsors looking to support your journey'
                : 'Find talented athletes to sponsor and grow together'}
            </p>
          </div>

          {/* Search Bar + Controls */}
          <form className="explore-filters" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-input explore-search"
              placeholder="Search by name, sport, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="form-input explore-select"
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
            >
              <option value="">All roles</option>
              <option value="athlete">Athletes only</option>
              <option value="sponsor">Sponsors only</option>
            </select>
            <button type="submit" className="btn btn-primary">Search</button>
            <button
              type="button"
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} explore-filter-btn`}
              onClick={() => setShowFilters((v) => !v)}
            >
              🎛 Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </form>

          {/* Advanced Filter Panel */}
          {showFilters && (
            <div className="filter-panel card fade-in">
              <div className="filter-panel-header">
                <span className="filter-panel-title">Advanced Filters</span>
                {activeFilterCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={clearAllFilters}>
                    Clear all
                  </button>
                )}
              </div>

              <div className="filter-grid">
                <div className="form-group">
                  <label className="form-label">Sport</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Cricket, Football"
                    value={filters.sport}
                    onChange={setFilter('sport')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City / Location</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Mumbai, Delhi"
                    value={filters.city}
                    onChange={setFilter('city')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Min Followers</label>
                  <select className="form-input" value={filters.minFollowers} onChange={setFilter('minFollowers')}>
                    {FOLLOWER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Achievement Keyword</label>
                  <input
                    className="form-input"
                    placeholder="e.g. National, Gold Medal"
                    value={filters.achievement}
                    onChange={setFilter('achievement')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Min Engagement Rate (%)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    value={filters.minEngagement}
                    onChange={setFilter('minEngagement')}
                  />
                </div>

                {user?.role === 'sponsor' && (
                  <div className="form-group">
                    <label className="form-label">My Budget Max (INR)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 500000"
                      value={filters.budgetMax}
                      onChange={setFilter('budgetMax')}
                    />
                    <span className="form-hint">Shows athletes whose asking price fits your budget</span>
                  </div>
                )}
              </div>

              <div className="filter-apply-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setPage(1); fetchUsers(); setShowFilters(false); }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Active filter tags */}
          {activeFilterCount > 0 && (
            <div className="filter-tags-row">
              {search       && <FilterTag label={`"${search}"`}             onRemove={() => setSearch('')} />}
              {filterRole   && <FilterTag label={filterRole}               onRemove={() => setFilterRole('')} />}
              {filters.sport       && <FilterTag label={`Sport: ${filters.sport}`}             onRemove={() => clearFilter('sport')} />}
              {filters.city        && <FilterTag label={`City: ${filters.city}`}               onRemove={() => clearFilter('city')} />}
              {filters.minFollowers && <FilterTag label={`${fmtNum(parseInt(filters.minFollowers))}+ followers`} onRemove={() => clearFilter('minFollowers')} />}
              {filters.achievement  && <FilterTag label={`Achievement: ${filters.achievement}`} onRemove={() => clearFilter('achievement')} />}
              {filters.minEngagement && <FilterTag label={`≥${filters.minEngagement}% engagement`} onRemove={() => clearFilter('minEngagement')} />}
              {filters.budgetMax    && <FilterTag label={`Budget ≤₹${parseInt(filters.budgetMax).toLocaleString()}`} onRemove={() => clearFilter('budgetMax')} />}
            </div>
          )}

          {/* Results count */}
          {!loading && users.length > 0 && (
            <p className="results-count">{total} {total === 1 ? 'result' : 'results'} found</p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="explore-loader">
              <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No users found</h3>
              <p>Try adjusting your search or filters</p>
              {activeFilterCount > 0 && (
                <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={clearAllFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="users-grid">
                {users.map((u) => (
                  <UserCard
                    key={u._id}
                    user={u}
                    onMessage={handleMessage}
                    onSponsor={setModalAthlete}
                    onViewProfile={handleViewProfile}
                    currentRole={user?.role}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                  <span className="page-info">{page} / {totalPages}</span>
                  <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Explore;
