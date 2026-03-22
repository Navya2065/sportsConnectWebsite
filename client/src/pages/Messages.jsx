import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import Navbar from '../components/Shared/Navbar';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const { joinConversation, leaveConversation, sendMessage, onMessage,
    emitTypingStart, emitTypingStop, onTypingStart, onTypingStop, isOnline } = useSocket();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    api.get('/conversations').then(({ data }) => {
      setConversations(data.conversations);
      const targetId = searchParams.get('c');
      const target = targetId
        ? data.conversations.find(c => c._id === targetId)
        : data.conversations[0];
      if (target) setActiveConv(target);
      setLoading(false);
    });
  }, [searchParams]);

  useEffect(() => {
    if (!activeConv) return;
    joinConversation(activeConv._id);
    api.get(`/messages/${activeConv._id}`).then(({ data }) => {
      setMessages(data.messages);
      setTimeout(scrollToBottom, 50);
    });
    return () => leaveConversation(activeConv._id);
  }, [activeConv, joinConversation, leaveConversation]);

  // Listen for incoming messages
  useEffect(() => {
    const unsub = onMessage(({ conversationId, message }) => {
      if (conversationId === activeConv?._id) {
        setMessages(prev => [...prev, message]);
        setTimeout(scrollToBottom, 50);
      }
      setConversations(prev => prev.map(c =>
        c._id === conversationId ? { ...c, lastMessage: message, lastMessageAt: message.createdAt } : c
      ));
    });
    return unsub;
  }, [activeConv, onMessage]);

  // Typing indicators
  useEffect(() => {
    const unsubStart = onTypingStart(({ userId, name, conversationId }) => {
      if (conversationId === activeConv?._id && userId !== user?._id) {
        setTypingUsers(prev => prev.includes(name) ? prev : [...prev, name]);
      }
    });
    const unsubStop = onTypingStop(({ userId, conversationId }) => {
      if (conversationId === activeConv?._id) {
        setTypingUsers(prev => prev.filter((_, i) => i !== 0));
      }
    });
    return () => { unsubStart(); unsubStop(); };
  }, [activeConv, onTypingStart, onTypingStop, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${activeConv._id}`, { content: input.trim() });
      setMessages(prev => [...prev, data.message]);
      sendMessage(activeConv._id, data.message);
      setInput('');
      setTimeout(scrollToBottom, 50);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConv) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post(`/messages/${activeConv._id}/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages(prev => [...prev, data.message]);
      sendMessage(activeConv._id, data.message);
      setTimeout(scrollToBottom, 50);
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeConv) return;
    emitTypingStart(activeConv._id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTypingStop(activeConv._id), 1500);
  };

  const getOtherParticipant = (conv) =>
    conv.participants.find(p => p._id !== user?._id);

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
     
      <div className="messages-layout fade-in">

        {/* Sidebar */}
        <div className="conv-sidebar">
          <div className="conv-sidebar-header">
            <h2 className="sidebar-title">Messages</h2>
          </div>
          <div className="conv-list">
            {conversations.length === 0 && (
              <div className="empty-state" style={{ padding: '40px 16px' }}>
                <div className="empty-state-icon">💬</div>
                <h3>No conversations</h3>
                <p>Go to Explore to start chatting</p>
              </div>
            )}
            {conversations.map(conv => {
              const other = getOtherParticipant(conv);
              const initials = other?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const online = isOnline(other?._id);
              return (
                <div
                  key={conv._id}
                  className={`conv-item ${activeConv?._id === conv._id ? 'active' : ''}`}
                  onClick={() => setActiveConv(conv)}
                >
                  <div className="conv-avatar-wrap">
                    <div className="avatar avatar-md">{initials}</div>
                    {online && <span className="online-dot" />}
                  </div>
                  <div className="conv-info">
                    <div className="conv-name">{other?.name}</div>
                    <div className="conv-last">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </div>
                  </div>
                  {conv.lastMessageAt && (
                    <div className="conv-time">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="chat-area">
          {!activeConv ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon">💬</div>
              <h3>Select a conversation</h3>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="chat-header">
                <div className="conv-avatar-wrap">
                  <div className="avatar avatar-md">
                    {getOtherParticipant(activeConv)?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {isOnline(getOtherParticipant(activeConv)?._id) && <span className="online-dot" />}
                </div>
                <div>
                  <div className="chat-header-name">{getOtherParticipant(activeConv)?.name}</div>
                  <div className="chat-header-sub">
                    <span className={`badge badge-${getOtherParticipant(activeConv)?.role}`}>
                      {getOtherParticipant(activeConv)?.role}
                    </span>
                    {isOnline(getOtherParticipant(activeConv)?._id) && (
                      <span style={{ fontSize: 12, color: '#32dc64', marginLeft: 8 }}>● Online</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.map((msg) => {
                  const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                  return (
                    <div key={msg._id} className={`msg-row ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && (
                        <div className="avatar avatar-sm">
                          {msg.sender?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div className="msg-bubble">
                        {msg.messageType === 'image' && (
                          <img src={msg.fileUrl} alt={msg.fileName} className="msg-image" />
                        )}
                        {msg.messageType === 'file' && (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="msg-file">
                            📎 {msg.fileName}
                          </a>
                        )}
                        {msg.content && <span>{msg.content}</span>}
                        <div className="msg-time">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typingUsers.length > 0 && (
                  <div className="msg-row theirs">
                    <div className="msg-bubble typing-indicator">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="chat-input-row" onSubmit={handleSend}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <button type="button" className="btn btn-ghost btn-sm attach-btn"
                  onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <div className="spinner" /> : '📎'}
                </button>
                <input
                  type="text"
                  className="form-input chat-input"
                  placeholder="Type a message..."
                  value={input}
                  onChange={handleTyping}
                />
                <button type="submit" className="btn btn-primary btn-sm send-btn" disabled={sending || !input.trim()}>
                  {sending ? <div className="spinner" /> : '↑'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Messages;
