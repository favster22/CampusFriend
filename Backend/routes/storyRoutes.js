// ── storyRoutes.js ─────────────────────────────────────────────────────────
const express = require("express");
const storyRouter = express.Router();
const { createStory, getStories, viewStory, deleteStory } = require("../controllers/storyController");
const { protect } = require("../middleware/authMiddleware");

storyRouter.get   ("/",         protect, getStories);
storyRouter.post  ("/",         protect, createStory);
storyRouter.patch ("/:id/view", protect, viewStory);
storyRouter.delete("/:id",      protect, deleteStory);

module.exports = storyRouter;