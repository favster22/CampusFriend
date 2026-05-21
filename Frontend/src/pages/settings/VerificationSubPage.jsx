import React, { useState } from "react";
import { BadgeCheck, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { SubPageShell } from "../SettingsPage";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";

export default function VerificationSubPage({ onBack }) {
  const { user, updateUser } = useAuth();
  const [statement,     setStatement]     = useState("");
  const [msg,           setMsg]           = useState("");
  const [loading,       setLoading]       = useState(false);

  const status = user?.verificationApplication?.status;
  const isVerified = user?.verified === true;

  const sc = (m) => m.startsWith("✓") ? { color:"#16a34a" } : { color:"#dc2626" };

  const handleSubmit = async () => {
    if (isVerified) return setMsg("Your account is already verified.");
    setLoading(true); setMsg("");
    try {
      const res = await api.post("/users/verification", {
        statement: statement.trim() || "I would like to be verified to represent my campus identity.",
      });
      updateUser(res.data.user);
      setMsg("✓ Verification request submitted successfully.");
      setStatement("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Could not submit request.");
    } finally { setLoading(false); }
  };

  return (
    <SubPageShell
      title="Verification"
      description="Request a verified badge for your campus profile"
      accent="#7c3aed"
      icon={BadgeCheck}
      onBack={onBack}>

      {/* Already verified */}
      {isVerified && (
        <div className="rounded-2xl p-5 flex items-start gap-4 mb-4"
          style={{ background:"rgba(22,163,74,0.08)", border:"1px solid rgba(22,163,74,0.3)" }}>
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-700">Your account is verified ✓</p>
            <p className="text-sm text-green-600 mt-1">
              The blue verified badge is displayed on your profile and posts.
            </p>
          </div>
        </div>
      )}

      {/* Status banners */}
      {!isVerified && status === "pending" && (
        <div className="rounded-2xl p-4 flex items-start gap-3 mb-4"
          style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)" }}>
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Application pending review</p>
            <p className="text-xs text-amber-600 mt-0.5">
              A campus admin will review your request shortly.
            </p>
          </div>
        </div>
      )}

      {!isVerified && status === "rejected" && (
        <div className="rounded-2xl p-4 flex items-start gap-3 mb-4"
          style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.3)" }}>
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Last request was rejected</p>
            <p className="text-xs text-red-600 mt-0.5">
              You may submit a new application below.
              {user?.verificationApplication?.reviewNotes && (
                <span className="block mt-1 italic">Note: {user.verificationApplication.reviewNotes}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* What verification means */}
      {!isVerified && (
        <div className="rounded-2xl p-4 mb-5"
          style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="w-5 h-5 text-blue-500" />
            <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>What you get</p>
          </div>
          <ul className="space-y-2">
            {[
              "Blue verified badge on your profile",
              "Badge shown next to your name on posts",
              "Increased trust and visibility on campus",
              "Priority in search results",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs" style={{ color:"var(--text-muted)" }}>
                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Application form */}
      {!isVerified && status !== "pending" && (
        <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color:"var(--text-muted)" }}>
              Tell the admin why you should be verified. Accounts representing student
              organizations, departments, or notable campus figures are prioritized.
            </p>
          </div>
          <textarea
            value={statement}
            onChange={e => setStatement(e.target.value)}
            rows={5}
            placeholder="e.g. I am the president of the Computer Engineering Society and want to officially represent our organization on Campusfriend…"
            className="input-base resize-none mb-3"
          />
          <button onClick={handleSubmit} disabled={loading}
            className="w-full btn-primary py-2.5 text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Submit Verification Request
          </button>
          {msg && <p className="text-xs mt-2 text-center" style={sc(msg)}>{msg}</p>}
        </div>
      )}
    </SubPageShell>
  );
}