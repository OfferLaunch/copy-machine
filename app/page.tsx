"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { COPY_TYPES } from "@/lib/offers";
import Link from "next/link";

interface OfferItem {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  avatar: string;
}

export default function Home() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [offerId, setOfferId] = useState("");
  const [copyTypeId, setCopyTypeId] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [promo, setPromo] = useState("");
  const [avatar, setAvatar] = useState("");
  const [angle, setAngle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customPieces, setCustomPieces] = useState<number | "">("");
  const [customTone, setCustomTone] = useState("");
  const [customLength, setCustomLength] = useState("");
  const [customOtherDetails, setCustomOtherDetails] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"generate" | "autopilot">("generate");
  const [feedback, setFeedback] = useState("");
  const [thumbs, setThumbs] = useState<"up" | "down" | null>(null);
  const [savingSwipe, setSavingSwipe] = useState(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  // Highlight-to-feedback state
  const [selectedText, setSelectedText] = useState("");
  const [sectionFeedback, setSectionFeedback] = useState("");
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/offers").then((r) => r.json()).then(setOffers).catch(() => {});
  }, []);

  const generate = useCallback(async (opts?: {
    feedbackText?: string;
    previousOutput?: string;
    selectedText?: string;
    sectionFeedback?: string;
    mode?: "full" | "section";
  }) => {
    if (!offerId || !copyTypeId) return;
    setLoading(true);
    setOutput("");
    setCopied(false);
    setThumbs(null);

    abortRef.current = new AbortController();

    let details = customDetails || "";
    if (opts?.mode !== "section" && opts?.feedbackText && opts?.previousOutput) {
      details = (details ? details + "\n\n" : "") +
        `FEEDBACK ON PREVIOUS OUTPUT: ${opts.feedbackText}\n\nPREVIOUS OUTPUT:\n${opts.previousOutput}\n\nRewrite incorporating this feedback.`;
    }

    const payload: Record<string, any> = { offerId, copyTypeId, customDetails: details, promo, avatar, angle };
    if (copyTypeId === "custom") {
      payload.customPrompt = customPrompt;
      payload.customParams = {
        pieces: customPieces || undefined,
        tone: customTone || undefined,
        length: customLength || undefined,
        otherDetails: customOtherDetails || undefined,
      };
    }
    if (opts?.mode === "section") {
      payload.mode = "section";
      payload.previousOutput = opts.previousOutput;
      payload.selectedText = opts.selectedText;
      payload.sectionFeedback = opts.sectionFeedback;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
  }, [offerId, copyTypeId, customDetails, promo, avatar, angle, customPrompt, customPieces, customTone, customLength, customOtherDetails]);

  const stop = () => abortRef.current?.abort();

  const handleThumbsUp = async () => {
    if (thumbs === "up") { setThumbs(null); return; }
    setThumbs("up");
    setSavingSwipe(true);
    const copyTypeName = COPY_TYPES.find((c) => c.id === copyTypeId)?.name || copyTypeId;
    try {
      await fetch("/api/swipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          tags: ["generated", copyTypeName],
          offerId,
          copyTypeId,
          content: output,
          source: "generated",
        }),
      });
    } catch {}
    setSavingSwipe(false);
  };

  const handleRegenerate = () => {
    if (!feedback.trim()) return;
    const prev = output;
    const fb = feedback;
    setFeedback("");
    setShowFeedbackPanel(false);
    // Save feedback to persistent log
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, copyTypeId, feedback: fb, context: prev?.slice(0, 200) }),
    }).catch(() => {});
    generate({ feedbackText: fb, previousOutput: prev });
  };

  const handleSectionRewrite = () => {
    if (!sectionFeedback.trim() || !selectedText) return;
    const prev = output;
    const sel = selectedText;
    const fb = sectionFeedback;
    setSectionFeedback("");
    setSelectedText("");
    setPopoverPos(null);
    // Save feedback to persistent log
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, copyTypeId, feedback: fb, context: sel?.slice(0, 200) }),
    }).catch(() => {});
    generate({ mode: "section", previousOutput: prev, selectedText: sel, sectionFeedback: fb });
  };

  const handleSave = () => {
    const offerName = offers.find((o) => o.id === offerId)?.name || "copy";
    const copyTypeName = copyTypeId === "custom" ? "custom" : (COPY_TYPES.find((c) => c.id === copyTypeId)?.name || "output");
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${offerName}-${copyTypeName}-${ts}.txt`.replace(/\s+/g, "-");
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle text selection in output for highlight-to-feedback
  const handleOutputMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !outputRef.current) {
      return;
    }
    const text = selection.toString().trim();
    if (!text) return;
    // Check selection is within output div
    const range = selection.getRangeAt(0);
    if (!outputRef.current.contains(range.commonAncestorContainer)) return;
    const rect = range.getBoundingClientRect();
    const containerRect = outputRef.current.getBoundingClientRect();
    setSelectedText(text);
    setSectionFeedback("");
    setPopoverPos({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.bottom - containerRect.top + 8,
    });
  }, []);

  // Dismiss popover on Escape or click outside
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPopoverPos(null); setSelectedText(""); }
    };
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverPos(null);
        setSelectedText("");
      }
    };
    if (popoverPos) {
      document.addEventListener("keydown", handleKey);
      setTimeout(() => document.addEventListener("mousedown", handleClick), 100);
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.removeEventListener("mousedown", handleClick);
      };
    }
  }, [popoverPos]);

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
          <div className="flex items-center gap-4">
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
            <Link
              href="/offers"
              className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition"
            >
              Offers
            </Link>
            <Link
              href="/swipes"
              className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition"
            >
              Swipes
            </Link>
            <Link
              href="/knowledge"
              className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 transition"
            >
              Knowledge
            </Link>
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
                  {offers.map((o) => (
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
                  <option disabled>──────────</option>
                  <option value="custom">✨ Custom</option>
                </select>
                {selectedCopyType && (
                  <p className="text-xs text-neutral-500 mt-1.5">
                    {selectedCopyType.description}
                    {"useOpus" in selectedCopyType && (selectedCopyType as any).useOpus && (
                      <span className="text-gold-400 ml-1">(Uses Opus for premium quality)</span>
                    )}
                  </p>
                )}
                {copyTypeId === "custom" && (
                  <p className="text-xs text-neutral-500 mt-1.5">Describe exactly what you need and we&apos;ll generate it.</p>
                )}
              </div>

              {/* Custom Copy Type Fields */}
              {copyTypeId === "custom" && (
                <div className="space-y-4 bg-[#1A1A1A] border border-[#333] rounded-xl p-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">What do you need?</label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g. 5-email no-show follow-up sequence, webinar reminder series, win-back campaign for churned clients..."
                      rows={3}
                      className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] outline-none transition resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                        Pieces <span className="text-neutral-600">optional</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={customPieces}
                        onChange={(e) => setCustomPieces(e.target.value ? parseInt(e.target.value) : "")}
                        placeholder="e.g. 5"
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-[#D4A843] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                        Tone <span className="text-neutral-600">optional</span>
                      </label>
                      <select
                        value={customTone}
                        onChange={(e) => setCustomTone(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#D4A843] transition"
                      >
                        <option value="">Any</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Casual">Casual</option>
                        <option value="Professional">Professional</option>
                        <option value="Aggressive">Aggressive</option>
                        <option value="Empathetic">Empathetic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                        Length <span className="text-neutral-600">optional</span>
                      </label>
                      <select
                        value={customLength}
                        onChange={(e) => setCustomLength(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#D4A843] transition"
                      >
                        <option value="">Any</option>
                        <option value="Short">Short</option>
                        <option value="Medium">Medium</option>
                        <option value="Long">Long</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Other details <span className="text-neutral-600">optional</span>
                    </label>
                    <textarea
                      value={customOtherDetails}
                      onChange={(e) => setCustomOtherDetails(e.target.value)}
                      placeholder="Any other parameters or instructions..."
                      rows={2}
                      className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-[#D4A843] transition resize-none"
                    />
                  </div>
                </div>
              )}

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
                  onClick={() => generate()}
                  disabled={!offerId || !copyTypeId || loading || (copyTypeId === "custom" && !customPrompt.trim())}
                  className={`flex-1 py-3 rounded-lg font-semibold text-sm transition ${
                    !offerId || !copyTypeId || (copyTypeId === "custom" && !customPrompt.trim())
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
              </div>
              <div
                ref={outputRef}
                onMouseUp={handleOutputMouseUp}
                className="relative flex-1 min-h-[500px] bg-neutral-900/50 border border-neutral-800 rounded-lg p-5 overflow-auto"
              >
                {output ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-200 leading-relaxed select-text">{output}</pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
                    Select an offer and copy type, then hit Generate.
                  </div>
                )}

                {/* Highlight-to-Feedback Popover */}
                {popoverPos && selectedText && (
                  <div
                    ref={popoverRef}
                    className="absolute z-50 w-72 bg-[#1A1A1A] border border-[#333] rounded-xl shadow-2xl p-3"
                    style={{
                      left: `${Math.min(popoverPos.x - 144, (outputRef.current?.clientWidth || 300) - 290)}px`,
                      top: `${popoverPos.y}px`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-neutral-400">Rewrite selection</span>
                      <button
                        onClick={() => { setPopoverPos(null); setSelectedText(""); }}
                        className="text-neutral-500 hover:text-white text-sm leading-none"
                      >✕</button>
                    </div>
                    <textarea
                      value={sectionFeedback}
                      onChange={(e) => setSectionFeedback(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSectionRewrite(); } }}
                      placeholder="What should change about this?"
                      rows={3}
                      className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none resize-none focus:border-[#D4A843] transition"
                      autoFocus
                    />
                    <button
                      onClick={handleSectionRewrite}
                      disabled={!sectionFeedback.trim()}
                      className={`mt-2 w-full py-1.5 rounded-lg text-sm font-medium transition ${
                        sectionFeedback.trim()
                          ? "bg-[#D4A843] text-black hover:bg-[#c49a3a]"
                          : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                      }`}
                    >
                      Rewrite Section
                    </button>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              {output && !loading && (
                <>
                  <div className="mt-3 flex items-center justify-between bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSave}
                        title="Download as .txt"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-[#D4A843] border border-transparent hover:border-[#D4A843]/30 transition"
                      >
                        <span>💾</span>
                        <span className="text-xs">{savedToast ? "Saved!" : "Save"}</span>
                      </button>
                      <button
                        onClick={copyToClipboard}
                        title="Copy to clipboard"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-[#D4A843] border border-transparent hover:border-[#D4A843]/30 transition"
                      >
                        <span>📋</span>
                        <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>
                      </button>
                      <button
                        onClick={handleThumbsUp}
                        title="Save to Swipe Vault"
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${thumbs === "up" ? "text-[#D4A843]" : "text-neutral-400 hover:text-[#D4A843]"}`}
                      >
                        {savingSwipe ? "⏳" : "👍"}
                      </button>
                      <button
                        onClick={() => setThumbs(thumbs === "down" ? null : "down")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${thumbs === "down" ? "text-red-500" : "text-neutral-400 hover:text-red-500"}`}
                      >
                        👎
                      </button>
                    </div>
                    <button
                      onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                        showFeedbackPanel ? "text-[#D4A843] border border-[#D4A843]/30" : "text-neutral-400 hover:text-[#D4A843] border border-transparent hover:border-[#D4A843]/30"
                      }`}
                    >
                      <span>💬</span>
                      <span className="text-xs">Feedback</span>
                    </button>
                  </div>

                  {/* Feedback Panel */}
                  {showFeedbackPanel && (
                    <div className="mt-2 bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-3 space-y-3">
                      <input
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRegenerate()}
                        placeholder="What should change overall?"
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-[#D4A843] transition"
                      />
                      <button
                        onClick={handleRegenerate}
                        disabled={!feedback.trim()}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                          feedback.trim()
                            ? "bg-[#D4A843] text-black hover:bg-[#c49a3a]"
                            : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                        }`}
                      >
                        Regenerate All
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
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
