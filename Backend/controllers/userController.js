const User = require("../models/User");

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).populate("communities", "name slug avatar category memberCount");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update current user's profile
// @route   PATCH /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username, fullName, bio, department, skills, socialLinks, avatar, header } = req.body;

    const updates = {};
    if (username && username.trim().toLowerCase() !== req.user.username) {
      const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "Username is already taken" });
      }
      updates.username = username.trim().toLowerCase();
    }
    if (fullName) updates.fullName = fullName.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (department !== undefined) updates.department = department.trim();
    if (skills) updates.skills = skills;
    if (socialLinks) updates.socialLinks = socialLinks;
    if (avatar !== undefined) updates.avatar = avatar;
    if (header !== undefined) updates.header = header;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate("communities", "name slug avatar");

    res.json({ success: true, user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Search for students
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res
        .status(400)
        .json({ success: false, message: "Search query must be at least 2 characters" });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { fullName: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { skills: { $in: [new RegExp(q, "i")] } },
      ],
    })
      .select("fullName username avatar department skills isOnline lastSeen")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Change password
// @route   PATCH /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide current and new password" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword))) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Submit verification application
// @route   POST /api/users/verification
// @access  Private
const submitVerificationApplication = async (req, res) => {
  try {
    const { statement = "" } = req.body;

    if (req.user.verified) {
      return res.status(400).json({ success: false, message: "Your account is already verified." });
    }

    if (req.user.verificationApplication?.status === "pending") {
      return res.status(400).json({ success: false, message: "A verification application is already pending." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        verificationApplication: {
          status: "pending",
          statement: statement.trim(),
          submittedAt: new Date(),
          reviewedAt: null,
          reviewer: "",
          reviewNotes: "",
        },
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error("Verification application error:", error);
    res.status(500).json({ success: false, message: "Server error submitting verification application" });
  }
};

// @desc    Get pending verification applications (admin only)
// @route   GET /api/users/verification/pending
// @access  Private/Admin
const getPendingVerificationApplications = async (req, res) => {
  try {
    const users = await User.find({ "verificationApplication.status": "pending" })
      .select("fullName username email avatar department verificationApplication verified");

    res.json({ success: true, applications: users });
  } catch (error) {
    console.error("Get pending verification applications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Approve verification application
// @route   PATCH /api/users/verification/:userId/approve
// @access  Private/Admin
const approveVerification = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        verified: true,
        verificationApplication: {
          ...targetUser.verificationApplication.toObject(),
          status: "approved",
          reviewedAt: new Date(),
          reviewer: req.user.username || req.user._id.toString(),
          reviewNotes: req.body.reviewNotes?.trim() || "",
        },
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error("Approve verification error:", error);
    res.status(500).json({ success: false, message: "Server error approving verification" });
  }
};

// @desc    Reject verification application
// @route   PATCH /api/users/verification/:userId/reject
// @access  Private/Admin
const rejectVerification = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        verified: false,
        verificationApplication: {
          ...targetUser.verificationApplication.toObject(),
          status: "rejected",
          reviewedAt: new Date(),
          reviewer: req.user.username || req.user._id.toString(),
          reviewNotes: req.body.reviewNotes?.trim() || "",
        },
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error("Reject verification error:", error);
    res.status(500).json({ success: false, message: "Server error rejecting verification" });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ success: false, message: "Server error uploading image" });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  searchUsers,
  changePassword,
  uploadImage,
  submitVerificationApplication,
  getPendingVerificationApplications,
  approveVerification,
  rejectVerification,
};