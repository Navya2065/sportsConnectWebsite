import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const StatCard = ({ icon, value, label, change, changeType, to }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      cursor: 'pointer',
      transition: 'border-color 0.18s, transform 0.18s',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: '12px 12px 0 0' }} />
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      {change && (
        <div style={{ fontSize: 12, fontWeight: 600, color: changeType === 'warn' ? 'var(--yellow)' : 'var(--green)' }}>
          {change}
        </div>
      )}
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ conversations: 0, sponsorships: 0, users: 0, posts: 0 });
  const [recentSpons, setRecentSpons] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, sponsRes, usersRes, postsRes] = await Promise.all([
          api.get('/conversations'),
          api.get('/sponsorships'),
          api.get('/users?limit=5'),
          api.get('/posts?type=opportunity&limit=3'),
        ]);
        setStats({
          conversations: convRes.data.conversations.length,
          sponsorships: sponsRes.data.sponsorships.length,
          users: usersRes.data.total,
          posts: postsRes.data.total || 0,
        });
        setRecentSpons(sponsRes.data.sponsorships.slice(0, 3));
        setTopUsers(usersRes.data.users.slice(0, 4));
        setOpportunities(postsRes.data.posts.slice(0, 3));

        // Load following list
        const followRes = await api.get(`/follow/${user._id}/following`);
        const map = {};
        followRes.data.following.forEach(u => { map[u._id] = true; });
        setFollowing(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user._id]);

  const handleFollow = async (userId) => {
    try {
      const { data } = await api.put(`/follow/${userId}`);
      setFollowing(prev => ({ ...prev, [userId]: data.following }));
      toast.success(data.following ? 'Following!' : 'Unfollowed');
    } catch {
      toast.error('Failed to follow');
    }
  };

  const handleApply = async (postId) => {
    try {
      await api.put(`/posts/${postId}/apply`);
      toast.success('Applied successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <div className="page-loader" style={{ minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Welcome banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
        }} />
        <div style={{ position: 'absolute', right: 120, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.04, fontFamily: 'var(--font-display)' }}>
          {user?.role === 'athlete' ? 'ATHLETE' : 'SPONSOR'}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Welcome back
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', lineHeight: 1, marginBottom: 10 }}>
            {user?.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            {user?.sport && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🏅 {user.sport}</span>}
            {user?.company && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🏢 {user.company}</span>}
            {user?.location && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍 {user.location}</span>}
          </div>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
            : <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--bg-hover)',
                border: '3px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700,
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
                boxShadow: 'var(--shadow-accent)',
              }}>
                {initials}
              </div>
          }
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard icon="💬" value={stats.conversations} label="Conversations" change="View messages" to="/messages" />
        <StatCard icon="🤝" value={stats.sponsorships} label="Sponsorships" change={recentSpons.some(s => s.status === 'pending') ? '⚠ Pending action' : 'All up to date'} changeType={recentSpons.some(s => s.status === 'pending') ? 'warn' : 'ok'} to="/sponsorships" />
        <StatCard icon="👥" value={stats.users} label={user?.role === 'athlete' ? 'Sponsors' : 'Athletes'} change="Explore all" to="/explore" />
        <StatCard icon="📰" value={stats.posts} label="Opportunities" change="View feed" to="/feed" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Hot opportunities */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🔥 {user?.role === 'athlete' ? 'Hot Opportunities' : 'Recent Posts'}
            </div>
            <Link to="/feed" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>View all →</Link>
          </div>
          {opportunities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No opportunities yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {opportunities.map(opp => {
                const authorInit = opp.author?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div key={opp._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                    }}>
                      {authorInit}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {opp.author?.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {opp.opportunity?.sport && `🏅 ${opp.opportunity.sport}`}
                        {opp.opportunity?.budget && ` · 💰 ${opp.opportunity.budget}`}
                      </div>
                    </div>
                    {user?.role === 'athlete' && (
                      <button
                        onClick={() => handleApply(opp._id)}
                        style={{
                          background: 'transparent', border: '1px solid var(--border-strong)',
                          color: 'var(--accent)', fontSize: 11, fontWeight: 600,
                          padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                          whiteSpace: 'nowrap', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent sponsorships */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🤝 My Deals
            </div>
            <Link to="/sponsorships" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>View all →</Link>
          </div>
          {recentSpons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 8 }}>🤝</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {user?.role === 'athlete' ? 'Sponsors will reach out here' : 'Start by exploring athletes'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentSpons.map(s => {
                const other = user?.role === 'athlete' ? s.sponsor : s.athlete;
                const otherInit = other?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const statusColors = {
                  active: { bg: 'var(--green-dim)', color: 'var(--green)', border: 'rgba(52,211,153,0.2)' },
                  pending: { bg: 'var(--yellow-dim)', color: 'var(--yellow)', border: 'rgba(251,191,36,0.2)' },
                  rejected: { bg: 'var(--red-dim)', color: 'var(--red)', border: 'rgba(248,113,113,0.2)' },
                };
                const sc = statusColors[s.status] || statusColors.pending;
                return (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                    }}>
                      {otherInit}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{other?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{other?.sport || other?.company}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 100,
                      background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Engagement chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            📈 Engagement
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', height: `${h}%`,
                  background: i === 6 ? 'var(--accent)' : 'var(--accent-dim)',
                  borderRadius: '4px 4px 0 0',
                  border: i === 6 ? '1px solid var(--accent)' : '1px solid var(--border)',
                  transition: 'opacity 0.15s',
                  minHeight: 4,
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: i === 6 ? 'var(--accent)' : 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Top users to follow */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🏆 {user?.role === 'athlete' ? 'Top Sponsors' : 'Top Athletes'}
            </div>
            <Link to="/explore" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>All →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topUsers.slice(0, 3).map(u => {
              const uInit = u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const isFollowing = following[u._id];
              return (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                  }}>
                    {uInit}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.sport || u.company}</div>
                  </div>
                  <button
                    onClick={() => handleFollow(u._id)}
                    style={{
                      background: isFollowing ? 'var(--accent-dim)' : 'transparent',
                      border: `1px solid ${isFollowing ? 'var(--accent)' : 'var(--border-strong)'}`,
                      color: isFollowing ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: 10, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 8, cursor: 'pointer',
                      whiteSpace: 'nowrap', transition: 'all 0.15s',
                    }}
                  >
                    {isFollowing ? 'Following' : '+ Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            ⚡ Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: '📰', label: 'Create a post', sub: 'Share your story', path: '/feed' },
              { icon: '🔍', label: user?.role === 'athlete' ? 'Find sponsors' : 'Find athletes', sub: 'Browse & connect', path: '/explore' },
              { icon: '✏️', label: 'Edit profile', sub: 'Update your info', path: '/profile' },
              { icon: '💬', label: 'Messages', sub: 'Chat with connections', path: '/messages' },
            ].map(action => (
              <div
                key={action.path}
                onClick={() => navigate(action.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
                  transition: 'background 0.13s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{action.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{action.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;