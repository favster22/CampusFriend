const User = require("../models/User");

const getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({
      "verificationApplication.status": "pending"
    }).select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveVerification = async (req, res) => {
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

const rejectVerification = async (req, res) => {
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