const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      maxlength: [5000, "Post content cannot exceed 5000 characters"],
    },
    postType: {
      type: String,
      enum: ["general", "announcement", "event", "resource", "question"],
      default: "general",
    },
    attachments: [
      {
        url: String,
        filename: String,
        fileType: String,
      },
    ],
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: {
          type: String,
          required: true,
          maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },
        createdAt: { type: Date, default: Date.now },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    tags: [{ type: String, trim: true }],
    eventDetails: {
      date: Date,
      location: String,
      isOnline: { type: Boolean, default: false },
      meetingLink: String,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Index for feed queries
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);