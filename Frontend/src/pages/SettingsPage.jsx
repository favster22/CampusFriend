import React, { useEffect, useState } from "react";
import {
  BadgeCheck, Lock, SunMedium, Settings as SettingsIcon,
  User as UserIcon, Bell, Eye, EyeOff, Key, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

/* ── Toggle row ───────────────────────────────────────────────────────────── */
function ToggleRow({ label, description, checked, loading, onChange, icon }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={loading}
        className={`ml-4 relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 focus:outline-none ${
          checked ? "bg-primary-700" : "bg-gray-300"
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

/* ── Section wrapper ──────────────────────────────────────────────────────── */
function Section({ title, description, icon, children, color = "primary" }) {
  const colorMap = {
    primary: "bg-primary-50 text-primary-700",
    blue:    "bg-blue-50 text-blue-700",
    green:   "bg-green-50 text-green-700",
    amber:   "bg-amber-50 text-amber-700",
    purple:  "bg-purple-50 text-purple-700",
  };
  return (
    <section className="bg-white rounded-3xl shadow-card p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/* ── Main SettingsPage ────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  /* Account */
  const [username,       setUsername]       = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMsg,    setUsernameMsg]    = useState("");

  /* Password */
  const [pwForm,    setPwForm]    = useState({ current:"", next:"", confirm:"" });
  const [pwMsg,     setPwMsg]     = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw,    setShowPw]    = useState(false);

  /* Privacy */
  const [privacy,       setPrivacy]       = useState({
    privateAccount:   user?.privateAccount   || false,
    showOnlineStatus: user?.showOnlineStatus !== false,
    hideLikes:        user?.hideLikes        || false,
    hideFollowing:    user?.hideFollowing    || false,
  });
  const [privacyLoading, setPrivacyLoading] = useState({});

  /* Notification prefs */
  const [notifPrefs,       setNotifPrefs]       = useState({
    newFollower:       user?.notificationPrefs?.newFollower       !== false,
    postLike:          user?.notificationPrefs?.postLike          !== false,
    postComment:       user?.notificationPrefs?.postComment       !== false,
    communityActivity: user?.notificationPrefs?.communityActivity !== false,
    directMessage:     user?.notificationPrefs?.directMessage     !== false,
  });
  const [notifLoading, setNotifLoading] = useState({});

  /* Accessibility (local only) */
  const [accessibility, setAccessibility] = useState({
    reducedMotion: false,
    highContrast:  false,
    largeText:     false,
  });

  /* Verification */
  const [statement,       setStatement]       = useState("");
  const [verifyMsg,       setVerifyMsg]       = useState("");
  const [verifyLoading,   setVerifyLoading]   = useState(false);

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

  /* ── Helpers ── */
  const patchProfile = async (payload) => {
    const res = await api.patch("/users/profile", payload);
    updateUser(res.data.user);
    return res.data.user;
  };

  /* ── Account ── */
  const handleSaveUsername = async () => {
    if (!username.trim()) return setUsernameMsg("Username cannot be empty.");
    if (username.trim() === user.username) return setUsernameMsg("Already up to date.");
    setSavingUsername(true); setUsernameMsg("");
    try {
      await patchProfile({ username: username.trim() });
      setUsernameMsg("✓ Username updated successfully.");
    } catch (e) {
      setUsernameMsg(e?.response?.data?.message || "Could not update username.");
    } finally { setSavingUsername(false); }
  };

  /* ── Password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (!pwForm.current || !pwForm.next) return setPwMsg("All fields required.");
    if (pwForm.next.length < 6) return setPwMsg("New password must be at least 6 characters.");
    if (pwForm.next !== pwForm.confirm) return setPwMsg("Passwords do not match.");
    setPwLoading(true);
    try {
      await api.patch("/users/change-password", { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwMsg("✓ Password changed successfully.");
      setPwForm({ current:"", next:"", confirm:"" });
    } catch (e) {
      setPwMsg(e?.response?.data?.message || "Could not change password.");
    } finally { setPwLoading(false); }
  };

  /* ── Privacy toggle ── */
  const togglePrivacy = async (field) => {
    const newVal = !privacy[field];
    setPrivacy(prev => ({ ...prev, [field]: newVal }));
    setPrivacyLoading(prev => ({ ...prev, [field]: true }));
    try {
      const updated = await patchProfile({ [field]: newVal });
      setPrivacy(prev => ({ ...prev, [field]: updated[field] }));
    } catch {
      setPrivacy(prev => ({ ...prev, [field]: !newVal })); // revert
    } finally {
      setPrivacyLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  /* ── Notification prefs toggle ── */
  const toggleNotif = async (field) => {
    const newVal = !notifPrefs[field];
    setNotifPrefs(prev => ({ ...prev, [field]: newVal }));
    setNotifLoading(prev => ({ ...prev, [field]: true }));
    try {
      await patchProfile({ notificationPrefs: { ...notifPrefs, [field]: newVal } });
    } catch {
      setNotifPrefs(prev => ({ ...prev, [field]: !newVal }));
    } finally {
      setNotifLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  /* ── Verification ── */
  const handleVerify = async () => {
    if (user?.verified) return setVerifyMsg("Already verified.");
    setVerifyLoading(true); setVerifyMsg("");
    try {
      const res = await api.post("/users/verification", {
        statement: statement.trim() || "I would like to be verified to represent my campus identity.",
      });
      updateUser(res.data.user);
      setVerifyMsg("✓ Verification request submitted.");
      setStatement("");
    } catch (e) {
      setVerifyMsg(e?.response?.data?.message || "Could not submit request.");
    } finally { setVerifyLoading(false); }
  };

  const statusColor = (msg) => msg.startsWith("✓") ? "text-green-600" : "text-red-500";

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-primary-700 text-white flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">Settings</p>
          <p className="text-xs text-gray-500">Manage your account, privacy, and notifications.</p>
        </div>
      </div>

      {/* ── Account ── */}
      <Section title="Account" description="Update your username and password." icon={<UserIcon className="w-5 h-5" />} color="primary">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
            <div className="flex gap-2">
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="input-base flex-1" placeholder="your_username" />
              <button onClick={handleSaveUsername} disabled={savingUsername}
                className="btn-primary px-4 py-2 text-xs whitespace-nowrap disabled:opacity-60">
                {savingUsername ? "Saving…" : "Save"}
              </button>
            </div>
            {usernameMsg && <p className={`text-xs mt-1.5 ${statusColor(usernameMsg)}`}>{usernameMsg}</p>}
          </div>
        </div>
      </Section>

      {/* ── Password ── */}
      <Section title="Change Password" description="Keep your account secure with a strong password." icon={<Key className="w-5 h-5" />} color="blue">
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { key:"current", label:"Current password",  placeholder:"••••••••" },
            { key:"next",    label:"New password",       placeholder:"At least 6 characters" },
            { key:"confirm", label:"Confirm new password",placeholder:"Repeat new password" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder={placeholder}
                  value={pwForm[key]} onChange={e => setPwForm(p => ({...p,[key]:e.target.value}))}
                  className="input-base pr-10" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {pwMsg && <p className={`text-xs ${statusColor(pwMsg)}`}>{pwMsg}</p>}
          <button type="submit" disabled={pwLoading}
            className="btn-primary px-4 py-2 text-xs disabled:opacity-60 flex items-center gap-2">
            {pwLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Change Password
          </button>
        </form>
      </Section>

      {/* ── Privacy & Safety ── */}
      <Section title="Privacy & Safety" description="Control who can see your activity and information." icon={<Lock className="w-5 h-5" />} color="blue">
        <ToggleRow
          label="Private account"
          description="Only approved followers can see your full profile."
          checked={privacy.privateAccount}
          loading={privacyLoading.privateAccount}
          onChange={() => togglePrivacy("privateAccount")}
        />
        <ToggleRow
          label="Show online status"
          description="Let others see when you're active."
          checked={privacy.showOnlineStatus}
          loading={privacyLoading.showOnlineStatus}
          onChange={() => togglePrivacy("showOnlineStatus")}
        />
        <ToggleRow
          label="Hide likes count"
          description="Others won't see how many likes your posts receive."
          checked={privacy.hideLikes}
          loading={privacyLoading.hideLikes}
          onChange={() => togglePrivacy("hideLikes")}
        />
        <ToggleRow
          label="Hide following list"
          description="Other users won't be able to see who you follow."
          checked={privacy.hideFollowing}
          loading={privacyLoading.hideFollowing}
          onChange={() => togglePrivacy("hideFollowing")}
        />
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications" description="Choose what you want to be notified about." icon={<Bell className="w-5 h-5" />} color="amber">
        <ToggleRow
          label="New followers"
          description="Get notified when someone follows you."
          checked={notifPrefs.newFollower}
          loading={notifLoading.newFollower}
          onChange={() => toggleNotif("newFollower")}
        />
        <ToggleRow
          label="Post likes"
          description="Get notified when someone likes your posts."
          checked={notifPrefs.postLike}
          loading={notifLoading.postLike}
          onChange={() => toggleNotif("postLike")}
        />
        <ToggleRow
          label="Post comments"
          description="Get notified when someone comments on your posts."
          checked={notifPrefs.postComment}
          loading={notifLoading.postComment}
          onChange={() => toggleNotif("postComment")}
        />
        <ToggleRow
          label="Community activity"
          description="Get notified about activity in your communities."
          checked={notifPrefs.communityActivity}
          loading={notifLoading.communityActivity}
          onChange={() => toggleNotif("communityActivity")}
        />
        <ToggleRow
          label="Direct messages"
          description="Get notified when you receive a new message."
          checked={notifPrefs.directMessage}
          loading={notifLoading.directMessage}
          onChange={() => toggleNotif("directMessage")}
        />
      </Section>

      {/* ── Accessibility ── */}
      <Section title="Accessibility" description="Customize your experience for comfort and clarity." icon={<SunMedium className="w-5 h-5" />} color="green">
        {[
          { field:"reducedMotion", label:"Reduced motion",  desc:"Minimize animations across the interface." },
          { field:"highContrast",  label:"High contrast",   desc:"Makes text and elements easier to read." },
          { field:"largeText",     label:"Larger text",     desc:"Increase font size across the platform." },
        ].map(({ field, label, desc }) => (
          <ToggleRow key={field}
            label={label} description={desc}
            checked={accessibility[field]}
            onChange={() => setAccessibility(prev => ({ ...prev, [field]: !prev[field] }))}
          />
        ))}
      </Section>

      {/* ── Verification ── */}
      <Section title="Request Verification" description="Get a verified badge on your campus profile." icon={<BadgeCheck className="w-5 h-5" />} color="purple">
        {user?.verified ? (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Your account is verified</p>
              <p className="text-xs text-green-600 mt-0.5">The blue badge is displayed on your profile.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {user?.verificationApplication?.status === "pending" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                ⏳ Your verification application is pending review.
              </div>
            )}
            {user?.verificationApplication?.status === "rejected" && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                ❌ Your last request was rejected. You may reapply.
              </div>
            )}
            <textarea value={statement} onChange={e => setStatement(e.target.value)}
              rows={4} placeholder="Tell us why you should be verified on Campusfriend…"
              className="input-base resize-none" />
            <button onClick={handleVerify} disabled={verifyLoading}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60 flex items-center gap-2">
              {verifyLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Request Verification
            </button>
            {verifyMsg && <p className={`text-xs ${statusColor(verifyMsg)}`}>{verifyMsg}</p>}
          </div>
        )}
      </Section>
    </div>
  );
}