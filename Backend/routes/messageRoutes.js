const express = require("express");
const router = express.Router();
const {
  getDirectMessages,
  getCommunityMessages,
  sendDirectMessage,
  sendCommunityMessage,
  getRecentChats,
  markAsRead,
} = require("../controllers/messageController");

router.get("/chats", getRecentChats);
router.get("/direct/:recipientId", getDirectMessages);
router.post("/direct/:recipientId", sendDirectMessage);
router.get("/community/:communityId", getCommunityMessages);
router.post("/community/:communityId", sendCommunityMessage);
router.patch("/read/:conversationId", markAsRead);

module.exports = router;