import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CreateCampaignModal from '../components/Shared/CreateCampaignModal';
import ApplyCampaignModal  from '../components/Shared/ApplyCampaignModal';
import './Campaigns.css';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n, cur = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : null;

const statusColor = s => ({ open:'green', closed:'yellow', completed:'purple' }[s] || 'muted');

const Av = ({ src, name, size = 36 }) =>
  src
    ? <img src={src} alt={name} className="cpg-avatar" style={{ width: size, height: size }} />
    : <div className="cpg-avatar cpg-avatar--init" style={{ width: size, height: size }}>
        {name?.charAt(0).toUpperCase()}
      </div>;

// ── Campaign Card (browse / athlete view) ─────────────────────────────────────
const CampaignCard = ({ c, onApply, onInviteRespond }) => {
  const slots = typeof c.slotsLeft === 'number' ? c.slotsLeft : c.slots - c.filledSlots;
  const pctFilled = Math.min(100, Math.round((c.filledSlots / c.slots) * 100));
  const hasApplied = !!c.myApplication;
  const hasInvite  = !!c.myInvite && c.myInvite.status === 'pending';

  return (
    <div className={`cpg-card cpg-card--${statusColor(c.status)}`}>
      {/* Sponsor */}
      <div className="cpg-card-top">
        <div className="cpg-sponsor-row">
          <Av src={c.sponsor?.avatar} name={c.sponsor?.name} />
          <div className="cpg-sponsor-info">
            <span className="cpg-sponsor-name">{c.sponsor?.companyName || c.sponsor?.name}</span>
            {c.sponsor?.verified && <span className="verified-badge">✓</span>}
            <span className="cpg-sport-tag">{c.sport || 'All Sports'}</span>
          </div>
          <span className={`badge badge-${statusColor(c.status) === 'green' ? 'active' : statusColor(c.status) === 'yellow' ? 'yellow' : 'completed'}`}>
            {c.status}
          </span>
        </div>

        <h3 className="cpg-card-title">{c.title}</h3>
        {c.description && <p className="cpg-card-desc">{c.description}</p>}
      </div>

      {/* Deliverables */}
      {c.deliverables && (
        <div className="cpg-deliverables">
          <span className="cpg-dlabel">📋 Deliverables:</span>
          <span className="cpg-dtext">{c.deliverables}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="cpg-stats-row">
        <div className="cpg-stat">
          <span className="cpg-stat-icon">💰</span>
          <div>
            <div className="cpg-stat-val">{fmt(c.budget, c.currency)}</div>
            <div className="cpg-stat-lbl">Total Budget</div>
          </div>
        </div>
        <div className="cpg-stat">
          <span className="cpg-stat-icon">👥</span>
          <div>
            <div className="cpg-stat-val">{slots} left</div>
            <div className="cpg-stat-lbl">of {c.slots} slots</div>
          </div>
        </div>
        {(c.startDate || c.endDate) && (
          <div className="cpg-stat">
            <span className="cpg-stat-icon">📅</span>
            <div>
              <div className="cpg-stat-val">{fmtDate(c.startDate) || '—'}</div>
              <div className="cpg-stat-lbl">to {fmtDate(c.endDate) || '—'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Slots progress */}
      <div className="cpg-slots-bar">
        <div className="cpg-slots-fill" style={{ width: `${pctFilled}%` }} />
      </div>

      {/* Invite banner */}
      {hasInvite && (
        <div className="cpg-invite-banner">
          <span>🎯 You've been invited! <em>{c.myInvite.message}</em></span>
          <div className="cpg-invite-btns">
            <button className="btn btn-sm btn-success" onClick={() => onInviteRespond(c._id, 'accepted')}>Accept</button>
            <button className="btn btn-sm btn-danger"  onClick={() => onInviteRespond(c._id, 'rejected')}>Decline</button>
          </div>
        </div>
      )}

      {/* Application status */}
      {hasApplied && !hasInvite && (
        <div className={`cpg-app-status cpg-app-status--${c.myApplication.status}`}>
          {c.myApplication.status === 'pending'  && '⏳ Application under review'}
          {c.myApplication.status === 'accepted' && '🎉 Application accepted!'}
          {c.myApplication.status === 'rejected' && '❌ Application not selected'}
        </div>
      )}

      {/* Action */}
      {!hasApplied && !hasInvite && c.status === 'open' && slots > 0 && (
        <button className="btn btn-primary cpg-apply-btn" onClick={() => onApply(c)}>
          Apply Now →
        </button>
      )}
      {c.status === 'open' && slots === 0 && !hasApplied && (
        <div className="cpg-full-badge">🔒 All slots filled</div>
      )}
    </div>
  );
};

// ── My Campaign Card (sponsor view) ──────────────────────────────────────────
const MyCampaignCard = ({ c, onStatusChange, onDecide }) => {
  const slots = c.slots - c.filledSlots;
  const pending  = c.applications?.filter(a => a.status === 'pending')  || [];
  const accepted = c.applications?.filter(a => a.status === 'accepted') || [];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`cpg-card cpg-mine cpg-card--${statusColor(c.status)}`}>
      <div className="cpg-card-top">
        <div className="cpg-mine-header">
          <div>
            <h3 className="cpg-card-title">{c.title}</h3>
            {c.sport && <span className="cpg-sport-tag">{c.sport}</span>}
          </div>
          <div className="cpg-mine-badges">
            <span className={`badge badge-${statusColor(c.status) === 'green' ? 'active' : statusColor(c.status) === 'yellow' ? 'yellow' : 'completed'}`}>
              {c.status}
            </span>
            {pending.length > 0 && (
              <span className="badge badge-yellow">{pending.length} new</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="cpg-stats-row">
        <div className="cpg-stat">
          <span className="cpg-stat-icon">💰</span>
          <div>
            <div className="cpg-stat-val">{fmt(c.budget, c.currency)}</div>
            <div className="cpg-stat-lbl">Budget</div>
          </div>
        </div>
        <div className="cpg-stat">
          <span className="cpg-stat-icon">✅</span>
          <div>
            <div className="cpg-stat-val">{accepted.length}/{c.slots}</div>
            <div className="cpg-stat-lbl">Accepted</div>
          </div>
        </div>
        <div className="cpg-stat">
          <span className="cpg-stat-icon">📥</span>
          <div>
            <div className="cpg-stat-val">{c.applications?.length || 0}</div>
            <div className="cpg-stat-lbl">Applications</div>
          </div>
        </div>
      </div>

      {/* Slots bar */}
      <div className="cpg-slots-bar">
        <div className="cpg-slots-fill" style={{ width: `${Math.min(100, Math.round((c.filledSlots/c.slots)*100))}%` }} />
      </div>

      {/* Actions */}
      <div className="cpg-mine-actions">
        {c.applications?.length > 0 && (
          <button className="btn btn-sm btn-outline" onClick={() => setExpanded(x => !x)}>
            {expanded ? '▲ Hide applicants' : `▼ View ${c.applications.length} applicant${c.applications.length !== 1 ? 's' : ''}`}
          </button>
        )}
        {c.status === 'open' && (
          <button className="btn btn-sm btn-ghost" onClick={() => onStatusChange(c._id, 'closed')}>Close Campaign</button>
        )}
        {c.status === 'closed' && (
          <button className="btn btn-sm btn-ghost" onClick={() => onStatusChange(c._id, 'completed')}>Mark Completed</button>
        )}
      </div>

      {/* Applicants list */}
      {expanded && c.applications?.length > 0 && (
        <div className="cpg-applicants">
          {c.applications.map(app => (
            <div key={app._id} className="cpg-applicant">
              <Av src={app.athlete?.avatar} name={app.athlete?.name} size={40} />
              <div className="cpg-applicant-info">
                <div className="cpg-applicant-name">{app.athlete?.name}</div>
                <div className="cpg-applicant-meta">
                  {app.athlete?.sport} · {app.athlete?.followers?.toLocaleString('en-IN')} followers
                  {app.athlete?.averageRating ? ` · ⭐ ${app.athlete.averageRating.toFixed(1)}` : ''}
                </div>
                {app.pitch && <p className="cpg-applicant-pitch">"{app.pitch}"</p>}
                {app.askingRate > 0 && (
                  <div className="cpg-applicant-rate">Asking: {fmt(app.askingRate, c.currency)}</div>
                )}
              </div>
              <div className="cpg-applicant-actions">
                {app.status === 'pending' ? (
                  <>
                    <button className="btn btn-sm btn-success"
                      onClick={() => onDecide(c._id, app.athlete._id, 'accepted')}>✓ Accept</button>
                    <button className="btn btn-sm btn-danger"
                      onClick={() => onDecide(c._id, app.athlete._id, 'rejected')}>✗ Reject</button>
                  </>
                ) : (
                  <span className={`badge badge-${app.status === 'accepted' ? 'active' : 'rejected'}`}>
                    {app.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const TABS_ATHLETE  = ['Browse', 'Applied', 'Invites'];
const TABS_SPONSOR  = ['My Campaigns'];

const Campaigns = () => {
  const { user } = useAuth();
  const isAthlete = user?.role === 'athlete';
  const isSponsor = user?.role === 'sponsor';

  const [tab,        setTab]        = useState(0);
  const [campaigns,  setCampaigns]  = useState([]);
  const [mine,       setMine]       = useState([]);
  const [applied,    setApplied]    = useState([]);
  const [invites,    setInvites]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [applyFor,   setApplyFor]   = useState(null);

  // filters
  const [q,          setQ]          = useState('');
  const [sportF,     setSportF]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isSponsor) {
        const { data } = await api.get('/campaigns/mine');
        setMine(data.campaigns);
      } else {
        const [browse, app, inv] = await Promise.all([
          api.get('/campaigns', { params: { q, sport: sportF } }),
          api.get('/campaigns/applied'),
          api.get('/campaigns/invites'),
        ]);
        setCampaigns(browse.data.campaigns);
        setApplied(app.data.campaigns);
        setInvites(inv.data.campaigns);
      }
    } catch {}
    setLoading(false);
  }, [isSponsor, q, sportF]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/campaigns/${id}`, { status });
      toast.success(`Campaign ${status}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDecide = async (campaignId, athleteId, status) => {
    try {
      await api.patch(`/campaigns/${campaignId}/application/${athleteId}`, { status });
      toast.success(`Application ${status}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleInviteRespond = async (campaignId, status) => {
    try {
      await api.patch(`/campaigns/${campaignId}/invite/respond`, { status });
      toast.success(status === 'accepted' ? 'Invite accepted! 🎉' : 'Invite declined');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const TABS = isSponsor ? TABS_SPONSOR : TABS_ATHLETE;

  const currentList = isSponsor
    ? mine
    : tab === 0 ? campaigns
    : tab === 1 ? applied
    : invites;

  const counts = isAthlete ? [campaigns.length, applied.length, invites.filter(c => c.myInvite?.status === 'pending').length] : [mine.length];

  return (
    <div className="campaigns">
      {/* Header */}
      <div className="cpg-header">
        <div>
          <h1 className="cpg-title">Campaigns</h1>
          <p className="cpg-sub">
            {isSponsor
              ? 'Create campaigns and find the perfect athletes for your brand'
              : 'Discover brand campaigns and grow your sponsorship portfolio'}
          </p>
        </div>
        {isSponsor && (
          <button className="btn btn-primary btn-xl" onClick={() => setShowCreate(true)}>
            📣 Create Campaign
          </button>
        )}
      </div>

      {/* Filters (athlete browse only) */}
      {isAthlete && tab === 0 && (
        <div className="cpg-filters">
          <input className="input cpg-search" placeholder="🔍 Search campaigns…"
            value={q} onChange={e => setQ(e.target.value)} />
          <input className="input cpg-sport-filter" placeholder="Filter by sport…"
            value={sportF} onChange={e => setSportF(e.target.value)} />
        </div>
      )}

      {/* Tabs */}
      <div className="cpg-tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`cpg-tab${tab === i ? ' cpg-tab--active' : ''}`} onClick={() => setTab(i)}>
            {t}
            {counts[i] > 0 && (
              <span className="cpg-tab-count">{counts[i]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="cpg-loading">
          <div className="cpg-spinner" />
          <span>Loading campaigns…</span>
        </div>
      ) : currentList.length === 0 ? (
        <div className="cpg-empty">
          <div className="cpg-empty-icon">
            {tab === 0 && isAthlete ? '🧭' : tab === 1 ? '📝' : tab === 2 ? '🎯' : '📣'}
          </div>
          <h3 className="cpg-empty-title">
            {isSponsor ? 'No campaigns yet' :
             tab === 0 ? 'No open campaigns' :
             tab === 1 ? 'No applications yet' :
             'No invites yet'}
          </h3>
          <p className="cpg-empty-sub">
            {isSponsor ? 'Launch your first campaign to find athletes' :
             tab === 0 ? 'Check back soon — new campaigns are added daily' :
             tab === 1 ? 'Browse campaigns and submit your first application' :
             'Sponsors can invite you directly from your profile'}
          </p>
          {isSponsor && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>📣 Create Campaign</button>
          )}
        </div>
      ) : (
        <div className="cpg-grid">
          {isSponsor
            ? currentList.map(c => (
                <MyCampaignCard key={c._id} c={c}
                  onStatusChange={handleStatusChange}
                  onDecide={handleDecide} />
              ))
            : currentList.map(c => (
                <CampaignCard key={c._id} c={c}
                  onApply={setApplyFor}
                  onInviteRespond={handleInviteRespond} />
              ))
          }
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={() => load()} />
      )}
      {applyFor && (
        <ApplyCampaignModal
          campaign={applyFor}
          onClose={() => setApplyFor(null)}
          onApplied={() => { setApplyFor(null); load(); }} />
      )}
    </div>
  );
};

export default Campaigns;
