"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  scope: string;
  category?: string;
  createdAt: string;
}

interface OfferItem {
  id: string;
  name: string;
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScope, setFilterScope] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", scope: "global", category: "" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = () => {
    setLoading(true);
    fetch("/api/knowledge").then((r) => r.json()).then(setDocs).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocs();
    fetch("/api/offers").then((r) => r.json()).then(setOffers).catch(() => {});
  }, []);

  const categories = Array.from(new Set(docs.map((d) => d.category).filter(Boolean))) as string[];

  const filtered = docs.filter((d) => {
    if (filterScope !== "all" && d.scope !== filterScope) return false;
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    return true;
  });

  const addDoc = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", content: "", scope: "global", category: "" });
    loadDocs();
  };

  const deleteDoc = async (id: string) => {
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) continue;
      const content = await file.text();
      const title = file.name.replace(/\.(txt|md)$/, "");
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, scope: "global", category: "" }),
      });
    }
    if (fileRef.current) fileRef.current.value = "";
    loadDocs();
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded bg-[#D4A843] flex items-center justify-center font-bold text-black text-sm">OL</div>
              <h1 className="text-lg font-semibold tracking-tight">
                Copy Machine <span className="text-neutral-500 font-normal text-sm">by OfferLaunch</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/offers" className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition">
              Offers
            </Link>
            <Link href="/swipes" className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition">
              Swipes
            </Link>
            <Link href="/knowledge" className="px-4 py-1.5 rounded-md text-sm font-medium text-[#D4A843] border border-[#D4A843]/50 transition">
              Knowledge
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Knowledge Base</h2>
            <p className="text-neutral-500 text-sm mt-1">Reference material included in copy generation prompts.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm font-medium transition cursor-pointer">
              📄 Upload File
              <input ref={fileRef} type="file" accept=".txt,.md" multiple onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-[#D4A843] text-black font-semibold text-sm hover:bg-[#c49a3a] transition"
            >
              + Add Knowledge
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#D4A843] transition"
          >
            <option value="all">All Scopes</option>
            <option value="global">Global</option>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#D4A843] transition"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-neutral-500 text-sm">{filtered.length} doc{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-600">
            <p className="text-lg mb-2">No knowledge docs yet</p>
            <p className="text-sm">Add reference material to improve copy generation quality.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <div key={doc.id} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white text-sm leading-tight flex-1 mr-2">{doc.title}</h3>
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="text-neutral-600 hover:text-red-400 text-sm transition flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    doc.scope === "global"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-[#D4A843]/20 text-[#D4A843]"
                  }`}>
                    {doc.scope === "global" ? "Global" : offers.find((o) => o.id === doc.scope)?.name || doc.scope}
                  </span>
                  {doc.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A843]/20 text-[#D4A843]">
                      {doc.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 flex-1 leading-relaxed">
                  {expandedId === doc.id ? doc.content : doc.content.slice(0, 200)}
                  {doc.content.length > 200 && (
                    <button
                      onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                      className="text-[#D4A843] hover:underline ml-1"
                    >
                      {expandedId === doc.id ? "collapse" : "...more"}
                    </button>
                  )}
                </p>
                <div className="mt-3 text-xs text-neutral-600">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#333] rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Knowledge</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#D4A843] transition"
                placeholder="e.g. Jeremy Haynes - Ad Copy Framework"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={8}
                className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#D4A843] transition resize-y"
                placeholder="Paste the reference material here..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Scope</label>
                <select
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#D4A843] transition"
                >
                  <option value="global">Global (all offers)</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#D4A843] transition"
                  placeholder="e.g. sales, ads, email"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm transition">
                Cancel
              </button>
              <button
                onClick={addDoc}
                disabled={!form.title || !form.content || saving}
                className="px-6 py-2 rounded-lg bg-[#D4A843] text-black font-semibold text-sm hover:bg-[#c49a3a] transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
