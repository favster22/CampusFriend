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
    mediaUrls:   [{ type: String }],
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

    // ── MakeMeFamous / Repost ──────────────────────────────────────
    // If originalPost is set → this is a repost, NOT shown on FYP
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost" },
    shareCount:   { type: Number, default: 0 },

    // ── FYP Visibility ─────────────────────────────────────────────
    // fypScore is recalculated on every like/comment/share
    // Posts start private to author's profile; promoted to FYP when score >= FYP_THRESHOLD
    fypScore:     { type: Number, default: 0, index: true },
    onFyp:        { type: Boolean, default: false, index: true },

    // ── View / impression tracking (for analytics) ─────────────────
    viewCount:    { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual("likeCount").get(function ()    { return this.likes.length; });
postSchema.virtual("commentCount").get(function () { return this.comments.length; });

// Recalculate FYP score helper
// Weights: like=2, comment=3, share=5, view=0.1, age penalty
postSchema.methods.recalcFypScore = function () {
  const ageHours = (Date.now() - this.createdAt) / 3_600_000;
  const agePenalty = Math.pow(0.98, ageHours);               // decay ~2% per hour
  const raw =
    (this.likes.length    * 2)  +
    (this.comments.length * 3)  +
    (this.shareCount      * 5)  +
    (this.viewCount       * 0.1);
  this.fypScore = Math.round(raw * agePenalty * 100) / 100;

  // Promote to FYP once score >= 5  (≈3 likes or 2 comments)
  const FYP_THRESHOLD = 5;
  this.onFyp = !this.originalPost && this.fypScore >= FYP_THRESHOLD;
  return this;
};

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, isDeleted: 1 });
postSchema.index({ onFyp: 1, fypScore: -1 });

module.exports = mongoose.model("FeedPost", postSchema);