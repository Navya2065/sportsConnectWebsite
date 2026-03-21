const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Track online users: userId -> socketId
const onlineUsers = new Map();

const socketHandlers = (io) => {
  // Authenticate socket connection using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    // Register user as online
    onlineUsers.set(userId, socket.id);
    io.emit('users:online', Array.from(onlineUsers.keys()));

    // Join a conversation room
    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId);
      console.log(`${socket.user.name} joined conversation: ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(conversationId);
    });

    // Send a message via socket (real-time broadcast)
    socket.on('message:send', (data) => {
      const { conversationId, message } = data;
      // Broadcast to everyone in the room except sender
      socket.to(conversationId).emit('message:receive', {
        conversationId,
        message,
      });
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:start', {
        userId,
        name: socket.user.name,
        conversationId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', {
        userId,
        conversationId,
      });
    });

    // Message read receipt
    socket.on('message:read', ({ conversationId, messageIds }) => {
      socket.to(conversationId).emit('message:read', {
        userId,
        messageIds,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = socketHandlers;