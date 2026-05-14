const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getPendingVerifications, approveVerification, rejectVerification } = require("../controllers/adminController");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

router.get("/verifications", protect, adminOnly, getPendingVerifications);
router.put("/verifications/:userId/approve", protect, adminOnly, approveVerification);
router.put("/verifications/:userId/reject", protect, adminOnly, rejectVerification);

module.exports = router; // ← IMPORTANT