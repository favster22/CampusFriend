import React, { useEffect, useState } from "react";
import { BookOpen, Link2, FileText, Search, Plus, X, ExternalLink } from "lucide-react";
import api from "../utils/api";
import { formatDistanceToNow } from "date-fns";

// Resource hub shows posts with type "resource" from the feed
export default function ResourceHubPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [form, setForm] = useState({ content: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/feed", { params: { type: "resource" } });
        setResources(res.data.posts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/feed", {
        content: form.content,
        postType: "resource",
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      setResources(prev => [res.data.post, ...prev]);
      setForm({ content: "", tags: "" });
      setShowShare(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = resources.filter(r =>
    !search || r.content.toLowerCase().includes(search.toLowerCase()) ||
    r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-800">Resource Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">Study materials, links, and tips shared by students</p>
        </div>
        <button onClick={() => setShowShare(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Share Resource
        </button>
      </div>

      {/* Share form */}
      {showShare && (
        <div className="bg-white rounded-xl shadow-card p-5 mb-5 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-gray-800">Share a Resource</h3>
            <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleShare} className="space-y-3">
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Paste a link, describe a resource, or share study tips…"
              rows={4}
              className="input-base resize-none"
              required
            />
            <input
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="Tags (e.g. math, finals, algorithms)"
              className="input-base"
            />
            <div className="flex justify-end">
              <button type="submit" disabled={submitting || !form.content.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                {submitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Share
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search resources and tags…"
          className="input-base pl-9"
        />
      </div>

      {/* Resources */}
      {loading
        ? <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
        : filtered.length === 0
          ? <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No resources found</p>
              <p className="text-sm mt-1">Be the first to share a study resource!</p>
            </div>
          : <div className="space-y-4">
              {filtered.map(r => {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const urls = r.content.match(urlRegex) || [];
                const textWithoutUrls = r.content.replace(urlRegex, "").trim();
                return (
                  <div key={r._id} className="bg-white rounded-xl shadow-card p-5 fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        {urls.length > 0 ? <Link2 className="w-4 h-4 text-amber-600" /> : <FileText className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-700">{r.author?.fullName}</span>
                          <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                        </div>
                        {textWithoutUrls && <p className="text-sm text-gray-700 leading-relaxed">{textWithoutUrls}</p>}
                        {urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 mt-2 text-xs text-primary-700 bg-primary-50 border border-primary-100 px-3 py-2 rounded-lg hover:bg-primary-100 transition-colors truncate max-w-full">
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{url}</span>
                          </a>
                        ))}
                        {r.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {r.tags.map(t => (
                              <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
      }
    </div>
  );
}