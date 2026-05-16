const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content:  { type: String, required: true, maxlength: 5000 },
    postType: {
      type: String,
      enum: ["general","announcement","event","resource","question"],
      default: "general",
    },
    attachments: [{ url: String, filename: String, fileType: String }],
    mediaUrls:   [{ type: String }],  // images/files uploaded with post
    community:   { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
    likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{
      author:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content:   { type: String, required: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now },
      likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    }],
    tags:         [{ type: String, trim: true }],
    eventDetails: { date: Date, location: String, isOnline: Boolean, meetingLink: String },
    isPinned:     { type: Boolean, default: false },
    isDeleted:    { type: Boolean, default: false },

    // MakeMeFamous / repost
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost" },
    shareCount:   { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual("likeCount").get(function () { return this.likes.length; });
postSchema.virtual("commentCount").get(function () { return this.comments.length; });
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model("FeedPost", postSchema);