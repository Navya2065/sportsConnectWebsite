import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('users:online', (users) => setOnlineUsers(users));

    return () => { socketRef.current?.disconnect(); };
  }, [user]);

  const joinConversation = (id) => socketRef.current?.emit('conversation:join', id);
  const leaveConversation = (id) => socketRef.current?.emit('conversation:leave', id);
  const sendMessage = (conversationId, message) => socketRef.current?.emit('message:send', { conversationId, message });
  const emitTypingStart = (id) => socketRef.current?.emit('typing:start', { conversationId: id });
  const emitTypingStop = (id) => socketRef.current?.emit('typing:stop', { conversationId: id });

  const onMessage = (cb) => {
    socketRef.current?.on('message:receive', cb);
    return () => socketRef.current?.off('message:receive', cb);
  };

  const onTypingStart = (cb) => {
    socketRef.current?.on('typing:start', cb);
    return () => socketRef.current?.off('typing:start', cb);
  };

  const onTypingStop = (cb) => {
    socketRef.current?.on('typing:stop', cb);
    return () => socketRef.current?.off('typing:stop', cb);
  };

  // Listen for real-time notifications
  const onNotification = (cb) => {
    socketRef.current?.on('notification:new', cb);
    return () => socketRef.current?.off('notification:new', cb);
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      onlineUsers,
      isOnline,
      joinConversation,
      leaveConversation,
      sendMessage,
      emitTypingStart,
      emitTypingStop,
      onMessage,
      onTypingStart,
      onTypingStop,
      onNotification,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);