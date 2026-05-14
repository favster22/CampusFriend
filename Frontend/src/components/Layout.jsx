import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, User, MessageSquare, Users,
  Rss, BookOpen, Bell, Search, ChevronDown,
  LogOut, Settings, Menu, X, FileText, UserCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const NAV_ITEMS = [
  { to: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { to: "/profile",     label: "Profile",      icon: User },
  { to: "/messages",    label: "Messages",     icon: MessageSquare },
  { to: "/communities", label: "Communities",  icon: Users },
  { to: "/feed",        label: "Campus Feed",  icon: Rss },
  { to: "/resources",   label: "Resource Hub", icon: BookOpen },
];

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], posts: [], communities: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults({ users: [], posts: [], communities: [] });
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/search", { params: { q } });
      setResults(res.data || { users: [], posts: [], communities: [] });
      setOpen(true);
    } catch (e) {
      // Fallback: try individual endpoints if unified search isn't available
      try {
        const [usersRes, postsRes] = await Promise.allSettled([
          api.get("/users/search", { params: { q } }),
          api.get("/feed/search", { params: { q } }),
        ]);
        setResults({
          users: usersRes.status === "fulfilled" ? usersRes.value.data.users || [] : [],
          posts: postsRes.status === "fulfilled" ? postsRes.value.data.posts || [] : [],
          communities: [],
        });
        setOpen(true);
      } catch (_) {
        console.error("Search failed", e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults =
    results.users?.length > 0 ||
    results.posts?.length > 0 ||
    results.communities?.length > 0;

  const goTo = (path) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-lg mx-auto relative hidden md:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-white/40 border-t-white/80 rounded-full animate-spin" />
      )}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query && hasResults && setOpen(true)}
        placeholder="Search Students, Groups, or Posts"
        className="w-full bg-white/10 border border-white/20 rounded-full py-1.5 pl-9 pr-4 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition"
      />

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {!hasResults && !loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No results for "{query}"
            </div>
          )}

          {results.users?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Students</p>
              {results.users.map((u) => {
                const initials = u.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <button
                    key={u._id}
                    onClick={() => goTo(`/profile/${u.username}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-xs flex items-center justify-center overflow-hidden shrink-0">
                      {u.avatar
                        ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                        : initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">@{u.username}{u.department ? ` · ${u.department}` : ""}</p>
                    </div>
                    <UserCircle className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {results.communities?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Communities</p>
              {results.communities.map((c) => (
                <button
                  key={c._id}
                  onClick={() => goTo(`/communities/${c._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold text-xs flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.memberCount || 0} members</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.posts?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Posts</p>
              {results.posts.map((p) => (
                <button
                  key={p._id}
                  onClick={() => goTo(`/feed?post=${p._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{p.content}</p>
                    <p className="text-xs text-gray-400 truncate">by {p.author?.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => goTo(`/search?q=${encodeURIComponent(query)}`)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              See all results for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest("#notifications-button") &&
        !event.target.closest("#notifications-dropdown")
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CF";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── TOP NAVBAR ── */}
      <header className="bg-primary-700 text-white flex items-center px-4 h-14 shrink-0 z-30 shadow-md">
        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center font-display font-bold text-sm">
            C
          </div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:block">
            Campusfriend
          </span>
        </NavLink>

        {/* Functional Search bar */}
        <SearchBar />

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              id="notifications-button"
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative p-2 hover:bg-white/10 rounded-full transition"
              aria-label="Notifications"
              type="button"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
            </button>

            {notificationsOpen && (
              <div
                id="notifications-dropdown"
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-card-hover border border-gray-100 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                </div>
                <div className="px-4 py-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">No new notifications</p>
                  <p className="mt-2 text-xs text-gray-500">You'll see alerts here when someone mentions you or sends a message.</p>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded-lg transition"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold overflow-hidden">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : initials}
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {user?.fullName?.split(" ")[0] || "Student"} {user?.fullName?.split(" ").slice(-1)[0]?.charAt(0)}.
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-card-hover border border-gray-100 py-1 z-50 fade-in">
                <NavLink
                  to={`/profile/${user?.username}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-gray-400" /> My Profile
                </NavLink>
                <NavLink
                  to="/settings"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 text-gray-400" /> Settings
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 hover:bg-white/10 rounded-full transition"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ── */}
        <aside
          className={`
            ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            fixed md:static inset-y-0 left-0 top-14 w-56 bg-white border-r border-gray-100
            flex flex-col z-20 transition-transform duration-200 shadow-card md:shadow-none
          `}
        >
          <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const resolvedTo = to === "/profile" ? `/profile/${user?.username}` : to;
              return (
                <NavLink
                  key={to}
                  to={resolvedTo}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-700 text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-primary-700"
                    }`
                  }
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom user card */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 overflow-hidden shrink-0">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-10 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}