"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Offer {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  avatar: string;
  trainingMaterial?: string;
  copyTypes?: string[];
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data) => { setOffers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch("/api/offers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setOffers((prev) => prev.filter((o) => o.id !== id));
    setDeleting(null);
  };

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
            href="/"
            className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition"
          >
            ← Back to Generate
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Offer Manager</h2>
            <p className="text-neutral-500 text-sm mt-1">Manage your offers and their training materials.</p>
          </div>
          <Link
            href="/offers/new"
            className="px-5 py-2.5 rounded-lg bg-gold-500 text-black font-semibold text-sm hover:bg-gold-400 transition active:scale-[0.98]"
          >
            + Add New Offer
          </Link>
        </div>

        {loading ? (
          <div className="text-neutral-500 text-center py-20">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="text-neutral-500 text-center py-20">
            No offers yet.{" "}
            <Link href="/offers/new" className="text-gold-400 hover:underline">
              Create your first offer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 flex flex-col hover:border-neutral-700 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{offer.name}</h3>
                    <span className="text-xs text-gold-400">{offer.priceRange}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-500 font-mono">{offer.id}</span>
                </div>

                <p className="text-sm text-neutral-400 mb-3 line-clamp-2 flex-1">{offer.description}</p>

                <div className="mb-4">
                  <p className="text-xs text-neutral-500">
                    <span className="text-neutral-600">Avatar:</span> {offer.avatar?.slice(0, 80)}
                    {(offer.avatar?.length || 0) > 80 ? "..." : ""}
                  </p>
                </div>

                {offer.trainingMaterial && (
                  <div className="mb-4">
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-500/10 text-gold-400">Has training material</span>
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-3 border-t border-neutral-800">
                  <Link
                    href={`/offers/${offer.id}/edit`}
                    className="flex-1 text-center py-2 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(offer.id, offer.name)}
                    disabled={deleting === offer.id}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                  >
                    {deleting === offer.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
