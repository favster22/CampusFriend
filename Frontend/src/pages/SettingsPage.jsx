import React, { useState } from "react";
import {
  BarChart2, Lock, Bell, SunMedium, BadgeCheck,
  Settings as SettingsIcon, ChevronRight, ArrowLeft,
  Sun, Moon, Palette,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Sub-pages
import AnalyticsSubPage       from "./settings/AnalyticsSubPage";
import PrivacySubPage         from "./settings/PrivacySubPage";
import NotificationsSubPage   from "./settings/NotificationsSubPage";
import AccessibilitySubPage   from "./settings/AccessibilitySubPage";
import VerificationSubPage    from "./settings/VerificationSubPage";

/* ── Settings menu items ────────────────────────────────────────────────── */
const MENU = [
  {
    id: "analytics",
    label: "Analytics",
    description: "Post performance, views & engagement",
    icon: BarChart2,
    accent: "#0f6485",
    component: AnalyticsSubPage,
  },
  {
    id: "privacy",
    label: "Privacy & Account",
    description: "Username, password, privacy controls",
    icon: Lock,
    accent: "#6366f1",
    component: PrivacySubPage,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Control what you're notified about",
    icon: Bell,
    accent: "#f59e0b",
    component: NotificationsSubPage,
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description: "Motion, contrast and text size",
    icon: SunMedium,
    accent: "#16a34a",
    component: AccessibilitySubPage,
  },
  {
    id: "verification",
    label: "Verification",
    description: "Request a verified badge",
    icon: BadgeCheck,
    accent: "#7c3aed",
    component: VerificationSubPage,
  },
];

/* ── Appearance card (shown on hub) ─────────────────────────────────────── */
function AppearanceCard() {
  const { dark, toggle } = useTheme();
  return (
    <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background:"rgba(15,100,133,0.12)", color:"#0f6485" }}>
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>Appearance</p>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>Choose your display theme</p>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Light */}
        <button onClick={() => dark && toggle()}
          className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
          style={{
            borderColor: !dark ? "#0f6485" : "var(--border)",
            background:  !dark ? "rgba(15,100,133,0.08)" : "var(--surface)",
          }}>
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <Sun className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-xs font-semibold" style={{ color: !dark ? "#0f6485" : "var(--text-muted)" }}>Light</span>
          {!dark && <div className="w-4 h-4 rounded-full bg-primary-700 flex items-center justify-center text-white text-[9px]">✓</div>}
        </button>

        {/* Dark */}
        <button onClick={() => !dark && toggle()}
          className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
          style={{
            borderColor: dark ? "#0f6485" : "var(--border)",
            background:  dark ? "rgba(15,100,133,0.12)" : "var(--surface)",
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background:"#1a1d27", border:"1px solid #2a2f45" }}>
            <Moon className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-xs font-semibold" style={{ color: dark ? "#0f6485" : "var(--text-muted)" }}>Dark</span>
          {dark && <div className="w-4 h-4 rounded-full bg-primary-700 flex items-center justify-center text-white text-[9px]">✓</div>}
        </button>
      </div>

      <p className="text-xs text-center mt-3" style={{ color:"var(--text-muted)" }}>
        Saved automatically
      </p>
    </div>
  );
}

/* ── Menu row ───────────────────────────────────────────────────────────── */
function MenuRow({ item, onClick }) {
  const Icon = item.icon;
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left"
      style={{ background:"var(--card)", border:"1px solid var(--border)" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = item.accent + "66"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: item.accent + "18", color: item.accent }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>{item.label}</p>
        <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{item.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color:"var(--text-muted)" }} />
    </button>
  );
}

/* ── Sub-page wrapper with back button ──────────────────────────────────── */
export function SubPageShell({ title, description, accent = "#0f6485", icon: Icon, onBack, children }) {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Back button + header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background:"var(--card)", border:"1px solid var(--border)", color:"var(--text)" }}
          onMouseEnter={e => e.currentTarget.style.borderColor=accent}
          onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: accent + "18", color: accent }}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold" style={{ color:"var(--text)" }}>{title}</h1>
            {description && <p className="text-xs" style={{ color:"var(--text-muted)" }}>{description}</p>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Main SettingsPage (hub) ─────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activePage, setActivePage] = useState(null);

  // Render sub-page if selected
  if (activePage) {
    const item = MENU.find(m => m.id === activePage);
    if (item) {
      const SubPage = item.component;
      return <SubPage onBack={() => setActivePage(null)} />;
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-primary-700 text-white flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color:"var(--text)" }}>Settings</h1>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>Manage your account and preferences</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Appearance card always visible on hub */}
        <AppearanceCard />

        {/* Menu rows */}
        {MENU.map(item => (
          <MenuRow key={item.id} item={item} onClick={() => setActivePage(item.id)} />
        ))}
      </div>
    </div>
  );
}