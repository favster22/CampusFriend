import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BadgeCheck, Edit3, Github, Linkedin, Twitter,
  MessageSquare, Users, UserPlus, UserMinus, Bell, BellOff,
  Share2, Heart, MessageCircle, Grid3X3, X, Camera,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";

/* ── Avatar helper ──────────────────────────────────────────────────────────── */
function Avatar({ user, size = 20, className = "" }) {
  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";
  return (
    <div style={{ width: size, height: size }}
      className={`rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
      {user?.avatar
        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        : <span style={{ fontSize: size * 0.38 }}>{initials}</span>}
    </div>
  );
}

/* ── Followers / Following modal ─────────────────────────────────────────────── */
function FollowListModal({ title, list, hidden, onClose, currentUserId }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {hidden ? (
            <p className="text-center text-sm text-gray-400 py-8">This list is private</p>
          ) : list.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No one here yet</p>
          ) : list.map(u => (
            <button key={u._id}
              onClick={() => { navigate(`/profile/${u.username}`); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left">
              <Avatar user={u} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName}</p>
                  {u.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 truncate">@{u.username}</p>
              </div>
              {u._id !== currentUserId && (
                <span className="text-xs text-primary-700 font-medium shrink-0">View</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Single post card (compact, profile style) ───────────────────────────────── */
function ProfilePostCard({ post, isOwn, onDelete }) {
  const { user } = useAuth();
  const [liked,    setLiked]    = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");

  const handleLike = async () => {
    try {
      const res = await api.patch(`/feed/${post._id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch (e) { console.error(e); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await api.post(`/feed/${post._id}/comment`, { content: comment.trim() });
      setComment("");
      setShowComments(false);
    } catch (e) { console.error(e); }
  };

  const isRepost = !!post.originalPost;

  return (
    <div className="bg-white rounded-xl shadow-card p-4 fade-in">
      {/* Repost label */}
      {isRepost && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Share2 className="w-3.5 h-3.5" />
          <span>Reposted from <span className="font-medium text-gray-600">@{post.originalPost?.author?.username}</span></span>
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start gap-3">
        <Avatar user={post.author} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{post.author?.fullName}</span>
            {post.author?.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
            <span className="text-xs text-gray-400 ml-auto">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-gray-400">@{post.author?.username}</p>
        </div>
        {isOwn && (
          <button onClick={() => onDelete(post._id)}
            className="text-gray-300 hover:text-red-400 transition-colors ml-1 mt-0.5 shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Original post (if repost) */}
      {isRepost && post.originalPost && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
            {post.originalPost.content}
          </p>
        </div>
      )}

      {/* Content */}
      <p className="mt-2.5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <div className={`mt-3 grid gap-1.5 ${post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.mediaUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full rounded-lg object-cover max-h-60" />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {post.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{t}</span>)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-gray-50">
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${liked ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-50"}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          <span className="text-xs">{likeCount}</span>
        </button>
        <button onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">{post.comments?.length || 0}</span>
        </button>
        {isRepost || (
          <button onClick={async () => { try { await api.patch(`/feed/${post._id}/makemefamous`); } catch(e){console.error(e);} }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors ml-auto">
            <Share2 className="w-4 h-4" />
            <span className="text-xs">{post.shareCount || 0}</span>
          </button>
        )}
      </div>

      {showComments && (
        <form onSubmit={handleComment} className="flex gap-2 mt-2">
          <input value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Add a comment…" className="input-base text-xs py-1.5 flex-1" />
          <button type="submit" disabled={!comment.trim()} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60">Post</button>
        </form>
      )}
    </div>
  );
}

/* ── Main ProfilePage ─────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { username }           = useParams();
  const navigate               = useNavigate();
  const { user: me, updateUser } = useAuth();

  const [profile,         setProfile]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [editing,         setEditing]         = useState(false);
  const [form,            setForm]            = useState({});
  const [saving,          setSaving]          = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [following,       setFollowing]       = useState(false);
  const [followLoading,   setFollowLoading]   = useState(false);
  const [notifying,       setNotifying]       = useState(false);
  const [posts,           setPosts]           = useState([]);
  const [postsLoading,    setPostsLoading]    = useState(true);
  const [activeTab,       setActiveTab]       = useState("posts"); // posts | reposts
  const [showFollowers,   setShowFollowers]   = useState(false);
  const [showFollowing,   setShowFollowing]   = useState(false);
  const [followersList,   setFollowersList]   = useState([]);
  const [followingList,   setFollowingList]   = useState([]);
  const [followingHidden, setFollowingHidden] = useState(false);

  const isMe = me?.username === username;

  // Load profile
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${username}`);
        const u = res.data.user;
        setProfile(u);
        setFollowing(u.followers?.some(f => (f._id || f) === me?._id) || false);
        setNotifying(me?.notifyUsers?.includes(u._id) || false);
        if (isMe) setForm({
          fullName:    u.fullName,
          bio:         u.bio || "",
          department:  u.department || "",
          skills:      u.skills?.join(", ") || "",
          socialLinks: u.socialLinks || {},
          avatar:      u.avatar || "",
          header:      u.header || "",
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [username, isMe]);

  // Load user's posts
  useEffect(() => {
    if (!profile) return;
    setPostsLoading(true);
    api.get("/feed", { params: { author: profile._id, limit: 50 } })
      .then(r => setPosts(r.data.posts || []))
      .catch(console.error)
      .finally(() => setPostsLoading(false));
  }, [profile]);

  const uploadImage = async (file) => {
    const data = new FormData();
    data.append("image", file);
    const res = await api.post("/users/upload", data, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data.imageUrl;
  };

  const handleImageChange = async (field, file) => {
    if (!file) return;
    const setter = field === "avatar" ? setUploadingAvatar : setUploadingHeader;
    setter(true);
    try {
      const url = await uploadImage(file);
      setForm(p => ({ ...p, [field]: url }));
    } catch (e) { console.error(e); }
    finally { setter(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch("/users/profile", {
        ...form,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      });
      setProfile(res.data.user);
      updateUser(res.data.user);
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await api.patch(`/users/${username}/follow`);
      setFollowing(res.data.following);
      setProfile(prev => ({
        ...prev,
        followersCount: res.data.following
          ? (prev.followersCount || 0) + 1
          : Math.max((prev.followersCount || 0) - 1, 0),
      }));
    } catch (e) { console.error(e); }
    finally { setFollowLoading(false); }
  };

  const handleNotify = async () => {
    try {
      const res = await api.patch(`/users/${username}/notify`);
      setNotifying(res.data.notifying);
    } catch (e) { console.error(e); }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/feed/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (e) { console.error(e); }
  };

  const loadFollowers = async () => {
    try {
      const res = await api.get(`/users/${username}/followers`);
      setFollowersList(res.data.followers || []);
    } catch (e) { console.error(e); }
    setShowFollowers(true);
  };

  const loadFollowing = async () => {
    try {
      const res = await api.get(`/users/${username}/following`);
      setFollowingHidden(res.data.hidden || false);
      setFollowingList(res.data.following || []);
    } catch (e) { console.error(e); }
    setShowFollowing(true);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!profile) return <div className="text-center py-24 text-gray-400 font-medium">User not found</div>;

  const initials      = profile.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const isVerified    = profile.verified === true;
  const followersCount = profile.followersCount ?? 0;
  const followingCount = profile.followingCount ?? 0;
  const postsCount    = profile.postsCount ?? posts.filter(p => !p.originalPost).length;

  // Filter posts/reposts for tabs
  const ownPosts   = posts.filter(p => !p.originalPost);
  const reposts    = posts.filter(p =>  p.originalPost);
  const displayed  = activeTab === "posts" ? ownPosts : reposts;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* ── Profile Card ── */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
        {/* Header / Banner */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary-700 to-primary-500"
          style={profile.header ? { backgroundImage:`url(${profile.header})`, backgroundSize:"cover", backgroundPosition:"center" } : {}}>
          {isMe && editing && (
            <label className="absolute bottom-2 right-2 bg-black/40 text-white text-xs px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              {uploadingHeader ? "Uploading…" : "Change"}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => handleImageChange("header", e.target.files[0])} />
            </label>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-primary-100 border-4 border-white flex items-center justify-center overflow-hidden shadow-card">
                {profile.avatar
                  ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-primary-700 font-bold text-xl">{initials}</span>}
              </div>
              {isMe && editing && (
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-700 rounded-full flex items-center justify-center cursor-pointer shadow-md">
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => handleImageChange("avatar", e.target.files[0])} />
                </label>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap justify-end mb-1">
              {isMe ? (
                <button onClick={() => setEditing(v => !v)} className="btn-primary flex items-center gap-2 text-xs">
                  <Edit3 className="w-3.5 h-3.5" /> {editing ? "Cancel" : "Edit Profile"}
                </button>
              ) : (
                <>
                  {/* Message button — visible on mobile too */}
                  <button onClick={() => navigate(`/messages?user=${profile._id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                  {/* Notify bell */}
                  <button onClick={handleNotify}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      notifying ? "bg-amber-50 text-amber-600 border-amber-200" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}>
                    {notifying ? <Bell className="w-3.5 h-3.5 fill-current" /> : <BellOff className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{notifying ? "Notifying" : "Notify"}</span>
                  </button>
                  {/* Follow button */}
                  <button onClick={handleFollow} disabled={followLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                      following
                        ? "border-gray-300 bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                        : "bg-primary-700 text-white border-primary-700 hover:bg-primary-800"
                    }`}>
                    {following ? <><UserMinus className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Edit form */}
          {editing ? (
            <form onSubmit={handleSave} className="space-y-3 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                  <input value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} className="input-base" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} rows={3} className="input-base resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma-separated)</label>
                  <input value={form.skills} onChange={e => setForm(p => ({...p, skills: e.target.value}))} className="input-base" placeholder="React, Python, UI/UX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GitHub URL</label>
                  <input value={form.socialLinks?.github || ""} onChange={e => setForm(p => ({...p, socialLinks:{...p.socialLinks, github: e.target.value}}))} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL</label>
                  <input value={form.socialLinks?.linkedin || ""} onChange={e => setForm(p => ({...p, socialLinks:{...p.socialLinks, linkedin: e.target.value}}))} className="input-base" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-xs disabled:opacity-50">
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Name & verification */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-xl text-gray-800">{profile.fullName}</h1>
                {isVerified && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500" style={{ color: "white" }} />}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>
              {profile.department && <p className="text-sm text-primary-700 font-medium mt-1">{profile.department}</p>}
              {profile.bio && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>}

              {/* Stats row — tappable */}
              <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => {}} className="text-center">
                  <p className="text-base font-bold text-gray-800">{postsCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Posts</p>
                </button>
                <div className="w-px h-8 bg-gray-100" />
                <button onClick={loadFollowers} className="text-center hover:opacity-70 transition">
                  <p className="text-base font-bold text-gray-800">{followersCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Followers</p>
                </button>
                <div className="w-px h-8 bg-gray-100" />
                <button onClick={loadFollowing} className="text-center hover:opacity-70 transition">
                  <p className="text-base font-bold text-gray-800">{followingCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Following</p>
                </button>
              </div>

              {/* Skills */}
              {profile.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.skills.map(s => (
                    <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              )}

              {/* Social links */}
              <div className="flex gap-3 mt-3">
                {profile.socialLinks?.github   && <a href={profile.socialLinks.github}   target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600"><Github   className="w-4 h-4" /></a>}
                {profile.socialLinks?.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600"><Linkedin className="w-4 h-4" /></a>}
                {profile.socialLinks?.twitter  && <a href={profile.socialLinks.twitter}  target="_blank" rel="noreferrer" className="text-gray-400 hover:text-sky-500" ><Twitter  className="w-4 h-4" /></a>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Posts / Reposts Tabs ── */}
      <div className="flex border-b border-gray-200 mb-4 bg-white rounded-t-xl overflow-hidden shadow-card">
        {[
          { key:"posts",   label:"Posts",   icon: Grid3X3 },
          { key:"reposts", label:"Reposts", icon: Share2  },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key ? "border-primary-700 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            <Icon className="w-4 h-4" /> {label}
            <span className="text-xs text-gray-400">({key === "posts" ? ownPosts.length : reposts.length})</span>
          </button>
        ))}
      </div>

      {/* Posts list */}
      {postsLoading
        ? <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
        : displayed.length === 0
          ? <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No {activeTab} yet</p>
              {isMe && activeTab === "posts" && <p className="text-sm mt-1">Share something on the campus feed!</p>}
            </div>
          : <div className="space-y-3">
              {displayed.map(p => (
                <ProfilePostCard key={p._id} post={p} isOwn={isMe} onDelete={handleDeletePost} />
              ))}
            </div>
      }

      {/* Communities */}
      {profile.communities?.length > 0 && (
        <div className="bg-white rounded-xl shadow-card p-4 mt-4">
          <h2 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> Communities
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.communities.map(c => (
              <span key={c._id} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{c.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showFollowers && (
        <FollowListModal title="Followers" list={followersList} hidden={false}
          onClose={() => setShowFollowers(false)} currentUserId={me?._id} />
      )}
      {showFollowing && (
        <FollowListModal title="Following" list={followingList} hidden={followingHidden}
          onClose={() => setShowFollowing(false)} currentUserId={me?._id} />
      )}
    </div>
  );
}