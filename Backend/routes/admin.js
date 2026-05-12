// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1. Get all users waiting for approval
router.get('/pending-verifications', async (req, res) => {
  try {
    const pending = await User.find({ "verificationApplication.status": "pending" });
    res.json(pending);
  } catch (err) {
    res.status(500).send("Error fetching pending users");
  }
});

// 2. Manual Approve Action
router.patch('/approve-badge/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { 
        $set: { 
          "verificationApplication.status": "verified",
          "verificationApplication.reviewedAt": new Date()
        } 
      },
      { new: true }
    );
    res.json({ message: "User verified manually", user });
  } catch (err) {
    res.status(500).send("Update failed");
  }
});