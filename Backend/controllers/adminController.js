const User = require("../models/User");

// Get all pending verification requests
exports.getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({
      "verificationApplication.status": "pending"
    }).select("-password");

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve verification → blue badge appears
exports.approveVerification = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          verified: true,
          "verificationApplication.status": "approved",
          "verificationApplication.reviewedAt": new Date(),
          "verificationApplication.reviewer": req.user.username,
        }
      },
      { new: true }
    );

    res.json({ success: true, message: "User verified!", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject verification
exports.rejectVerification = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          verified: false,
          "verificationApplication.status": "rejected",
          "verificationApplication.reviewedAt": new Date(),
          "verificationApplication.reviewer": req.user.username,
        }
      },
      { new: true }
    );

    res.json({ success: true, message: "Verification rejected", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPendingVerifications,
  approveVerification,
  rejectVerification
};