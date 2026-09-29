import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home, Search, Bell, Mail, Users, BookOpen, User, Settings,
  LayoutDashboard, MoreHorizontal, LogOut, Sun, Moon, FileText,
  Feather, Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";

/* ── Avatar (exported – Dashboard uses it) ───────────────────────────── */
export function UserAvatar({ user, size = 40, className = "" }) {
  const initials = user?.fullName
    ?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "CF";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.fullName || "User"}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`rounded-full bg-primary-100 text-primary-500 font-bold flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}

/* ── Campusfriend mark (own logo, not X's) ───────────────────────────── */
function Logo({ size = 30 }) {
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-primary-500 text-white font-extrabold flex items-center justify-center"
    >
      <span style={{ fontSize: size * 0.55 }}>C</span>
    </div>
  );
}

/* ── Search (pill, sits in the right rail) ───────────────────────────── */
function SearchBar() {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState({ users: [], posts: [] });
  const [open,    setOpen]    = useState(false);
  const [focus,   setFocus]   = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate     = useNavigate();
  const containerRef = useRef(null);
  const debounce     = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults({ users: [], posts: [] }); setOpen(false); return; }
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
    const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const goTo = (path) => { setOpen(false); setQuery(""); navigate(path); };
  const hasResults = results.users?.length > 0 || results.posts?.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3 rounded-full px-4 h-11 border"
        style={{ background: focus ? "transparent" : "var(--input-bg)", borderColor: focus ? "var(--blue)" : "transparent" }}>
        <Search className="w-[18px] h-[18px] shrink-0" style={{ color: focus ? "var(--blue)" : "var(--text-muted)" }} />
        <input
          type="text" value={query} onChange={handleChange}
          onFocus={() => { setFocus(true); query && hasResults && setOpen(true); }}
          onBlur={() => setFocus(false)}
          onKeyDown={e => e.key === "Escape" && setOpen(false)}
          placeholder="Search"
          className="flex-1 bg-transparent outline-none text-[15px] min-w-0"
          style={{ color: "var(--text)" }}
        />
        {loading && <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-50 max-h-96 overflow-y-auto border shadow-2xl"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {!hasResults && !loading && (
            <div className="px-4 py-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No results for "{query}"
            </div>
          )}
          {results.users?.map(u => (
            <button key={u._id} onClick={() => goTo(`/profile/${u.username}`)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left x-hover">
              <UserAvatar user={u} size={40} />
              <div className="min-w-0">
                <p className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>{u.fullName}</p>
                <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>@{u.username}</p>
              </div>
            </button>
          ))}
          {results.posts?.map(p => (
            <button key={p._id} onClick={() => goTo("/feed")}
              className="w-full flex items-center gap-3 px-4 py-3 text-left x-hover border-t"
              style={{ borderColor: "var(--border)" }}>
              <FileText className="w-5 h-5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: "var(--text)" }}>{p.content?.slice(0, 70)}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>by {p.author?.fullName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Notifications panel ─────────────────────────────────────────────── */
function NotifPanel({ onRead }) {
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
    setUnread(0); onRead?.();
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };

  const icons = { follow:"👤", like:"❤️", comment:"💬", repost:"🔁", message:"✉️", community:"👥", story_view:"👁️" };

  return (
    <div className="fixed inset-x-2 bottom-16 md:absolute md:inset-x-auto md:bottom-auto md:left-full md:top-0 md:ml-2 md:w-96 rounded-2xl overflow-hidden z-50 border shadow-2xl fade-in"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <p className="text-xl font-bold" style={{ color: "var(--text)" }}>Notifications</p>
        {unread > 0 && <button onClick={markAll} className="text-sm text-primary-500 hover:underline">Mark all read</button>}
      </div>
      <div className="max-h-[70vh] md:max-h-96 overflow-y-auto">
        {loading
          ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
          : notifs.length === 0
            ? <div className="px-4 py-10 text-center" style={{ color: "var(--text-muted)" }}>Nothing to see here — yet</div>
            : notifs.map(n => (
                <div key={n._id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 x-hover"
                  style={{ borderColor: "var(--border)", background: !n.read ? "rgba(29,155,240,0.08)" : "transparent" }}>
                  <UserAvatar user={n.sender} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] leading-snug" style={{ color: "var(--text)" }}>{icons[n.type] || "🔔"} {n.message}</p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              ))}
      </div>
    </div>
  );
}

/* ── Right rail: search + upcoming events + footer ───────────────────── */
function RightRail() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    api.get("/feed/events").then(r => setEvents((r.data.events || []).slice(0, 4))).catch(() => {});
  }, []);

  return (
    <aside className="hidden lg:block w-[350px] shrink-0 pl-6 pr-2 py-1 overflow-y-auto">
      <div className="sticky top-0 py-1 z-10" style={{ background: "var(--bg)" }}>
        <SearchBar />
      </div>

      <div className="rounded-2xl mt-3 overflow-hidden" style={{ background: "var(--surface)" }}>
        <h2 className="text-xl font-extrabold px-4 py-3" style={{ color: "var(--text)" }}>Upcoming on campus</h2>
        {events.length === 0 ? (
          <p className="px-4 pb-4 text-[15px]" style={{ color: "var(--text-muted)" }}>
            No upcoming events. Post an event on the feed to see it here.
          </p>
        ) : events.map(ev => (
          <Link key={ev._id} to="/feed" className="block px-4 py-3 x-hover" style={{ color: "var(--text)" }}>
            <p className="text-[13px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Calendar className="w-3.5 h-3.5" />
              {new Date(ev.eventDetails.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              {ev.eventDetails.location ? ` · ${ev.eventDetails.location}` : ""}
            </p>
            <p className="text-[15px] font-bold line-clamp-2">{ev.content}</p>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>by {ev.author?.fullName}</p>
          </Link>
        ))}
        <Link to="/resources" className="block px-4 py-3 text-[15px] text-primary-500 x-hover">Browse resource hub</Link>
      </div>

      <p className="text-[13px] px-4 py-4" style={{ color: "var(--text-muted)" }}>
        © {new Date().getFullYear()} Campusfriend · Connect. Study. Belong.
      </p>
    </aside>
  );
}

/* ── Navigation ──────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/feed",        label: "Home",        icon: Home },
  { to: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { to: "/communities", label: "Communities", icon: Users },
  { to: "/messages",    label: "Messages",    icon: Mail },
  { to: "/resources",   label: "Resources",   icon: BookOpen },
  { to: "/profile",     label: "Profile",     icon: User },
  { to: "/settings",    label: "Settings",    icon: Settings },
];

const MOBILE_NAV = [
  { to: "/feed",        icon: Home },
  { to: "/communities", icon: Users },
  { to: "/messages",    icon: Mail },
  { to: "/resources",   icon: BookOpen },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [userMenu,   setUserMenu]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get("/notifications").then(r => setUnreadCount(r.data.unreadCount || 0)).catch(() => {});
  }, []);

  useEffect(() => { setNotifOpen(false); setUserMenu(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  // Feed + profile use X's narrow 600px column with the right rail.
  // Other pages get a wider column (no rail) so their layouts don't get squeezed.
  const narrow = location.pathname.startsWith("/feed") || location.pathname.startsWith("/profile");
  const profilePath = `/profile/${user?.username}`;
  const resolve = (to) => (to === "/profile" ? profilePath : to);

  const renderNotif = (mobile = false) => (
    <div className={mobile ? "relative flex-1 flex justify-center" : "relative"}>
      <button onClick={() => { setNotifOpen(v => !v); setUserMenu(false); }}
        className={mobile ? "relative p-3" : "x-nav-link w-full xl:pr-6"} style={{ color: "var(--text)" }}>
        <span className="relative">
          <Bell size={26} strokeWidth={notifOpen ? 2.6 : 1.8} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-primary-500 rounded-full text-[11px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
        {!mobile && <span className={`hidden xl:block text-xl ${notifOpen ? "font-bold" : ""}`}>Notifications</span>}
      </button>
      {notifOpen && <NotifPanel onRead={() => setUnreadCount(0)} />}
    </div>
  );

  return (
    <div className="h-screen flex justify-center overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── LEFT NAV (md+) ── */}
      <header className="hidden md:flex flex-col justify-between shrink-0 w-[88px] xl:w-[275px] px-2 xl:pr-4 py-1 h-screen">
        <div>
          <Link to="/feed" className="inline-flex p-3 rounded-full x-nav-link !p-3 !gap-0 mb-1">
            <Logo size={30} />
          </Link>

          <nav className="space-y-0.5">
            {NAV_ITEMS.slice(0, 3).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={resolve(to)} className="x-nav-link xl:pr-6" style={{ color: "var(--text)" }}>
                {({ isActive }) => (<>
                  <Icon size={26} strokeWidth={isActive ? 2.6 : 1.8} />
                  <span className={`hidden xl:block text-xl ${isActive ? "font-bold" : ""}`}>{label}</span>
                </>)}
              </NavLink>
            ))}
            {renderNotif()}
            {NAV_ITEMS.slice(3).map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={resolve(to)} className="x-nav-link xl:pr-6" style={{ color: "var(--text)" }}>
                {({ isActive }) => (<>
                  <Icon size={26} strokeWidth={isActive ? 2.6 : 1.8} />
                  <span className={`hidden xl:block text-xl ${isActive ? "font-bold" : ""}`}>{label}</span>
                </>)}
              </NavLink>
            ))}
          </nav>

          <button onClick={() => navigate("/feed")}
            className="mt-4 bg-primary-500 hover:bg-primary-800 text-white font-bold rounded-full transition-colors w-[52px] h-[52px] xl:w-full xl:h-[52px] flex items-center justify-center text-[17px]">
            <Feather className="w-6 h-6 xl:hidden" />
            <span className="hidden xl:block">Post</span>
          </button>
        </div>

        {/* account pill */}
        <div className="relative mb-3">
          {userMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl border shadow-2xl overflow-hidden z-50 fade-in"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-3 x-hover font-bold text-[15px]" style={{ color: "var(--text)" }}>
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {dark ? "Switch to light mode" : "Switch to dark mode"}
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 x-hover font-bold text-[15px]" style={{ color: "var(--text)" }}>
                <LogOut className="w-5 h-5" /> Log out @{user?.username}
              </button>
            </div>
          )}
          <button onClick={() => { setUserMenu(v => !v); setNotifOpen(false); }}
            className="x-nav-link w-full !gap-3 !p-3 justify-center xl:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar user={user} size={40} />
              <div className="hidden xl:block text-left min-w-0">
                <p className="text-[15px] font-bold truncate" style={{ color: "var(--text)" }}>{user?.fullName}</p>
                <p className="text-[15px] truncate" style={{ color: "var(--text-muted)" }}>@{user?.username}</p>
              </div>
            </div>
            <MoreHorizontal className="hidden xl:block w-5 h-5 shrink-0" style={{ color: "var(--text)" }} />
          </button>
        </div>
      </header>

      {/* ── MAIN COLUMN ── */}
      <div className="flex flex-1 min-w-0 justify-start" style={{ maxWidth: narrow ? 976 : 1100 }}>
        <main
          className={`h-screen overflow-y-auto border-x pb-16 md:pb-0 ${narrow ? "w-full max-w-[600px]" : "flex-1"}`}
          style={{ borderColor: "var(--border)" }}>
          {/* mobile top bar */}
          <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b backdrop-blur"
            style={{ background: "color-mix(in srgb, var(--bg) 85%, transparent)", borderColor: "var(--border)" }}>
            <Link to={profilePath}><UserAvatar user={user} size={32} /></Link>
            <Logo size={28} />
            <button onClick={toggle} className="p-1.5 rounded-full x-hover" style={{ color: "var(--text)" }}>
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <Outlet />
        </main>
        {narrow && <RightRail />}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center border-t backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", borderColor: "var(--border)" }}>
        {MOBILE_NAV.map(({ to, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className="flex-1 flex justify-center py-3" style={{ color: "var(--text)" }}>
              <Icon size={26} strokeWidth={active ? 2.6 : 1.8} />
            </NavLink>
          );
        })}
        {renderNotif(true)}
      </nav>

      {/* mobile floating post button on Home */}
      {location.pathname.startsWith("/feed") && (
        <button onClick={() => document.getElementById("compose-box")?.focus()}
          className="md:hidden fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg">
          <Feather className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}