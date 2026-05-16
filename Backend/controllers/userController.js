const User         = require("../models/User");
const Notification = require("../models/Notification");
const FeedPost     = require("../models/FeedPost");

// ── GET /api/users/:username ─────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate("communities", "name slug avatar category");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const postsCount = await FeedPost.countDocuments({ author: user._id, isDeleted: false });

    res.json({ success: true, user: { ...user.toJSON(), postsCount } });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/users/profile ─────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const {
      username, fullName, bio, department, skills, socialLinks,
      avatar, header,
      privateAccount, hideFollowing, showOnlineStatus, hideLikes,
      notificationPrefs,
    } = req.body;

    const updates = {};
    if (username) {
      const lower = username.trim().toLowerCase();
      if (lower !== req.user.username) {
        const exists = await User.findOne({ username: lower });
        if (exists && exists._id.toString() !== req.user._id.toString())
          return res.status(400).json({ success: false, message: "Username already taken" });
        updates.username = lower;
      }
    }
    if (fullName)              updates.fullName   = fullName.trim();
    if (bio      !== undefined) updates.bio        = bio.trim();
    if (department !== undefined) updates.department = department.trim();
    if (skills)                updates.skills     = skills;
    if (socialLinks)           updates.socialLinks = socialLinks;
    if (avatar   !== undefined) updates.avatar     = avatar;
    if (header   !== undefined) updates.header     = header;
    if (privateAccount  !== undefined) updates.privateAccount  = privateAccount;
    if (hideFollowing   !== undefined) updates.hideFollowing   = hideFollowing;
    if (showOnlineStatus !== undefined) updates.showOnlineStatus = showOnlineStatus;
    if (hideLikes       !== undefined) updates.hideLikes       = hideLikes;
    if (notificationPrefs) updates.notificationPrefs = { ...req.user.notificationPrefs, ...notificationPrefs };

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    }).populate("communities", "name slug avatar");

    res.json({ success: true, user });
  } catch (e) {
    console.error("updateProfile:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/users/:username/follow ────────────────────────────────────────
const toggleFollow = async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    if (target._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });

    const isFollowing = target.followers.includes(req.user._id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(target._id, {
        $pull:  { followers: req.user._id },
        $inc:   { followersCount: -1 },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: target._id },
        $inc:  { followingCount: -1 },
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(target._id, {
        $addToSet: { followers: req.user._id },
        $inc:      { followersCount: 1 },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: target._id },
        $inc:      { followingCount: 1 },
      });
      // Notify target if they have newFollower pref on
      if (target.notificationPrefs?.newFollower !== false) {
        await Notification.create({
          recipient: target._id,
          sender:    req.user._id,
          type:      "follow",
          message:   `${req.user.fullName} started following you`,
        });
      }
    }

    res.json({ success: true, following: !isFollowing });
  } catch (e) {
    console.error("toggleFollow:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/users/:username/followers ───────────────────────────────────────
const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate("followers", "fullName username avatar department verified isOnline");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, followers: user.followers });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/users/:username/following ───────────────────────────────────────
const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate("following", "fullName username avatar department verified isOnline");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Respect hideFollowing privacy (except the owner themselves)
    if (user.hideFollowing && req.user._id.toString() !== user._id.toString()) {
      return res.json({ success: true, following: [], hidden: true });
    }
    res.json({ success: true, following: user.following });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/users/search?q= ─────────────────────────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ success: false, message: "Min 2 characters" });

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { fullName:   { $regex: q, $options: "i" } },
        { username:   { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { skills:     { $in: [new RegExp(q, "i")] } },
      ],
    })
      .select("fullName username avatar department skills isOnline lastSeen verified followersCount")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/users/change-password ────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Both fields required" });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Min 6 characters" });

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ success: false, message: "Wrong current password" });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password changed" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /api/users/upload ───────────────────────────────────────────────────
const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image" });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: "Upload error" });
  }
};

// ── POST /api/users/verification ─────────────────────────────────────────────
const submitVerificationApplication = async (req, res) => {
  try {
    const { statement = "" } = req.body;
    if (req.user.verified)
      return res.status(400).json({ success: false, message: "Already verified" });
    if (req.user.verificationApplication?.status === "pending")
      return res.status(400).json({ success: false, message: "Application already pending" });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { verificationApplication: { status: "pending", statement: statement.trim(), submittedAt: new Date() } },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/users/verification/pending (admin) ───────────────────────────────
const getPendingVerificationApplications = async (req, res) => {
  try {
    const users = await User.find({ "verificationApplication.status": "pending" })
      .select("fullName username email avatar department verificationApplication verified");
    res.json({ success: true, applications: users });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/users/verification/:userId/approve (admin) ─────────────────────
const approveVerification = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verified: true, "verificationApplication.status": "approved", "verificationApplication.reviewedAt": new Date() },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/users/verification/:userId/reject (admin) ──────────────────────
const rejectVerification = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verified: false, "verificationApplication.status": "rejected", "verificationApplication.reviewedAt": new Date() },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/users/:username/notify ────────────────────────────────────────
const toggleUserNotification = async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    const me = await User.findById(req.user._id);
    const isOn = me.notifyUsers.includes(target._id);

    await User.findByIdAndUpdate(req.user._id, isOn
      ? { $pull:    { notifyUsers: target._id } }
      : { $addToSet:{ notifyUsers: target._id } }
    );

    res.json({ success: true, notifying: !isOn });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getUserProfile, updateProfile, searchUsers, changePassword, uploadImage,
  toggleFollow, getFollowers, getFollowing,
  submitVerificationApplication, getPendingVerificationApplications,
  approveVerification, rejectVerification,
  toggleUserNotification,
};