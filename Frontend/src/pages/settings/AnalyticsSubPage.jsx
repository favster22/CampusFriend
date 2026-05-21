import React, { useEffect, useState } from "react";
import { BarChart2, Heart, MessageCircle, Repeat2, Eye, Users, TrendingUp } from "lucide-react";
import { SubPageShell } from "../SettingsPage";
import api from "../../../utils/api";

function MiniBar({ data, color = "#0f6485", height = 48 }) {
  if (!data || Object.keys(data).length === 0)
    return <p className="text-xs py-3" style={{ color:"var(--text-muted)" }}>No data yet</p>;
  const sorted = Object.entries(data).sort(([a],[b]) => a.localeCompare(b)).slice(-14);
  const max    = Math.max(...sorted.map(([,v]) => v), 1);
  return (
    <div className="flex items-end gap-0.5 w-full" style={{ height }}>
      {sorted.map(([day, val]) => (
        <div key={day} title={`${day}: ${val}`}
          style={{ flex:1, height:`${Math.max((val/max)*100,4)}%`, background:color,
            borderRadius:"2px 2px 0 0", minWidth:3, opacity:0.85 }} />
      ))}
    </div>
  );
}

function StatTile({ label, value, icon, color }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1.5"
      style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color:"var(--text-muted)" }}>{label}</span>
        <span style={{ color, opacity:0.7 }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value?.toLocaleString?.() ?? value}</p>
    </div>
  );
}

export default function AnalyticsSubPage({ onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get("/feed/analytics")
      .then(r => setData(r.data))
      .catch(() => setError("Could not load analytics."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SubPageShell
      title="Analytics"
      description="Your post performance, engagement and audience"
      accent="#0f6485"
      icon={BarChart2}
      onBack={onBack}>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

      {data && (
        <div className="space-y-5">
          {/* Summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatTile label="Total Posts"    value={data.summary.totalPosts}    color="#0f6485" icon={<BarChart2      className="w-4 h-4"/>}/>
            <StatTile label="Total Reposts"  value={data.summary.totalReposts}  color="#7c3aed" icon={<Repeat2        className="w-4 h-4"/>}/>
            <StatTile label="Total Likes"    value={data.summary.totalLikes}    color="#e11d48" icon={<Heart          className="w-4 h-4"/>}/>
            <StatTile label="Total Comments" value={data.summary.totalComments} color="#0891b2" icon={<MessageCircle  className="w-4 h-4"/>}/>
            <StatTile label="Total Shares"   value={data.summary.totalShares}   color="#16a34a" icon={<Repeat2        className="w-4 h-4"/>}/>
            <StatTile label="Total Views"    value={data.summary.totalViews}    color="#d97706" icon={<Eye            className="w-4 h-4"/>}/>
            <StatTile label="Followers"      value={data.summary.followersCount} color="#0f6485" icon={<Users         className="w-4 h-4"/>}/>
            <StatTile label="Following"      value={data.summary.followingCount} color="#475569" icon={<Users         className="w-4 h-4"/>}/>
            <StatTile label="On FYP"         value={data.summary.onFypCount}    color="#f59e0b" icon={<span className="text-base">✨</span>}/>
          </div>

          {/* Engagement rate */}
          <div className="rounded-2xl p-5 text-white" style={{ background:"linear-gradient(135deg,#0f6485,#157aa0)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Engagement Rate</p>
                <p className="text-4xl font-bold mt-1">{data.summary.engagementRate}%</p>
                <p className="text-xs text-white/60 mt-2">(likes + comments + shares) ÷ views × 100</p>
              </div>
              <TrendingUp className="w-12 h-12 text-white/20" />
            </div>
          </div>

          {/* Posts chart */}
          <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color:"var(--text)" }}>Posts per day — last 14 days</p>
            <MiniBar data={data.byDay} color="#0f6485" height={56} />
            <div className="flex justify-between mt-2">
              <p className="text-xs" style={{ color:"var(--text-muted)" }}>14 days ago</p>
              <p className="text-xs" style={{ color:"var(--text-muted)" }}>Today</p>
            </div>
          </div>

          {/* Likes chart */}
          <div className="rounded-2xl p-4" style={{ background:"var(--card)", border:"1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color:"var(--text)" }}>Likes received — last 14 days</p>
            <MiniBar data={data.likesByDay} color="#e11d48" height={56} />
            <div className="flex justify-between mt-2">
              <p className="text-xs" style={{ color:"var(--text-muted)" }}>14 days ago</p>
              <p className="text-xs" style={{ color:"var(--text-muted)" }}>Today</p>
            </div>
          </div>

          {/* Top posts */}
          {data.topPosts?.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color:"var(--text)" }}>Top performing posts</p>
              <div className="space-y-2">
                {data.topPosts.map((p, i) => (
                  <div key={p._id} className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <div className="w-6 h-6 rounded-full bg-primary-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2" style={{ color:"var(--text)" }}>{p.content}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}><Heart className="w-3 h-3 text-red-400"/> {p.likes}</span>
                        <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}><MessageCircle className="w-3 h-3 text-blue-400"/> {p.comments}</span>
                        <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}><Repeat2 className="w-3 h-3 text-green-500"/> {p.shares}</span>
                        <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}><Eye className="w-3 h-3 text-amber-400"/> {p.views}</span>
                        {p.onFyp && <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">✨ FYP</span>}
                        <span className="text-xs ml-auto" style={{ color:"var(--text-muted)" }}>
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.summary.totalPosts === 0 && (
            <div className="text-center py-10" style={{ color:"var(--text-muted)" }}>
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No posts yet</p>
              <p className="text-xs mt-1">Start posting to see your analytics here</p>
            </div>
          )}
        </div>
      )}
    </SubPageShell>
  );
}