const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl:  { type: String, default: "" },   // image or video URL
    mediaType: { type: String, enum: ["image", "video", "text"], default: "text" },
    text:      { type: String, default: "", maxlength: 300 },
    bgColor:   { type: String, default: "#0f6485" },
    viewers:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

// Auto-expire after 24 h (requires TTL index)
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", storySchema);