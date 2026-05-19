const express = require("express");
const router  = express.Router();
const {
  getFeed, searchPosts, createPost, toggleLike,
  makeMeFamous, addComment, deletePost, getUpcomingEvents, getAnalytics,
} = require("../controllers/feedController");

router.get   ("/",                 getFeed);
router.get   ("/search",           searchPosts);
router.get   ("/events",           getUpcomingEvents);
router.get   ("/analytics",        getAnalytics);
router.post  ("/",                 createPost);
router.patch ("/:id/like",         toggleLike);
router.patch ("/:id/makemefamous", makeMeFamous);
router.post  ("/:id/comment",      addComment);
router.delete("/:id",              deletePost);

module.exports = router;