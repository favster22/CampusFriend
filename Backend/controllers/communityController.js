const Community = require("../models/Community");
const User = require("../models/User");

// @desc    Get all communities
// @route   GET /api/communities
// @access  Private
const getCommunities = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }
    if (category) query.category = category;

    const communities = await Community.find(query)
      .populate("creator", "fullName username avatar")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Community.countDocuments(query);

    res.json({
      success: true,
      communities,
      total,
      pages: Math.ceil(total / Number(limit)),
      page: Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get single community
// @route   GET /api/communities/:id
// @access  Private
const getCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("creator", "fullName username avatar")
      .populate("members.user", "fullName username avatar isOnline");

    if (!community) {
      return res
        .status(404)
        .json({ success: false, message: "Community not found" });
    }

    res.json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create a community
// @route   POST /api/communities
// @access  Private
const createCommunity = async (req, res) => {
  try {
    const { name, description, category, isPrivate, tags } = req.body;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Community name is required" });
    }

    const community = await Community.create({
      name: name.trim(),
      description: description?.trim() || "",
      category: category || "general",
      isPrivate: isPrivate || false,
      tags: tags || [],
      creator: req.user._id,
      members: [{ user: req.user._id, role: "admin" }],
    });

    // Add community to user's list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { communities: community._id },
    });

    const populated = await community.populate(
      "creator",
      "fullName username avatar"
    );

    res.status(201).json({ success: true, community: populated });
  } catch (error) {
    console.error("Create community error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Join a community
// @route   POST /api/communities/:id/join
// @access  Private
const joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res
        .status(404)
        .json({ success: false, message: "Community not found" });
    }

    const isMember = community.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res
        .status(400)
        .json({ success: false, message: "Already a member" });
    }

    community.members.push({ user: req.user._id, role: "member" });
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { communities: community._id },
    });

    res.json({ success: true, message: "Joined community successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Leave a community
// @route   DELETE /api/communities/:id/leave
// @access  Private
const leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res
        .status(404)
        .json({ success: false, message: "Community not found" });
    }

    community.members = community.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { communities: community._id },
    });

    res.json({ success: true, message: "Left community successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get user's communities
// @route   GET /api/communities/my
// @access  Private
const getMyCommunities = async (req, res) => {
  try {
    const communities = await Community.find({
      "members.user": req.user._id,
    }).populate("creator", "fullName username avatar");

    res.json({ success: true, communities });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getCommunities,
  getCommunity,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getMyCommunities,
};