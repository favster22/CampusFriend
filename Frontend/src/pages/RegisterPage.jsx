import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

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

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    setLoading(true);
    try {
      await register(form);
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
                  placeholder="Alex Reyes" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input name="username" required value={form.username} onChange={handleChange}
                  placeholder="alexr" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input name="studentId" value={form.studentId} onChange={handleChange}
                  placeholder="2021-01234" className="input-base" />
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

            <button type="submit" disabled={loading}
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