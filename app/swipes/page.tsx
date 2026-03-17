"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface Swipe {
  id: string;
  type: "text" | "image" | "link";
  title?: string;
  tags: string[];
  offerId?: string;
  copyTypeId?: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  savedAt: string;
  source: "generated" | "manual";
}

interface OfferItem {
  id: string;
  name: string;
}

const COPY_TYPE_NAMES: Record<string, string> = {
  vsl: "VSL Script",
  ads: "Ad Copy",
  emails: "Email Sequence",
  landing: "Landing Page",
  objections: "Objection Handlers",
  texts: "Follow-up Texts",
  onepager: "One-Pager",
  social: "Social Posts",
};

export default function SwipesPage() {
  const [swipes, setSwipes] = useState<Swipe[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [filterOffer, setFilterOffer] = useState("");
  const [filterType, setFilterType] = useState<"" | "text" | "image" | "link">("");
  const [filterTag, setFilterTag] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/swipes").then((r) => r.json()).then(setSwipes).catch(() => {});
    fetch("/api/offers").then((r) => r.json()).then(setOffers).catch(() => {});
  }, []);

  const deleteSwipe = async (id: string) => {
    await fetch(`/api/swipes?id=${id}`, { method: "DELETE" });
    setSwipes((prev) => prev.filter((s) => s.id !== id));
  };

  const offerName = (id?: string) => {
    if (!id || id === "general") return "General";
    return offers.find((o) => o.id === id)?.name || id;
  };

  const allTags = Array.from(new Set(swipes.flatMap((s) => s.tags || [])));

  const filtered = swipes.filter((s) => {
    if (filterOffer && s.offerId !== filterOffer) return false;
    if (filterType && s.type !== filterType) return false;
    if (filterTag && !(s.tags || []).includes(filterTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [s.content, s.title, s.linkUrl, ...(s.tags || [])].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const onSwipeAdded = (swipe: Swipe) => {
    setSwipes((prev) => [...prev, swipe]);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#D4A843] flex items-center justify-center font-bold text-black text-sm">OL</div>
            <h1 className="text-lg font-semibold tracking-tight">
              Copy Machine <span className="text-neutral-500 font-normal text-sm">by OfferLaunch</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition">
              Generate
            </Link>
            <Link href="/offers" className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition">
              Offers
            </Link>
            <span className="px-4 py-1.5 rounded-md text-sm font-medium bg-[#D4A843] text-black">
              Swipes
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl font-semibold">Swipe Vault</h2>
          <span className="text-sm text-neutral-500">{swipes.length} saved</span>
          <div className="flex-1" />
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 rounded-lg bg-[#D4A843] text-black font-semibold text-sm hover:bg-[#c49a3a] transition active:scale-[0.98]"
          >
            + Add Swipe
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterOffer}
            onChange={(e) => setFilterOffer(e.target.value)}
            className="bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:border-[#D4A843] outline-none"
          >
            <option value="">All Offers</option>
            <option value="general">General</option>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          <div className="flex gap-1 bg-neutral-800/50 rounded-lg p-1">
            {(["", "text", "image", "link"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filterType === t ? "bg-[#D4A843] text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:border-[#D4A843] outline-none"
            >
              <option value="">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search swipes..."
            className="flex-1 min-w-[200px] bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2 text-white text-sm placeholder-neutral-600 focus:border-[#D4A843] outline-none"
          />
        </div>

        {/* Card Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-600">
            No swipes yet. Generate copy and hit 👍, or click &quot;Add Swipe&quot; to build your reference library.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div key={s.id} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 group flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      s.type === "text" ? "bg-blue-500/20 text-blue-400" :
                      s.type === "image" ? "bg-purple-500/20 text-purple-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {s.type}
                    </span>
                    <span className="text-xs text-neutral-600">{new Date(s.savedAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => deleteSwipe(s.id)}
                    className="text-xs text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>

                {s.title && <h4 className="text-sm font-medium text-white mb-1">{s.title}</h4>}
                
                <div className="text-xs text-neutral-500 mb-2">
                  {offerName(s.offerId)} {s.copyTypeId && s.copyTypeId !== "any" ? `· ${COPY_TYPE_NAMES[s.copyTypeId] || s.copyTypeId}` : ""}
                </div>

                {/* Content based on type */}
                <div className="flex-1 min-h-0">
                  {s.type === "text" && s.content && (
                    <div className="text-sm text-neutral-300 leading-relaxed">
                      {expandedId === s.id ? (
                        <pre className="whitespace-pre-wrap font-sans max-h-96 overflow-auto">{s.content}</pre>
                      ) : (
                        <p className="line-clamp-4">{s.content.slice(0, 200)}{s.content.length > 200 ? "..." : ""}</p>
                      )}
                      {s.content.length > 200 && (
                        <button
                          onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                          className="text-[#D4A843] text-xs mt-1 hover:underline"
                        >
                          {expandedId === s.id ? "Show less" : "Expand"}
                        </button>
                      )}
                    </div>
                  )}

                  {s.type === "image" && s.imageUrl && (
                    <div>
                      <img
                        src={s.imageUrl}
                        alt={s.title || "Swipe image"}
                        className="rounded-lg max-h-40 w-full object-cover cursor-pointer hover:opacity-80 transition"
                        onClick={() => setExpandedImage(s.imageUrl!)}
                      />
                    </div>
                  )}

                  {s.type === "link" && (
                    <div>
                      <a href={s.linkUrl} target="_blank" rel="noopener noreferrer" className="text-[#D4A843] text-xs hover:underline break-all">
                        {s.linkUrl}
                      </a>
                      {s.content && (
                        <p className="text-sm text-neutral-400 mt-1 line-clamp-3">{s.content.slice(0, 200)}{(s.content.length > 200) ? "..." : ""}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {s.tags && s.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.tags.map((tag) => (
                      <span key={tag} className="bg-[#D4A843]/20 text-[#D4A843] rounded-full px-3 py-1 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Swipe Modal */}
      {showModal && (
        <AddSwipeModal
          offers={offers}
          onClose={() => setShowModal(false)}
          onSave={onSwipeAdded}
        />
      )}

      {/* Image Lightbox */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} alt="Expanded" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
}

function AddSwipeModal({ offers, onClose, onSave }: { offers: OfferItem[]; onClose: () => void; onSave: (s: Swipe) => void }) {
  const [type, setType] = useState<"text" | "image" | "link">("text");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [offerId, setOfferId] = useState("general");
  const [copyTypeId, setCopyTypeId] = useState("any");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
    } catch {}
    setUploading(false);
  };

  const handleFetchLink = async () => {
    if (!linkUrl) return;
    setFetching(true);
    try {
      const res = await fetch("/api/fetch-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkUrl }),
      });
      const data = await res.json();
      if (data.content) setContent(data.content);
    } catch {}
    setFetching(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/swipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title || undefined,
          tags: tagList,
          offerId: offerId || "general",
          copyTypeId: copyTypeId || "any",
          content: content || undefined,
          imageUrl: imageUrl || undefined,
          linkUrl: linkUrl || undefined,
          source: "manual",
        }),
      });
      const swipe = await res.json();
      onSave(swipe);
    } catch {}
    setSaving(false);
  };

  const canSave = type === "text" ? !!content : type === "image" ? !!imageUrl : !!linkUrl;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-neutral-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Add Swipe</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">✕</button>
        </div>

        {/* Type selector */}
        <div className="flex gap-1 bg-neutral-800/50 rounded-lg p-1 mb-5">
          {(["text", "image", "link"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                type === t ? "bg-[#D4A843] text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm text-neutral-400 mb-1">Title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Killer Facebook ad from competitor"
            className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-600 focus:border-[#D4A843] outline-none"
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm text-neutral-400 mb-1">Tags (comma-separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. ad, facebook, competitor"
            className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-600 focus:border-[#D4A843] outline-none"
          />
        </div>

        {/* Offer + Copy Type */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Offer</label>
            <select
              value={offerId}
              onChange={(e) => setOfferId(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#D4A843] outline-none"
            >
              <option value="general">General</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Copy Type</label>
            <select
              value={copyTypeId}
              onChange={(e) => setCopyTypeId(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#D4A843] outline-none"
            >
              <option value="any">Any</option>
              {Object.entries(COPY_TYPE_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type-specific content */}
        {type === "text" && (
          <div className="mb-5">
            <label className="block text-sm text-neutral-400 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your swipe copy here..."
              rows={8}
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-3 text-white text-sm placeholder-neutral-600 focus:border-[#D4A843] outline-none resize-none"
            />
          </div>
        )}

        {type === "image" && (
          <div className="mb-5">
            <label className="block text-sm text-neutral-400 mb-1">Image</label>
            <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f);
            }} />
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Preview" className="rounded-lg max-h-48 w-full object-cover" />
                <button onClick={() => { setImageUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 bg-black/60 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs hover:bg-red-500/80">✕</button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[#D4A843]"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("border-[#D4A843]"); }}
                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-[#D4A843]"); const f = e.dataTransfer.files[0]; if (f) handleImageUpload(f); }}
                className="border-2 border-dashed border-[#333] hover:border-[#D4A843] rounded-lg p-8 text-center cursor-pointer transition"
              >
                {uploading ? (
                  <p className="text-neutral-400 text-sm">Uploading...</p>
                ) : (
                  <>
                    <p className="text-neutral-400 text-sm mb-1">Drop image here or click to upload</p>
                    <p className="text-neutral-600 text-xs">PNG, JPG, GIF, WEBP</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {type === "link" && (
          <div className="mb-5">
            <label className="block text-sm text-neutral-400 mb-1">URL</label>
            <div className="flex gap-2">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/great-ad"
                className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-600 focus:border-[#D4A843] outline-none"
              />
              <button
                onClick={handleFetchLink}
                disabled={!linkUrl || fetching}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  linkUrl && !fetching ? "bg-[#D4A843] text-black hover:bg-[#c49a3a]" : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                }`}
              >
                {fetching ? "..." : "Fetch"}
              </button>
            </div>
            {content && (
              <div className="mt-3 bg-[#1A1A1A] border border-[#333] rounded-lg p-3 max-h-40 overflow-auto">
                <p className="text-xs text-neutral-500 mb-1">Extracted content:</p>
                <p className="text-sm text-neutral-300 whitespace-pre-wrap">{content.slice(0, 500)}{content.length > 500 ? "..." : ""}</p>
              </div>
            )}
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition ${
            canSave && !saving ? "bg-[#D4A843] text-black hover:bg-[#c49a3a]" : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving..." : "Save Swipe"}
        </button>
      </div>
    </div>
  );
}
