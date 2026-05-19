// ── Add this Appearance section to the TOP of SettingsPage.jsx ───────────────
// Import useTheme at the top of your SettingsPage:
//   import { useTheme } from "../context/ThemeContext";
// Then add inside the component:
//   const { dark, toggle } = useTheme();
// And add this <Section> BEFORE the Analytics section:

/*
  <Section title="Appearance" description="Choose your preferred display theme." icon={<Palette className="w-5 h-5" />} color="primary">
    <div className="flex items-center gap-3">
      <button
        onClick={() => !dark && toggle()}
        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
          !dark ? "border-primary-700 bg-primary-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
        }`}
        style={dark ? { borderColor:"var(--border)", background:"var(--surface)" } : {}}
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          <Sun className="w-5 h-5 text-amber-500" />
        </div>
        <span className={`text-xs font-semibold ${!dark ? "text-primary-700" : ""}`} style={dark ? { color:"var(--text)" } : {}}>
          Light
        </span>
        {!dark && <div className="w-4 h-4 rounded-full bg-primary-700 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
      </button>

      <button
        onClick={() => dark && toggle()}
        className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
        style={{
          borderColor: dark ? "#0f6485" : "var(--border)",
          background:  dark ? "rgba(15,100,133,0.1)" : "var(--surface)",
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shadow-sm">
          <Moon className="w-5 h-5 text-blue-400" />
        </div>
        <span className="text-xs font-semibold" style={{ color: dark ? "#0f6485" : "var(--text)" }}>
          Dark
        </span>
        {dark && <div className="w-4 h-4 rounded-full bg-primary-700 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
      </button>
    </div>

    <p className="text-xs text-center" style={{ color:"var(--text-muted)" }}>
      Your preference is saved automatically
    </p>
  </Section>
*/

