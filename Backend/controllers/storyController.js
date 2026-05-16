const Story = require("../models/Story");
const User  = require("../models/User");

// ── POST /api/stories ────────────────────────────────────────────────────────
const createStory = async (req, res) => {
  try {
    const { text, bgColor, mediaUrl, mediaType } = req.body;
    if (!text?.trim() && !mediaUrl)
      return res.status(400).json({ success: false, message: "Story needs text or media" });

    const story = await Story.create({
      author:    req.user._id,
      text:      text?.trim() || "",
      bgColor:   bgColor || "#0f6485",
      mediaUrl:  mediaUrl || "",
      mediaType: mediaType || (mediaUrl ? "image" : "text"),
    });

    const populated = await story.populate("author", "fullName username avatar verified");
    res.status(201).json({ success: true, story: populated });
  } catch (e) {
    console.error("createStory:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/stories ─────────────────────────────────────────────────────────
// Returns stories from people the user follows + their own
const getStories = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select("following");
    const ids = [...(me.following || []), req.user._id];

    const stories = await Story.find({
      author:    { $in: ids },
      expiresAt: { $gt: new Date() },
    })
      .populate("author", "fullName username avatar verified")
      .sort({ createdAt: -1 });

    // Group by author
    const grouped = {};
    for (const s of stories) {
      const uid = s.author._id.toString();
      if (!grouped[uid]) grouped[uid] = { author: s.author, stories: [] };
      grouped[uid].stories.push(s);
    }

    res.json({ success: true, groups: Object.values(grouped) });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PATCH /api/stories/:id/view ──────────────────────────────────────────────
const viewStory = async (req, res) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewers: req.user._id },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── DELETE /api/stories/:id ──────────────────────────────────────────────────
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    if (story.author.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    await story.deleteOne();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createStory, getStories, viewStory, deleteStory };