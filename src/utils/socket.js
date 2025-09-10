const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");

// Store online users and their socket connections
const onlineUsers = new Set();
const userSockets = new Map(); // userId -> Set of socket IDs

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("$"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on("connection", (socket) => {
    
    // Handle connection errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // User Status Management
    socket.on("joinUserStatus", ({ userId }) => {
      if (!userId) {
        console.error("joinUserStatus: userId is required");
        return;
      }
      
      socket.userId = userId;
      
      // Track user's socket connections
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      
      // Add to online users if not already there
      const wasOffline = !onlineUsers.has(userId);
      onlineUsers.add(userId);
      
      if (wasOffline) {
        // Broadcast to all other users that this user is online
        socket.broadcast.emit("userOnline", userId);
      }
      
      // Send current online users list to the newly connected user
      socket.emit("onlineUsers", Array.from(onlineUsers));
    });

    socket.on("userOnline", ({ userId }) => {
      if (userId && !onlineUsers.has(userId)) {
        onlineUsers.add(userId);
        socket.broadcast.emit("userOnline", userId);
      }
    });

    socket.on("userOffline", ({ userId }) => {
      if (userId && onlineUsers.has(userId)) {
        // Check if user has other active connections
        const userSocketSet = userSockets.get(userId);
        if (userSocketSet && userSocketSet.size > 0) {
          // User still has other connections, don't mark as offline
          return;
        }
        
        onlineUsers.delete(userId);
        socket.broadcast.emit("userOffline", userId);
      }
    });

    // Chat functionality
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetUserId, text }) => {
        // Save messages to the database
        try {
          const roomId = getSecretRoomId(userId, targetUserId);

          // TODO: Check if userId & targetUserId are friends

          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          chat.messages.push({
            senderId: userId,
            text,
          });

          await chat.save();
          
          // Emit message to the chat room
          io.to(roomId).emit("messageReceived", { firstName, lastName, text });
          
          // Emit notification to the target user (if they're not in the chat room)
          const targetUserSockets = userSockets.get(targetUserId);
          if (targetUserSockets && targetUserSockets.size > 0) {
            // Check if target user is currently in this chat room
            let isInChatRoom = false;
            for (const socketId of targetUserSockets) {
              const targetSocket = io.sockets.sockets.get(socketId);
              if (targetSocket && targetSocket.rooms.has(roomId)) {
                isInChatRoom = true;
                break;
              }
            }
            
            // Only send notification if target user is not currently viewing this chat
            if (!isInChatRoom) {
              io.to(targetUserId).emit("chatNotification", {
                fromUserId: userId,
                fromName: `${firstName} ${lastName}`,
                message: text,
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (err) {
          // Error handling
        }
      }
    );

    socket.on("disconnect", () => {
      
      // Handle user going offline
      if (socket.userId) {
        const userSocketSet = userSockets.get(socket.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          
          // If no more connections for this user, mark as offline
          if (userSocketSet.size === 0) {
            userSockets.delete(socket.userId);
            if (onlineUsers.has(socket.userId)) {
              onlineUsers.delete(socket.userId);
              socket.broadcast.emit("userOffline", socket.userId);
            }
          }
        }
      }
    });
  });
};

// Utility function to get online users (can be used in routes if needed)
const getOnlineUsers = () => {
  return Array.from(onlineUsers);
};

// Utility function to check if a user is online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

module.exports = {
  initializeSocket,
  getOnlineUsers,
  isUserOnline
};