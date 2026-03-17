"use client";

import { useState, useRef, useCallback } from "react";
import { OFFERS, COPY_TYPES } from "@/lib/offers";

export default function Home() {
  const [offerId, setOfferId] = useState("");
  const [copyTypeId, setCopyTypeId] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [promo, setPromo] = useState("");
  const [avatar, setAvatar] = useState("");
  const [angle, setAngle] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"generate" | "autopilot">("generate");
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    if (!offerId || !copyTypeId) return;
    setLoading(true);
    setOutput("");
    setCopied(false);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, copyTypeId, customDetails, promo, avatar, angle }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) setOutput((prev) => prev + parsed.text);
            if (parsed.error) setOutput((prev) => prev + `\n\nError: ${parsed.error}`);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setOutput((prev) => prev + `\n\nError: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [offerId, copyTypeId, customDetails, promo, avatar, angle]);

  const stop = () => abortRef.current?.abort();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedCopyType = COPY_TYPES.find((c) => c.id === copyTypeId);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gold-500 flex items-center justify-center font-bold text-black text-sm">OL</div>
            <h1 className="text-lg font-semibold tracking-tight">
              Copy Machine <span className="text-neutral-500 font-normal text-sm">by OfferLaunch</span>
            </h1>
          </div>
          <div className="flex gap-1 bg-neutral-800/50 rounded-lg p-1">
            <button
              onClick={() => setTab("generate")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                tab === "generate" ? "bg-gold-500 text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setTab("autopilot")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                tab === "autopilot" ? "bg-gold-500 text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              Autopilot
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === "generate" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Controls */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Offer</label>
                <select
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
                >
                  <option value="">Select an offer...</option>
                  {OFFERS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.priceRange})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Copy Type</label>
                <select
                  value={copyTypeId}
                  onChange={(e) => setCopyTypeId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
                >
                  <option value="">Select copy type...</option>
                  {COPY_TYPES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {selectedCopyType && (
                  <p className="text-xs text-neutral-500 mt-1.5">
                    {selectedCopyType.description}
                    {"useOpus" in selectedCopyType && (selectedCopyType as any).useOpus && (
                      <span className="text-gold-400 ml-1">(Uses Opus for premium quality)</span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Custom Details <span className="text-neutral-600">optional</span>
                </label>
                <textarea
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="Any specific details, stats, testimonials, or context..."
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Promo / Offer <span className="text-neutral-600">optional</span>
                  </label>
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="e.g. $5K off this week only"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Target Avatar <span className="text-neutral-600">optional</span>
                  </label>
                  <input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="e.g. Ex-corporate, 40s, $100K saved"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Specific Angle <span className="text-neutral-600">optional</span>
                </label>
                <input
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  placeholder="e.g. Fear of missing out, urgency, social proof heavy"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={generate}
                  disabled={!offerId || !copyTypeId || loading}
                  className={`flex-1 py-3 rounded-lg font-semibold text-sm transition ${
                    !offerId || !copyTypeId
                      ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                      : loading
                      ? "bg-gold-600 text-black animate-pulse-gold cursor-wait"
                      : "bg-gold-500 text-black hover:bg-gold-400 active:scale-[0.98]"
                  }`}
                >
                  {loading ? "Generating..." : "Generate Copy"}
                </button>
                {loading && (
                  <button
                    onClick={stop}
                    className="px-6 py-3 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm font-medium transition"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Right: Output */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-neutral-400">Output</h2>
                {output && (
                  <button
                    onClick={copyToClipboard}
                    className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
                  >
                    {copied ? "✓ Copied" : "Copy All"}
                  </button>
                )}
              </div>
              <div className="flex-1 min-h-[500px] bg-neutral-900/50 border border-neutral-800 rounded-lg p-5 overflow-auto">
                {output ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-200 leading-relaxed">{output}</pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
                    Select an offer and copy type, then hit Generate.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Autopilot Tab */
          <AutopilotPanel />
        )}
      </main>
    </div>
  );
}

function AutopilotPanel() {
  const QUEUE_ITEMS = [
    { type: "Ad Copy", offer: "Ecom Accelerator", freq: "Daily", desc: "5 fresh ad variations every morning" },
    { type: "Email", offer: "Algo Exchange", freq: "Weekly", desc: "Weekly nurture email for the sequence" },
    { type: "VSL Hooks", offer: "All Offers", freq: "Weekly", desc: "10 new VSL opening hooks" },
    { type: "Objection Handlers", offer: "All Offers", freq: "Bi-weekly", desc: "Updated rebuttals based on common objections" },
    { type: "Social Posts", offer: "All Offers", freq: "Daily", desc: "3 posts per platform per day" },
    { type: "Follow-up Texts", offer: "Ecom Accelerator", freq: "Weekly", desc: "New text sequences for no-shows and follow-ups" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Autopilot Mode</h2>
        <p className="text-neutral-500 text-sm">
          Automated copy generation queue. Set it and forget it. Fresh copy lands in your inbox on schedule.
        </p>
      </div>

      <div className="space-y-3">
        {QUEUE_ITEMS.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-neutral-900/50 border border-neutral-800 rounded-lg px-5 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-medium text-white">{item.type}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">{item.offer}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gold-500/10 text-gold-400">{item.freq}</span>
              </div>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-neutral-700 rounded-full peer peer-checked:bg-gold-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 border border-dashed border-neutral-700 rounded-lg text-center">
        <p className="text-neutral-500 text-sm">
          Autopilot runs are delivered to your configured email or webhook.
          <br />
          <span className="text-neutral-600">Configuration coming soon. For now, use the Generate tab.</span>
        </p>
      </div>
    </div>
  );
}
