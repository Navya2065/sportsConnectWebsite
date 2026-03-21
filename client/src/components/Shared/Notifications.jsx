import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import './Notifications.css';

const typeIcon = {
  like: '❤️',
  comment: '💬',
  follow: '👤',
  apply: '🤝',
  sponsorship: '💼',
};

const Notifications = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { onNotification } = useSocket();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!onNotification) return;
    const unsub = onNotification((newNotif) => {
      // Add new notification to top of list
      setNotifications(prev => [newNotif, ...prev]);
      // Increment unread count
      setUnreadCount(prev => prev + 1);
    });
    return unsub;
  }, [onNotification]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchNotifications();
  };

  const handleReadAll = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await api.put(`/notifications/${notif._id}/read`);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (notif.post) navigate('/feed');
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  return (
    <div className="notif-wrap" ref={dropdownRef}>
      <button className="notif-bell" onClick={handleOpen}>
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-read-all" onClick={handleReadAll}>Mark all read</button>
            )}
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="notif-loader"><div className="spinner" /></div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <span>🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="notif-icon">{typeIcon[n.type]}</div>
                  <div className="notif-body">
                    <div className="notif-sender-wrap">
                      <div className="avatar avatar-sm">
                        {n.sender?.name?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="notif-delete" onClick={(e) => handleDelete(e, n._id)}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;