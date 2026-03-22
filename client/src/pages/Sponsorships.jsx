import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Shared/Navbar';
import toast from 'react-hot-toast';
import './Sponsorships.css';

const Sponsorships = () => {
  const { user } = useAuth();
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/sponsorships')
      .then(({ data }) => setSponsorships(data.sponsorships))
      .catch(() => toast.error('Failed to load sponsorships'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setUpdating(id);
    try {
      const { data } = await api.put(`/sponsorships/${id}/status`, { status });
      setSponsorships(prev => prev.map(s => s._id === id ? data.sponsorship : s));
      toast.success(`Sponsorship ${status === 'active' ? 'accepted' : 'rejected'}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const groups = {
    pending: sponsorships.filter(s => s.status === 'pending'),
    active: sponsorships.filter(s => s.status === 'active'),
    rejected: sponsorships.filter(s => s.status === 'rejected'),
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="page-loader" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    </>
  );

  return (
    <>
     
      <div className="sponsorships fade-in">
        <div className="container">
          <div className="spons-page-header">
            <h1 className="spons-page-title">Sponsorships</h1>
            <p className="spons-page-sub">
              {user?.role === 'athlete'
                ? 'Manage sponsorship requests from sponsors'
                : 'Track your sponsorship outreach'}
            </p>
          </div>

          {sponsorships.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 80 }}>
              <div className="empty-state-icon">🤝</div>
              <h3>No sponsorships yet</h3>
              <p>{user?.role === 'athlete'
                ? 'Sponsors will send requests here'
                : 'Visit Explore to find athletes to sponsor'}
              </p>
            </div>
          ) : (
            <div className="spons-sections">
              {Object.entries(groups).map(([status, items]) => items.length > 0 && (
                <div key={status} className="spons-section">
                  <div className="spons-section-header">
                    <span className={`badge badge-${status}`}>{status}</span>
                    <span className="spons-count">{items.length}</span>
                  </div>
                  <div className="spons-cards">
                    {items.map(s => {
                      const other = user?.role === 'athlete' ? s.sponsor : s.athlete;
                      const initials = other?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <div key={s._id} className="spons-card card">
                          <div className="spons-card-header">
                            <div className="avatar avatar-md">{initials}</div>
                            <div className="spons-card-info">
                              <div className="spons-card-name">{other?.name}</div>
                              <div className="spons-card-meta">
                                {other?.sport || other?.company || other?.industry}
                              </div>
                            </div>
                            <span className={`badge badge-${s.status}`}>{s.status}</span>
                          </div>

                          {s.deal?.title && (
                            <div className="spons-deal">
                              <div className="deal-title">{s.deal.title}</div>
                              {s.deal.description && <div className="deal-desc">{s.deal.description}</div>}
                              {s.deal.value > 0 && (
                                <div className="deal-value">
                                  {s.deal.currency} {s.deal.value.toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}

                          {s.notes && <p className="spons-notes">{s.notes}</p>}

                          {user?.role === 'athlete' && s.status === 'pending' && (
                            <div className="spons-actions">
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={updating === s._id}
                                onClick={() => handleStatusUpdate(s._id, 'active')}
                              >
                                {updating === s._id ? <div className="spinner" /> : '✓ Accept'}
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                disabled={updating === s._id}
                                onClick={() => handleStatusUpdate(s._id, 'rejected')}
                              >
                                ✕ Decline
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sponsorships;
