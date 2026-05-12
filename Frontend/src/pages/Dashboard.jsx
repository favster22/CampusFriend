// ─── DashboardPage.jsx ────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Users, Rss, BookOpen, ArrowRight, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";

export function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/feed?limit=5"),
      api.get("/communities/my"),
      api.get("/feed/events"),
    ]).then(([feedRes, commRes, evRes]) => {
      setPosts(feedRes.data.posts || []);
      setCommunities(commRes.data.communities?.slice(0, 5) || []);
      setEvents(evRes.data.events?.slice(0, 3) || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const quickLinks = [
    { to: "/messages", label: "Messages", icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
    { to: "/communities", label: "Communities", icon: Users, color: "bg-purple-50 text-purple-600" },
    { to: "/feed", label: "Campus Feed", icon: Rss, color: "bg-green-50 text-green-600" },
    { to: "/resources", label: "Resources", icon: BookOpen, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-display font-bold text-lg overflow-hidden shrink-0">
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div>
            <h2 className="font-display font-bold text-xl">Welcome back, {user?.fullName?.split(" ")[0]}! 👋</h2>
            <p className="text-white/70 text-sm mt-0.5">
              {user?.department ? `${user.department} · ` : ""}@{user?.username}
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {quickLinks.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} className="bg-white rounded-xl shadow-card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-shadow group">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-primary-700 transition-colors">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent feed */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-gray-800">Recent Posts</h3>
            <Link to="/feed" className="text-xs text-primary-700 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading
            ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
            : posts.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">No posts yet</p>
              : <div className="space-y-3">
                  {posts.map(p => (
                    <div key={p._id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0">
                        {p.author?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700">{p.author?.fullName}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{p.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* My communities */}
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-800">My Communities</h3>
              <Link to="/communities" className="text-xs text-primary-700 hover:underline">See all</Link>
            </div>
            {communities.length === 0
              ? <p className="text-xs text-gray-400 py-2">No communities joined yet</p>
              : communities.map(c => (
                  <div key={c._id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">{c.name[0]}</div>
                    <span className="text-xs font-medium text-gray-700 truncate">{c.name}</span>
                  </div>
                ))
            }
          </div>

          {/* Upcoming events */}
          <div className="bg-white rounded-xl shadow-card p-4">
            <h3 className="font-semibold text-sm text-gray-800 mb-3">Upcoming Events</h3>
            {events.length === 0
              ? <p className="text-xs text-gray-400 py-2">No upcoming events</p>
              : events.map(e => (
                  <div key={e._id} className="flex gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-green-700 leading-none">
                        {new Date(e.eventDetails?.date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{e.content?.slice(0, 40)}…</p>
                      <p className="text-xs text-gray-400">{e.eventDetails?.location || "Online"}</p>
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

export default DashboardPage;