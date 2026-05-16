const express = require("express");
const router  = express.Router();
const { getNotifications, markAllRead, markOneRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get   ("/",              protect, getNotifications);
router.patch ("/read-all",      protect, markAllRead);
router.patch ("/:id/read",      protect, markOneRead);

module.exports = router;