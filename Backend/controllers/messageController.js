const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Get conversation between two users
// @route   GET /api/messages/direct/:recipientId
// @access  Private
const getDirectMessages = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id },
      ],
      isDeleted: false,
    })
      .populate("sender", "fullName username avatar")
      .populate("recipient", "fullName username avatar")
      .populate("replyTo", "content sender")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      messages: messages.reverse(),
      page: Number(page),
    });
  } catch (error) {
    console.error("Get direct messages error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get community messages
// @route   GET /api/messages/community/:communityId
// @access  Private
const getCommunityMessages = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      community: communityId,
      isDeleted: false,
    })
      .populate("sender", "fullName username avatar")
      .populate("replyTo", "content sender")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      messages: messages.reverse(),
      page: Number(page),
    });
  } catch (error) {
    console.error("Get community messages error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Send a direct message
// @route   POST /api/messages/direct/:recipientId
// @access  Private
const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { content, messageType = "text", replyTo } = req.body;

    if (!content?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message content is required" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res
        .status(404)
        .json({ success: false, message: "Recipient not found" });
    }

    const message = await Message.create({
      sender: req.user._id,
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

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error("Send direct message error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Send a community message
// @route   POST /api/messages/community/:communityId
// @access  Private
const sendCommunityMessage = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { content, messageType = "text", replyTo } = req.body;

    if (!content?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message content is required" });
    }

    const message = await Message.create({
      sender: req.user._id,
      community: communityId,
      content: content.trim(),
      messageType,
      replyTo: replyTo || undefined,
    });

    const populated = await message.populate([
      { path: "sender", select: "fullName username avatar" },
      { path: "replyTo", select: "content sender" },
    ]);

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error("Send community message error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get recent chat list for a user
// @route   GET /api/messages/chats
// @access  Private
const getRecentChats = async (req, res) => {
  try {
    // Aggregate latest message per conversation
    const recentDirect = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { recipient: req.user._id }],
          isDeleted: false,
          recipient: { $exists: true },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", req.user._id] },
              "$recipient",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      { $limit: 20 },
    ]);

    const populated = await User.populate(recentDirect, {
      path: "_id",
      select: "fullName username avatar isOnline lastSeen",
    });

    res.json({ success: true, chats: populated });
  } catch (error) {
    console.error("Get recent chats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Mark messages as read
// @route   PATCH /api/messages/read/:conversationId
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type } = req.query; // 'direct' or 'community'

    const query =
      type === "community"
        ? { community: conversationId, sender: { $ne: req.user._id } }
        : { sender: conversationId, recipient: req.user._id };

    await Message.updateMany(
      { ...query, "readBy.user": { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getDirectMessages,
  getCommunityMessages,
  sendDirectMessage,
  sendCommunityMessage,
  getRecentChats,
  markAsRead,
};