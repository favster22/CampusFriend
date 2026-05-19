import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, User, MessageSquare, Users, Rss, BookOpen,
  Bell, Search, ChevronDown, LogOut, Settings, Menu, X,
  FileText, UserCircle, Sun, Moon, Home, Compass,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";

/* ── Avatar component used throughout layout ─────────────────────────── */
export function UserAvatar({ user, size = 32, className = "" }) {
  const initials = user?.fullName
    ?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "CF";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.fullName || "User"}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        onError={e => {
          // Fallback to initials if image fails to load
          e.target.style.display = "none";
          e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
        }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}

/* ── Search bar ──────────────────────────────────────────────────────── */
function SearchBar({ onClose }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState({ users: [], posts: [] });
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate    = useNavigate();
  const containerRef = useRef(null);
  const debounce     = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults({ users:[], posts:[] }); setOpen(false); return; }
    setLoading(true);
    try {
      const [usersRes, postsRes] = await Promise.allSettled([
        api.get("/users/search", { params: { q } }),
        api.get("/feed/search",  { params: { q } }),
      ]);
      setResults({
        users: usersRes.status === "fulfilled" ? usersRes.value.data.users || [] : [],
        posts: postsRes.status === "fulfilled" ? postsRes.value.data.posts || [] : [],
      });
      setOpen(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(val), 300);
  };

  useEffect(() => {
    const h = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const goTo = (path) => { setOpen(false); setQuery(""); navigate(path); onClose?.(); };
  const hasResults = results.users?.length > 0 || results.posts?.length > 0;

  return (
    <div ref={containerRef} className="flex-1 max-w-lg mx-auto relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-white/40 border-t-white/80 rounded-full animate-spin" />
      )}
      <input
        type="text" value={query} onChange={handleChange}
        onKeyDown={e => e.key === "Escape" && setOpen(false)}
        onFocus={() => query && hasResults && setOpen(true)}
        placeholder="Search students, posts…"
        className="w-full bg-white/10 border border-white/20 rounded-full py-1.5 pl-9 pr-4 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {!hasResults && !loading && (
            <div className="px-4 py-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No results for "{query}"
            </div>
          )}
          {results.users?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Students</p>
              {results.users.map(u => (
                <button key={u._id} onClick={() => goTo(`/profile/${u.username}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ color: "var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <UserAvatar user={u} size={32} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.fullName}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {results.posts?.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Posts</p>
              {results.posts.map(p => (
                <button key={p._id} onClick={() => goTo(`/feed`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ color: "var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{p.content?.slice(0, 60)}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>by {p.author?.fullName}</p>
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

/* ── Notifications dropdown ──────────────────────────────────────────── */
function NotifDropdown() {
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications")
      .then(r => { setNotifs(r.data.notifications || []); setUnread(r.data.unreadCount || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await api.patch("/notifications/read-all");
    setUnread(0);
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };

  const icons = { follow:"👤", like:"❤️", comment:"💬", repost:"🔁", message:"💬", community:"👥", story_view:"👁️" };

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl overflow-hidden z-50"
      style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:"var(--border)", background:"var(--surface)" }}>
        <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>
          Notifications {unread > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{unread}</span>}
        </p>
        {unread > 0 && <button onClick={markAll} className="text-xs text-primary-600 hover:underline">Mark all read</button>}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading
          ? <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
          : notifs.length === 0
            ? <div className="px-4 py-6 text-center text-sm" style={{ color:"var(--text-muted)" }}>No notifications yet</div>
            : notifs.map(n => (
                <div key={n._id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0"
                  style={{ borderColor:"var(--border)", background: !n.read ? "rgba(15,100,133,0.06)" : "transparent" }}>
                  <UserAvatar user={n.sender} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug" style={{ color:"var(--text)" }}>
                      {icons[n.type] || "🔔"} {n.message}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                </div>
              ))
        }
      </div>
    </div>
  );
}

/* ── Nav items ───────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to:"/dashboard",   label:"Dashboard",   icon:LayoutDashboard },
  { to:"/profile",     label:"Profile",     icon:User },
  { to:"/messages",    label:"Messages",    icon:MessageSquare },
  { to:"/communities", label:"Communities", icon:Users },
  { to:"/feed",        label:"Campus Feed", icon:Rss },
  { to:"/resources",   label:"Resource Hub",icon:BookOpen },
  { to:"/settings",    label:"Settings",    icon:Settings },
];

const MOBILE_NAV = [
  { to:"/dashboard",   icon:Home },
  { to:"/feed",        icon:Rss },
  { to:"/messages",    icon:MessageSquare },
  { to:"/communities", icon:Users },
  { to:"/profile",     icon:User },
];

/* ── Main Layout ─────────────────────────────────────────────────────── */
export default function Layout() {
  const { user, logout }  = useAuth();
  const { dark, toggle }  = useTheme();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [userMenuOpen,setUserMenuOpen]= useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileSearch,setMobileSearch]= useState(false);

  // Load unread notification count
  useEffect(() => {
    api.get("/notifications").then(r => setUnreadCount(r.data.unreadCount || 0)).catch(() => {});
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── TOP NAVBAR ── */}
      <header className="cf-navbar text-white flex items-center px-4 h-14 shrink-0 z-30 shadow-md">
        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2 mr-4 shrink-0">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center font-display font-bold text-sm">C</div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:block">Campusfriend</span>
        </NavLink>

        {/* Desktop search */}
        <div className="hidden md:block flex-1 max-w-lg mx-auto">
          <SearchBar />
        </div>

        {/* Mobile search */}
        {mobileSearch && (
          <div className="flex-1 md:hidden mx-2">
            <SearchBar onClose={() => setMobileSearch(false)} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {/* Mobile search toggle */}
          <button className="md:hidden p-2 hover:bg-white/10 rounded-full transition"
            onClick={() => setMobileSearch(v => !v)}>
            <Search className="w-5 h-5" />
          </button>

          {/* Dark mode toggle */}
          <button onClick={toggle}
            className="p-2 hover:bg-white/10 rounded-full transition"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setNotifOpen(v => !v); setUserMenuOpen(false); }}
              className="relative p-2 hover:bg-white/10 rounded-full transition">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && <NotifDropdown />}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded-lg transition">
              {/* Avatar — properly shows profile picture */}
              <UserAvatar user={user} size={28} className="ring-2 ring-white/30" />
              <span className="text-sm font-medium hidden sm:block">
                {user?.fullName?.split(" ")[0] || "Student"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl overflow-hidden z-50 fade-in"
                style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
                {/* User info header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor:"var(--border)", background:"var(--surface)" }}>
                  <UserAvatar user={user} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{user?.fullName}</p>
                    <p className="text-xs truncate" style={{ color:"var(--text-muted)" }}>@{user?.username}</p>
                  </div>
                </div>
                <NavLink to={`/profile/${user?.username}`} onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                  style={{ color:"var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.background="var(--surface)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <User className="w-4 h-4" style={{ color:"var(--text-muted)" }} /> My Profile
                </NavLink>
                {/* Dark mode toggle in menu too */}
                <button onClick={toggle}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full transition-colors"
                  style={{ color:"var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.background="var(--surface)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  {dark ? <Sun className="w-4 h-4" style={{ color:"var(--text-muted)" }} /> : <Moon className="w-4 h-4" style={{ color:"var(--text-muted)" }} />}
                  {dark ? "Light mode" : "Dark mode"}
                </button>
                <NavLink to="/settings" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                  style={{ color:"var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.background="var(--surface)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <Settings className="w-4 h-4" style={{ color:"var(--text-muted)" }} /> Settings
                </NavLink>
                <button onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-red-500 transition-colors border-t"
                  style={{ borderColor:"var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button className="md:hidden p-2 hover:bg-white/10 rounded-full transition"
            onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ── */}
        <aside className={`
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          fixed md:static inset-y-0 left-0 top-14 w-56 cf-sidebar border-r cf-border
          flex flex-col z-20 transition-transform duration-200
        `}>
          <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const resolvedTo = to === "/profile" ? `/profile/${user?.username}` : to;
              return (
                <NavLink key={to} to={resolvedTo} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-700 text-white"
                        : "hover:bg-gray-50"
                    }`
                  }
                  style={({ isActive }) => isActive ? {} : { color: "var(--text)" }}
                >
                  <Icon size={18} className="shrink-0" />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom user card */}
          <div className="p-3 border-t cf-border">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg cf-surface">
              {/* Shows actual profile picture */}
              <UserAvatar user={user} size={32} />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color:"var(--text)" }}>{user?.fullName}</p>
                <p className="text-xs truncate" style={{ color:"var(--text-muted)" }}>@{user?.username}</p>
              </div>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 bg-black/30 z-10 md:hidden" onClick={() => setMenuOpen(false)} />
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0" style={{ background:"var(--bg)" }}>
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center border-t"
        style={{ background:"var(--card)", borderColor:"var(--border)" }}>
        {MOBILE_NAV.map(({ to, icon: Icon }) => {
          const resolvedTo = to === "/profile" ? `/profile/${user?.username}` : to;
          const isActive   = location.pathname === resolvedTo || (to !== "/profile" && location.pathname.startsWith(to));
          return (
            <NavLink key={to} to={resolvedTo}
              className="flex-1 flex flex-col items-center py-2.5">
              <Icon size={22} className={isActive ? "text-primary-700" : ""} style={isActive ? {} : { color:"var(--text-muted)" }} />
            </NavLink>
          );
        })}
        {/* Notifications in mobile bottom nav */}
        <button className="flex-1 flex flex-col items-center py-2.5 relative"
          onClick={() => setNotifOpen(v => !v)}>
          <Bell size={22} style={{ color: notifOpen ? undefined : "var(--text-muted)" }}
            className={notifOpen ? "text-primary-700" : ""} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}