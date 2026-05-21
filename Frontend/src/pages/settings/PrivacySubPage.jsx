import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Key, User as UserIcon, Shield } from "lucide-react";
import { SubPageShell } from "../SettingsPage";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

function ToggleRow({ label, description, checked, loading, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-2xl p-4"
      style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium" style={{ color:"var(--text)" }}>{label}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color:"var(--text-muted)" }}>{description}</p>
      </div>
      <button type="button" onClick={onChange} disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 focus:outline-none ${checked ? "bg-primary-700" : ""}`}
        style={!checked ? { background:"var(--border)" } : {}}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, accent = "#0f6485" }) {
  return (
    <div className="flex items-center gap-2.5 mt-6 mb-3 first:mt-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent + "18", color: accent }}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-bold" style={{ color:"var(--text)" }}>{title}</p>
    </div>
  );
}

export default function PrivacySubPage({ onBack }) {
  const { user, updateUser } = useAuth();

  // Username
  const [username,       setUsername]       = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMsg,    setUsernameMsg]    = useState("");

  // Password
  const [pwForm,    setPwForm]    = useState({ current:"", next:"", confirm:"" });
  const [pwMsg,     setPwMsg]     = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw,    setShowPw]    = useState(false);

  // Privacy toggles
  const [privacy, setPrivacy] = useState({
    privateAccount:   user?.privateAccount   || false,
    showOnlineStatus: user?.showOnlineStatus !== false,
    hideLikes:        user?.hideLikes        || false,
    hideFollowing:    user?.hideFollowing    || false,
  });
  const [privacyLoading, setPrivacyLoading] = useState({});

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPrivacy({
        privateAccount:   user.privateAccount   || false,
        showOnlineStatus: user.showOnlineStatus !== false,
        hideLikes:        user.hideLikes        || false,
        hideFollowing:    user.hideFollowing    || false,
      });
    }
  }, [user]);

  const patchProfile = async (payload) => {
    const res = await api.patch("/users/profile", payload);
    updateUser(res.data.user);
    return res.data.user;
  };

  const sc = (msg) => msg.startsWith("✓") ? { color:"#16a34a" } : { color:"#dc2626" };

  /* ── Username ── */
  const handleSaveUsername = async () => {
    if (!username.trim()) return setUsernameMsg("Cannot be empty.");
    if (username.trim() === user.username) return setUsernameMsg("Already up to date.");
    setSavingUsername(true); setUsernameMsg("");
    try {
      await patchProfile({ username: username.trim() });
      setUsernameMsg("✓ Username updated.");
    } catch (e) {
      setUsernameMsg(e?.response?.data?.message || "Could not update username.");
    } finally { setSavingUsername(false); }
  };

  /* ── Password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault(); setPwMsg("");
    if (!pwForm.current || !pwForm.next) return setPwMsg("All fields required.");
    if (pwForm.next.length < 6)          return setPwMsg("New password min 6 chars.");
    if (pwForm.next !== pwForm.confirm)  return setPwMsg("Passwords do not match.");
    setPwLoading(true);
    try {
      await api.patch("/users/change-password", {
        currentPassword: pwForm.current,
        newPassword:     pwForm.next,
      });
      setPwMsg("✓ Password changed successfully.");
      setPwForm({ current:"", next:"", confirm:"" });
    } catch (e) {
      setPwMsg(e?.response?.data?.message || "Could not change password.");
    } finally { setPwLoading(false); }
  };

  /* ── Privacy toggle ── */
  const togglePrivacy = async (field) => {
    const newVal = !privacy[field];
    setPrivacy(p => ({ ...p, [field]: newVal }));
    setPrivacyLoading(p => ({ ...p, [field]: true }));
    try {
      const u = await patchProfile({ [field]: newVal });
      setPrivacy(p => ({ ...p, [field]: u[field] }));
    } catch {
      setPrivacy(p => ({ ...p, [field]: !newVal })); // revert
    } finally {
      setPrivacyLoading(p => ({ ...p, [field]: false }));
    }
  };

  return (
    <SubPageShell
      title="Privacy & Account"
      description="Username, password and privacy controls"
      accent="#6366f1"
      icon={Lock}
      onBack={onBack}>

      {/* ── Account section ── */}
      <SectionTitle icon={UserIcon} title="Account Details" accent="#0891b2" />

      {/* Username */}
      <div className="rounded-2xl p-4 mb-3" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
        <label className="block text-xs font-semibold mb-2" style={{ color:"var(--text)" }}>Username</label>
        <p className="text-xs mb-3" style={{ color:"var(--text-muted)" }}>
          Your unique handle — shown in your profile URL and across the app.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:"var(--text-muted)" }}>@</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input-base pl-7"
              placeholder="your_username" />
          </div>
          <button onClick={handleSaveUsername} disabled={savingUsername}
            className="btn-primary px-4 text-xs whitespace-nowrap disabled:opacity-60">
            {savingUsername ? "Saving…" : "Save"}
          </button>
        </div>
        {usernameMsg && (
          <p className="text-xs mt-2" style={sc(usernameMsg)}>{usernameMsg}</p>
        )}
      </div>

      {/* ── Password section ── */}
      <SectionTitle icon={Key} title="Change Password" accent="#6366f1" />

      <div className="rounded-2xl p-4 mb-3" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { key:"current", label:"Current password",    ph:"Enter your current password" },
            { key:"next",    label:"New password",         ph:"At least 6 characters" },
            { key:"confirm", label:"Confirm new password", ph:"Repeat new password" },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color:"var(--text)" }}>{label}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder={ph}
                  value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  className="input-base pr-10" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color:"var(--text-muted)" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {pwMsg && <p className="text-xs" style={sc(pwMsg)}>{pwMsg}</p>}

          <button type="submit" disabled={pwLoading}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-60 flex items-center gap-2 w-full justify-center">
            {pwLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Change Password
          </button>
        </form>
      </div>

      {/* ── Privacy section ── */}
      <SectionTitle icon={Shield} title="Privacy Controls" accent="#6366f1" />

      <div className="space-y-2">
        <ToggleRow
          label="Private account"
          description="Only approved followers can see your full profile and posts."
          checked={privacy.privateAccount}
          loading={privacyLoading.privateAccount}
          onChange={() => togglePrivacy("privateAccount")}
        />
        <ToggleRow
          label="Show online status"
          description="Let others see when you're currently active on Campusfriend."
          checked={privacy.showOnlineStatus}
          loading={privacyLoading.showOnlineStatus}
          onChange={() => togglePrivacy("showOnlineStatus")}
        />
        <ToggleRow
          label="Hide likes count"
          description="Other users won't see how many likes your posts receive."
          checked={privacy.hideLikes}
          loading={privacyLoading.hideLikes}
          onChange={() => togglePrivacy("hideLikes")}
        />
        <ToggleRow
          label="Hide following list"
          description="Other users won't be able to see the list of people you follow."
          checked={privacy.hideFollowing}
          loading={privacyLoading.hideFollowing}
          onChange={() => togglePrivacy("hideFollowing")}
        />
      </div>
    </SubPageShell>
  );
}