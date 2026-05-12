const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  searchUsers,
  changePassword,
  uploadImage,
  submitVerificationApplication,
  getPendingVerificationApplications,
  approveVerification,
  rejectVerification,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
    cb(null, safeName);
  },
});
const upload = multer({ storage });

router.get("/search", protect, searchUsers);
router.get("/:username", protect, getUserProfile);
router.post("/upload", protect, upload.single("image"), uploadImage);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);
router.post("/verification", protect, submitVerificationApplication);
router.get("/verification/pending", protect, adminOnly, getPendingVerificationApplications);
router.patch("/verification/:userId/approve", protect, adminOnly, approveVerification);
router.patch("/verification/:userId/reject", protect, adminOnly, rejectVerification);

module.exports = router;