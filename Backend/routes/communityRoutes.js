const express = require("express");
const router  = express.Router();
const {
  getCommunities,
  getCommunity,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getMyCommunities,
} = require("../controllers/communityController");

router.get   ("/",          getCommunities);
router.get   ("/my",        getMyCommunities);
router.get   ("/:id",       getCommunity);
router.post  ("/",          createCommunity);
router.post  ("/:id/join",  joinCommunity);
router.delete("/:id/leave", leaveCommunity);

module.exports = router;