// ── COMPLETE UPDATED SettingsPage.jsx WITH DARK MODE + ANALYTICS ─────────────
import React, { useEffect, useState } from "react";
import {
  BadgeCheck, Lock, SunMedium, Settings as SettingsIcon,
  User as UserIcon, Bell, Eye, EyeOff, Key, CheckCircle2,
  BarChart2, Heart, MessageCircle, Repeat2, Users,
  Sun, Moon, Palette,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";

/* ─── Mini bar chart ──────────────────────────────────────────────────────── */
function MiniBar({ data, color = "#0f6485", height = 44 }) {
  if (!data || Object.keys(data).length === 0)
    return <p className="text-xs py-2" style={{ color:"var(--text-muted)" }}>No data yet</p>;

  const sorted = Object.entries(data).sort(([a],[b]) => a.localeCompare(b)).slice(-14);
  const max    = Math.max(...sorted.map(([,v]) => v), 1);

  return (
    <div className="flex items-end gap-0.5 overflow-hidden rounded" style={{ height }}>
      {sorted.map(([day, val]) => (
        <div key={day} title={`${day}: ${val}`}
          style={{
            flex:1,
            height:`${Math.max((val/max)*100, 4)}%`,
            background:color,
            borderRadius:"2px 2px 0 0",
            minWidth:4,
            opacity:0.85,
          }} />
      ))}
    </div>
  );
}

/* ─── Stat tile ───────────────────────────────────────────────────────────── */
function StatTile({ label, value, icon, color }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color:"var(--text-muted)" }}>{label}</span>
        <span style={{ color, opacity:0.7 }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

/* ─── Toggle row ──────────────────────────────────────────────────────────── */
function ToggleRow({ label, description, checked, loading, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-2xl p-4"
      style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium" style={{ color:"var(--text)" }}>{label}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color:"var(--text-muted)" }}>{description}</p>
      </div>
      <button type="button" onClick={onChange} disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 focus:outline-none ${checked ? "bg-primary-700" : "bg-gray-300"}`}
        style={!checked ? { background:"var(--border)" } : {}}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

/* ─── Section ─────────────────────────────────────────────────────────────── */
function Section({ title, description, icon, children, accent = "#0f6485" }) {
  return (
    <section className="rounded-3xl p-5 sm:p-6" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background:`${accent}18`, color:accent }}>
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color:"var(--text)" }}>{title}</h2>
          <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/* ─── Analytics Section ───────────────────────────────────────────────────── */
function AnalyticsSection() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get("/feed/analytics")
      .then(r => setData(r.data))
      .catch(() => setError("Could not load analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error)  return <p className="text-sm text-red-500">{error}</p>;
  if (!data)  return null;

  const { summary, topPosts, byDay, likesByDay } = data;

  return (
    <div className="space-y-5">
      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Total Posts"    value={summary.totalPosts}    color="#0f6485" icon={<BarChart2      className="w-4 h-4" />} />
        <StatTile label="Total Reposts"  value={summary.totalReposts}  color="#7c3aed" icon={<Repeat2        className="w-4 h-4" />} />
        <StatTile label="Total Likes"    value={summary.totalLikes}    color="#e11d48" icon={<Heart          className="w-4 h-4" />} />
        <StatTile label="Total Comments" value={summary.totalComments} color="#0891b2" icon={<MessageCircle  className="w-4 h-4" />} />
        <StatTile label="Total Shares"   value={summary.totalShares}   color="#16a34a" icon={<Repeat2        className="w-4 h-4" />} />
        <StatTile label="Total Views"    value={summary.totalViews}    color="#d97706" icon={<Eye            className="w-4 h-4" />} />
        <StatTile label="Followers"      value={summary.followersCount.toLocaleString()} color="#0f6485" icon={<Users className="w-4 h-4" />} />
        <StatTile label="Following"      value={summary.followingCount.toLocaleString()} color="#475569" icon={<Users className="w-4 h-4" />} />
        <StatTile label="On FYP"         value={summary.onFypCount}    color="#f59e0b" icon={<span className="text-base">✨</span>} />
      </div>

      {/* Engagement rate */}
      <div className="rounded-2xl p-4 text-white" style={{ background:"linear-gradient(135deg, #0f6485, #157aa0)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70 font-medium">Engagement Rate</p>
            <p className="text-3xl font-bold mt-1">{summary.engagementRate}%</p>
            <p className="text-xs text-white/60 mt-1">(likes + comments + shares) ÷ views</p>
          </div>
          <BarChart2 className="w-10 h-10 text-white/20" />
        </div>
      </div>

      {/* Charts */}
      <div className="rounded-2xl p-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color:"var(--text)" }}>Posts — last 14 days</p>
        <MiniBar data={byDay} color="#0f6485" height={48} />
        <div className="flex justify-between mt-1">
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>14 days ago</p>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>Today</p>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color:"var(--text)" }}>Likes — last 14 days</p>
        <MiniBar data={likesByDay} color="#e11d48" height={48} />
        <div className="flex justify-between mt-1">
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>14 days ago</p>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>Today</p>
        </div>
      </div>

      {/* Top posts */}
      {topPosts?.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color:"var(--text)" }}>Top performing posts</p>
          <div className="space-y-2">
            {topPosts.map((p, i) => (
              <div key={p._id} className="flex items-start gap-3 rounded-xl p-3"
                style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                <div className="w-6 h-6 rounded-full bg-primary-700 text-white text-xs font-bold flex items-center justify-center shrink-0">{i+1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1" style={{ color:"var(--text)" }}>{p.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}><Heart className="w-3 h-3 text-red-400" /> {p.likes}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}><MessageCircle className="w-3 h-3 text-blue-400" /> {p.comments}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}><Repeat2 className="w-3 h-3 text-green-500" /> {p.shares}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}><Eye className="w-3 h-3 text-amber-400" /> {p.views}</span>
                    {p.onFyp && <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">✨ FYP</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.totalPosts === 0 && (
        <div className="text-center py-6" style={{ color:"var(--text-muted)" }}>
          <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No posts yet</p>
          <p className="text-xs mt-0.5">Start posting to see your analytics</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main SettingsPage ───────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { dark, toggle }     = useTheme();

  const [username,       setUsername]       = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMsg,    setUsernameMsg]    = useState("");

  const [pwForm,    setPwForm]    = useState({ current:"", next:"", confirm:"" });
  const [pwMsg,     setPwMsg]     = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw,    setShowPw]    = useState(false);

  const [privacy, setPrivacy] = useState({
    privateAccount:   user?.privateAccount   || false,
    showOnlineStatus: user?.showOnlineStatus !== false,
    hideLikes:        user?.hideLikes        || false,
    hideFollowing:    user?.hideFollowing    || false,
  });
  const [privacyLoading, setPrivacyLoading] = useState({});

  const [notifPrefs, setNotifPrefs] = useState({
    newFollower:       user?.notificationPrefs?.newFollower       !== false,
    postLike:          user?.notificationPrefs?.postLike          !== false,
    postComment:       user?.notificationPrefs?.postComment       !== false,
    communityActivity: user?.notificationPrefs?.communityActivity !== false,
    directMessage:     user?.notificationPrefs?.directMessage     !== false,
  });
  const [notifLoading, setNotifLoading] = useState({});

  const [accessibility, setAccessibility] = useState({ reducedMotion:false, highContrast:false, largeText:false });
  const [statement,     setStatement]     = useState("");
  const [verifyMsg,     setVerifyMsg]     = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPrivacy({
        privateAccount:   user.privateAccount   || false,
        showOnlineStatus: user.showOnlineStatus !== false,
        hideLikes:        user.hideLikes        || false,
        hideFollowing:    user.hideFollowing    || false,
      });
      setNotifPrefs({
        newFollower:       user.notificationPrefs?.newFollower       !== false,
        postLike:          user.notificationPrefs?.postLike          !== false,
        postComment:       user.notificationPrefs?.postComment       !== false,
        communityActivity: user.notificationPrefs?.communityActivity !== false,
        directMessage:     user.notificationPrefs?.directMessage     !== false,
      });
    }
  }, [user]);

  const patchProfile = async (payload) => {
    const res = await api.patch("/users/profile", payload);
    updateUser(res.data.user);
    return res.data.user;
  };

  const sc = (msg) => msg.startsWith("✓") ? { color:"#16a34a" } : { color:"#dc2626" };

  const handleSaveUsername = async () => {
    if (!username.trim()) return setUsernameMsg("Cannot be empty.");
    if (username.trim() === user.username) return setUsernameMsg("Already up to date.");
    setSavingUsername(true); setUsernameMsg("");
    try { await patchProfile({ username: username.trim() }); setUsernameMsg("✓ Username updated."); }
    catch (e) { setUsernameMsg(e?.response?.data?.message || "Could not update."); }
    finally { setSavingUsername(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPwMsg("");
    if (!pwForm.current || !pwForm.next) return setPwMsg("All fields required.");
    if (pwForm.next.length < 6) return setPwMsg("Min 6 characters.");
    if (pwForm.next !== pwForm.confirm) return setPwMsg("Passwords do not match.");
    setPwLoading(true);
    try {
      await api.patch("/users/change-password", { currentPassword:pwForm.current, newPassword:pwForm.next });
      setPwMsg("✓ Password changed."); setPwForm({ current:"",next:"",confirm:"" });
    } catch (e) { setPwMsg(e?.response?.data?.message || "Could not change."); }
    finally { setPwLoading(false); }
  };

  const togglePrivacy = async (field) => {
    const newVal = !privacy[field];
    setPrivacy(p => ({ ...p, [field]:newVal }));
    setPrivacyLoading(p => ({ ...p, [field]:true }));
    try { const u = await patchProfile({ [field]:newVal }); setPrivacy(p => ({ ...p, [field]:u[field] })); }
    catch { setPrivacy(p => ({ ...p, [field]:!newVal })); }
    finally { setPrivacyLoading(p => ({ ...p, [field]:false })); }
  };

  const toggleNotif = async (field) => {
    const newVal = !notifPrefs[field];
    setNotifPrefs(p => ({ ...p, [field]:newVal }));
    setNotifLoading(p => ({ ...p, [field]:true }));
    try { await patchProfile({ notificationPrefs:{ ...notifPrefs, [field]:newVal } }); }
    catch { setNotifPrefs(p => ({ ...p, [field]:!newVal })); }
    finally { setNotifLoading(p => ({ ...p, [field]:false })); }
  };

  const handleVerify = async () => {
    if (user?.verified) return setVerifyMsg("Already verified.");
    setVerifyLoading(true); setVerifyMsg("");
    try {
      const res = await api.post("/users/verification", { statement: statement.trim() || "I would like to be verified." });
      updateUser(res.data.user); setVerifyMsg("✓ Request submitted."); setStatement("");
    } catch (e) { setVerifyMsg(e?.response?.data?.message || "Could not submit."); }
    finally { setVerifyLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-primary-700 text-white flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold" style={{ color:"var(--text)" }}>Settings</p>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>Account, privacy, notifications and analytics</p>
        </div>
      </div>

      {/* ── Appearance ── */}
      <Section title="Appearance" description="Choose your preferred display theme." icon={<Palette className="w-5 h-5" />} accent="#0f6485">
        <div className="flex items-center gap-3">
          {/* Light mode card */}
          <button onClick={() => dark && toggle()}
            className="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all"
            style={{
              borderColor: !dark ? "#0f6485" : "var(--border)",
              background:  !dark ? "rgba(15,100,133,0.08)" : "var(--surface)",
            }}>
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              <Sun className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-xs font-semibold" style={{ color: !dark ? "#0f6485" : "var(--text-muted)" }}>Light</span>
            {!dark && (
              <div className="w-5 h-5 rounded-full bg-primary-700 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>

          {/* Dark mode card */}
          <button onClick={() => !dark && toggle()}
            className="flex-1 flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all"
            style={{
              borderColor: dark ? "#0f6485" : "var(--border)",
              background:  dark ? "rgba(15,100,133,0.12)" : "var(--surface)",
            }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background:"#1a1d27", border:"1px solid #2a2f45" }}>
              <Moon className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs font-semibold" style={{ color: dark ? "#0f6485" : "var(--text-muted)" }}>Dark</span>
            {dark && (
              <div className="w-5 h-5 rounded-full bg-primary-700 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        </div>
        <p className="text-xs text-center" style={{ color:"var(--text-muted)" }}>
          Your preference is saved automatically
        </p>
      </Section>

      {/* ── Analytics ── */}
      <Section title="Analytics" description="Post performance, engagement and audience insights." icon={<BarChart2 className="w-5 h-5" />} accent="#0f6485">
        <AnalyticsSection />
      </Section>

      {/* ── Account ── */}
      <Section title="Account" description="Update your username." icon={<UserIcon className="w-5 h-5" />} accent="#0891b2">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color:"var(--text)" }}>Username</label>
          <div className="flex gap-2">
            <input value={username} onChange={e => setUsername(e.target.value)} className="input-base flex-1" />
            <button onClick={handleSaveUsername} disabled={savingUsername}
              className="btn-primary px-4 text-xs whitespace-nowrap disabled:opacity-60">
              {savingUsername ? "Saving…" : "Save"}
            </button>
          </div>
          {usernameMsg && <p className="text-xs mt-1.5" style={sc(usernameMsg)}>{usernameMsg}</p>}
        </div>
      </Section>

      {/* ── Password ── */}
      <Section title="Change Password" description="Keep your account secure." icon={<Key className="w-5 h-5" />} accent="#0891b2">
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { key:"current", label:"Current password",    ph:"••••••••" },
            { key:"next",    label:"New password",         ph:"At least 6 characters" },
            { key:"confirm", label:"Confirm new password", ph:"Repeat new password" },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color:"var(--text)" }}>{label}</label>
              <div className="relative">
                <input type={showPw?"text":"password"} placeholder={ph}
                  value={pwForm[key]} onChange={e => setPwForm(p=>({...p,[key]:e.target.value}))}
                  className="input-base pr-10" />
                <button type="button" onClick={() => setShowPw(v=>!v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:"var(--text-muted)" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {pwMsg && <p className="text-xs" style={sc(pwMsg)}>{pwMsg}</p>}
          <button type="submit" disabled={pwLoading}
            className="btn-primary px-4 py-2 text-xs disabled:opacity-60 flex items-center gap-2">
            {pwLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Change Password
          </button>
        </form>
      </Section>

      {/* ── Privacy ── */}
      <Section title="Privacy & Safety" description="Control who sees your activity." icon={<Lock className="w-5 h-5" />} accent="#6366f1">
        <ToggleRow label="Private account" description="Only approved followers see your full profile." checked={privacy.privateAccount} loading={privacyLoading.privateAccount} onChange={() => togglePrivacy("privateAccount")} />
        <ToggleRow label="Show online status" description="Let others see when you're active." checked={privacy.showOnlineStatus} loading={privacyLoading.showOnlineStatus} onChange={() => togglePrivacy("showOnlineStatus")} />
        <ToggleRow label="Hide likes count" description="Others won't see like counts on your posts." checked={privacy.hideLikes} loading={privacyLoading.hideLikes} onChange={() => togglePrivacy("hideLikes")} />
        <ToggleRow label="Hide following list" description="Others can't see who you follow." checked={privacy.hideFollowing} loading={privacyLoading.hideFollowing} onChange={() => togglePrivacy("hideFollowing")} />
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications" description="Choose what you want to be notified about." icon={<Bell className="w-5 h-5" />} accent="#f59e0b">
        <ToggleRow label="New followers" description="Get notified when someone follows you." checked={notifPrefs.newFollower} loading={notifLoading.newFollower} onChange={() => toggleNotif("newFollower")} />
        <ToggleRow label="Post likes" description="Get notified when someone likes your posts." checked={notifPrefs.postLike} loading={notifLoading.postLike} onChange={() => toggleNotif("postLike")} />
        <ToggleRow label="Post comments" description="Get notified on comments to your posts." checked={notifPrefs.postComment} loading={notifLoading.postComment} onChange={() => toggleNotif("postComment")} />
        <ToggleRow label="Community activity" description="Get notified about your communities." checked={notifPrefs.communityActivity} loading={notifLoading.communityActivity} onChange={() => toggleNotif("communityActivity")} />
        <ToggleRow label="Direct messages" description="Get notified on new messages." checked={notifPrefs.directMessage} loading={notifLoading.directMessage} onChange={() => toggleNotif("directMessage")} />
      </Section>

      {/* ── Accessibility ── */}
      <Section title="Accessibility" description="Customize for comfort and clarity." icon={<SunMedium className="w-5 h-5" />} accent="#16a34a">
        {[
          { f:"reducedMotion", l:"Reduced motion",  d:"Minimize animations." },
          { f:"highContrast",  l:"High contrast",   d:"Increase contrast for readability." },
          { f:"largeText",     l:"Larger text",      d:"Increase font sizes across the app." },
        ].map(({ f, l, d }) => (
          <ToggleRow key={f} label={l} description={d}
            checked={accessibility[f]}
            onChange={() => setAccessibility(p => ({ ...p, [f]:!p[f] }))} />
        ))}
      </Section>

      {/* ── Verification ── */}
      <Section title="Request Verification" description="Get a verified badge on your campus profile." icon={<BadgeCheck className="w-5 h-5" />} accent="#7c3aed">
        {user?.verified
          ? (
            <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background:"rgba(22,163,74,0.08)", border:"1px solid rgba(22,163,74,0.3)" }}>
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">Your account is verified</p>
                <p className="text-xs text-green-600 mt-0.5">Blue badge is shown on your profile.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {user?.verificationApplication?.status === "pending" && (
                <div className="rounded-2xl p-3 text-sm" style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", color:"#b45309" }}>⏳ Pending review</div>
              )}
              {user?.verificationApplication?.status === "rejected" && (
                <div className="rounded-2xl p-3 text-sm" style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.3)", color:"#dc2626" }}>❌ Last request rejected. You may reapply.</div>
              )}
              <textarea value={statement} onChange={e => setStatement(e.target.value)}
                rows={4} placeholder="Tell us why you should be verified…"
                className="input-base resize-none" />
              <button onClick={handleVerify} disabled={verifyLoading}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-60 flex items-center gap-2">
                {verifyLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Request Verification
              </button>
              {verifyMsg && <p className="text-xs" style={sc(verifyMsg)}>{verifyMsg}</p>}
            </div>
          )
        }
      </Section>
    </div>
  );
}