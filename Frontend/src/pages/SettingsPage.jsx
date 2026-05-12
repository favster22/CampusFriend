import React, { useEffect, useState } from "react";
import { BadgeCheck, Lock, Globe2, SunMedium, Settings as SettingsIcon, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [statement, setStatement] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [privacy, setPrivacy] = useState({ privateAccount: false, showOnlineStatus: true });
  const [accessibility, setAccessibility] = useState({ reducedMotion: false, highContrast: false });

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
    }
  }, [user]);

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      setUsernameMessage("Username cannot be empty.");
      return;
    }
    if (username.trim() === user.username) {
      setUsernameMessage("Your username is already up to date.");
      return;
    }

    setSavingUsername(true);
    setUsernameMessage("");

    try {
      const res = await api.patch("/users/profile", { username: username.trim() });
      updateUser(res.data.user);
      setUsernameMessage("Username updated successfully.");
    } catch (error) {
      setUsernameMessage(error?.response?.data?.message || "Unable to update username.");
      console.error(error);
    } finally {
      setSavingUsername(false);
    }
  };

  const handleRequestVerification = async () => {
    if (user?.verified) {
      setRequestMessage("Your account is already verified.");
      return;
    }
    setRequestLoading(true);
    setRequestMessage("");
    try {
      const res = await api.post("/users/verification", {
        statement: statement.trim() || "I would like to be verified to better represent my campus identity and community.",
      });
      updateUser(res.data.user);
      setRequestMessage("Verification request submitted successfully.");
      setStatement("");
    } catch (error) {
      setRequestMessage(error?.response?.data?.message || "Unable to submit verification request.");
      console.error(error);
    } finally {
      setRequestLoading(false);
    }
  };

  const togglePrivacy = (field) => {
    setPrivacy((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAccessibility = (field) => {
    setAccessibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-primary-700 text-white flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">Settings</p>
          <p className="text-sm text-gray-500">Manage your account, privacy, accessibility, and verification requests.</p>
        </div>
      </div>

      <section className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Account</h2>
            <p className="text-sm text-gray-500">Change your username and manage account details.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-base w-full"
            />
            <p className="text-xs text-gray-500">Your campus handle. This is used in your profile URL.</p>
          </div>
          <div className="flex items-end justify-end">
            <button
              type="button"
              disabled={savingUsername}
              onClick={handleSaveUsername}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {savingUsername ? "Saving…" : "Save username"}
            </button>
          </div>
        </div>

        {usernameMessage && <p className="mt-3 text-sm text-gray-600">{usernameMessage}</p>}
      </section>

      <section className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Privacy & Safety</h2>
            <p className="text-sm text-gray-500">Control how others see and interact with you.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="font-medium text-gray-900">Private account</p>
              <p className="text-sm text-gray-500">Only approved users can follow or see certain details.</p>
            </div>
            <button
              type="button"
              onClick={() => togglePrivacy("privateAccount")}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${privacy.privateAccount ? "bg-primary-700 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
            >
              {privacy.privateAccount ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="font-medium text-gray-900">Show online status</p>
              <p className="text-sm text-gray-500">Allow people to see when you are active.</p>
            </div>
            <button
              type="button"
              onClick={() => togglePrivacy("showOnlineStatus")}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${privacy.showOnlineStatus ? "bg-primary-700 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
            >
              {privacy.showOnlineStatus ? "On" : "Off"}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center">
            <SunMedium className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Accessibility</h2>
            <p className="text-sm text-gray-500">Customize your experience for comfort and clarity.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="font-medium text-gray-900">Reduced motion</p>
              <p className="text-sm text-gray-500">Minimize animations across the interface.</p>
            </div>
            <button
              type="button"
              onClick={() => toggleAccessibility("reducedMotion")}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${accessibility.reducedMotion ? "bg-primary-700 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
            >
              {accessibility.reducedMotion ? "On" : "Off"}
            </button>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="font-medium text-gray-900">High contrast</p>
              <p className="text-sm text-gray-500">Make interfaces easier to read.</p>
            </div>
            <button
              type="button"
              onClick={() => toggleAccessibility("highContrast")}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${accessibility.highContrast ? "bg-primary-700 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
            >
              {accessibility.highContrast ? "On" : "Off"}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Request verification</h2>
            <p className="text-sm text-gray-500">Submit your request so a campus admin can review your profile for verification.</p>
          </div>
        </div>

        <div className="space-y-4">
          {user?.verified ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">Your account is already verified.</div>
          ) : (
            <>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={4}
                placeholder="Tell us why you should be verified."
                className="input-base w-full resize-none"
              />
              <button
                type="button"
                onClick={handleRequestVerification}
                disabled={requestLoading}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
              >
                {requestLoading ? "Requesting…" : "Request verification"}
              </button>
              {requestMessage && <p className="text-sm text-gray-600">{requestMessage}</p>}
            </>
          )}
          {user?.verificationApplication?.status === "pending" && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Your verification application is pending review.
            </div>
          )}
          {user?.verificationApplication?.status === "rejected" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Your last verification request was rejected.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
