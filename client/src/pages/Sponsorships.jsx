import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ContractModal from '../components/Shared/ContractModal';
import ReviewModal   from '../components/Shared/ReviewModal';
import './Sponsorships.css';

/* ─── Status Badge Config ─────────────────────────────────────── */
const STATUS_META = {
  pending:   { label: 'Pending',   emoji: '⏳', color: 'yellow'    },
  active:    { label: 'Active',    emoji: '✅', color: 'active'    },
  rejected:  { label: 'Declined',  emoji: '✕',  color: 'rejected'  },
  completed: { label: 'Completed', emoji: '🏆', color: 'completed' },
};

/* ─── Deal Card ────────────────────────────────────────────────── */
const DealCard = ({
  s, userRole, onStatusUpdate, onComplete, onOpenContract, onOpenReview, updating,
}) => {
  const other    = userRole === 'athlete' ? s.sponsor : s.athlete;
  const initials = other?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const meta     = STATUS_META[s.status] || {};
  const isBusy   = updating === s._id;

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  const showContractBtn = s.status === 'active' || s.status === 'completed';
  const showReviewBtn   = s.status === 'completed';

  return (
    <div className={`spons-card card spons-card--${s.status}`}>

      {/* Header */}
      <div className="spons-card-header">
        {other?.avatar
          ? <img src={other.avatar} alt={other.name} className="avatar avatar-md" style={{ objectFit: 'cover', borderRadius: '50%' }} />
          : <div className="avatar avatar-md">{initials}</div>
        }
        <div className="spons-card-info">
          <div className="spons-card-name">{other?.name}</div>
          <div className="spons-card-meta">{other?.sport || other?.company || other?.industry}</div>
        </div>
        <span className={`badge badge-${meta.color}`}>{meta.emoji} {meta.label}</span>
      </div>

      {/* Deal Details */}
      {s.deal?.title && (
        <div className="spons-deal">
          <div className="deal-title">{s.deal.title}</div>
          {s.deal.description && <div className="deal-desc">{s.deal.description}</div>}
          <div className="deal-footer">
            {s.deal.value > 0 && (
              <div className="deal-value">
                {s.deal.currency} {s.deal.value.toLocaleString()}
              </div>
            )}
            {(s.deal.startDate || s.deal.endDate) && (
              <div className="deal-dates">
                {fmtDate(s.deal.startDate)}
                {s.deal.startDate && s.deal.endDate ? ' → ' : ''}
                {fmtDate(s.deal.endDate)}
              </div>
            )}
          </div>
        </div>
      )}

      {s.notes && <p className="spons-notes">💬 {s.notes}</p>}

      {/* ── Action Buttons ── */}
      <div className="spons-actions spons-actions--col">

        {/* Athlete: Accept / Decline pending */}
        {userRole === 'athlete' && s.status === 'pending' && (
          <div className="spons-actions">
            <button
              className="btn btn-primary btn-sm"
              disabled={isBusy}
              onClick={() => onStatusUpdate(s._id, 'active')}
            >
              {isBusy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✓ Accept'}
            </button>
            <button
              className="btn btn-danger btn-sm"
              disabled={isBusy}
              onClick={() => onStatusUpdate(s._id, 'rejected')}
            >
              ✕ Decline
            </button>
          </div>
        )}

        {/* Sponsor: Mark Complete on active */}
        {userRole === 'sponsor' && s.status === 'active' && (
          <button
            className="btn btn-success btn-sm"
            disabled={isBusy}
            onClick={() => onComplete(s._id)}
          >
            {isBusy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🏆 Mark Complete'}
          </button>
        )}

        {/* Contract button — active & completed deals */}
        {showContractBtn && (
          <button
            className="btn btn-contract btn-sm"
            onClick={() => onOpenContract(s)}
          >
            📄 {userRole === 'sponsor' ? 'Manage Contract' : 'View Contract'}
          </button>
        )}

        {/* Review button — completed deals only */}
        {showReviewBtn && (
          <button
            className="btn btn-review btn-sm"
            onClick={() => onOpenReview(s)}
          >
            ⭐ Leave a Review
          </button>
        )}
      </div>

    </div>
  );
};

/* ─── Sponsorships Page ────────────────────────────────────────── */
const Sponsorships = () => {
  const { user }   = useAuth();
  const { socket } = useSocket();

  const [sponsorships, setSponsorships] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);
  const [activeTab,    setActiveTab]    = useState('all');

  // Contract modal state
  const [contractSpons, setContractSpons] = useState(null);
  // Review modal state
  const [reviewSpons,   setReviewSpons]   = useState(null);

  /* ── Load sponsorships ── */
  useEffect(() => {
    api.get('/sponsorships')
      .then(({ data }) => setSponsorships(data.sponsorships))
      .catch(() => toast.error('Failed to load sponsorships'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Real-time: deal status updates ── */
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (updated) =>
      setSponsorships((prev) => prev.map((s) => s._id === updated._id ? updated : s));
    socket.on('sponsorship:updated', onUpdate);
    return () => socket.off('sponsorship:updated', onUpdate);
  }, [socket]);

  /* ── Real-time: contract signed notification ── */
  useEffect(() => {
    if (!socket) return;
    const onSigned = () => toast.success('✍️ Contract has been signed!');
    socket.on('contract:signed', onSigned);
    return () => socket.off('contract:signed', onSigned);
  }, [socket]);

  /* ── Handlers ── */
  const handleStatusUpdate = async (id, status) => {
    setUpdating(id);
    try {
      const { data } = await api.put(`/sponsorships/${id}/status`, { status });
      setSponsorships((prev) => prev.map((s) => s._id === id ? data.sponsorship : s));
      toast.success(status === 'active' ? '✅ Offer accepted!' : 'Offer declined');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleComplete = async (id) => {
    setUpdating(id);
    try {
      const { data } = await api.put(`/sponsorships/${id}/complete`);
      setSponsorships((prev) => prev.map((s) => s._id === id ? data.sponsorship : s));
      toast.success('🏆 Deal marked as completed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not complete deal');
    } finally {
      setUpdating(null);
    }
  };

  /* ── Tab config ── */
  const TABS     = ['all', 'pending', 'active', 'completed', 'rejected'];
  const displayed = activeTab === 'all'
    ? sponsorships
    : sponsorships.filter((s) => s.status === activeTab);

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all'
      ? sponsorships.length
      : sponsorships.filter((s) => s.status === t).length;
    return acc;
  }, {});

  /* ── Render ── */
  if (loading) return (
    <div className="page-loader" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <>
      {/* Contract Modal */}
      {contractSpons && (
        <ContractModal
          sponsorship={contractSpons}
          userRole={user?.role}
          userId={user?._id}
          onClose={() => setContractSpons(null)}
        />
      )}

      {/* Review Modal */}
      {reviewSpons && (
        <ReviewModal
          sponsorship={reviewSpons}
          userRole={user?.role}
          onClose={() => setReviewSpons(null)}
          onReviewSubmitted={() => {
            // nothing to reload — modal shows read-only after submit
          }}
        />
      )}

      <div className="sponsorships fade-in">
        <div className="container">

          {/* Page Header */}
          <div className="spons-page-header">
            <h1 className="spons-page-title">Sponsorships</h1>
            <p className="spons-page-sub">
              {user?.role === 'athlete'
                ? 'Manage sponsorship offers from sponsors'
                : 'Track your sponsorship deals with athletes'}
            </p>
          </div>

          {sponsorships.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 80 }}>
              <div className="empty-state-icon">🤝</div>
              <h3>No sponsorships yet</h3>
              <p>
                {user?.role === 'athlete'
                  ? 'Sponsors will send offers here'
                  : 'Visit Explore to find athletes and send offers'}
              </p>
            </div>
          ) : (
            <>
              {/* Tab Bar */}
              <div className="spons-tabs">
                {TABS.map((tab) =>
                  counts[tab] > 0 || tab === 'all' ? (
                    <button
                      key={tab}
                      className={`spons-tab ${activeTab === tab ? 'spons-tab--active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {STATUS_META[tab]?.emoji || '📋'}{' '}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {counts[tab] > 0 && (
                        <span className="spons-tab-count">{counts[tab]}</span>
                      )}
                    </button>
                  ) : null
                )}
              </div>

              {/* Cards Grid */}
              {displayed.length === 0 ? (
                <div className="empty-state" style={{ paddingTop: 60 }}>
                  <div className="empty-state-icon">{STATUS_META[activeTab]?.emoji || '📋'}</div>
                  <h3>No {activeTab} deals</h3>
                </div>
              ) : (
                <div className="spons-cards">
                  {displayed.map((s) => (
                    <DealCard
                      key={s._id}
                      s={s}
                      userRole={user?.role}
                      onStatusUpdate={handleStatusUpdate}
                      onComplete={handleComplete}
                      onOpenContract={setContractSpons}
                      onOpenReview={setReviewSpons}
                      updating={updating}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Sponsorships;
