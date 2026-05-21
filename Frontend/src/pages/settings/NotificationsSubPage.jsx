import React, { useState, useEffect } from "react";
import { Bell, UserPlus, Heart, MessageCircle, Users, MessageSquare, Repeat2 } from "lucide-react";
import { SubPageShell } from "../SettingsPage";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";

function NotifRow({ icon: Icon, iconColor, label, description, checked, loading, onChange }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl transition-colors"
      style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconColor + "18", color: iconColor }}>
        <Icon className="w-4 h-4" />
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color:"var(--text)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{description}</p>
      </div>
      {/* Toggle */}
      <button type="button" onClick={onChange} disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 focus:outline-none ${checked ? "bg-primary-700" : ""}`}
        style={!checked ? { background:"var(--border)" } : {}}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

const NOTIF_ITEMS = [
  {
    key:   "newFollower",
    label: "New followers",
    desc:  "When someone starts following you",
    icon:  UserPlus,
    color: "#0f6485",
  },
  {
    key:   "postLike",
    label: "Post likes",
    desc:  "When someone likes one of your posts",
    icon:  Heart,
    color: "#e11d48",
  },
  {
    key:   "postComment",
    label: "Post comments",
    desc:  "When someone comments on your posts",
    icon:  MessageCircle,
    color: "#0891b2",
  },
  {
    key:   "repost",
    label: "Reposts (MakeMeFamous)",
    desc:  "When someone reposts one of your posts",
    icon:  Repeat2,
    color: "#16a34a",
  },
  {
    key:   "communityActivity",
    label: "Community activity",
    desc:  "Updates from communities you've joined",
    icon:  Users,
    color: "#7c3aed",
  },
  {
    key:   "directMessage",
    label: "Direct messages",
    desc:  "When you receive a new message",
    icon:  MessageSquare,
    color: "#f59e0b",
  },
];

export default function NotificationsSubPage({ onBack }) {
  const { user, updateUser } = useAuth();

  const [prefs,   setPrefs]   = useState({
    newFollower:       user?.notificationPrefs?.newFollower       !== false,
    postLike:          user?.notificationPrefs?.postLike          !== false,
    postComment:       user?.notificationPrefs?.postComment       !== false,
    repost:            user?.notificationPrefs?.repost            !== false,
    communityActivity: user?.notificationPrefs?.communityActivity !== false,
    directMessage:     user?.notificationPrefs?.directMessage     !== false,
  });
  const [loading, setLoading] = useState({});
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    if (user?.notificationPrefs) {
      setPrefs({
        newFollower:       user.notificationPrefs.newFollower       !== false,
        postLike:          user.notificationPrefs.postLike          !== false,
        postComment:       user.notificationPrefs.postComment       !== false,
        repost:            user.notificationPrefs.repost            !== false,
        communityActivity: user.notificationPrefs.communityActivity !== false,
        directMessage:     user.notificationPrefs.directMessage     !== false,
      });
    }
  }, [user]);

  const toggle = async (key) => {
    const newVal = !prefs[key];
    setPrefs(p => ({ ...p, [key]: newVal }));
    setLoading(p => ({ ...p, [key]: true }));
    try {
      const res = await api.patch("/users/profile", {
        notificationPrefs: { ...prefs, [key]: newVal },
      });
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setPrefs(p => ({ ...p, [key]: !newVal })); // revert on error
    } finally {
      setLoading(p => ({ ...p, [key]: false }));
    }
  };

  return (
    <SubPageShell
      title="Notifications"
      description="Choose what you want to be notified about"
      accent="#f59e0b"
      icon={Bell}
      onBack={onBack}>

      {/* Auto-save indicator */}
      {saved && (
        <div className="mb-4 text-center">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background:"rgba(22,163,74,0.12)", color:"#16a34a", border:"1px solid rgba(22,163,74,0.3)" }}>
            ✓ Saved automatically
          </span>
        </div>
      )}

      <div className="space-y-2">
        {NOTIF_ITEMS.map(({ key, label, desc, icon, color }) => (
          <NotifRow
            key={key}
            icon={icon}
            iconColor={color}
            label={label}
            description={desc}
            checked={prefs[key]}
            loading={loading[key]}
            onChange={() => toggle(key)}
          />
        ))}
      </div>

      <p className="text-xs text-center mt-5" style={{ color:"var(--text-muted)" }}>
        Changes are saved automatically when you toggle a preference.
      </p>
    </SubPageShell>
  );
}