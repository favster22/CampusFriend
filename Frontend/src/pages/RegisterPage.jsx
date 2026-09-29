import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Upload, Loader2 } from "lucide-react";
import { compressImage, readCardText, extractValidity, checkValidity, fmtDate } from "../utils/idCard";

function CardUpload({ label, image, scanning, onPick }) {
  const ref = useRef(null);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
      <button type="button" onClick={() => ref.current?.click()}
        className="relative w-full h-28 border-2 border-dashed border-gray-300 hover:border-primary-600 rounded-lg overflow-hidden flex flex-col items-center justify-center text-gray-400 text-xs gap-1 bg-gray-50">
        {image ? (
          <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <><Upload className="w-5 h-5" />Tap to upload</>
        )}
        {scanning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white gap-1">
            <Loader2 className="w-4 h-4 animate-spin" />Scanning…
          </div>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", username: "", email: "",
    password: "", studentId: "", department: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Student ID card (front + back), OCR text per side, scan state
  const [card, setCard] = useState({ front: "", back: "" });
  const [ocrText, setOcrText] = useState({ front: "", back: "" });
  const [scanning, setScanning] = useState({ front: false, back: false });
  const [cardError, setCardError] = useState("");

  const handleCardPick = async (side, file) => {
    setCardError("");
    setScanning((p) => ({ ...p, [side]: true }));
    try {
      const img = await compressImage(file);
      setCard((p) => ({ ...p, [side]: img }));
      setOcrText((p) => ({ ...p, [side]: "" }));
      const text = await readCardText(img);
      setOcrText((p) => ({ ...p, [side]: text }));
    } catch (err) {
      setCardError(err.message || "Could not read that image. Try another photo.");
    } finally {
      setScanning((p) => ({ ...p, [side]: false }));
    }
  };

  // Dates detected from both sides of the card + validation result
  const detected = extractValidity(`${ocrText.front}\n${ocrText.back}`);
  const bothUploaded = !!card.front && !!card.back;
  const scanDone = bothUploaded && !scanning.front && !scanning.back;
  const validity = scanDone
    ? checkValidity(detected?.validFrom, detected?.validUntil)
    : null;

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (!bothUploaded) {
      return setError("Please upload both the front and back of your student ID card.");
    }
    if (!validity?.ok) {
      return setError(validity?.message || "Your student ID card is still being scanned.");
    }
    setLoading(true);
    try {
      await register({
        ...form,
        idCardFront: card.front,
        idCardBack: card.back,
        idCardValidFrom: detected.validFrom.toISOString(),
        idCardValidUntil: detected.validUntil.toISOString(),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-display font-bold text-white text-lg">C</div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">Campusfriend</span>
          </div>
          <p className="text-white/70 text-sm">Join your campus community today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="font-display font-bold text-xl text-gray-800 mb-6">Create your account</h1>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input name="fullName" required value={form.fullName} onChange={handleChange}
                  placeholder="Kofi Oduro" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input name="username" required value={form.username} onChange={handleChange}
                  placeholder="odurokof" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input name="studentId" value={form.studentId} onChange={handleChange}
                  placeholder="UEB22902282" className="input-base" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange}
                  placeholder="student@university.edu" className="input-base" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input name="department" value={form.department} onChange={handleChange}
                  placeholder="Computer Engineering" className="input-base" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input name="password" type={showPw ? "text" : "password"} required
                    value={form.password} onChange={handleChange}
                    placeholder="At least 6 characters" className="input-base pr-10" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Student ID card ── */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Verify your student ID card</p>
                <p className="text-xs text-gray-500">Upload the front and back. Your card must be in date and cover a 4-year programme.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CardUpload label="Front" image={card.front} scanning={scanning.front} onPick={(f) => handleCardPick("front", f)} />
                <CardUpload label="Back" image={card.back} scanning={scanning.back} onPick={(f) => handleCardPick("back", f)} />
              </div>

              {cardError && <p className="text-xs text-red-600">{cardError}</p>}

              {validity && (
                <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg border ${
                  validity.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                  {validity.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <div>
                    {detected && (
                      <p className="text-xs opacity-80">
                        Detected: {fmtDate(detected.validFrom)} → {fmtDate(detected.validUntil)}
                      </p>
                    )}
                    <p>{validity.ok ? `Card accepted (${validity.span.toFixed(1)}-year span).` : validity.message}</p>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || scanning.front || scanning.back}
              className="w-full btn-primary py-2.5 text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-700 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}