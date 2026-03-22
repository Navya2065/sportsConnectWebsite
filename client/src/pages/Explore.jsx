import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Shared/Navbar';
import toast from 'react-hot-toast';
import './Explore.css';

const UserCard = ({ user, onMessage, onSponsor, currentRole }) => {
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="user-card card card-hover fade-in">
      <div className="uc-header">
        <div className="avatar avatar-lg">{initials}</div>
        <div className="uc-info">
          <h3 className="uc-name">{user.name}</h3>
          <span className={`badge badge-${user.role}`}>{user.role}</span>
        </div>
      </div>
      <div className="uc-details">
        {user.sport && <div className="uc-detail"><span>🏅</span>{user.sport}</div>}
        {user.company && <div className="uc-detail"><span>🏢</span>{user.company}</div>}
        {user.industry && <div className="uc-detail"><span>💼</span>{user.industry}</div>}
        {user.location && <div className="uc-detail"><span>📍</span>{user.location}</div>}
      </div>
      {user.bio && <p className="uc-bio">{user.bio.slice(0, 100)}{user.bio.length > 100 ? '...' : ''}</p>}
      <div className="uc-actions">
        <button className="btn btn-secondary btn-sm w-full" onClick={() => onMessage(user._id)}>
          💬 Message
        </button>
        {currentRole === 'sponsor' && user.role === 'athlete' && (
          <button className="btn btn-primary btn-sm w-full" onClick={() => onSponsor(user._id)}>
            🤝 Sponsor
          </button>
        )}
      </div>
    </div>
  );
};

const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, page]);

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
    } catch (err) {
      toast.error('Could not open conversation');
    }
  };

  const handleSponsor = async (athleteId) => {
    try {
      await api.post('/sponsorships', { athleteId });
      toast.success('Sponsorship request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <>
     
      <div className="explore fade-in">
        <div className="container">
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

          {/* Filters */}
          <form className="explore-filters" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-input explore-search"
              placeholder="Search by name, sport, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="form-input explore-select"
              value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}>
              <option value="">All roles</option>
              <option value="athlete">Athletes</option>
              <option value="sponsor">Sponsors</option>
            </select>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {/* Grid */}
          {loading ? (
            <div className="explore-loader"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No users found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          ) : (
            <>
              <div className="users-grid">
                {users.map((u) => (
                  <UserCard
                    key={u._id} user={u}
                    onMessage={handleMessage}
                    onSponsor={handleSponsor}
                    currentRole={user?.role}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <span className="page-info">{page} / {totalPages}</span>
                  <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
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
