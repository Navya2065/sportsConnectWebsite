import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import Notifications from './Notifications';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', icon: '📊', label: 'Dashboard' },
      { path: '/feed',      icon: '📰', label: 'Feed' },
      { path: '/explore',   icon: '🧭', label: 'Explore' },
      { path: '/search',    icon: '🔍', label: 'Search' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { path: '/messages',     icon: '💬', label: 'Messages',     badge: true },
      { path: '/sponsorships', icon: '🤝', label: 'Sponsorships', badge: true },
      { path: '/campaigns',    icon: '📣', label: 'Campaigns' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: '/analytics', icon: '📈', label: 'Analytics' },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/profile', icon: '👤', label: 'Profile' },
    ],
  },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      width: 220,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'background 0.3s',
      zIndex: 50,
    }}>

      {/* Logo */}
      <div style={{
        padding: '18px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34,
          background: 'var(--accent)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: 'white', flexShrink: 0,
        }}>⚡</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16, fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
        }}>
          Sports<span style={{ color: 'var(--accent)' }}>Connect</span>
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ padding: '12px 10px 4px' }}>
            <div style={{
              fontSize: 10, fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              padding: '0 10px',
              marginBottom: 4,
            }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px',
                    borderRadius: active ? '0 10px 10px 0' : 10,
                    marginBottom: 2,
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                    textDecoration: 'none',
                    transition: 'background 0.13s',
                    paddingLeft: active ? 9 : 12,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span style={{
                      background: 'var(--accent)', color: 'white',
                      fontSize: 10, fontWeight: 700,
                      padding: '1px 7px', borderRadius: 100,
                      minWidth: 20, textAlign: 'center',
                    }}>
                      {item.path === '/messages' ? '💬' : '🤝'}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '10px 10px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>

        {/* Connection + Notifications + Theme toggle row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '4px 10px', gap: 10,
        }}>
          {/* Connection dot */}
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isConnected ? '#34d399' : 'var(--text-muted)',
            flexShrink: 0,
            boxShadow: isConnected ? '0 0 6px rgba(52,211,153,0.5)' : 'none',
          }} title={isConnected ? 'Connected' : 'Disconnected'} />

          <div style={{ flex: 1 }} />

          

          {/* Theme toggle */}
        
        </div>

        {/* User card */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'background 0.13s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onClick={() => navigate('/profile')}
        >
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: 'var(--accent)', flexShrink: 0,
                fontFamily: 'var(--font-display)',
              }}>
                {initials}
              </div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {user?.role === 'athlete' ? '🏃 Athlete' : '🏢 Sponsor'}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', fontSize: 14,
              cursor: 'pointer', padding: '2px 4px',
              borderRadius: 4, transition: 'color 0.13s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Logout"
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;