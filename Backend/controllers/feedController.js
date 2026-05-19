const Post         = require("../models/FeedPost");
const User         = require("../models/User");
const Notification = require("../models/Notification");

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/feed
   Modes:
     ?mode=fyp        → algorithmically ranked posts that earned onFyp=true
                         (excludes reposts, excludes posts by people you muted)
     ?mode=following  → posts (NOT reposts) from people you follow, chronological
     ?author=<userId> → all posts (original + reposts) by that author — used for
                         profile page.  Caller passes ?reposts=true to get only
                         reposts, omit it to get only originals.
   The FYP never shows reposts and never shows a post that hasn't earned fypScore>=5.
───────────────────────────────────────────────────────────────────────────── */
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20, mode, author, reposts, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    /* ── Profile page: posts for a specific author ─────────────────────── */
    if (author) {
      const query = { author, isDeleted: false };
      if (reposts === "true") {
        // Repost tab: only documents that have originalPost set
        query.originalPost = { $exists: true, $ne: null };
      } else {
        // Posts tab: only original posts (no originalPost field)
        query.originalPost = { $exists: false };
      }
      if (type) query.postType = type;

      const posts = await Post.find(query)
        .populate("author", "fullName username avatar department verified")
        .populate("community", "name slug avatar")
        .populate("comments.author", "fullName username avatar")
        .populate({
          path: "originalPost",
          populate: { path: "author", select: "fullName username avatar verified" },
        })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip);

      const total = await Post.countDocuments(query);
      return res.json({ success: true, posts, total, page: Number(page) });
    }

    /* ── Following feed ────────────────────────────────────────────────── */
    if (mode === "following") {
      const me = await User.findById(req.user._id).select("following");
      const ids = [...(me.following || [])];
      // Following feed shows original posts only from people I follow, newest first
      const query = {
        isDeleted: false,
        author:    { $in: ids },
        originalPost: { $exists: false },   // no reposts in following feed
      };
      if (type) query.postType = type;

      const posts = await Post.find(query)
        .populate("author",   "fullName username avatar department verified")
        .populate("community","name slug avatar")
        .populate("comments.author","fullName username avatar")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip);

      const total = await Post.countDocuments(query);
      return res.json({ success: true, posts, total, page: Number(page) });
    }

    /* ── FYP (default) ────────────────────────────────────────────────── */
    // Only posts with onFyp=true, no reposts, ranked by fypScore desc then recency
    const query = {
      isDeleted:    false,
      onFyp:        true,
      originalPost: { $exists: false },   // never show reposts on FYP
    };
    if (type) query.postType = type;

    const posts = await Post.find(query)
      .populate("author",   "fullName username avatar department verified")
      .populate("community","name slug avatar")
      .populate("comments.author","fullName username avatar")
      .sort({ isPinned: -1, fypScore: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    // Increment viewCount in background (fire-and-forget)
    const ids = posts.map(p => p._id);
    Post.updateMany({ _id: { $in: ids } }, { $inc: { viewCount: 1 } }).exec().catch(() => {});

    const total = await Post.countDocuments(query);
    return res.json({ success: true, posts, total, page: Number(page) });

  } catch (e) {
    console.error("getFeed:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/feed/search
───────────────────────────────────────────────────────────────────────────── */
const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ success: false, message: "Min 2 characters" });

    const posts = await Post.find({
      isDeleted:    false,
      originalPost: { $exists: false },
      $or: [
        { content: { $regex: q, $options: "i" } },
        { tags:    { $in: [new RegExp(q, "i")] } },
      ],
    })
      .populate("author","fullName username avatar verified")
      .sort({ fypScore: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, posts });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/feed  — create original post
   Newly created posts are NOT on FYP until they earn enough engagement.
───────────────────────────────────────────────────────────────────────────── */
const createPost = async (req, res) => {
  try {
    const { content, postType, community, tags, eventDetails, mediaUrls } = req.body;
    if (!content?.trim())
      return res.status(400).json({ success: false, message: "Content is required" });

    const post = await Post.create({
      author:    req.user._id,
      content:   content.trim(),
      postType:  postType || "general",
      community: community || undefined,
      tags:      tags || [],
      mediaUrls: mediaUrls || [],
      eventDetails: eventDetails || undefined,
      fypScore: 0,
      onFyp:    false,   // starts off FYP — earns its way in via engagement
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    const populated = await post.populate([
      { path: "author",    select: "fullName username avatar department verified" },
      { path: "community", select: "name slug avatar" },
    ]);

    res.status(201).json({ success: true, post: populated });
  } catch (e) {
    console.error("createPost:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   Internal helper — recalc score and persist
───────────────────────────────────────────────────────────────────────────── */
const _updateScore = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) return;
  post.recalcFypScore();
  await post.save();
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /api/feed/:id/like
───────────────────────────────────────────────────────────────────────────── */
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const alreadyLiked = post.likes.map(String).includes(String(req.user._id));
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => String(id) !== String(req.user._id));
    } else {
      post.likes.push(req.user._id);
      if (String(post.author) !== String(req.user._id)) {
        const author = await User.findById(post.author).select("notificationPrefs");
        if (author?.notificationPrefs?.postLike !== false) {
          await Notification.create({
            recipient: post.author, sender: req.user._id,
            type: "like", post: post._id,
            message: `${req.user.fullName} liked your post`,
          });
        }
      }
    }

    // Recalc FYP score
    post.recalcFypScore();
    await post.save();

    res.json({ success: true, liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /api/feed/:id/makemefamous
   Creates a repost document linked to the original.
   The REPOST is NOT placed on FYP (onFyp=false, originalPost set).
   The ORIGINAL post gets +5 shareScore → may cross FYP threshold.
───────────────────────────────────────────────────────────────────────────── */
const makeMeFamous = async (req, res) => {
  try {
    const original = await Post.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: "Post not found" });

    // Create the repost — explicitly NOT on FYP
    const repost = await Post.create({
      author:       req.user._id,
      content:      original.content,
      postType:     original.postType,
      community:    original.community,
      tags:         original.tags,
      mediaUrls:    original.mediaUrls,
      eventDetails: original.eventDetails,
      originalPost: original._id,   // marks it as a repost
      fypScore: 0,
      onFyp:    false,              // reposts NEVER appear on FYP
    });

    // Boost original's score (share is worth 5 points)
    original.shareCount = (original.shareCount || 0) + 1;
    original.recalcFypScore();
    await original.save();

    // Notify original author
    if (String(original.author) !== String(req.user._id)) {
      const author = await User.findById(original.author).select("notificationPrefs");
      if (author?.notificationPrefs?.postLike !== false) {
        await Notification.create({
          recipient: original.author, sender: req.user._id,
          type: "repost", post: original._id,
          message: `${req.user.fullName} reposted your post`,
        });
      }
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    const populated = await repost.populate([
      { path: "author",    select: "fullName username avatar department verified" },
      { path: "community", select: "name slug avatar" },
      { path: "originalPost",
        populate: { path: "author", select: "fullName username avatar verified" } },
    ]);

    res.status(201).json({ success: true, post: populated });
  } catch (e) {
    console.error("makeMeFamous:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/feed/:id/comment
───────────────────────────────────────────────────────────────────────────── */
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim())
      return res.status(400).json({ success: false, message: "Comment required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.comments.push({ author: req.user._id, content: content.trim() });
    post.recalcFypScore();   // comments boost score
    await post.save();

    // Notify
    if (String(post.author) !== String(req.user._id)) {
      const author = await User.findById(post.author).select("notificationPrefs");
      if (author?.notificationPrefs?.postComment !== false) {
        await Notification.create({
          recipient: post.author, sender: req.user._id,
          type: "comment", post: post._id,
          message: `${req.user.fullName} commented on your post`,
        });
      }
    }

    const updated = await Post.findById(req.params.id)
      .populate("comments.author","fullName username avatar");

    res.status(201).json({
      success: true,
      comment: updated.comments[updated.comments.length - 1],
      commentCount: updated.comments.length,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /api/feed/:id
───────────────────────────────────────────────────────────────────────────── */
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (String(post.author) !== String(req.user._id))
      return res.status(403).json({ success: false, message: "Not authorized" });

    post.isDeleted = true;
    post.onFyp     = false;
    await post.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/feed/events
───────────────────────────────────────────────────────────────────────────── */
const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Post.find({
      postType: "event", isDeleted: false,
      "eventDetails.date": { $gte: new Date() },
    })
      .populate("author","fullName username avatar verified")
      .sort({ "eventDetails.date": 1 })
      .limit(10);

    res.json({ success: true, events });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/feed/analytics  — stats for current user
───────────────────────────────────────────────────────────────────────────── */
const getAnalytics = async (req, res) => {
  try {
    const uid = req.user._id;

    // All original posts by this user
    const posts = await Post.find({ author: uid, isDeleted: false, originalPost: { $exists: false } })
      .select("likes comments shareCount viewCount fypScore onFyp createdAt postType content");

    const reposts = await Post.countDocuments({
      author: uid, isDeleted: false, originalPost: { $exists: true },
    });

    const totalLikes    = posts.reduce((s, p) => s + p.likes.length, 0);
    const totalComments = posts.reduce((s, p) => s + p.comments.length, 0);
    const totalShares   = posts.reduce((s, p) => s + (p.shareCount || 0), 0);
    const totalViews    = posts.reduce((s, p) => s + (p.viewCount || 0), 0);
    const onFypCount    = posts.filter(p => p.onFyp).length;

    // Top 5 posts by fypScore
    const topPosts = [...posts]
      .sort((a, b) => b.fypScore - a.fypScore)
      .slice(0, 5)
      .map(p => ({
        _id:      p._id,
        content:  p.content.slice(0, 80),
        likes:    p.likes.length,
        comments: p.comments.length,
        shares:   p.shareCount || 0,
        views:    p.viewCount  || 0,
        fypScore: p.fypScore,
        onFyp:    p.onFyp,
        postType: p.postType,
        createdAt:p.createdAt,
      }));

    // Posts per day last 14 days
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000);
    const recentPosts = posts.filter(p => p.createdAt >= twoWeeksAgo);
    const byDay = {};
    recentPosts.forEach(p => {
      const day = p.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    // Likes per day last 14 days (approximate from post createdAt)
    const likesByDay = {};
    recentPosts.forEach(p => {
      const day = p.createdAt.toISOString().slice(0, 10);
      likesByDay[day] = (likesByDay[day] || 0) + p.likes.length;
    });

    const user = await User.findById(uid).select("followersCount followingCount postsCount");

    res.json({
      success: true,
      summary: {
        totalPosts:    posts.length,
        totalReposts:  reposts,
        totalLikes,
        totalComments,
        totalShares,
        totalViews,
        onFypCount,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        engagementRate: posts.length > 0
          ? ((totalLikes + totalComments + totalShares) / Math.max(totalViews, 1) * 100).toFixed(1)
          : "0.0",
      },
      topPosts,
      byDay,
      likesByDay,
    });
  } catch (e) {
    console.error("getAnalytics:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getFeed, searchPosts, createPost, toggleLike,
  makeMeFamous, addComment, deletePost, getUpcomingEvents, getAnalytics,
};