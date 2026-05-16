const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "follow",       // someone followed you
        "like",         // someone liked your post
        "comment",      // someone commented on your post
        "mention",      // mentioned in post/comment
        "repost",       // someone reposted (makemefamous)
        "message",      // new direct message
        "community",    // community activity
        "story_view",   // someone viewed your story
      ],
      required: true,
    },
    post:      { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost" },
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
    message:   { type: String, default: "" },
    read:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);