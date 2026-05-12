import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { initSocket, disconnectSocket } from "../utils/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("cf_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem("cf_token");
    if (!token) { setLoading(false); return; }

    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("cf_user", JSON.stringify(data.user));
        initSocket(token);
      })
      .catch(() => {
        localStorage.removeItem("cf_token");
        localStorage.removeItem("cf_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("cf_token", data.token);
    localStorage.setItem("cf_user", JSON.stringify(data.user));
    setUser(data.user);
    initSocket(data.token);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("cf_token", data.token);
    localStorage.setItem("cf_user", JSON.stringify(data.user));
    setUser(data.user);
    initSocket(data.token);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* silent */ }
    localStorage.removeItem("cf_token");
    localStorage.removeItem("cf_user");
    disconnectSocket();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("cf_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};