const express = require("express");
const router  = express.Router();
const {
  getFeed,
  createPost,
  toggleLike,
  makeMeFamous,
  addComment,
  deletePost,
  getUpcomingEvents,
} = require("../controllers/feedController");

router.get   ("/",            getFeed);
router.post  ("/",            createPost);
router.get   ("/events",      getUpcomingEvents);
router.patch ("/:id/like",    toggleLike);
router.patch ("/:id/makemefamous", makeMeFamous);
router.post  ("/:id/comment", addComment);
router.delete("/:id",         deletePost);

module.exports = router;