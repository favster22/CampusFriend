const Message = require("../models/Message");
const User = require("../models/User");

// Map of userId -> socketId for presence tracking
const onlineUsers = new Map();

const handleSocketConnection = (io, socket) => {
  const userId = socket.userId;
  console.log(`⚡ User connected: ${userId} (socket: ${socket.id})`);

  // Register user as online
  onlineUsers.set(userId, socket.id);
  User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).exec();

  // Broadcast online status to all
  io.emit("user:online", { userId });

  // ─── JOIN ROOMS ───────────────────────────────────────────────────────────
  socket.on("room:join", ({ roomId }) => {
    socket.join(roomId);
    console.log(`📌 ${userId} joined room: ${roomId}`);
  });

  socket.on("room:leave", ({ roomId }) => {
    socket.leave(roomId);
    console.log(`🚪 ${userId} left room: ${roomId}`);
  });

  // ─── DIRECT MESSAGING ─────────────────────────────────────────────────────
  socket.on("message:send-direct", async ({ recipientId, content, messageType = "text", replyTo }) => {
    try {
      if (!content?.trim()) return;

      const message = await Message.create({
        sender: userId,
        recipient: recipientId,
        content: content.trim(),
        messageType,
        replyTo: replyTo || undefined,
      });

      const populated = await message.populate([
        { path: "sender", select: "fullName username avatar" },
        { path: "recipient", select: "fullName username avatar" },
        { path: "replyTo", select: "content sender" },
      ]);

      // Send to sender
      socket.emit("message:new-direct", populated);

      // Send to recipient if online
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("message:new-direct", populated);
      }
    } catch (err) {
      console.error("Socket send-direct error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ─── COMMUNITY MESSAGING ──────────────────────────────────────────────────
  socket.on("message:send-community", async ({ communityId, content, messageType = "text", replyTo }) => {
    try {
      if (!content?.trim()) return;

      const message = await Message.create({
        sender: userId,
        community: communityId,
        content: content.trim(),
        messageType,
        replyTo: replyTo || undefined,
      });

      const populated = await message.populate([
        { path: "sender", select: "fullName username avatar" },
        { path: "replyTo", select: "content sender" },
      ]);

      // Broadcast to everyone in the room (community channel)
      io.to(communityId).emit("message:new-community", { communityId, message: populated });
    } catch (err) {
      console.error("Socket send-community error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ─── TYPING INDICATORS ────────────────────────────────────────────────────
  socket.on("typing:start", ({ conversationId, isGroup }) => {
    if (isGroup) {
      socket.to(conversationId).emit("typing:update", { userId, conversationId, isTyping: true });
    } else {
      const recipientSocketId = onlineUsers.get(conversationId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing:update", { userId, conversationId, isTyping: true });
      }
    }
  });

  socket.on("typing:stop", ({ conversationId, isGroup }) => {
    if (isGroup) {
      socket.to(conversationId).emit("typing:update", { userId, conversationId, isTyping: false });
    } else {
      const recipientSocketId = onlineUsers.get(conversationId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing:update", { userId, conversationId, isTyping: false });
      }
    }
  });

  // ─── READ RECEIPTS ────────────────────────────────────────────────────────
  socket.on("message:read", async ({ messageIds, senderId }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds }, "readBy.user": { $ne: userId } },
        { $push: { readBy: { user: userId, readAt: new Date() } } }
      );

      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message:read-receipt", { messageIds, readBy: userId });
      }
    } catch (err) {
      console.error("Socket read receipt error:", err);
    }
  });

  // ─── DISCONNECT ───────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    console.log(`💤 User disconnected: ${userId}`);
    onlineUsers.delete(userId);

    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: new Date(),
    }).exec();

    io.emit("user:offline", { userId, lastSeen: new Date() });
  });
};

const getOnlineUsers = () => Array.from(onlineUsers.keys());

module.exports = { handleSocketConnection, getOnlineUsers };