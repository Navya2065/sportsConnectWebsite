import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Shared/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ conversations: 0, sponsorships: 0, users: 0 });
  const [recentSpons, setRecentSpons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, sponsRes, usersRes] = await Promise.all([
          api.get('/conversations'),
          api.get('/sponsorships'),
          api.get('/users?limit=4'),
        ]);
        setStats({
          conversations: convRes.data.conversations.length,
          sponsorships: sponsRes.data.sponsorships.length,
          users: usersRes.data.total,
        });
        setRecentSpons(sponsRes.data.sponsorships.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
      <Navbar />
      <div className="dashboard fade-in">
        <div className="container">

          {/* Hero section */}
          <div className="dash-hero">
            <div className="dash-hero-left">
              <div className="dash-greeting">Good day,</div>
              <h1 className="dash-name">{user?.name}</h1>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
              {user?.sport && <p className="dash-sport">{user.sport}</p>}
              {user?.company && <p className="dash-sport">{user.company}</p>}
            </div>
            <div className="dash-avatar-wrap">
              <div className="avatar avatar-xl">{initials}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="dash-stats">
            <div className="stat-card">
              <div className="stat-number">{stats.conversations}</div>
              <div className="stat-label">Conversations</div>
              <Link to="/messages" className="stat-link">View all →</Link>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.sponsorships}</div>
              <div className="stat-label">Sponsorships</div>
              <Link to="/sponsorships" className="stat-link">View all →</Link>
            </div>
            <div className="stat-card accent">
              <div className="stat-number">{stats.users}</div>
              <div className="stat-label">
                {user?.role === 'athlete' ? 'Sponsors available' : 'Athletes available'}
              </div>
              <Link to="/explore" className="stat-link">Explore →</Link>
            </div>
          </div>

          <div className="dash-grid">
            {/* Quick actions */}
            <div className="card">
              <h2 className="section-title">Quick actions</h2>
              <div className="quick-actions">
                <Link to="/explore" className="quick-action">
                  <span className="qa-icon">🔍</span>
                  <div>
                    <div className="qa-title">Explore</div>
                    <div className="qa-sub">
                      {user?.role === 'athlete' ? 'Find sponsors' : 'Discover athletes'}
                    </div>
                  </div>
                </Link>
                <Link to="/messages" className="quick-action">
                  <span className="qa-icon">💬</span>
                  <div>
                    <div className="qa-title">Messages</div>
                    <div className="qa-sub">Chat with connections</div>
                  </div>
                </Link>
                <Link to="/profile" className="quick-action">
                  <span className="qa-icon">✏️</span>
                  <div>
                    <div className="qa-title">Edit profile</div>
                    <div className="qa-sub">Update your info</div>
                  </div>
                </Link>
                <Link to="/sponsorships" className="quick-action">
                  <span className="qa-icon">🤝</span>
                  <div>
                    <div className="qa-title">Sponsorships</div>
                    <div className="qa-sub">Manage deals</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent sponsorships */}
            <div className="card">
              <h2 className="section-title">Recent sponsorships</h2>
              {recentSpons.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <p className="empty-state-icon" style={{ fontSize: 36 }}>🤝</p>
                  <h3>No sponsorships yet</h3>
                  <p>
                    {user?.role === 'athlete' ? 'Sponsors will reach out here' : 'Start by exploring athletes'}
                  </p>
                </div>
              ) : (
                <div className="spons-list">
                  {recentSpons.map((s) => {
                    const other = user?.role === 'athlete' ? s.sponsor : s.athlete;
                    const otherInit = other?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <div key={s._id} className="spons-item">
                        <div className="avatar avatar-sm">{otherInit}</div>
                        <div className="spons-info">
                          <div className="spons-name">{other?.name}</div>
                          <div className="spons-meta">{other?.sport || other?.company}</div>
                        </div>
                        <span className={`badge badge-${s.status}`}>{s.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;
