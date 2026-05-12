import React, { useState, useEffect } from "react";
import { Search, Plus, Users, Lock, Globe, Check, X } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

function CommunityCard({ community, isMember, onJoin, onLeave }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      isMember ? await onLeave(community._id) : await onJoin(community._id);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    academic: "bg-blue-50 text-blue-700",
    department: "bg-purple-50 text-purple-700",
    hobby: "bg-green-50 text-green-700",
    "study-group": "bg-amber-50 text-amber-700",
    general: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow fade-in">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
          {community.avatar
            ? <img src={community.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
            : community.name[0].toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-800 text-sm truncate">{community.name}</h3>
            {community.isPrivate
              ? <Lock className="w-3 h-3 text-gray-400 shrink-0" />
              : <Globe className="w-3 h-3 text-gray-400 shrink-0" />
            }
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize mt-0.5 inline-block ${categoryColors[community.category]}`}>
            {community.category}
          </span>
        </div>
      </div>

      {community.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{community.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Users className="w-3.5 h-3.5" />
          <span>{community.memberCount || community.members?.length || 0} members</span>
        </div>
        <button
          onClick={handleAction}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${
            isMember
              ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
              : "bg-primary-700 text-white hover:bg-primary-800"
          }`}
        >
          {loading
            ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : isMember ? <><Check className="w-3 h-3" /> Joined</> : <><Plus className="w-3 h-3" /> Join</>
          }
        </button>
      </div>
    </div>
  );
}

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "general", isPrivate: false });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [allRes, myRes] = await Promise.all([
          api.get("/communities", { params: search ? { search } : {} }),
          api.get("/communities/my"),
        ]);
        setCommunities(allRes.data.communities || []);
        setMyCommunities(myRes.data.communities || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  const handleJoin = async (id) => {
    await api.post(`/communities/${id}/join`);
    setMyCommunities(prev => {
      const c = communities.find(c => c._id === id);
      return c ? [...prev, c] : prev;
    });
  };

  const handleLeave = async (id) => {
    await api.delete(`/communities/${id}/leave`);
    setMyCommunities(prev => prev.filter(c => c._id !== id));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post("/communities", form);
      setCommunities(prev => [res.data.community, ...prev]);
      setMyCommunities(prev => [res.data.community, ...prev]);
      setForm({ name: "", description: "", category: "general", isPrivate: false });
      setShowCreate(false);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const joinedIds = new Set(myCommunities.map(c => c._id));
  const displayed = activeTab === "my" ? myCommunities : communities;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-bold text-xl text-gray-800">Communities</h1>
        <button onClick={() => setShowCreate(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl shadow-card p-5 mb-6 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Create a Community</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="ACES Study Group" className="input-base" required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What is this community about?" rows={2} className="input-base resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-base text-sm">
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="department">Department</option>
                <option value="hobby">Hobby</option>
                <option value="study-group">Study Group</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPrivate} onChange={e => setForm(p => ({ ...p, isPrivate: e.target.checked }))}
                  className="w-4 h-4 accent-primary-700" />
                <span className="text-sm text-gray-700">Private community</span>
              </label>
            </div>
            <div className="col-span-2 flex justify-end">
              <button type="submit" disabled={creating || !form.name.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                {creating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Create Community
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
          {["discover", "my"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-primary-700 text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {tab === "my" ? "My Communities" : "Discover"}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search communities…"
            className="input-base pl-9"
          />
        </div>
      </div>

      {loading
        ? <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
        : displayed.length === 0
          ? <div className="text-center py-16 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No communities found</p>
              <p className="text-sm mt-1">{activeTab === "my" ? "Join some communities to get started!" : "Try a different search term"}</p>
            </div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map(c => (
                <CommunityCard key={c._id} community={c} isMember={joinedIds.has(c._id)} onJoin={handleJoin} onLeave={handleLeave} />
              ))}
            </div>
      }
    </div>
  );
}