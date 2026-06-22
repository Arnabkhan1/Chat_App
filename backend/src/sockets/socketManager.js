// Online users track korar jonno ekta map
// Format: { userId: socketId }

const User = require('../models/User');

const userSocketMap = {};

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 New connection:', socket.id);

    // Frontend theke connect korar somoy userId pathabe
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`✅ User ${userId} is now online`);

      // DB e online status update koro
      User.findByIdAndUpdate(userId, { isOnline: true }).catch((err) =>
        console.error('Failed to update online status:', err)
      );

      io.emit('getOnlineUsers', Object.keys(userSocketMap));
    }

    // Notun message pathanor event
    socket.on('sendMessage', (data) => {
      const { receiverId, message } = data;
      const receiverSocketId = userSocketMap[receiverId];

      // Receiver online thakले taর socket e direct message pathao
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', message);
      }
    });

    // Typing indicator event
    socket.on('typing', ({ receiverId, senderId }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', { senderId });
      }
    });

    socket.on('stopTyping', ({ receiverId, senderId }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userStopTyping', { senderId });
      }
    });

    // Disconnect hole online list theke remove koro
    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id);
      if (userId) {
        delete userSocketMap[userId];
        io.emit('getOnlineUsers', Object.keys(userSocketMap));

        // DB e offline status ar lastSeen update koro
        User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        }).catch((err) => console.error('Failed to update offline status:', err));
      }
    });
  });
};

// Onno file theke (jeman messageController) receiver er socket id pete eта export korলাম
const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

module.exports = { initializeSocket, getReceiverSocketId };