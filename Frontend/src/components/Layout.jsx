import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, User, MessageSquare, Users, Rss, BookOpen,
  Bell, Search, ChevronDown, LogOut, Settings, Menu, X,
  FileText, UserCircle, Home, Compass, PlusSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

/* ── Search bar ────────────────────────────────────────────────────────────── */
function SearchBar({ onClose }) {
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState({ users: [], posts: [], communities: [] });
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate   = useNavigate();
  const containerRef = useRef(null);
  const debounceRef  = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults({ users:[], posts:[], communities:[] }); setOpen(false); return; }
    setLoading(true);
    try {
      const [usersRes, postsRes] = await Promise.allSettled([
        api.get("/users/search", { params: { q } }),
        api.get("/feed/search",  { params: { q } }),
      ]);
      setResults({
        users:       usersRes.status  === "fulfilled" ? usersRes.value.data.users   || [] : [],
        posts:       postsRes.status  === "fulfilled" ? postsRes.value.data.posts   || [] : [],
        communities: [],
      });
      setOpen(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  useEffect(() => {
    const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const goTo = (path) => { setOpen(false); setQuery(""); navigate(path); onClose?.(); };
  const hasResults = results.users?.length > 0 || results.posts?.length > 0;

  return (
    <div ref={containerRef} className="flex-1 max-w-lg mx-auto relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-white/40 border-t-white/80 rounded-full animate-spin" />}
      <input
        type="text" value={query} onChange={handleChange}
        onKeyDown={(e) => e.key === "Escape" && (setOpen(false), setQuery(""))}
        onFocus={() => query && hasResults && setOpen(true)}
        placeholder="Search students, groups, posts…"
        className="w-full bg-white/10 border border-white/20 rounded-full py-1.5 pl-9 pr-4 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {!hasResults && !loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No results for "{query}"</div>
          )}
          {results.users?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Students</p>
              {results.users.map((u) => (
                <button key={u._id} onClick={() => goTo(`/profile/${u.username}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold text-xs flex items-center justify-center overflow-hidden shrink-0">
                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      : u.fullName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">@{u.username}{u.department ? ` · ${u.department}` : ""}</p>
                  </div>
                  <UserCircle className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}
          {results.posts?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Posts</p>
              {results.posts.map((p) => (
                <button key={p._id} onClick={() => goTo(`/feed?post=${p._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
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
        </div>
      )}
    </div>
  );
}

/* ── Notifications dropdown ────────────────────────────────────────────────── */
function NotificationsDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    api.get("/notifications").then(r => {
      setNotifications(r.data.notifications || []);
      setUnread(r.data.unreadCount || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await api.patch("/notifications/read-all");
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const icons = { follow:"👤", like:"❤️", comment:"💬", repost:"🔁", message:"💬", community:"👥", story_view:"👁️", mention:"@" };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card-hover border border-gray-100 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-semibold text-gray-900">Notifications {unread > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{unread}</span>}</p>
        {unread > 0 && <button onClick={markAll} className="text-xs text-primary-700 hover:underline">Mark all read</button>}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading
          ? <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
          : notifications.length === 0
            ? <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet</div>
            : notifications.map(n => (
                <div key={n._id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${!n.read ? "bg-blue-50/40" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center overflow-hidden shrink-0">
                    {n.sender?.avatar
                      ? <img src={n.sender.avatar} alt="" className="w-full h-full object-cover" />
                      : n.sender?.fullName?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{icons[n.type] || "🔔"} {n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                </div>
              ))
        }
      </div>
    </div>
  );
}

/* ── Desktop sidebar items ─────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { to: "/profile",     label: "Profile",      icon: User },
  { to: "/messages",    label: "Messages",     icon: MessageSquare },
  { to: "/communities", label: "Communities",  icon: Users },
  { to: "/feed",        label: "Campus Feed",  icon: Rss },
  { to: "/resources",   label: "Resource Hub", icon: BookOpen },
  { to: "/settings",    label: "Settings",     icon: Settings },
];

/* ── Mobile bottom nav items ───────────────────────────────────────────────── */
const MOBILE_NAV = [
  { to: "/dashboard",   icon: Home },
  { to: "/feed",        icon: Rss },
  { to: "/messages",    icon: MessageSquare },
  { to: "/communities", icon: Users },
  { to: "/profile",     icon: User },
];

/* ── Main Layout ───────────────────────────────────────────────────────────── */
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [mobileSearch, setMobileSearch] = useState(false);

  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "CF";

  // Load unread count on mount
  useEffect(() => {
    api.get("/notifications").then(r => setUnreadNotif(r.data.unreadCount || 0)).catch(() => {});
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── TOP NAVBAR ── */}
      <header className="bg-primary-700 text-white flex items-center px-4 h-14 shrink-0 z-30 shadow-md">
        <NavLink to="/dashboard" className="flex items-center gap-2 mr-4 shrink-0">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center font-display font-bold text-sm">C</div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:block">Campusfriend</span>
        </NavLink>

        {/* Desktop search */}
        <div className="hidden md:block flex-1 max-w-lg mx-auto">
          <SearchBar />
        </div>

        {/* Mobile search toggle */}
        {mobileSearch && (
          <div className="flex-1 md:hidden mx-2">
            <SearchBar onClose={() => setMobileSearch(false)} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {/* Mobile search icon */}
          <button className="md:hidden p-2 hover:bg-white/10 rounded-full" onClick={() => setMobileSearch(v => !v)}>
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setNotifOpen(v => !v); setUserMenuOpen(false); }}
              className="relative p-2 hover:bg-white/10 rounded-full transition">
              <Bell className="w-5 h-5" />
              {unreadNotif > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadNotif > 9 ? "9+" : unreadNotif}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotificationsDropdown onClose={() => setNotifOpen(false)} />
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded-lg transition">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {user?.fullName?.split(" ")[0] || "Student"} {user?.fullName?.split(" ").slice(-1)[0]?.charAt(0)}.
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 hidden sm:block" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-card-hover border border-gray-100 py-1 z-50 fade-in">
                <NavLink to={`/profile/${user?.username}`} onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4 text-gray-400" /> My Profile
                </NavLink>
                <NavLink to="/settings" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4 text-gray-400" /> Settings
                </NavLink>
                <button onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger (for desktop sidebar) */}
          <button className="md:hidden p-2 hover:bg-white/10 rounded-full" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className={`
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          fixed md:static inset-y-0 left-0 top-14 w-56 bg-white border-r border-gray-100
          flex flex-col z-20 transition-transform duration-200 shadow-card md:shadow-none
        `}>
          <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const resolvedTo = to === "/profile" ? `/profile/${user?.username}` : to;
              return (
                <NavLink key={to} to={resolvedTo} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-primary-700 text-white" : "text-gray-600 hover:bg-gray-50 hover:text-primary-700"
                    }`
                  }>
                  <Icon size={18} className="shrink-0" />
                  {label}
                </NavLink>
              );
            })}
          </nav>
          {/* Bottom user card */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 overflow-hidden shrink-0">
                {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
              </div>
            </div>
          </div>
        </aside>

        {menuOpen && <div className="fixed inset-0 bg-black/30 z-10 md:hidden" onClick={() => setMenuOpen(false)} />}

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-surface pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex items-center">
        {MOBILE_NAV.map(({ to, icon: Icon }) => {
          const resolvedTo = to === "/profile" ? `/profile/${user?.username}` : to;
          const isActive = location.pathname.startsWith(to === "/profile" ? `/profile/${user?.username}` : to);
          return (
            <NavLink key={to} to={resolvedTo}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5">
              <Icon size={22} className={isActive ? "text-primary-700" : "text-gray-400"} />
            </NavLink>
          );
        })}
        {/* Notifications icon in mobile bottom nav */}
        <button className="flex-1 flex flex-col items-center py-2.5 gap-0.5 relative"
          onClick={() => { setNotifOpen(v => !v); }}>
          <Bell size={22} className={notifOpen ? "text-primary-700" : "text-gray-400"} />
          {unreadNotif > 0 && (
            <span className="absolute top-1.5 right-6 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {unreadNotif > 9 ? "9+" : unreadNotif}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}