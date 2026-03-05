"use client";

import { useState, useEffect } from "react";

interface ReviewResult {
  id: string;
  url: string;
  timestamp: string;
  strengths: string;
  improvements: string;
  score: string;
  summary?: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ReviewResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("review_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        if (parsed.length > 0) setActiveIndex(0);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("review_history", JSON.stringify(history));
  }, [history]);

  const handleReview = async () => {
    if (!url) {
      setError("Please enter a Google Docs link.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://fwai-assignment-review-4.onrender.com/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ google_docs_url: url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch review");
      }

      const data = await response.json();

      const newReview: ReviewResult = {
        id: Date.now().toString(),
        url: url,
        timestamp: new Date().toLocaleString(),
        ...data
      };

      const updatedHistory = [newReview, ...history].slice(0, 10); // Keep last 10
      setHistory(updatedHistory);
      setActiveIndex(0);
      setUrl("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const activeResult = activeIndex !== null ? history[activeIndex] : null;

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse" />

      {/* Sidebar - History */}
      <aside className="w-full md:w-80 border-r border-white/5 bg-white/[0.01] backdrop-blur-3xl p-6 flex flex-col z-20 overflow-y-auto max-h-screen md:h-screen sticky top-0">
        <div className="mb-10">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight italic uppercase">
            Sessions
          </h2>
          <p className="text-gray-500 text-[10px] mt-1 font-bold uppercase tracking-[0.2em] opacity-60">Intelligence Vault</p>
        </div>

        <div className="space-y-4 flex-1">
          {history.length === 0 ? (
            <div className="text-gray-700 text-xs text-center py-20 border border-dashed border-white/5 rounded-3xl">
              No intelligence logs yet.
            </div>
          ) : (
            history.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className={`w-full text-left p-5 rounded-3xl transition-all border outline-none group ${activeIndex === index
                  ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                  }`}
              >
                <div className="font-bold text-[10px] truncate text-gray-400 mb-3 opacity-60 italic group-hover:opacity-100 transition-opacity">
                  ID: {item.url.split('d/')[1]?.substring(0, 10) || 'REVI-LOG'}
                </div>
                <div className="flex justify-between items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black font-mono">
                      {item.timestamp.split(',')[0]}
                    </span>
                    <span className="text-[9px] text-gray-600 font-bold uppercase">
                      {item.timestamp.split(',')[1]?.trim() || ''}
                    </span>
                  </div>
                  <span className="text-sm font-black text-indigo-100 bg-indigo-500/30 px-3 py-1.5 rounded-xl border border-indigo-400/30 whitespace-nowrap shadow-lg shadow-indigo-500/10">
                    {item.score.length > 5 ? item.score.substring(0, 5) : item.score}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {history.length > 0 && (
          <button
            onClick={() => { if (confirm("Clear all review logs?")) { setHistory([]); setActiveIndex(null); localStorage.removeItem("review_history"); } }}
            className="mt-8 text-gray-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 px-2 py-4 border border-dashed border-white/5 rounded-2xl hover:border-red-500/20 hover:bg-red-500/5"
          >
            Clear Intelligence Vault
          </button>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto relative z-10 flex flex-col items-center">
        <div className="max-w-5xl w-full space-y-12 pb-20">
          {/* Header */}
          <header className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-2 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              AI Active Engine
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-700 leading-tight">
              Assignment Intelligence
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              Deep-learning analysis of academic assignments to maintain a continuous trajectory of growth.
            </p>
          </header>

          {/* Submission Card */}
          <div className="glass-card p-6 md:p-12 space-y-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-fade-in [animation-delay:200ms] border border-white/10 rounded-[3rem] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  placeholder="Paste public Google Docs URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-3xl px-8 py-6 text-white placeholder:text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-bold text-lg pr-16 group-hover:border-white/20"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-indigo-500 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>

              <button
                onClick={handleReview}
                disabled={loading}
                className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 hover:from-white hover:to-white hover:text-black text-white font-black px-12 py-6 rounded-3xl shadow-2xl shadow-indigo-500/30 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 whitespace-nowrap min-w-[240px] text-xl uppercase tracking-widest border border-white/10"
              >
                {loading ? (
                  <>
                    <div className="w-7 h-7 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                    Analyzing
                  </>
                ) : (
                  "Initiate Scan"
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-8 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest animate-shake text-center flex items-center justify-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* Result Display */}
          {activeResult ? (
            <div className="space-y-12 animate-fade-in [animation-delay:400ms] w-full">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-white/5 pb-10">
                <div className="space-y-6 flex-1 min-w-0">
                  <div className="space-y-2">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">Intelligence Report</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-500 text-xs font-bold tracking-widest uppercase">
                      <div className="hidden sm:block w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] shrink-0" />
                      <span className="shrink-0 text-white/40">Document ID:</span>
                      <span className="text-indigo-400 break-all font-mono opacity-80 hover:opacity-100 transition-opacity">
                        {activeResult.url}
                      </span>
                    </div>
                  </div>

                  {/* Summary Display with client-side split safeguard */}
                  {(() => {
                    const displaySummary = activeResult.summary || "";
                    // If summary is empty and score looks like it contains the summary (for older records)
                    let finalSummary = displaySummary;
                    let finalScore = activeResult.score;

                    if (!displaySummary && activeResult.score.includes(" ")) {
                      const parts = activeResult.score.split(/\s+/);
                      finalScore = parts[0];
                      finalSummary = parts.slice(1).join(" ").replace(/^\**\s*Overall,?\s*/i, "");
                    }

                    return finalSummary ? (
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 italic">
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed font-medium">
                          <span className="text-indigo-400 font-bold not-italic font-mono mr-2">OVR:</span>
                          {finalSummary.replace(/^\**\s*/, "")}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="bg-white/[0.04] border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl min-w-[200px] lg:self-start">
                  <div className="text-[10px] uppercase text-gray-600 font-black tracking-[0.4em] mb-4">Metric Score</div>
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient whitespace-nowrap leading-none pb-2">
                    {(() => {
                      // Extract just the number for the large display
                      const match = activeResult.score.match(/(\d+[\s\-/]*\d+)/);
                      return match ? match[1] : activeResult.score.split(' ')[0];
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-start">
                <section className="space-y-6">
                  <h3 className="text-green-500 font-black flex items-center gap-4 text-2xl tracking-tighter uppercase italic">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/10">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Engine Positives
                  </h3>
                  <div className="glass-card p-10 bg-white/[0.01] border-white/10 text-gray-300 whitespace-pre-wrap leading-[1.8] rounded-[3rem] text-lg shadow-2xl relative overflow-hidden group hover:border-green-500/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500/10 group-hover:bg-green-500/40 transition-all" />
                    {activeResult.strengths}
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-amber-500 font-black flex items-center gap-4 text-2xl tracking-tighter uppercase italic">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Vector Alignment
                  </h3>
                  <div className="glass-card p-10 bg-white/[0.01] border-white/10 text-gray-300 whitespace-pre-wrap leading-[1.8] rounded-[3rem] text-lg shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/10 group-hover:bg-amber-500/40 transition-all" />
                    {activeResult.improvements}
                  </div>
                </section>
              </div>
            </div>

          ) : !loading && (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Ready for your first analysis</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
