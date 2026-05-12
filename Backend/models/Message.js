const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For direct messages
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // For community/group messages
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "resource"],
      default: "text",
    },
    attachments: [
      {
        url: String,
        filename: String,
        fileType: String,
        size: Number,
      },
    ],
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);