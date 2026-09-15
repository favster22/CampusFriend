import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Users, Rss, BookOpen, ArrowRight, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "../components/Layout";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [posts,       setPosts]       = useState([]);
  const [communities, setCommunities] = useState([]);
  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/feed?limit=6&mode=fyp"),
      api.get("/communities/my"),
      api.get("/feed/events"),
    ])
      .then(([feedRes, commRes, evRes]) => {
        setPosts(feedRes.data.posts || []);
        setCommunities(commRes.data.communities?.slice(0, 5) || []);
        setEvents(evRes.data.events?.slice(0, 3) || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { to:"/messages",    label:"Messages",    icon:MessageSquare, bg:"bg-blue-500"   },
    { to:"/communities", label:"Communities", icon:Users,         bg:"bg-purple-500" },
    { to:"/feed",        label:"Campus Feed", icon:Rss,           bg:"bg-teal-500"   },
    { to:"/resources",   label:"Resources",   icon:BookOpen,      bg:"bg-amber-500"  },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {quickLinks.map(({ to, label, icon: Icon, bg }) => (
          <Link key={to} to={to}
            className="rounded-xl p-4 flex flex-col items-center gap-2.5 hover:scale-[1.02] transition-transform group"
            style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold" style={{ color:"var(--text)" }}>{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Recent FYP posts ── */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color:"var(--text)" }}>Trending Posts</h3>
            <Link to="/feed" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading
            ? <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              </div>
            : posts.length === 0
              ? <p className="text-sm text-center py-6" style={{ color:"var(--text-muted)" }}>No trending posts yet</p>
              : <div className="space-y-3">
                  {posts.map(p => (
                    <div key={p._id} className="flex gap-3 py-2.5 border-b last:border-0" style={{ borderColor:"var(--border)" }}>
                      {/* Author avatar — shows actual picture */}
                      <UserAvatar user={p.author} size={34} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color:"var(--text)" }}>{p.author?.fullName}</p>
                        <p className="text-xs line-clamp-2 mt-0.5" style={{ color:"var(--text-muted)" }}>{p.content}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs" style={{ color:"var(--text-muted)" }}>
                            {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                          </p>
                          {p.onFyp && <span className="text-xs text-amber-500 font-medium"> FYP</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* My profile card */}
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <UserAvatar user={user} size={48} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{user?.fullName}</p>
              <p className="text-xs truncate" style={{ color:"var(--text-muted)" }}>@{user?.username}</p>
              {user?.department && (
                <p className="text-xs text-primary-600 mt-0.5 truncate">{user.department}</p>
              )}
            </div>
            <Link to={`/profile/${user?.username}`}
              className="text-xs text-primary-600 hover:underline shrink-0">View</Link>
          </div>

          {/* My communities */}
          <div className="rounded-xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color:"var(--text)" }}>My Communities</h3>
              <Link to="/communities" className="text-xs text-primary-600 hover:underline">See all</Link>
            </div>
            {communities.length === 0
              ? <p className="text-xs py-2" style={{ color:"var(--text-muted)" }}>No communities joined yet</p>
              : communities.map(c => (
                  <div key={c._id} className="flex items-center gap-2.5 py-2 border-b last:border-0" style={{ borderColor:"var(--border)" }}>
                    <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {c.name[0]}
                    </div>
                    <span className="text-xs font-medium truncate" style={{ color:"var(--text)" }}>{c.name}</span>
                  </div>
                ))
            }
          </div>

          {/* Upcoming events */}
          <div className="rounded-xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color:"var(--text)" }}>Upcoming Events</h3>
            {events.length === 0
              ? <p className="text-xs py-2" style={{ color:"var(--text-muted)" }}>No upcoming events</p>
              : events.map(e => (
                  <div key={e._id} className="flex gap-2.5 py-2 border-b last:border-0" style={{ borderColor:"var(--border)" }}>
                    <div className="w-9 h-9 bg-green-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-green-700 leading-none">
                        {new Date(e.eventDetails?.date).getDate()}
                      </span>
                      <span className="text-[9px] text-green-600 leading-none mt-0.5">
                        {new Date(e.eventDetails?.date).toLocaleString("default",{month:"short"})}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color:"var(--text)" }}>
                        {e.content?.slice(0, 45)}{e.content?.length > 45 ? "…" : ""}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>
                        {e.eventDetails?.location || "Online"}
                      </p>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}