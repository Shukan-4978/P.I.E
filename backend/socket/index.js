// In-memory map: userId -> Set of socketIds
const onlineUsers = new Map();

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user_online', (userId) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);
      socket.userId = userId;

      // Broadcast online status to all connected clients
      io.emit('user_status', { userId, online: true });
      console.log(`👤 User ${userId} online (${onlineUsers.get(userId).size} connections)`);
    });

    // Join a conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`📨 Socket ${socket.id} joined conversation:${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, userId, name }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', { userId, name });
    });

    socket.on('stop_typing', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', { userId });
    });

    // Read receipt
    socket.on('message_read', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('message_read', { userId, conversationId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = socket.userId;
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status', { userId, online: false });
          console.log(`👤 User ${userId} went offline`);
        }
      }
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  // Helper: emit to a specific user (all their sockets)
  io.sendToUser = (userId, event, data) => {
    const sockets = onlineUsers.get(userId.toString());
    if (sockets) {
      sockets.forEach((socketId) => {
        io.to(socketId).emit(event, data);
      });
    }
  };

  // Helper: check if user is online
  io.isOnline = (userId) => onlineUsers.has(userId.toString());
};

module.exports = initSocket;
