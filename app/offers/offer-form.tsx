"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COPY_TYPES } from "@/lib/offers";

interface OfferData {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  avatar: string;
  trainingMaterial: string;
  copyTypes: string[];
}

const EMPTY: OfferData = {
  id: "",
  name: "",
  description: "",
  priceRange: "",
  avatar: "",
  trainingMaterial: "",
  copyTypes: COPY_TYPES.map((c) => c.id),
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
}

export default function OfferForm({ editId }: { editId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<OfferData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(!editId);
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (!editId) return;
    fetch("/api/offers")
      .then((r) => r.json())
      .then((offers: OfferData[]) => {
        const o = offers.find((x) => x.id === editId);
        if (o) {
          setForm({ ...EMPTY, ...o, trainingMaterial: o.trainingMaterial || "", copyTypes: o.copyTypes || COPY_TYPES.map((c) => c.id) });
          setAutoSlug(false);
        }
        setLoaded(true);
      });
  }, [editId]);

  const update = (key: keyof OfferData, val: string | string[]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "name" && autoSlug && !editId) next.id = slugify(val as string);
      return next;
    });
  };

  const toggleCopyType = (id: string) => {
    setForm((prev) => ({
      ...prev,
      copyTypes: prev.copyTypes.includes(id) ? prev.copyTypes.filter((c) => c !== id) : [...prev.copyTypes, id],
    }));
  };

  const save = async () => {
    if (!form.id || !form.name) {
      setError("Name and ID are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      router.push("/offers");
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-neutral-500">Loading...</div>;

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded bg-gold-500 flex items-center justify-center font-bold text-black text-sm">OL</div>
              <h1 className="text-lg font-semibold tracking-tight">
                Copy Machine <span className="text-neutral-500 font-normal text-sm">by OfferLaunch</span>
              </h1>
            </Link>
          </div>
          <Link
            href="/offers"
            className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition"
          >
            ← Back to Offers
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-8">{editId ? "Edit Offer" : "New Offer"}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Offer Name *</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Ecom Accelerator"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Short ID / Slug *{" "}
                {!editId && <span className="text-neutral-600 font-normal">(auto-generated)</span>}
              </label>
              <input
                value={form.id}
                onChange={(e) => { setAutoSlug(false); update("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }}
                disabled={!!editId}
                placeholder="e.g. ex"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition disabled:opacity-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="What is this offer? What does the client get?"
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Price Range</label>
                <input
                  value={form.priceRange}
                  onChange={(e) => update("priceRange", e.target.value)}
                  placeholder="e.g. $15,000 - $35,000"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Target Avatar</label>
                <input
                  value={form.avatar}
                  onChange={(e) => update("avatar", e.target.value)}
                  placeholder="Who is the ideal buyer?"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Training Material <span className="text-neutral-600">fed to Claude as context</span>
              </label>
              <textarea
                value={form.trainingMaterial}
                onChange={(e) => update("trainingMaterial", e.target.value)}
                placeholder="Paste VSL scripts, sales frameworks, email swipes, objection handles, etc. This gets appended to the system prompt when generating copy for this offer."
                rows={8}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition resize-y"
              />
              <p className="text-xs text-neutral-600 mt-1">{form.trainingMaterial.length.toLocaleString()} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">Enabled Copy Types</label>
              <div className="grid grid-cols-2 gap-2">
                {COPY_TYPES.map((ct) => (
                  <label
                    key={ct.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${
                      form.copyTypes.includes(ct.id)
                        ? "border-gold-500/50 bg-gold-500/5"
                        : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.copyTypes.includes(ct.id)}
                      onChange={() => toggleCopyType(ct.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        form.copyTypes.includes(ct.id) ? "bg-gold-500 border-gold-500" : "border-neutral-600"
                      }`}
                    >
                      {form.copyTypes.includes(ct.id) && (
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-white">{ct.name}</span>
                      <p className="text-xs text-neutral-500">{ct.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-4">
              <button
                onClick={save}
                disabled={saving}
                className="px-8 py-3 rounded-lg bg-gold-500 text-black font-semibold text-sm hover:bg-gold-400 transition active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Saving..." : editId ? "Update Offer" : "Create Offer"}
              </button>
              <Link
                href="/offers"
                className="px-6 py-3 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm font-medium transition"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-neutral-400 mb-3">Preview</h3>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 sticky top-8">
              {form.name ? (
                <>
                  <h4 className="font-semibold text-white mb-1">{form.name}</h4>
                  {form.priceRange && <span className="text-xs text-gold-400">{form.priceRange}</span>}
                  {form.id && <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-500 font-mono ml-2">{form.id}</span>}
                  {form.description && <p className="text-sm text-neutral-400 mt-3">{form.description}</p>}
                  {form.avatar && (
                    <p className="text-xs text-neutral-500 mt-3">
                      <span className="text-neutral-600">Avatar:</span> {form.avatar}
                    </p>
                  )}
                  {form.trainingMaterial && (
                    <div className="mt-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-gold-500/10 text-gold-400">
                        {form.trainingMaterial.length.toLocaleString()} chars of training material
                      </span>
                    </div>
                  )}
                  {form.copyTypes.length > 0 && form.copyTypes.length < COPY_TYPES.length && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {form.copyTypes.map((id) => {
                        const ct = COPY_TYPES.find((c) => c.id === id);
                        return ct ? (
                          <span key={id} className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            {ct.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-neutral-600 text-sm">Start filling in the form to see a preview.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
