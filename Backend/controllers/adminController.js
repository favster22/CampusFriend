// controllers/adminController.js or admin route

exports.approveVerification = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          verified: true,
          "verificationApplication.status": "approved",
          "verificationApplication.reviewedAt": new Date(),
          "verificationApplication.reviewer": req.user._id,
        }
      },
      { new: true }
    );

    res.json({ success: true, message: "User verified successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectVerification = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          verified: false,
          "verificationApplication.status": "rejected",
          "verificationApplication.reviewedAt": new Date(),
          "verificationApplication.reviewer": req.user._id,
        }
      },
      { new: true }
    );

    res.json({ success: true, message: "Verification rejected", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};