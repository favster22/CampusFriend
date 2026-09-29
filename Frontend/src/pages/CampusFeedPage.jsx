import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BadgeCheck, Heart, MessageCircle, Repeat2, Bookmark,
  Image as ImageIcon, X, Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";

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
    <div className="flex gap-3 px-4 pt-3 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-500 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
        {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : ini}
      </div>
      <div className="flex-1 min-w-0">
        <textarea id="compose-box" value={content} onChange={e => setContent(e.target.value)}
          placeholder="What is happening on campus?!"
          rows={content.length > 80 ? 4 : 2}
          className="w-full resize-none text-xl bg-transparent focus:outline-none leading-relaxed pt-2"
          style={{ color: "var(--text)" }} />

        {mediaUrls.length > 0 && (
          <div className={`mt-2 grid gap-1 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="w-full rounded-2xl object-cover max-h-72" />
                <button onClick={() => setMediaUrls(p => p.filter((_, j) => j !== i))}
                  className="absolute top-2 left-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 pt-2 border-t flex-wrap" style={{ borderColor: "var(--border)" }}>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />
          <button onClick={() => fileRef.current.click()} type="button" title="Add photo"
            className="p-2 rounded-full text-primary-500 hover:bg-primary-500/10 transition-colors">
            {uploading
              ? <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              : <ImageIcon className="w-5 h-5" />}
          </button>
          <select value={postType} onChange={e => setPostType(e.target.value)}
            className="text-sm rounded-full px-3 py-1.5 focus:outline-none border text-primary-500 font-medium"
            style={{ borderColor: "var(--border)", background: "transparent" }}>
            {["general","announcement","event","resource","question"].map(t => (
              <option key={t} value={t} style={{ color: "#000" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <input value={tags} onChange={e => setTags(e.target.value)}
            placeholder="#tags, comma separated"
            className="text-sm bg-transparent px-2 py-1.5 focus:outline-none flex-1 min-w-[100px]"
            style={{ color: "var(--text)" }} />
          <button onClick={handleSubmit} disabled={submitting || !content.trim()}
            className="ml-auto btn-primary !px-5 disabled:opacity-50 flex items-center gap-1.5">
            {submitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

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
    announcement: "text-primary-500 border-primary-500/40",
    event:        "text-emerald-500 border-emerald-500/40",
    resource:     "text-purple-400 border-purple-400/40",
    question:     "text-amber-500 border-amber-500/40",
  };

  const isLong  = post.content?.length > 280;
  const content = isLong && !expanded ? post.content.slice(0, 280) + "…" : post.content;
  const isRepost = !!post.originalPost;
  const muted = { color: "var(--text-muted)" };
  const ini = post.author?.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  const Action = ({ onClick, icon: Icon, count, hover, active, fill }) => (
    <button onClick={onClick} className={`group flex items-center gap-1 text-[13px] transition-colors ${active ? hover.text : ""} ${hover.groupText}`} style={active ? {} : muted}>
      <span className={`p-2 rounded-full transition-colors ${hover.bg}`}>
        <Icon className={`w-[18px] h-[18px] ${fill && active ? "fill-current" : ""}`} />
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );

  return (
    <article className="px-4 py-3 border-b x-hover fade-in" style={{ borderColor: "var(--border)" }}>
      {isRepost && (
        <div className="flex items-center gap-2 text-[13px] font-bold mb-1 ml-8" style={muted}>
          <Repeat2 className="w-4 h-4" />
          Reposted from @{post.originalPost?.author?.username}
        </div>
      )}

      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-500 font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
          {post.author?.avatar ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover" /> : ini}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap text-[15px] leading-5">
            <span className="font-bold truncate" style={{ color: "var(--text)" }}>{post.author?.fullName}</span>
            {post.author?.verified && <BadgeCheck className="w-[18px] h-[18px] text-primary-500 fill-primary-500/20" />}
            <span style={muted}>@{post.author?.username}</span>
            <span style={muted}>·</span>
            <span style={muted}>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: false })}</span>
            {post.postType && post.postType !== "general" && (
              <span className={`ml-1 text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${typeColors[post.postType] || ""}`}>
                {post.postType}
              </span>
            )}
            {post.onFyp && <span className="text-xs text-amber-500">✨</span>}
          </div>
          {(post.author?.department || post.community) && (
            <p className="text-[13px]" style={muted}>
              {post.author?.department}{post.community ? ` · in ${post.community.name}` : ""}
            </p>
          )}

          {isRepost && post.originalPost && (
            <div className="mt-2 p-3 rounded-2xl border" style={{ borderColor: "var(--border)" }}>
              <p className="text-[15px] whitespace-pre-wrap line-clamp-3" style={{ color: "var(--text)" }}>
                {post.originalPost.content}
              </p>
            </div>
          )}

          <p className="mt-1 text-[15px] leading-5 whitespace-pre-wrap" style={{ color: "var(--text)" }}>{content}</p>
          {isLong && (
            <button onClick={() => setExpanded(v => !v)} className="text-[15px] text-primary-500 hover:underline">
              {expanded ? "Show less" : "Show more"}
            </button>
          )}

          {post.mediaUrls?.length > 0 && (
            <div className={`mt-3 grid gap-0.5 rounded-2xl overflow-hidden border ${post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
              style={{ borderColor: "var(--border)" }}>
              {post.mediaUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="w-full object-cover max-h-[510px]" />
              ))}
            </div>
          )}

          {post.postType === "event" && post.eventDetails?.date && (
            <div className="mt-3 rounded-2xl p-3 text-sm border text-emerald-500" style={{ borderColor: "var(--border)" }}>
              {new Date(post.eventDetails.date).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
              {post.eventDetails.location && ` · ${post.eventDetails.location}`}
            </div>
          )}

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-x-2 mt-2">
              {post.tags.map(t => <span key={t} className="text-[15px] text-primary-500">#{t}</span>)}
            </div>
          )}

          {/* action row */}
          <div className="flex items-center justify-between max-w-[425px] mt-1 -ml-2">
            <Action onClick={() => setShowComments(v => !v)} icon={MessageCircle}
              count={post.commentCount ?? post.comments?.length ?? 0}
              hover={{ bg: "group-hover:bg-primary-500/10", groupText: "hover:text-primary-500", text: "text-primary-500" }} />
            <Action onClick={() => onMakeMeFamous(post._id)} icon={Repeat2} count={post.shareCount || 0}
              hover={{ bg: "group-hover:bg-emerald-500/10", groupText: "hover:text-emerald-500", text: "text-emerald-500" }} />
            <Action onClick={() => onLike(post._id)} icon={Heart} active={liked} fill
              count={post.likeCount ?? post.likes?.length ?? 0}
              hover={{ bg: "group-hover:bg-pink-500/10", groupText: "hover:text-pink-500", text: "text-pink-500" }} />
            <Action icon={Bookmark}
              hover={{ bg: "group-hover:bg-primary-500/10", groupText: "hover:text-primary-500", text: "text-primary-500" }} />
          </div>

          {showComments && (
            <div className="mt-2 space-y-3">
              {post.comments?.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-500 text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
                    {c.author?.avatar ? <img src={c.author.avatar} alt="" className="w-full h-full object-cover" /> : c.author?.fullName?.[0] || "?"}
                  </div>
                  <div className="flex-1 text-[15px]">
                    <span className="font-bold" style={{ color: "var(--text)" }}>{c.author?.fullName} </span>
                    <span style={{ color: "var(--text)" }}>{c.content}</span>
                  </div>
                </div>
              ))}
              <form onSubmit={handleComment} className="flex gap-2 items-center">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Post your reply" className="input-base !py-2 !text-[15px] !rounded-full flex-1" />
                <button type="submit" disabled={submitting || !comment.trim()}
                  className="btn-primary disabled:opacity-50">Reply</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

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
    <div>
      {/* sticky header with tabs */}
      <div className="sticky top-0 md:top-0 z-10 backdrop-blur border-b"
        style={{ background: "color-mix(in srgb, var(--bg) 85%, transparent)", borderColor: "var(--border)" }}>
        <h1 className="hidden md:block px-4 pt-3 text-xl font-bold" style={{ color: "var(--text)" }}>Home</h1>
        <div className="flex">
          {[{ key:"fyp", label:"For you" }, { key:"following", label:"Following" }].map(({ key, label }) => (
            <button key={key} onClick={() => { setTab(key); setFilter("all"); }}
              className={`x-tab ${tab === key ? "x-tab-active" : ""}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <ComposePost onPost={handlePost} />

      {/* Stories */}
      <div className="px-3 border-b" style={{ borderColor: "var(--border)" }}>
        <StoriesBar />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b" style={{ borderColor: "var(--border)" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap capitalize shrink-0 border ${
              filter === f ? "bg-primary-500 text-white border-primary-500" : "hover:bg-primary-500/10"
            }`}
            style={filter === f ? {} : { color: "var(--text)", borderColor: "var(--border)" }}>
            {f === "all" ? "All posts" : f}
          </button>
        ))}
      </div>

      {tab === "fyp" && (
        <p className="text-[13px] px-4 py-2 border-b" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
          Posts appear here after earning enough likes, comments &amp; reposts.
        </p>
      )}

      {/* Feed */}
      {loading && posts.length === 0
        ? <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        : posts.length === 0
          ? <div className="text-center py-16 px-8">
              <p className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>
                {tab === "fyp" ? "No trending posts yet" : "Nothing from people you follow"}
              </p>
              <p className="mt-2 text-[15px]" style={{ color: "var(--text-muted)" }}>
                {tab === "fyp" ? "Posts earn their way here via engagement!" : "Follow more students to see their posts here."}
              </p>
            </div>
          : <div>
              {posts.map(p => (
                <PostCard key={p._id} post={p} onLike={handleLike} onComment={handleComment} onMakeMeFamous={handleMakeMeFamous} />
              ))}
              <div ref={loaderRef} className="flex justify-center py-6">
                {loading && hasMore && <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
                {!hasMore && posts.length > 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>You're all caught up!</p>}
              </div>
            </div>
      }
    </div>
  );
}