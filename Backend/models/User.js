const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    studentId:  { type: String, unique: true, sparse: true, trim: true, default: null },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true, minlength: 6, select: false },
    fullName:   { type: String, required: true, trim: true },
    username:   { type: String, required: true, unique: true, trim: true, lowercase: true },
    avatar:     { type: String, default: "" },
    header:     { type: String, default: "" },
    bio:        { type: String, maxlength: 300, default: "" },
    department: { type: String, default: "" },
    skills:     [{ type: String, trim: true }],
    socialLinks: {
      github:   { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter:  { type: String, default: "" },
    },
    communities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],

    // ── Follow system ──────────────────────────────────────────────
    followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount:     { type: Number, default: 0 },

    // ── Notification preferences ───────────────────────────────────
    notificationPrefs: {
      newFollower:        { type: Boolean, default: true },
      postLike:           { type: Boolean, default: true },
      postComment:        { type: Boolean, default: true },
      communityActivity:  { type: Boolean, default: true },
      directMessage:      { type: Boolean, default: true },
    },

    // Users this person has turned on notifications for
    notifyUsers:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    notifyCommunities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],

    // ── Privacy ────────────────────────────────────────────────────
    privateAccount:    { type: Boolean, default: false },
    hideFollowing:     { type: Boolean, default: false },
    showOnlineStatus:  { type: Boolean, default: true },
    hideLikes:         { type: Boolean, default: false },

    // ── Verification ───────────────────────────────────────────────
    verified: { type: Boolean, default: false },
    verificationApplication: {
      status:      { type: String, enum: ["none","pending","approved","rejected"], default: "none" },
      statement:   { type: String, default: "" },
      submittedAt: { type: Date },
      reviewedAt:  { type: Date },
      reviewer:    { type: String, default: "" },
      reviewNotes: { type: String, default: "" },
    },

    isOnline:  { type: Boolean, default: false },
    lastSeen:  { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password?.startsWith("$2a$")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (pwd) {
  return await bcrypt.compare(pwd, this.password);
};

userSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.password;
  return o;
};

module.exports = mongoose.model("User", userSchema);