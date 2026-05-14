import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BadgeCheck, Edit3, Github, Linkedin, Twitter, MessageSquare, Users } from "lucide-react";
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

  const isMe = me?.username === username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${username}`);
        setProfile(res.data.user);
        if (isMe) setForm({
          fullName: res.data.user.fullName,
          bio: res.data.user.bio || "",
          department: res.data.user.department || "",
          skills: res.data.user.skills?.join(", ") || "",
          socialLinks: res.data.user.socialLinks || {},
          avatar: res.data.user.avatar || "",
          header: res.data.user.header || "",
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

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

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-24 text-gray-400">
      <p className="font-medium">User not found</p>
    </div>
  );

  const initials = profile.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-5">
        {/* Banner */}
        <div
          className="h-28 bg-gradient-to-r from-primary-700 to-primary-500"
          style={profile.header ? { backgroundImage: `url(${profile.header})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 border-4 border-white flex items-center justify-center font-display font-bold text-2xl text-primary-700 overflow-hidden shadow-card">
              {profile.avatar
                ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div className="flex gap-2 mb-1">
              {isMe
                ? <button onClick={() => setEditing(v => !v)} className="btn-primary flex items-center gap-2 text-xs">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                : <Link to={`/messages`} className="btn-primary flex items-center gap-2 text-xs">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </Link>
              }
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Profile Header</label>
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 h-32 mb-2">
                    {form.header ? (
                      <img src={form.header} alt="Profile header" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No header selected</div>
                    )}
                    <label className="absolute right-3 bottom-3 bg-white border border-gray-200 px-3 py-1 text-xs rounded-full cursor-pointer">
                      {uploadingHeader ? "Uploading…" : "Upload header"}
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange("header", e.target.files?.[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Profile Picture</label>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl bg-primary-100 border border-gray-200 overflow-hidden flex items-center justify-center text-primary-700 font-display font-bold text-2xl">
                      {form.avatar ? <img src={form.avatar} alt="Avatar preview" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <label className="btn-primary text-xs cursor-pointer px-3 py-2">
                      {uploadingAvatar ? "Uploading…" : "Upload avatar"}
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange("avatar", e.target.files?.[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                  <input value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} className="input-base" placeholder="Computer Engineering" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} rows={3} className="input-base resize-none" placeholder="Tell everyone about yourself…" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma-separated)</label>
                  <input value={form.skills} onChange={e => setForm(p => ({...p, skills: e.target.value}))} className="input-base" placeholder="React, Python, UI/UX Design" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GitHub URL</label>
                  <input value={form.socialLinks?.github || ""} onChange={e => setForm(p => ({...p, socialLinks: {...p.socialLinks, github: e.target.value}}))} className="input-base" placeholder="https://github.com/…" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL</label>
                  <input value={form.socialLinks?.linkedin || ""} onChange={e => setForm(p => ({...p, socialLinks: {...p.socialLinks, linkedin: e.target.value}}))} className="input-base" placeholder="https://linkedin.com/in/…" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl text-gray-800">{profile.fullName}</h1>
                {profile.verified === true && (
                  <BadgeCheck classname="w-5 h-5 fill-blue-500 text-white" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">@{profile.username}</p>
              {profile.department && <p className="text-sm text-primary-700 font-medium mt-1">{profile.department}</p>}
              {profile.bio && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>}

              {profile.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.skills.map(s => (
                    <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                {profile.socialLinks?.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-700 transition"><Github className="w-5 h-5" /></a>
                )}
                {profile.socialLinks?.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition"><Linkedin className="w-5 h-5" /></a>
                )}
                {profile.socialLinks?.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-sky-500 transition"><Twitter className="w-5 h-5" /></a>
                )}
              </div>

            </>
          )}
        </div>
      </div>

      {/* Communities */}
      {profile.communities?.length > 0 && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> Communities</h2>
          <div className="flex flex-wrap gap-2">
            {profile.communities.map(c => (
              <span key={c._id} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{c.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}