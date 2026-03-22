import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import Navbar from './Navbar';
import Notifications from './Notifications';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

const AppLayout = ({ children, title, hideChat }) => {
  const { user } = useAuth();
  const { isOnline, onMessage, joinConversation, leaveConversation, sendMessage: socketSend } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [chatMinimized, setChatMinimized] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/conversations').then(({ data }) => {
      setConversations(data.conversations);
      if (data.conversations.length > 0) setActiveConv(data.conversations[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    joinConversation(activeConv._id);
    api.get(`/messages/${activeConv._id}`).then(({ data }) => {
      setMessages(data.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return () => leaveConversation(activeConv._id);
  }, [activeConv, joinConversation, leaveConversation]);

  useEffect(() => {
    const unsub = onMessage(({ conversationId, message }) => {
      if (conversationId === activeConv?._id) {
        setMessages(prev => [...prev, message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      setConversations(prev => prev.map(c =>
        c._id === conversationId ? { ...c, lastMessage: message } : c
      ));
    });
    return unsub;
  }, [activeConv, onMessage]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${activeConv._id}`, { content: input.trim() });
      setMessages(prev => [...prev, data.message]);
      socketSend(activeConv._id, data.message);
      setInput('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {}
    finally { setSending(false); }
  };

  const getOther = (conv) => conv.participants?.find(p => p._id !== user?._id);

  return (
    <div className="app-layout">

      {/* Side Navbar */}
      <Navbar />

      {/* Main area */}
      <div className="app-main">

        {/* Topbar — search + notifications + theme toggle */}
        <div className="app-topbar">
          <span className="topbar-title">{title}</span>

          <div className="topbar-right">

            {/* Search bar */}
            <div
              onClick={() => navigate('/search')}
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 16px',
                fontSize: 13,
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer',
                minWidth: 220,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              🔍 <span>Search athletes, sponsors...</span>
            </div>

            {/* Notifications bell */}
            <Notifications />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-strong)',
                borderRadius: 100,
                width: 44, height: 24,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            >
              <div style={{
                position: 'absolute',
                top: 3,
                left: theme === 'light' ? 22 : 3,
                width: 18, height: 18,
                background: 'var(--accent)',
                borderRadius: '50%',
                transition: 'left 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10,
              }}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
            </button>

          </div>
        </div>

        {/* Content + chat panel */}
        <div className="app-content-wrap">
          <div className="app-content">
            {children}
          </div>

          {/* Chat side panel */}
          {!hideChat && (
          <div style={{
            width: chatMinimized ? 48 : 300,
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary)',
            flexShrink: 0,
            transition: 'width 0.25s ease',
            overflow: 'hidden',
          }}>

            {/* Header */}
            <div style={{
              padding: '14px 12px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              minHeight: 52,
            }}>
              {!chatMinimized && (
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Messages
                </span>
              )}
              <div style={{ display: 'flex', gap: 6, marginLeft: chatMinimized ? 'auto' : 0 }}>
                {!chatMinimized && (
                  <button
                    onClick={() => navigate('/messages')}
                    style={{
                      background: 'var(--accent-dim)', border: 'none',
                      color: 'var(--accent)', fontSize: 11, fontWeight: 600,
                      padding: '4px 10px', borderRadius: 100, cursor: 'pointer',
                    }}
                  >
                    expand ↗
                  </button>
                )}
                <button
                  onClick={() => setChatMinimized(p => !p)}
                  title={chatMinimized ? 'Expand chat' : 'Minimize chat'}
                  style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    width: 26, height: 26,
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700,
                    transition: 'background 0.13s, color 0.13s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {chatMinimized ? '›' : '‹'}
                </button>
              </div>
            </div>

            {/* Expanded state */}
            {!chatMinimized && (
              <>
                <div className="chat-panel-list">
                  {conversations.length === 0 && (
                    <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                      No conversations yet
                    </div>
                  )}
                  {conversations.map(conv => {
                    const other = getOther(conv);
                    const otherInit = other?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const online = isOnline(other?._id);
                    return (
                      <div
                        key={conv._id}
                        className={`chat-panel-item ${activeConv?._id === conv._id ? 'active' : ''}`}
                        onClick={() => setActiveConv(conv)}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {other?.avatar
                            ? <img src={other.avatar} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                            : <div className="avatar avatar-sm">{otherInit}</div>
                          }
                          {online && (
                            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, background: 'var(--green)', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }} />
                          )}
                        </div>
                        <div className="chat-panel-item-info">
                          <div className="chat-panel-item-name">{other?.name}</div>
                          <div className="chat-panel-item-last">
                            {conv.lastMessage?.content || 'No messages yet'}
                          </div>
                        </div>
                        {conv.lastMessageAt && (
                          <span className="chat-panel-item-time">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {activeConv && (
                  <div className="chat-panel-active">
                    <div className="chat-panel-active-header">
                      <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
                        {getOther(activeConv)?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="chat-panel-active-name">
                        {getOther(activeConv)?.name}
                      </span>
                      <button className="chat-panel-expand" onClick={() => navigate(`/messages?c=${activeConv._id}`)}>
                        ↗
                      </button>
                    </div>

                    <div className="chat-panel-messages">
                      {messages.slice(-10).map(msg => {
                        const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                        return (
                          <div key={msg._id} className={`chat-panel-msg ${isMine ? 'mine' : ''}`}>
                            {!isMine && (
                              <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: 9 }}>
                                {msg.sender?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className="chat-panel-bubble">{msg.content}</div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-panel-input-row" onSubmit={handleSend}>
                      <input
                        className="chat-panel-input"
                        placeholder="Message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                      />
                      <button type="submit" className="chat-panel-send" disabled={sending || !input.trim()}>
                        {sending ? '...' : '↑'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* Minimized state — show avatar icons */}
            {chatMinimized && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 10 }}>
                {conversations.slice(0, 6).map(conv => {
                  const other = getOther(conv);
                  const otherInit = other?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const online = isOnline(other?._id);
                  const isActive = activeConv?._id === conv._id;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => { setChatMinimized(false); setActiveConv(conv); }}
                      title={other?.name}
                      style={{ position: 'relative', cursor: 'pointer' }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: isActive ? 'var(--accent-dim)' : 'var(--bg-hover)',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-strong)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                        transition: 'border-color 0.15s',
                      }}>
                        {otherInit}
                      </div>
                      {online && (
                        <span style={{
                          position: 'absolute', bottom: 0, right: 0,
                          width: 8, height: 8,
                          background: 'var(--green)', borderRadius: '50%',
                          border: '2px solid var(--bg-secondary)',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;