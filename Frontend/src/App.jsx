import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminPanel from "./pages/AdminPanel";

import LoginPage    from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Layout       from "./components/Layout";
import DashboardPage   from "./pages/Dashboard";
import MessagesPage    from "./pages/MessagesPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import CampusFeedPage  from "./pages/CampusFeedPage";
import ResourceHubPage from "./pages/ResourceHubPage";
import ProfilePage     from "./pages/ProfilePage";
import SettingsPage    from "./pages/SettingsPage";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 font-medium">Loading Campusfriend…</span>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<DashboardPage />} />
            <Route path="messages"    element={<MessagesPage />} />
            <Route path="messages/:chatId" element={<MessagesPage />} />
            <Route path="communities" element={<CommunitiesPage />} />
            <Route path="feed"        element={<CampusFeedPage />} />
            <Route path="resources"   element={<ResourceHubPage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}