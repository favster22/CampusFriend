import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../utils/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [view, setView] = useState("login"); // "login" | "forgot" | "sent"
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: resetEmail });
      setView("sent");
    } catch (err) {
      setResetError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-display font-bold text-white text-lg">
              C
            </div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">
              Campusfriend
            </span>
          </div>
          <p className="text-white/70 text-sm">Connect. Study. Belong.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* ── LOGIN VIEW ── */}
          {view === "login" && (
            <>
              <h1 className="font-display font-bold text-xl text-gray-800 mb-6">
                Sign in to your account
              </h1>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="student@university.edu"
                    className="input-base"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setView("forgot"); setResetError(""); setResetEmail(""); }}
                      className="text-xs text-primary-700 font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPw ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="input-base pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary-700 font-medium hover:underline">
                  Create one
                </Link>
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD VIEW ── */}
          {view === "forgot" && (
            <>
              <button
                onClick={() => setView("login")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>

              <h1 className="font-display font-bold text-xl text-gray-800 mb-2">
                Reset your password
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter the email address linked to your account and we'll send you a reset link.
              </p>

              {resetError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {resetError}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="input-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full btn-primary py-2.5 text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resetLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {resetLoading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            </>
          )}

          {/* ── EMAIL SENT VIEW ── */}
          {view === "sent" && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h1 className="font-display font-bold text-xl text-gray-800 mb-2">
                Check your inbox
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                We sent a password reset link to{" "}
                <span className="font-medium text-gray-700">{resetEmail}</span>.
                Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => setView("login")}
                className="w-full btn-primary py-2.5 text-base flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
