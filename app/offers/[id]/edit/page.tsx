"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import OfferForm from "../../offer-form";

interface FeedbackEntry {
  id: string;
  offerId: string;
  copyTypeId?: string;
  feedback: string;
  context?: string;
  createdAt: string;
}

export default function EditOfferPage() {
  const params = useParams();
  const offerId = params.id as string;
  const [tab, setTab] = useState<"edit" | "feedback">("edit");
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [loadingFb, setLoadingFb] = useState(false);

  useEffect(() => {
    if (tab === "feedback") {
      setLoadingFb(true);
      fetch(`/api/feedback?offerId=${offerId}`)
        .then((r) => r.json())
        .then(setFeedbackEntries)
        .catch(() => {})
        .finally(() => setLoadingFb(false));
    }
  }, [tab, offerId]);

  const deleteFeedback = async (id: string) => {
    await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
    setFeedbackEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      {/* Tab switcher above the form */}
      <div className="max-w-4xl mx-auto px-6 pt-4">
        <div className="flex gap-1 bg-neutral-800/50 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("edit")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === "edit" ? "bg-[#D4A843] text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Edit Offer
          </button>
          <button
            onClick={() => setTab("feedback")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === "feedback" ? "bg-[#D4A843] text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Feedback Log ({feedbackEntries.length || "…"})
          </button>
        </div>
      </div>

      {tab === "edit" ? (
        <OfferForm editId={offerId} />
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h2 className="text-xl font-semibold mb-2">Feedback Log</h2>
          <p className="text-neutral-500 text-sm mb-6">
            These are style preferences learned from your feedback. They&apos;re included in every generation for this offer.
            Remove entries that are no longer relevant.
          </p>

          {loadingFb ? (
            <p className="text-neutral-500">Loading...</p>
          ) : feedbackEntries.length === 0 ? (
            <div className="text-center py-16 text-neutral-600">
              <p className="text-lg mb-2">No feedback yet</p>
              <p className="text-sm">When you provide feedback during generation, it&apos;ll show up here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-lg px-5 py-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white mb-1">&ldquo;{entry.feedback}&rdquo;</p>
                    {entry.context && (
                      <p className="text-xs text-neutral-500 truncate">
                        Re: {entry.context}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {entry.copyTypeId && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A843]/20 text-[#D4A843]">
                          {entry.copyTypeId}
                        </span>
                      )}
                      <span className="text-xs text-neutral-600">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFeedback(entry.id)}
                    className="text-neutral-600 hover:text-red-400 text-sm transition flex-shrink-0"
                    title="Remove this feedback"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
