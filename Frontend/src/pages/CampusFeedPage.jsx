import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BadgeCheck, Heart, MessageCircle, Repeat2, Bookmark,
  Image as ImageIcon, X, Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";

/* ─── Stories Bar ──────────────────────────────────────────────────────────── */
function StoriesBar() {
  const { user } = useAuth();
  const [groups,      setGroups]      = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [storyText,   setStoryText]   = useState("");
  const [storyBg,     setStoryBg]     = useState("#0f6485");
  const [mediaUrl,    setMediaUrl]    = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [active,      setActive]      = useState(null);
  const fileRef = useRef(null);
  const BG_COLORS = ["#0f6485","#7c3aed","#db2777","#d97706","#16a34a","#dc2626","#0891b2","#1d4ed8"];

  const load = useCallback(async () => {
    try { const r = await api.get("/stories"); setGroups(r.data.groups || []); }
    catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const d = new FormData(); d.append("image", file);
      const r = await api.post("/users/upload", d, { headers: { "Content-Type": "multipart/form-data" } });
      setMediaUrl(r.data.imageUrl);
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const handleCreate = async () => {
    if (!storyText.trim() && !mediaUrl) return;
    try {
      await api.post("/stories", { text: storyText.trim(), bgColor: storyBg, mediaUrl, mediaType: mediaUrl ? "image" : "text" });
      setShowCompose(false); setStoryText(""); setMediaUrl(""); setStoryBg("#0f6485");
      load();
    } catch (e) { console.error(e); }
  };

  const ini = (u) => u?.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";

  return (
    <>
      <div className="flex items-center gap-3 overflow-x-auto py-3 px-1 scrollbar-none mb-1">
        <button onClick={() => setShowCompose(true)} className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-14 h-14 rounded-full bg-white border-2 border-dashed border-primary-300 flex items-center justify-center relative overflow-hidden">
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover opacity-50" />
              : <span className="text-sm font-bold text-primary-300">{ini(user)}</span>}
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary-700 rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs text-gray-500 max-w-[56px] truncate">Your story</span>
        </button>
        {groups.map((g, i) => {
          const hasNew = g.stories.some(s => !s.viewers?.includes(user._id));
          return (
            <button key={i} onClick={() => setActive({ group: g, idx: 0 })} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-14 h-14 rounded-full p-0.5 ${hasNew ? "bg-gradient-to-tr from-primary-500 to-accent" : "bg-gray-200"}`}>
                <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                  {g.author.avatar
                    ? <img src={g.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">{ini(g.author)}</div>}
                </div>
              </div>
              <span className="text-xs text-gray-500 max-w-[56px] truncate">{g.author.fullName?.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Compose story modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="relative h-44 flex items-center justify-center"
              style={{ background: mediaUrl ? "black" : storyBg }}>
              {mediaUrl
                ? <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                : <p className="text-white text-lg font-medium text-center px-6">{storyText || "Your story text…"}</p>}
              <button onClick={() => setShowCompose(false)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {!mediaUrl && (
                <textarea value={storyText} onChange={e => setStoryText(e.target.value)}
                  placeholder="What's your story?" rows={2} className="input-base resize-none text-sm" />
              )}
              {!mediaUrl && (
                <div className="flex gap-1.5 flex-wrap">
                  {BG_COLORS.map(c => (
                    <button key={c} onClick={() => setStoryBg(c)} style={{ background: c }}
                      className={`w-6 h-6 rounded-full ${storyBg === c ? "ring-2 ring-offset-1 ring-gray-500 scale-110" : ""}`} />
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleUpload(e.target.files[0])} />
                <button onClick={() => fileRef.current.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary-400 transition-colors">
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    : <><ImageIcon className="w-4 h-4" /> Add photo</>}
                </button>
                {mediaUrl && <button onClick={() => setMediaUrl("")} className="px-3 text-sm text-red-400 border border-gray-200 rounded-xl">Remove</button>}
              </div>
              <button onClick={handleCreate} disabled={!storyText.trim() && !mediaUrl}
                className="w-full btn-primary py-2.5 disabled:opacity-50">Share Story</button>
            </div>
          </div>
        </div>
      )}

      {/* Story viewer */}
      {active && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setActive(null)}>
          <div className="relative w-full max-w-xs h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 left-4 right-4 flex gap-1">
              {active.group.stories.map((_, i) => (
                <div key={i} className={`h-0.5 flex-1 rounded-full ${i <= active.idx ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
            <div className="absolute top-8 left-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100">
                {active.group.author.avatar
                  ? <img src={active.group.author.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-primary-700 text-xs font-bold">{ini(active.group.author)}</div>}
              </div>
              <p className="text-white text-xs font-semibold">{active.group.author.fullName}</p>
            </div>
            <button onClick={() => setActive(null)} className="absolute top-8 right-4 text-white/70"><X className="w-5 h-5" /></button>
            <div className="w-full h-[80vh] rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: active.group.stories[active.idx].bgColor || "#0f6485" }}>
              {active.group.stories[active.idx].mediaUrl
                ? <img src={active.group.stories[active.idx].mediaUrl} alt="" className="w-full h-full object-contain" />
                : <p className="text-white text-xl font-medium text-center px-8">{active.group.stories[active.idx].text}</p>}
            </div>
            {active.idx > 0 && (
              <button onClick={() => setActive(p => ({ ...p, idx: p.idx - 1 }))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white text-xl">‹</button>
            )}
            {active.idx < active.group.stories.length - 1 && (
              <button onClick={() => setActive(p => ({ ...p, idx: p.idx + 1 }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white text-xl">›</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Compose Post ──────────────────────────────────────────────────────────── */
function ComposePost({ onPost }) {
  const { user } = useAuth();
  const [content,    setContent]    = useState("");
  const [postType,   setPostType]   = useState("general");
  const [tags,       setTags]       = useState("");
  const [mediaUrls,  setMediaUrls]  = useState([]);
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const ini = user?.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "CF";

  const uploadFile = async (file) => {
    const d = new FormData(); d.append("image", file);
    const r = await api.post("/users/upload", d, { headers: { "Content-Type": "multipart/form-data" } });
    return r.data.imageUrl;
  };

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try { const urls = await Promise.all(Array.from(files).map(uploadFile)); setMediaUrls(p => [...p, ...urls]); }
    catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/feed", {
        content: content.trim(), postType,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        mediaUrls,
      });
      onPost(res.data.post);
      setContent(""); setTags(""); setMediaUrls([]); setPostType("general");
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-4 mb-4">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center overflow-hidden shrink-0">
          {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : ini}
        </div>
        <div className="flex-1 min-w-0">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Share something with your campus…"
            rows={content.length > 80 ? 4 : 2}
            className="w-full resize-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none leading-relaxed" />

          {mediaUrls.length > 0 && (
            <div className={`mt-2 grid gap-1.5 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-full rounded-lg object-cover max-h-40" />
                  <button onClick={() => setMediaUrls(p => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 flex-wrap">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} />
            <button onClick={() => fileRef.current.click()} type="button"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              {uploading
                ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <ImageIcon className="w-3.5 h-3.5" />}
              Photo
            </button>
            <select value={postType} onChange={e => setPostType(e.target.value)}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white">
              {["general","announcement","event","resource","question"].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="Tags (comma sep.)"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400 flex-1 min-w-[100px]" />
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

/* ─── Post Card ─────────────────────────────────────────────────────────────── */
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
    catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const typeColors = {
    announcement: "bg-blue-100 text-blue-700",
    event:        "bg-green-100 text-green-700",
    resource:     "bg-purple-100 text-purple-700",
    question:     "bg-amber-100 text-amber-700",
    general:      "bg-gray-100 text-gray-600",
  };

  const isLong  = post.content?.length > 280;
  const content = isLong && !expanded ? post.content.slice(0, 280) + "…" : post.content;
  const isRepost = !!post.originalPost;

  return (
    <div className="bg-white rounded-xl shadow-card p-4 sm:p-5 fade-in">
      {isRepost && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2.5">
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
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${typeColors[post.postType] || typeColors.general}`}>
              {post.postType}
            </span>
            {post.onFyp && (
              <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">✨ FYP</span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          {post.community && <p className="text-xs text-primary-600 mt-0.5">in {post.community.name}</p>}
        </div>
      </div>

      {/* Original post preview for reposts */}
      {isRepost && post.originalPost && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
            {post.originalPost.content}
          </p>
        </div>
      )}

      <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      {isLong && (
        <button onClick={() => setExpanded(v => !v)} className="text-xs text-primary-600 mt-1 hover:underline">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {post.mediaUrls?.length > 0 && (
        <div className={`mt-3 grid gap-1.5 ${post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.mediaUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full rounded-lg object-cover max-h-72" />
          ))}
        </div>
      )}

      {post.postType === "event" && post.eventDetails?.date && (
        <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
          📅 {new Date(post.eventDetails.date).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
          {post.eventDetails.location && ` · 📍 ${post.eventDetails.location}`}
        </div>
      )}

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {post.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{t}</span>)}
        </div>
      )}

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
        <button onClick={() => onMakeMeFamous(post._id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors ml-auto">
          <Repeat2 className="w-4 h-4" />
          {post.shareCount > 0 && <span className="text-xs">{post.shareCount}</span>}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3">
          {post.comments?.map((c, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                {c.author?.avatar ? <img src={c.author.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : c.author?.fullName?.[0] || "?"}
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

/* ─── Main CampusFeedPage ─────────────────────────────────────────────────── */
export default function CampusFeedPage() {
  const { user }    = useAuth();
  const [tab,       setTab]       = useState("fyp");     // "fyp" | "following"
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);
  const loaderRef   = useRef(null);
  const fetchingRef = useRef(false);

  const fetchPosts = useCallback(async (reset = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const params = { page: p, limit: 20 };
      if (filter !== "all") params.type = filter;
      // Use mode param for FYP vs Following
      params.mode = tab === "following" ? "following" : "fyp";

      const res = await api.get("/feed", { params });
      const newPosts = res.data.posts || [];
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 20);
      if (reset) setPage(2); else setPage(prev => prev + 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); fetchingRef.current = false; }
  }, [tab, filter, page]);

  useEffect(() => { setPage(1); fetchPosts(true); }, [tab, filter]);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchPosts(false);
    }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading]);

  const handlePost        = (p)         => setPosts(prev => [p, ...prev]);
  const handleLike        = async (id)  => {
    try {
      const res = await api.patch(`/feed/${id}/like`);
      setPosts(prev => prev.map(p => p._id === id
        ? { ...p, likes: res.data.liked ? [...(p.likes||[]), user._id] : (p.likes||[]).filter(x => x !== user._id) }
        : p));
    } catch (e) { console.error(e); }
  };
  const handleComment     = async (id, content) => {
    try {
      const res = await api.post(`/feed/${id}/comment`, { content });
      setPosts(prev => prev.map(p => p._id === id
        ? { ...p, comments: [...(p.comments||[]), res.data.comment] }
        : p));
    } catch (e) { console.error(e); }
  };
  const handleMakeMeFamous = async (id) => {
    try {
      const res = await api.patch(`/feed/${id}/makemefamous`);
      // The repost goes to the reposter's profile, NOT to the feed list here
      // Just update shareCount on the original post visually
      setPosts(prev => prev.map(p => p._id === id
        ? { ...p, shareCount: (p.shareCount || 0) + 1 }
        : p));
    } catch (e) { console.error(e); }
  };

  const FILTERS = ["all","announcement","event","resource","question","general"];

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 pb-6">
      {/* Stories */}
      <StoriesBar />

      {/* FYP / Following tabs */}
      <div className="flex border-b border-gray-200 mb-4 bg-white rounded-xl overflow-hidden shadow-card">
        {[{ key:"fyp", label:"For You ✨" }, { key:"following", label:"Following" }].map(({ key, label }) => (
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
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap capitalize shrink-0 ${
              filter === f ? "bg-primary-700 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-primary-300"
            }`}>
            {f === "all" ? "All Posts" : f}
          </button>
        ))}
      </div>

      {/* FYP note */}
      {tab === "fyp" && (
        <p className="text-xs text-gray-400 mb-3 text-center">
          ✨ Posts appear here after earning enough likes, comments &amp; reposts
        </p>
      )}

      {/* Feed */}
      {loading && posts.length === 0
        ? <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        : posts.length === 0
          ? <div className="text-center py-16 text-gray-400">
              <p className="font-medium text-lg">{tab === "fyp" ? "🌟" : "👥"}</p>
              <p className="font-medium mt-1">{tab === "fyp" ? "No trending posts yet" : "No posts from people you follow"}</p>
              <p className="text-sm mt-1">{tab === "fyp" ? "Posts earn their way here via engagement!" : "Follow more students to see their posts here."}</p>
            </div>
          : <div className="space-y-4">
              {posts.map(p => (
                <PostCard key={p._id} post={p} onLike={handleLike} onComment={handleComment} onMakeMeFamous={handleMakeMeFamous} />
              ))}
              <div ref={loaderRef} className="flex justify-center py-4">
                {loading && hasMore && <div className="w-5 h-5 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" />}
                {!hasMore && posts.length > 0 && <p className="text-xs text-gray-400">You're all caught up!</p>}
              </div>
            </div>
      }
    </div>
  );
}