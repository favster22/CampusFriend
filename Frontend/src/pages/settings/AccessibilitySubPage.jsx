import React, { useState, useEffect } from "react";
import { SunMedium, ZoomIn, Minus, Type, Eye, Zap } from "lucide-react";
import { SubPageShell } from "../SettingsPage";

const ITEMS = [
  {
    key:   "reducedMotion",
    label: "Reduced motion",
    desc:  "Minimize animations and transitions across the interface.",
    icon:  Zap,
    color: "#7c3aed",
  },
  {
    key:   "highContrast",
    label: "High contrast",
    desc:  "Increase contrast between text and background for better readability.",
    icon:  Eye,
    color: "#0891b2",
  },
  {
    key:   "largeText",
    label: "Larger text",
    desc:  "Increase the font size throughout the app.",
    icon:  Type,
    color: "#16a34a",
  },
];

function AccessRow({ icon: Icon, iconColor, label, description, checked, onChange }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl"
      style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconColor + "18", color: iconColor }}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color:"var(--text)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{description}</p>
      </div>
      <button type="button" onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none ${checked ? "bg-primary-700" : ""}`}
        style={!checked ? { background:"var(--border)" } : {}}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function AccessibilitySubPage({ onBack }) {
  const [prefs, setPrefs] = useState({
    reducedMotion: false,
    highContrast:  false,
    largeText:     false,
  });

  // Persist in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cf_accessibility");
      if (saved) setPrefs(JSON.parse(saved));
    } catch {}
  }, []);

  const toggle = (key) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("cf_accessibility", JSON.stringify(next));

      // Apply effects immediately
      const root = document.documentElement;
      if (key === "reducedMotion") {
        root.style.setProperty("--transition-duration", next.reducedMotion ? "0ms" : "");
        root.classList.toggle("reduce-motion", next.reducedMotion);
      }
      if (key === "highContrast") {
        root.classList.toggle("high-contrast", next.highContrast);
      }
      if (key === "largeText") {
        root.style.fontSize = next.largeText ? "17px" : "";
      }

      return next;
    });
  };

  return (
    <SubPageShell
      title="Accessibility"
      description="Customize your experience for comfort and clarity"
      accent="#16a34a"
      icon={SunMedium}
      onBack={onBack}>

      <div className="space-y-2">
        {ITEMS.map(({ key, label, desc, icon, color }) => (
          <AccessRow
            key={key}
            icon={icon}
            iconColor={color}
            label={label}
            description={desc}
            checked={prefs[key]}
            onChange={() => toggle(key)}
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl p-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
        <p className="text-xs font-semibold mb-2" style={{ color:"var(--text)" }}>About accessibility settings</p>
        <p className="text-xs leading-relaxed" style={{ color:"var(--text-muted)" }}>
          These settings are saved to your browser. They apply immediately when toggled.
          For dark and light mode, visit the main Settings page.
        </p>
      </div>
    </SubPageShell>
  );
}