import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BadgeCheck, Heart, MessageCircle, Share2, Bookmark, Plus, X,
  Image as ImageIcon, Video, Smile, ChevronDown, Repeat2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";

/* ─── Stories Bar ──────────────────────────────────────────────────────────── */
function StoriesBar() {
  const { user } = useAuth();
  const [groups, setGroups]       = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyBg,   setStoryBg]   = useState("#0f6485");
  const [mediaUrl,  setMediaUrl]  = useState("");
  const [uploading, setUploading] = useState(false);
  const [active,    setActive]    = useState(null); // { group, storyIndex }
  const fileRef = useRef(null);

  const BG_COLORS = ["#0f6485","#7c3aed","#db2777","#d97706","#16a34a","#dc2626","#0891b2","#1d4ed8"];

  const load = useCallback(async () => {
    try {
      const res = await api.get("/stories");
      setGroups(res.data.groups || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("image", file);
      const res = await api.post("/users/upload", data, { headers: { "Content-Type": "multipart/form-data" } });
      setMediaUrl(res.data.imageUrl);
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const handleCreate = async () => {
    if (!storyText.trim() && !mediaUrl) return;
    try {
      await api.post("/stories", {
        text: storyText.trim(),
        bgColor: storyBg,
        mediaUrl,
        mediaType: mediaUrl ? "image" : "text",
      });
      setShowCompose(false);
      setStoryText(""); setMediaUrl(""); setStoryBg("#0f6485");
      load();
    } catch (e) { console.error(e); }
  };

  const openStory = async (group, idx) => {
    setActive({ group, idx });
    try { await api.patch(`/stories/${group.stories[idx]._id}/view`); } catch(e){}
  };

  const initials = (u) => u?.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";

  return (
    <>
      {/* Horizontal scroll stories strip */}
      <div className="flex items-center gap-3 overflow-x-auto py-3 px-1 scrollbar-none">
        {/* Add story button */}
        <button onClick={() => setShowCompose(true)}
          className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-14 h-14 rounded-full bg-white border-2 border-dashed border-primary-300 flex items-center justify-center text-primary-500 hover:border-primary-500 transition-colors relative overflow-hidden">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover opacity-50" />
              : <span className="text-lg font-bold text-primary-300">{initials(user)}</span>}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary-700 rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs text-gray-500 max-w-[56px] truncate">Your story</span>
        </button>

        {/* Story groups */}
        {groups.map((group, gi) => {
          const hasUnread = group.stories.some(s => !s.viewers?.includes(user._id));
          return (
            <button key={gi} onClick={() => openStory(group, 0)}
              className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-14 h-14 rounded-full p-0.5 ${hasUnread ? "bg-gradient-to-tr from-primary-500 to-accent" : "bg-gray-200"}`}>
                <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                  {group.author.avatar
                    ? <img src={group.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                        {initials(group.author)}
                      </div>}
                </div>
              </div>
              <span className="text-xs text-gray-500 max-w-[56px] truncate">{group.author.fullName?.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Compose story modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            {/* Preview */}
            <div className="relative h-48 flex items-center justify-center rounded-t-2xl overflow-hidden"
              style={{ background: mediaUrl ? "black" : storyBg }}>
              {mediaUrl
                ? <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                : <p className="text-white text-lg font-medium text-center px-4 leading-relaxed">{storyText || "Your story text…"}</p>}
              <button onClick={() => setShowCompose(false)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {!mediaUrl && (
                <textarea value={storyText} onChange={e => setStoryText(e.target.value)}
                  placeholder="What's your story?" rows={2}
                  className="input-base resize-none text-sm" />
              )}

              {/* BG color picker */}
              {!mediaUrl && (
                <div className="flex gap-1.5 flex-wrap">
                  {BG_COLORS.map(c => (
                    <button key={c} onClick={() => setStoryBg(c)}
                      style={{ background: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${storyBg === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""}`} />
                  ))}
                </div>
              )}

              {/* Upload image */}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleUpload(e.target.files[0])} />
                <button onClick={() => fileRef.current.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
                  {uploading ? <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    : <><ImageIcon className="w-4 h-4" /> Add photo</>}
                </button>
                {mediaUrl && (
                  <button onClick={() => setMediaUrl("")}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-red-400 hover:bg-red-50">
                    Remove
                  </button>
                )}
              </div>

              <button onClick={handleCreate} disabled={!storyText.trim() && !mediaUrl}
                className="w-full btn-primary py-2.5 disabled:opacity-50">
                Share Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story viewer */}
      {active && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setActive(null)}>
          <div className="relative w-full max-w-xs sm:max-w-sm h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}>
            {/* Progress bar */}
            <div className="absolute top-4 left-4 right-4 flex gap-1">
              {active.group.stories.map((_, i) => (
                <div key={i} className={`h-0.5 flex-1 rounded-full ${i <= active.idx ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>

            {/* Author */}
            <div className="absolute top-8 left-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 overflow-hidden">
                {active.group.author.avatar
                  ? <img src={active.group.author.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-primary-200 flex items-center justify-center text-primary-700 text-xs font-bold">{initials(active.group.author)}</div>}
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{active.group.author.fullName}</p>
                <p className="text-white/60 text-xs">
                  {formatDistanceToNow(new Date(active.group.stories[active.idx].createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <button onClick={() => setActive(null)}
              className="absolute top-8 right-4 text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {/* Story content */}
            <div className="w-full h-[80vh] rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: active.group.stories[active.idx].bgColor || "#0f6485" }}>
              {active.group.stories[active.idx].mediaUrl
                ? <img src={active.group.stories[active.idx].mediaUrl} alt="" className="w-full h-full object-contain" />
                : <p className="text-white text-xl font-medium text-center px-8 leading-relaxed">
                    {active.group.stories[active.idx].text}
                  </p>}
            </div>

            {/* Prev / Next */}
            {active.idx > 0 && (
              <button onClick={() => setActive(prev => ({ ...prev, idx: prev.idx - 1 }))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white text-lg">‹</button>
            )}
            {active.idx < active.group.stories.length - 1 && (
              <button onClick={() => setActive(prev => ({ ...prev, idx: prev.idx + 1 }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white text-lg">›</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Compose Post ─────────────────────────────────────────────────────────── */
function ComposePost({ onPost }) {
  const { user } = useAuth();
  const [content,   setContent]   = useState("");
  const [postType,  setPostType]  = useState("general");
  const [tags,      setTags]      = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const fileRef = useRef(null);

  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "CF";

  const uploadFile = async (file) => {
    const data = new FormData();
    data.append("image", file);
    const res = await api.post("/users/upload", data, { headers:{"Content-Type":"multipart/form-data"} });
    return res.data.imageUrl;
  };

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadFile));
      setMediaUrls(prev => [...prev, ...urls]);
    } catch(e) { console.error(e); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/feed", {
        content: content.trim(),
        postType,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        mediaUrls,
      });
      onPost(res.data.post);
      setContent(""); setTags(""); setMediaUrls([]); setPostType("general");
    } catch(e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-4 mb-5">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center overflow-hidden shrink-0">
          {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <div className="flex-1 min-w-0">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind, student?"
            rows={content.length > 80 ? 4 : 2}
            className="w-full resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none leading-relaxed"
          />

          {/* Media previews */}
          {mediaUrls.length > 0 && (
            <div className={`mt-2 grid gap-1.5 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-full rounded-lg object-cover max-h-40" />
                  <button onClick={() => setMediaUrls(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 flex-wrap">
            {/* Image upload */}
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} />
            <button onClick={() => fileRef.current.click()} type="button"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50">
              {uploading
                ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <ImageIcon className="w-3.5 h-3.5" />}
              Photo
            </button>

            {/* Post type */}
            <select value={postType} onChange={e => setPostType(e.target.value)}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white">
              {["general","announcement","event","resource","question"].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
              ))}
            </select>

            {/* Tags */}
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400 flex-1 min-w-[120px]" />

            <button onClick={handleSubmit} disabled={submitting || !content.trim()}
              className="ml-auto btn-primary px-4 py-1.5 text-xs disabled:opacity-50 flex items-center gap-1.5">
              {submitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Post Card ────────────────────────────────────────────────────────────── */
function PostCard({ post, onLike, onComment, onMakeMeFamous }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comment,      setComment]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [expanded,     setExpanded]     = useState(false);
  const liked = post.likes?.includes(user._id);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try { await onComment(post._id, comment.trim()); setComment(""); }
    catch(e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const typeColors = {
    announcement: "bg-blue-100 text-blue-700",
    event:        "bg-green-100 text-green-700",
    resource:     "bg-purple-100 text-purple-700",
    question:     "bg-amber-100 text-amber-700",
    general:      "bg-gray-100 text-gray-600",
  };

  const isLong   = post.content?.length > 280;
  const content  = isLong && !expanded ? post.content.slice(0, 280) + "…" : post.content;
  const isRepost = !!post.originalPost;

  return (
    <div className="bg-white rounded-xl shadow-card p-4 sm:p-5 fade-in">
      {/* Repost label */}
      {isRepost && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Repeat2 className="w-3.5 h-3.5" />
          Reposted from <span className="font-medium text-gray-600">@{post.originalPost?.author?.username}</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center text-sm shrink-0 overflow-hidden">
          {post.author?.avatar
            ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
            : post.author?.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{post.author?.fullName}</span>
            {post.author?.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
            {post.author?.department && <span className="text-xs text-gray-400">{post.author.department}</span>}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ml-1 ${typeColors[post.postType] || typeColors.general}`}>
              {post.postType}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          {post.community && <p className="text-xs text-primary-600 mt-0.5">in {post.community.name}</p>}
        </div>
      </div>

      {/* Original post preview if repost */}
      {isRepost && post.originalPost && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
            {post.originalPost.content}
          </p>
        </div>
      )}

      {/* Content */}
      <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      {isLong && (
        <button onClick={() => setExpanded(v => !v)} className="text-xs text-primary-600 mt-1 hover:underline">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {/* Media grid */}
      {post.mediaUrls?.length > 0 && (
        <div className={`mt-3 grid gap-1.5 ${post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.mediaUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full rounded-lg object-cover max-h-72 cursor-pointer" />
          ))}
        </div>
      )}

      {/* Event details */}
      {post.postType === "event" && post.eventDetails?.date && (
        <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
          📅 {new Date(post.eventDetails.date).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
          {post.eventDetails.location && ` · 📍 ${post.eventDetails.location}`}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {post.tags.map(tag => <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>)}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-50">
        <button onClick={() => onLike(post._id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${liked ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-50"}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          <span>{post.likeCount ?? post.likes?.length ?? 0}</span>
        </button>
        <button onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount ?? post.comments?.length ?? 0}</span>
        </button>
        {/* MakeMeFamous */}
        <button onClick={() => onMakeMeFamous(post._id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors ml-auto">
          <Repeat2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">MakeMeFamous</span>
          {post.shareCount > 0 && <span className="text-xs">{post.shareCount}</span>}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 space-y-3">
          {post.comments?.map((c, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0">
                {c.author?.avatar
                  ? <img src={c.author.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  : c.author?.fullName?.[0] || "?"}
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                <span className="text-xs font-semibold text-gray-700">{c.author?.fullName} </span>
                <span className="text-xs text-gray-600">{c.content}</span>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Write a comment…" className="input-base text-xs py-1.5 flex-1" />
            <button type="submit" disabled={submitting || !comment.trim()}
              className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50">Post</button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── Main CampusFeedPage ──────────────────────────────────────────────────── */
export default function CampusFeedPage() {
  const { user }  = useAuth();
  const [tab,      setTab]      = useState("fyp");      // "fyp" | "following"
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const loaderRef = useRef(null);

  const fetchPosts = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const params = { page: p, limit: 20 };
      if (filter !== "all") params.type = filter;
      if (tab === "following") params.following = true;

      const res = await api.get("/feed", { params });
      const newPosts = res.data.posts || [];
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 20);
      if (reset) setPage(2); else setPage(prev => prev + 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab, filter, page]);

  useEffect(() => { fetchPosts(true); }, [tab, filter]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchPosts(false);
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchPosts]);

  const handlePost = (newPost) => setPosts(prev => [newPost, ...prev]);

  const handleLike = async (postId) => {
    try {
      const res = await api.patch(`/feed/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, likes: res.data.liked ? [...(p.likes||[]), user._id] : (p.likes||[]).filter(id => id !== user._id) }
        : p));
    } catch(e) { console.error(e); }
  };

  const handleComment = async (postId, content) => {
    try {
      const res = await api.post(`/feed/${postId}/comment`, { content });
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, comments: [...(p.comments||[]), res.data.comment] }
        : p));
    } catch(e) { console.error(e); }
  };

  const handleMakeMeFamous = async (postId) => {
    try {
      const res = await api.patch(`/feed/${postId}/makemefamous`);
      setPosts(prev => [res.data.post, ...prev]);
    } catch(e) { console.error(e); }
  };

  const FILTERS = ["all","announcement","event","resource","question","general"];

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 pb-6">
      {/* Stories */}
      <StoriesBar />

      {/* FYP / Following tabs */}
      <div className="flex border-b border-gray-200 mb-4 bg-white rounded-xl overflow-hidden shadow-card">
        {[
          { key:"fyp",       label:"For You" },
          { key:"following", label:"Following" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => { setTab(key); setFilter("all"); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
              tab === key ? "border-primary-700 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Compose */}
      <ComposePost onPost={handlePost} />

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto scrollbar-none pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap capitalize flex-shrink-0 ${
              filter === f ? "bg-primary-700 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-primary-300"
            }`}>
            {f === "all" ? "All Posts" : f}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading && posts.length === 0
        ? <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        : posts.length === 0
          ? <div className="text-center py-16 text-gray-400">
              <p className="font-medium">No posts yet</p>
              <p className="text-sm mt-1">{tab === "following" ? "Follow people to see their posts here!" : "Be the first to post!"}</p>
            </div>
          : <div className="space-y-4">
              {posts.map(p => (
                <PostCard key={p._id} post={p} onLike={handleLike} onComment={handleComment} onMakeMeFamous={handleMakeMeFamous} />
              ))}
              {/* Infinite scroll loader */}
              <div ref={loaderRef} className="flex justify-center py-4">
                {loading && hasMore && <div className="w-5 h-5 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" />}
                {!hasMore && posts.length > 0 && <p className="text-xs text-gray-400">You're all caught up!</p>}
              </div>
            </div>
      }
    </div>
  );
}