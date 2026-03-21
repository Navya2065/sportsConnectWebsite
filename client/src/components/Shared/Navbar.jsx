import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Notifications from './Notifications';
import './Navbar.css';

const VerifiedBadge = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 14, height: 14, background: 'var(--accent)', color: '#0a0a0f',
    borderRadius: '50%', fontSize: 8, fontWeight: 700, marginLeft: 4,
  }}>✓</span>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">SPORTSCONNECT</span>
        </Link>

        <div className="navbar-links">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/feed" className={`nav-link ${isActive('/feed') ? 'active' : ''}`}>Feed</Link>
          <Link to="/explore" className={`nav-link ${isActive('/explore') ? 'active' : ''}`}>Explore</Link>
          <Link to="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`}>Search</Link>
          <Link to="/messages" className={`nav-link ${isActive('/messages') ? 'active' : ''}`}>Messages</Link>
          <Link to="/sponsorships" className={`nav-link ${isActive('/sponsorships') ? 'active' : ''}`}>Sponsorships</Link>
        </div>

        <div className="navbar-right">
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : ''}`} />
          </div>
          <Notifications />
          <Link to="/profile" className="navbar-avatar">
            <div className="avatar avatar-sm">{initials}</div>
            {user?.isVerified && <VerifiedBadge />}
            <span className="nav-username hide-mobile">{user?.name?.split(' ')[0]}</span>
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;