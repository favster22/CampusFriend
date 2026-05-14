import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BadgeCheck, Edit3, Github, Linkedin, Twitter,
  MessageSquare, Users, UserPlus, UserMinus, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  // hideLikes: only the profile owner (me) can toggle this; stored in user settings
  const [hideLikes, setHideLikes] = useState(false);
  const [savingHideLikes, setSavingHideLikes] = useState(false);

  const isMe = me?.username === username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${username}`);
        const u = res.data.user;
        setProfile(u);
        setFollowing(u.followers?.includes(me?._id) || false);
        if (isMe) {
          setForm({
            fullName: u.fullName,
            bio: u.bio || "",
            department: u.department || "",
            skills: u.skills?.join(", ") || "",
            socialLinks: u.socialLinks || {},
            avatar: u.avatar || "",
            header: u.header || "",
          });
          // Load hideLikes preference (stored in user settings or profile)
          setHideLikes(u.hideLikes === true || me?.hideLikes === true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, isMe]);

  const uploadImage = async (file) => {
    const data = new FormData();
    data.append("image", file);
    const res = await api.post("/users/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.imageUrl;
  };

  const handleImageChange = async (field, file) => {
    if (!file) return;
    const setter = field === "avatar" ? setUploadingAvatar : setUploadingHeader;
    setter(true);
    try {
      const imageUrl = await uploadImage(file);
      setForm((prev) => ({ ...prev, [field]: imageUrl }));
    } catch (e) {
      console.error("Image upload failed", e);
    } finally {
      setter(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await api.patch("/users/profile", payload);
      setProfile(res.data.user);
      updateUser(res.data.user);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await api.patch(`/users/${username}/follow`);
      setFollowing(res.data.following);
      setProfile((prev) => ({
        ...prev,
        followersCount: res.data.following
          ? (prev.followersCount || 0) + 1
          : Math.max((prev.followersCount || 0) - 1, 0),
        followers: res.data.following
          ? [...(prev.followers || []), me._id]
          : (prev.followers || []).filter((id) => id !== me._id),
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleHideLikes = async () => {
    const newVal = !hideLikes;
    setSavingHideLikes(true);
    setHideLikes(newVal);
    try {
      const res = await api.patch("/users/profile", { hideLikes: newVal });
      updateUser(res.data.user);
    } catch (e) {
      console.error(e);
      setHideLikes(!newVal); // revert on error
    } finally {
      setSavingHideLikes(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-24">
      <p className="font-medium text-gray-400">User not found</p>
    </div>
  );

  const initials = profile.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isVerified = profile.verified === true;

  // Follower/following counts
  const followersCount = profile.followersCount ?? profile.followers?.length ?? 0;
  const followingCount = profile.followingCount ?? profile.following?.length ?? 0;
  const postsCount = profile.postsCount ?? 0;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-5">
        {/* Banner */}
        <div
          className="h-28 bg-gradient-to-r from-primary-700 to-primary-500"
          style={profile.header ? {
            backgroundImage: `url(${profile.header})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          } : {}}
        />

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 border-4 border-white flex items-center justify-center overflow-hidden">
              {profile.avatar
                ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-primary-700 font-bold text-xl">{initials}</span>
              }
            </div>
            <div className="flex gap-2 mb-1">
              {isMe ? (
                <>
                  {/* Hide/show likes toggle — only visible to profile owner */}
                  <button
                    onClick={handleToggleHideLikes}
                    disabled={savingHideLikes}
                    title={hideLikes ? "Show likes count" : "Hide likes count"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                      hideLikes
                        ? "border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        : "border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
                    }`}
                  >
                    {hideLikes
                      ? <><EyeOff className="w-3.5 h-3.5" /> Likes hidden</>
                      : <><Eye className="w-3.5 h-3.5" /> Likes visible</>
                    }
                  </button>
                  <button onClick={() => setEditing(v => !v)} className="btn-primary flex items-center gap-2 text-xs">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                      following
                        ? "border-gray-300 bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                        : "bg-primary-700 text-white border-primary-700 hover:bg-primary-800"
                    }`}
                  >
                    {following
                      ? <><UserMinus className="w-3.5 h-3.5" /> Following</>
                      : <><UserPlus className="w-3.5 h-3.5" /> Follow</>
                    }
                  </button>
                  <Link to={`/messages`} className="btn-primary flex items-center gap-2 text-xs">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </Link>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Profile Header</label>
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 h-32">
                    {form.header
                      ? <img src={form.header} alt="Profile header" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No header</div>
                    }
                    <label className="absolute right-3 bottom-3 bg-white border border-gray-200 px-3 py-1 text-xs cursor-pointer rounded-lg">
                      {uploadingHeader ? "Uploading..." : "Upload header"}
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange("header", e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Profile Picture</label>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl bg-primary-100 border border-gray-200 overflow-hidden">
                      {form.avatar && <img src={form.avatar} alt="Avatar preview" className="w-full h-full object-cover" />}
                    </div>
                    <label className="btn-primary text-xs cursor-pointer px-3 py-2">
                      {uploadingAvatar ? "Uploading..." : "Upload avatar"}
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange("avatar", e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input value={form.fullName} onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))} className="input-field" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                  <input value={form.department} onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} className="input-field" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} className="input-field" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma-separated)</label>
                  <input value={form.skills} onChange={(e) => setForm(p => ({ ...p, skills: e.target.value }))} className="input-field" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GitHub URL</label>
                  <input value={form.socialLinks?.github || ""} onChange={(e) => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, github: e.target.value } }))} className="input-field" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL</label>
                  <input value={form.socialLinks?.linkedin || ""} onChange={(e) => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, linkedin: e.target.value } }))} className="input-field" />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl text-gray-800">{profile.fullName}</h1>
                {isVerified && (
                  <BadgeCheck className="w-5 h-5 fill-blue-500 text-white" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">@{profile.username}</p>
              {profile.department && <p className="text-sm text-primary-700 font-medium mt-1">{profile.department}</p>}
              {profile.bio && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>}

              {/* ── Follower / Following / Posts stats ── */}
              <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-base font-bold text-gray-800">{followersCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Followers</p>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="text-center">
                  <p className="text-base font-bold text-gray-800">{followingCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Following</p>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="text-center">
                  <p className="text-base font-bold text-gray-800">{postsCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Posts</p>
                </div>
              </div>

              {profile.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.skills.map((s) => (
                    <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                {profile.socialLinks?.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600">
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {profile.socialLinks?.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {profile.socialLinks?.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600">
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Communities */}
      {profile.communities?.length > 0 && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> Communities
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.communities.map((c) => (
              <span key={c._id} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{c.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}