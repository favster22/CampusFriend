const Post = require("../models/FeedPost");
const User = require("../models/User");

// @desc    Get campus feed
// @route   GET /api/feed
// @access  Private
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { isDeleted: false };
    if (type) query.postType = type;

    const posts = await Post.find(query)
      .populate("author", "fullName username avatar department verified")
      .populate("community", "name slug avatar")
      .populate("comments.author", "fullName username avatar")
      .populate({ path: "originalPost", populate: { path: "author", select: "fullName username avatar verified" } })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      total,
      pages: Math.ceil(total / Number(limit)),
      page: Number(page),
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create a post
// @route   POST /api/feed
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, postType, community, tags, eventDetails } = req.body;

    if (!content?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Post content is required" });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      postType: postType || "general",
      community: community || undefined,
      tags: tags || [],
      eventDetails: eventDetails || undefined,
    });

    const populated = await post.populate([
      { path: "author", select: "fullName username avatar department verified" },
      { path: "community", select: "name slug avatar" },
    ]);

    res.status(201).json({ success: true, post: populated });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Like / unlike a post
// @route   PATCH /api/feed/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Make a post famous (share/retweet)
// @route   PATCH /api/feed/:id/makemefamous
// @access  Private
const makeMeFamous = async (req, res) => {
  try {
    const original = await Post.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: "Original post not found" });
    }

    const sharedPost = await Post.create({
      author: req.user._id,
      content: original.content,
      postType: original.postType,
      community: original.community,
      tags: original.tags,
      eventDetails: original.eventDetails,
      originalPost: original._id,
    });

    original.shareCount = (original.shareCount || 0) + 1;
    await original.save();

    const populated = await sharedPost.populate([
      { path: "author", select: "fullName username avatar department verified" },
      { path: "community", select: "name slug avatar" },
      { path: "originalPost", populate: { path: "author", select: "fullName username avatar verified" } },
    ]);

    res.status(201).json({ success: true, post: populated });
  } catch (error) {
    console.error("MakeMeFamous error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/feed/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Comment content is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.comments.push({ author: req.user._id, content: content.trim() });
    await post.save();

    const updated = await Post.findById(req.params.id).populate(
      "comments.author",
      "fullName username avatar"
    );

    res.status(201).json({
      success: true,
      comment: updated.comments[updated.comments.length - 1],
      commentCount: updated.comments.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete a post
// @route   DELETE /api/feed/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to delete this post" });
    }

    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get upcoming events from feed
// @route   GET /api/feed/events
// @access  Private
const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Post.find({
      postType: "event",
      isDeleted: false,
      "eventDetails.date": { $gte: new Date() },
    })
      .populate("author", "fullName username avatar")
      .sort({ "eventDetails.date": 1 })
      .limit(10);

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getFeed, createPost, toggleLike, addComment, deletePost, getUpcomingEvents, makeMeFamous };