import React, { useState, useEffect } from "react";
import { BadgeCheck, Heart, MessageCircle, Share2, Bookmark, Plus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";

function PostCard({ post, onLike, onComment, onMakeMeFamous }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const liked = post.likes?.includes(user._id);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await onComment(post._id, comment.trim());
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const typeColors = {
    announcement: "bg-blue-100 text-blue-700",
    event: "bg-green-100 text-green-700",
    resource: "bg-purple-100 text-purple-700",
    question: "bg-amber-100 text-amber-700",
    general: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-5 fade-in">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center text-sm shrink-0 overflow-hidden">
          {post.author?.avatar
            ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
            : post.author?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{post.author?.fullName}</span>
            {post.author?.verified && (
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            )}
            {post.author?.department && (
              <span className="text-xs text-gray-400">{post.author.department}</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${typeColors[post.postType] || typeColors.general}`}>
              {post.postType}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          {post.community && (
            <p className="text-xs text-primary-600 mt-0.5">in {post.community.name}</p>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {post.originalPost && (
        <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Made me famous from {post.originalPost.author?.fullName}</p>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.originalPost.content}
          </div>
        </div>
      )}

      {post.postType === "event" && post.eventDetails?.date && (
        <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
          📅 {new Date(post.eventDetails.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          {post.eventDetails.location && ` · 📍 ${post.eventDetails.location}`}
        </div>
      )}

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-50">
        <button
          onClick={() => onLike(post._id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${liked ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          <span>{post.likeCount || post.likes?.length || 0}</span>
        </button>
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount || post.comments?.length || 0}</span>
        </button>
        <button
          onClick={() => onMakeMeFamous(post._id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors ml-auto"
        >
          <Share2 className="w-4 h-4" />
          <span>MakeMeFamous</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
      {post.shareCount > 0 && (
        <p className="mt-2 text-xs text-gray-400">{post.shareCount} people have made this famous</p>
      )}

      {showComments && (
        <div className="mt-3 space-y-3">
          {post.comments?.map((c, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0">
                {c.author?.fullName?.[0] || "?"}
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                <span className="text-xs font-semibold text-gray-700">{c.author?.fullName} </span>
                <span className="text-xs text-gray-600">{c.content}</span>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a comment…"
              className="input-base text-xs py-1.5"
            />
            <button type="submit" disabled={submitting || !comment.trim()} className="btn-primary px-3 py-1.5 text-xs">Post</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CampusFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState({ content: "", postType: "general", tags: "" });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const params = filter !== "all" ? { type: filter } : {};
        const res = await api.get("/feed", { params });
        setPosts(res.data.posts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!compose.content.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        content: compose.content,
        postType: compose.postType,
        tags: compose.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      const res = await api.post("/feed", payload);
      setPosts(prev => [res.data.post, ...prev]);
      setCompose({ content: "", postType: "general", tags: "" });
      setShowCompose(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.patch(`/feed/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, likes: res.data.liked ? [...(p.likes || []), user._id] : (p.likes || []).filter(id => id !== user._id) }
        : p
      ));
    } catch (e) { console.error(e); }
  };

  const handleComment = async (postId, content) => {
    try {
      const res = await api.post(`/feed/${postId}/comment`, { content });
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, comments: [...(p.comments || []), res.data.comment] }
        : p
      ));
    } catch (e) { console.error(e); }
  };

  const handleMakeMeFamous = async (postId) => {
    try {
      const res = await api.patch(`/feed/${postId}/makemefamous`);
      setPosts(prev => [res.data.post, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const FILTERS = ["all", "announcement", "event", "resource", "question", "general"];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-bold text-xl text-gray-800">Campus Feed</h1>
        <button onClick={() => setShowCompose(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${filter === f ? "bg-primary-700 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-primary-300"}`}>
            {f === "all" ? "All Posts" : f}
          </button>
        ))}
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="bg-white rounded-xl shadow-card p-5 mb-5 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-gray-800">Create Post</h3>
            <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handlePost} className="space-y-3">
            <textarea
              value={compose.content}
              onChange={e => setCompose(p => ({ ...p, content: e.target.value }))}
              placeholder="What's on your mind, student?"
              rows={4}
              className="input-base resize-none"
              required
            />
            <div className="flex gap-3">
              <select
                value={compose.postType}
                onChange={e => setCompose(p => ({ ...p, postType: e.target.value }))}
                className="input-base flex-1 text-xs"
              >
                <option value="general">General</option>
                <option value="announcement">Announcement</option>
                <option value="event">Event</option>
                <option value="resource">Resource</option>
                <option value="question">Question</option>
              </select>
              <input
                value={compose.tags}
                onChange={e => setCompose(p => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (comma-separated)"
                className="input-base flex-1 text-xs"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting || !compose.content.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                {submitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      {loading
        ? <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
        : posts.length === 0
          ? <div className="text-center py-16 text-gray-400"><p className="font-medium">No posts yet</p><p className="text-sm mt-1">Be the first to post!</p></div>
          : <div className="space-y-4">
              {posts.map(p => <PostCard key={p._id} post={p} onLike={handleLike} onComment={handleComment} onMakeMeFamous={handleMakeMeFamous} />)}
            </div>
      }
    </div>
  );
}