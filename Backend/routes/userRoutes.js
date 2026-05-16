const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const router  = express.Router();

const {
  getUserProfile, updateProfile, searchUsers, changePassword, uploadImage,
  toggleFollow, getFollowers, getFollowing,
  submitVerificationApplication, getPendingVerificationApplications,
  approveVerification, rejectVerification,
  toggleUserNotification,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Multer setup
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-")}`),
});
const upload = multer({ storage });

router.get   ("/search",                        protect, searchUsers);
router.patch ("/profile",                       protect, updateProfile);
router.patch ("/change-password",               protect, changePassword);
router.post  ("/upload",                        protect, upload.single("image"), uploadImage);
router.post  ("/verification",                  protect, submitVerificationApplication);
router.get   ("/verification/pending",          protect, adminOnly, getPendingVerificationApplications);
router.patch ("/verification/:userId/approve",  protect, adminOnly, approveVerification);
router.patch ("/verification/:userId/reject",   protect, adminOnly, rejectVerification);

// Profile (must be after specific routes)
router.get   ("/:username",                     protect, getUserProfile);
router.patch ("/:username/follow",              protect, toggleFollow);
router.get   ("/:username/followers",           protect, getFollowers);
router.get   ("/:username/following",           protect, getFollowing);
router.patch ("/:username/notify",              protect, toggleUserNotification);

module.exports = router;