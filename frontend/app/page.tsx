"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ReportResult {
  id: string;
  filename: string;
  timestamp: string;
  score: string;
  summary: string;
  strengths: string[];
  weak_areas: string[];
  concept_understanding: string;
  structure_clarity: string;
  grammar_writing_quality: string;
  suggestions_for_improvement: string[];
  improved_version_suggestions: string;
}

const BACKEND_URL = "https://fwai-assignment-review-4.onrender.com";

function ScoreBadge({ score }: { score: string }) {
  const num = parseInt(score.split("/")[0]) || 0;
  const color =
    num >= 8 ? "#00E5FF" : num >= 6 ? "#7C5CFF" : num >= 4 ? "#FFAD00" : "#FF4D4D";
  return (
    <div
      className="score-badge"
      style={{ "--score-color": color } as React.CSSProperties}
    >
      <div className="score-label">SCORE</div>
      <div className="score-value" style={{ color }}>
        {score}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-card" style={{ "--accent": color } as React.CSSProperties}>
      <div className="section-header">
        <span className="section-icon" style={{ color }}>
          {icon}
        </span>
        <h3 className="section-title" style={{ color }}>
          {title}
        </h3>
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [history, setHistory] = useState<ReportResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("assignment_vault");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) setActiveIndex(0);
      } catch {}
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("assignment_vault", JSON.stringify(history));
  }, [history]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const validateAndSetFile = (f: File) => {
    setError("");
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setError("Unsupported File Type. Please upload a .pdf, .docx, or .txt file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum allowed size is 5 MB.");
      return;
    }
    setFile(f);
  };

  const simulateProgress = () => {
    const stages = [
      { pct: 15, label: "Reading document..." },
      { pct: 35, label: "Extracting content..." },
      { pct: 55, label: "Sending to AI engine..." },
      { pct: 75, label: "Generating intelligence report..." },
      { pct: 90, label: "Finalizing analysis..." },
    ];
    let i = 0;
    setProgress(5);
    setProgressLabel("Initializing...");
    const interval = setInterval(() => {
      if (i < stages.length) {
        setProgress(stages[i].pct);
        setProgressLabel(stages[i].label);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 900);
    return interval;
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload an assignment file first.");
      return;
    }
    setLoading(true);
    setError("");
    setRevealed(false);

    const interval = simulateProgress();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/review`, {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to analyze document");
      }

      const data = await res.json();
      setProgress(100);
      setProgressLabel("Analysis complete!");

      const newReport: ReportResult = {
        id: Date.now().toString(),
        filename: file.name,
        timestamp: new Date().toLocaleString(),
        ...data,
      };

      const updated = [newReport, ...history].slice(0, 15);
      setHistory(updated);
      setActiveIndex(0);
      setFile(null);

      setTimeout(() => {
        setRevealed(true);
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setProgressLabel("");
      }, 600);
    }
  };

  const clearVault = () => {
    if (confirm("Clear all reports from the Intelligence Vault?")) {
      setHistory([]);
      setActiveIndex(null);
      localStorage.removeItem("assignment_vault");
    }
  };

  const activeResult = activeIndex !== null ? history[activeIndex] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #F7F8FC;
          background-image:
            radial-gradient(ellipse 70% 40% at 10% 0%, rgba(124,92,255,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 30% at 90% 100%, rgba(0,180,216,0.06) 0%, transparent 55%);
          color: #1A1A2E;
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ========== LAYOUT ========== */
        .app {
          display: flex;
          min-height: 100vh;
          position: relative;
        }

        .bg-glow-1 {
          position: fixed; top: -10%; left: -5%;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(124,92,255,0.08) 0%, transparent 70%);
          border-radius: 50%; pointer-events: none; z-index: 0;
          animation: pulse-slow 6s ease-in-out infinite alternate;
        }
        .bg-glow-2 {
          position: fixed; bottom: -10%; right: -5%;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(0,180,216,0.07) 0%, transparent 70%);
          border-radius: 50%; pointer-events: none; z-index: 0;
          animation: pulse-slow 8s ease-in-out infinite alternate-reverse;
        }
        @keyframes pulse-slow {
          from { opacity: 0.6; transform: scale(1); }
          to { opacity: 1; transform: scale(1.1); }
        }

        /* ========== SIDEBAR ========== */
        .sidebar {
          width: 268px;
          min-height: 100vh;
          background: #EEF0FF;
          border-right: 1px solid rgba(124,92,255,0.15);
          display: flex;
          flex-direction: column;
          padding: 28px 18px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 10;
          flex-shrink: 0;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }
        .sidebar-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #7C5CFF, #00E5FF);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .sidebar-logo-text {
          font-size: 14px; font-weight: 800;
          background: linear-gradient(135deg, #7C5CFF, #00E5FF);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: 0.05em; text-transform: uppercase;
        }

        .sidebar-section-title {
          font-size: 9px; font-weight: 700;
          color: rgba(26,26,46,0.4);
          letter-spacing: 0.2em; text-transform: uppercase;
          margin-bottom: 12px; margin-top: 4px;
        }

        .vault-list { flex: 1; display: flex; flex-direction: column; gap: 8px; }

        .vault-empty {
          text-align: center; padding: 48px 16px;
          border: 1px dashed rgba(124,92,255,0.2);
          border-radius: 16px; color: rgba(26,26,46,0.3);
          font-size: 12px; line-height: 1.6;
        }
        .vault-empty-icon { font-size: 28px; margin-bottom: 8px; }

        .vault-item {
          width: 100%; text-align: left;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(124,92,255,0.12);
          background: rgba(255,255,255,0.8);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex; flex-direction: column; gap: 5px;
          box-shadow: 0 1px 6px rgba(124,92,255,0.05);
        }
        .vault-item:hover { background: rgba(124,92,255,0.08); border-color: rgba(124,92,255,0.3); }
        .vault-item.active { background: rgba(124,92,255,0.14); border-color: rgba(124,92,255,0.4); }

        .vault-item-name {
          font-size: 11px; font-weight: 700;
          color: #2D2B55;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .vault-item-meta {
          display: flex; justify-content: space-between; align-items: center;
        }
        .vault-item-date { font-size: 9px; color: rgba(26,26,46,0.4); font-family: 'JetBrains Mono', monospace; }
        .vault-item-score {
          font-size: 10px; font-weight: 800;
          padding: 2px 8px; border-radius: 6px;
          background: rgba(124,92,255,0.2); color: #7C5CFF;
          border: 1px solid rgba(124,92,255,0.3);
        }

        .clear-btn {
          margin-top: 20px;
          width: 100%; padding: 10px;
          border-radius: 12px;
          border: 1px dashed rgba(200,40,40,0.25);
          background: transparent;
          color: rgba(200,40,40,0.5);
          font-size: 10px; font-weight: 700;
          cursor: pointer; letter-spacing: 0.1em; text-transform: uppercase;
          transition: all 0.2s ease;
        }
        .clear-btn:hover { background: rgba(200,40,40,0.07); color: #C8282B; border-color: rgba(200,40,40,0.4); }

        /* ========== MAIN PANEL ========== */
        .main-panel {
          flex: 1;
          padding: 40px 48px;
          overflow-y: auto;
          z-index: 5;
          position: relative;
          max-width: 900px;
        }

        /* ========== HEADER ========== */
        .header { margin-bottom: 40px; }
        .header-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 100px;
          background: rgba(124,92,255,0.1);
          border: 1px solid rgba(124,92,255,0.25);
          font-size: 10px; font-weight: 700;
          color: #7C5CFF; letter-spacing: 0.15em;
          text-transform: uppercase; margin-bottom: 20px;
        }
        .pulse-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #7C5CFF;
          animation: ping 1.5s ease-in-out infinite;
        }
        @keyframes ping {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(124,92,255,0.5); }
          50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(124,92,255,0); }
        }

        .header h1 {
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 900; line-height: 1.05;
          background: linear-gradient(135deg, #1A1A2E 15%, #7C5CFF 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
        }
        .header p {
          color: rgba(26,26,46,0.5);
          font-size: 15px; font-weight: 500; line-height: 1.6;
          max-width: 480px;
        }

        /* ========== UPLOAD CARD ========== */
        .upload-card {
          background: #FFFFFF;
          border: 1px solid rgba(124,92,255,0.13);
          border-radius: 28px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 4px 28px rgba(124,92,255,0.07), 0 1px 3px rgba(0,0,0,0.04);
        }
        .upload-card-title { font-size: 13px; font-weight: 700; color: rgba(26,26,46,0.45); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; }

        .drop-zone {
          border: 2px dashed rgba(124,92,255,0.3);
          border-radius: 20px;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          background: rgba(124,92,255,0.03);
          position: relative;
        }
        .drop-zone:hover, .drop-zone.dragging {
          border-color: rgba(124,92,255,0.65);
          background: rgba(124,92,255,0.07);
          box-shadow: 0 0 30px rgba(124,92,255,0.1);
        }
        .drop-zone.has-file {
          border-color: rgba(0,180,216,0.5);
          background: rgba(0,180,216,0.04);
        }

        .drop-icon {
          width: 56px; height: 56px;
          background: rgba(124,92,255,0.1);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; margin: 0 auto 16px;
          border: 1px solid rgba(124,92,255,0.18);
        }
        .drop-title { font-size: 15px; font-weight: 700; color: #1A1A2E; margin-bottom: 6px; }
        .drop-sub { font-size: 12px; color: rgba(26,26,46,0.4); margin-bottom: 16px; }
        .drop-formats { font-size: 10px; color: #7C5CFF; font-family: 'JetBrains Mono', monospace; margin-top: 12px; }

        .file-chosen {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          background: rgba(0,180,216,0.07);
          border: 1px solid rgba(0,180,216,0.25);
          border-radius: 12px;
          margin-top: 16px;
        }
        .file-chosen-icon { font-size: 20px; }
        .file-chosen-name { font-size: 13px; font-weight: 600; color: #006E96; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-chosen-clear {
          background: none; border: none; color: rgba(26,26,46,0.3); cursor: pointer; font-size: 16px; padding: 4px;
          transition: color 0.2s;
        }
        .file-chosen-clear:hover { color: #C8282B; }

        .upload-row { display: flex; gap: 12px; margin-top: 20px; align-items: center; }

        .upload-file-btn {
          padding: 12px 24px; border-radius: 14px;
          border: 1px solid rgba(124,92,255,0.3);
          background: rgba(124,92,255,0.1);
          color: #7C5CFF; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
          letter-spacing: 0.03em;
        }
        .upload-file-btn:hover { background: rgba(124,92,255,0.2); border-color: rgba(124,92,255,0.5); }

        .analyze-btn {
          flex: 1;
          padding: 14px 28px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(135deg, #7C5CFF, #5A3FDB);
          color: white;
          font-size: 14px; font-weight: 800;
          cursor: pointer;
          letter-spacing: 0.08em; text-transform: uppercase;
          transition: all 0.25s ease;
          box-shadow: 0 0 30px rgba(124,92,255,0.3), 0 8px 24px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(124,92,255,0.5), 0 12px 32px rgba(0,0,0,0.4);
        }
        .analyze-btn:active:not(:disabled) { transform: translateY(0); }
        .analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ========== PROGRESS ========== */
        .progress-wrapper { margin-top: 20px; }
        .progress-bar-track {
          height: 5px; border-radius: 4px;
          background: rgba(124,92,255,0.1);
          overflow: hidden; margin-bottom: 8px;
        }
        .progress-bar-fill {
          height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, #7C5CFF, #00B4D8);
          transition: width 0.6s ease;
          box-shadow: 0 0 8px rgba(124,92,255,0.3);
        }
        .progress-label { font-size: 11px; color: rgba(26,26,46,0.45); font-family: 'JetBrains Mono', monospace; }

        /* ========== ERROR ========== */
        .error-box {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px 20px;
          border-radius: 14px;
          background: rgba(200,40,40,0.06);
          border: 1px solid rgba(200,40,40,0.2);
          color: #B91C1C;
          font-size: 13px; font-weight: 600;
          margin-top: 16px;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* ========== REPORT ========== */
        .report-wrapper {
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .report-wrapper.visible { opacity: 1; transform: translateY(0); }

        .report-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
          margin-bottom: 32px;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(26,26,46,0.08);
        }

        .report-title-area {}
        .report-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(124,92,255,0.8); margin-bottom: 8px;
          display: flex; align-items: center; gap: 8px;
        }
        .report-eyebrow::before {
          content: ''; display: block;
          width: 20px; height: 2px;
          background: linear-gradient(90deg, #7C5CFF, #00E5FF);
          border-radius: 2px;
        }
        .report-h2 {
          font-size: clamp(26px, 3vw, 38px);
          font-weight: 900; color: #1A1A2E;
          letter-spacing: -0.02em; line-height: 1.1;
          margin-bottom: 8px;
        }
        .report-filename {
          font-size: 11px; color: #006E96;
          font-family: 'JetBrains Mono', monospace;
          display: flex; align-items: center; gap: 8px;
        }
        .report-filename::before {
          content: ''; display: block; width: 6px; height: 6px;
          border-radius: 50%; background: #00B4D8;
          box-shadow: 0 0 6px rgba(0,180,216,0.4);
        }

        .score-badge {
          background: #FFFFFF;
          border: 1px solid rgba(124,92,255,0.2);
          border-radius: 24px;
          padding: 24px 32px;
          text-align: center;
          min-width: 160px;
          box-shadow: 0 4px 24px rgba(124,92,255,0.12), 0 1px 4px rgba(0,0,0,0.05);
        }
        .score-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.25em;
          color: rgba(26,26,46,0.35); text-transform: uppercase; margin-bottom: 6px;
        }
        .score-value {
          font-size: 48px; font-weight: 900; line-height: 1;
        }

        .summary-card {
          background: rgba(124,92,255,0.05);
          border: 1px solid rgba(124,92,255,0.15);
          border-radius: 18px;
          padding: 20px 24px;
          margin-bottom: 28px;
          font-size: 14px; line-height: 1.7;
          color: rgba(26,26,46,0.7);
        }
        .summary-card strong { color: #7C5CFF; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; display: block; margin-bottom: 8px; }

        .report-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
        }
        @media (max-width: 700px) { .report-grid { grid-template-columns: 1fr; } }

        .section-card {
          background: #FFFFFF;
          border: 1px solid rgba(26,26,46,0.08);
          border-radius: 20px;
          padding: 22px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .section-card::before {
          content: '';
          position: absolute; top: 0; left: 0;
          width: 4px; height: 100%;
          background: var(--accent, #7C5CFF);
          opacity: 0.8;
        }
        .section-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08); border-color: rgba(124,92,255,0.2); }

        .section-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .section-icon { font-size: 16px; }
        .section-title { font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }

        .section-body {
          font-size: 13px; line-height: 1.7; color: rgba(26,26,46,0.65);
        }

        .tag-list { display: flex; flex-direction: column; gap: 8px; }
        .tag {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13px; color: rgba(26,26,46,0.7); line-height: 1.5;
        }
        .tag-bullet {
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 900; flex-shrink: 0;
          margin-top: 2px;
        }

        .section-full {
          background: #FFFFFF;
          border: 1px solid rgba(26,26,46,0.08);
          border-radius: 20px; padding: 22px; margin-bottom: 20px;
          position: relative; overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .section-full::before {
          content: ''; position: absolute; top: 0; left: 0;
          width: 4px; height: 100%;
          background: var(--accent, #7C5CFF); opacity: 0.8;
        }

        .no-report {
          text-align: center; padding: 80px 24px;
          color: rgba(26,26,46,0.25);
        }
        .no-report-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
        .no-report p { font-size: 14px; color: rgba(26,26,46,0.35); }

        @media (max-width: 860px) {
          .sidebar { display: none; }
          .main-panel { padding: 24px 20px; }
        }
      `}</style>

      <div className="app">
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />

        {/* ========== SIDEBAR ========== */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🧠</div>
            <span className="sidebar-logo-text">AI Vault</span>
          </div>

          <div className="sidebar-section-title">Intelligence Vault · {history.length} Reports</div>

          <div className="vault-list">
            {history.length === 0 ? (
              <div className="vault-empty">
                <div className="vault-empty-icon">📂</div>
                No reports yet.<br />Upload an assignment to begin.
              </div>
            ) : (
              history.map((item, idx) => (
                <button
                  key={item.id}
                  className={`vault-item ${activeIndex === idx ? "active" : ""}`}
                  onClick={() => { setActiveIndex(idx); setRevealed(true); }}
                >
                  <div className="vault-item-name">{item.filename}</div>
                  <div className="vault-item-meta">
                    <span className="vault-item-date">{item.timestamp.split(",")[0]}</span>
                    <span className="vault-item-score">{item.score}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {history.length > 0 && (
            <button className="clear-btn" onClick={clearVault}>
              🗑 Clear Vault
            </button>
          )}
        </aside>

        {/* ========== MAIN PANEL ========== */}
        <main className="main-panel">
          {/* Header */}
          <header className="header">
            <div className="header-badge">
              <span className="pulse-dot" />
              AI Active Engine
            </div>
            <h1>Assignment<br />Intelligence</h1>
            <p>AI-powered assignment evaluation — upload your document and receive a complete structured review instantly.</p>
          </header>

          {/* Upload Card */}
          <div className="upload-card">
            <div className="upload-card-title">Upload Assignment</div>

            <div
              className={`drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="drop-icon">{file ? "✅" : "📄"}</div>
              <div className="drop-title">{file ? file.name : "Drag & Drop your file here"}</div>
              <div className="drop-sub">{file ? "File ready for analysis" : "or click to browse"}</div>
              <div className="drop-formats">.PDF · .DOCX · .TXT · max 5MB</div>
            </div>

            {file && (
              <div className="file-chosen">
                <span className="file-chosen-icon">📎</span>
                <span className="file-chosen-name">{file.name}</span>
                <button className="file-chosen-clear" onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]); }}
            />

            <div className="upload-row">
              <button className="upload-file-btn" onClick={() => fileInputRef.current?.click()}>
                📂 Upload File
              </button>
              <button className="analyze-btn" onClick={handleAnalyze} disabled={loading || !file}>
                {loading ? (
                  <><span className="spinner" /> Analyzing…</>
                ) : (
                  <><span>⚡</span> Analyze Assignment</>
                )}
              </button>
            </div>

            {loading && (
              <div className="progress-wrapper">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-label">{progressLabel}</div>
              </div>
            )}

            {error && (
              <div className="error-box">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ========== REPORT ========== */}
          {activeResult ? (
            <div className={`report-wrapper ${revealed ? "visible" : ""}`}>
              {/* Report Header */}
              <div className="report-header">
                <div className="report-title-area">
                  <div className="report-eyebrow">Assignment Intelligence Report</div>
                  <h2 className="report-h2">Analysis Complete</h2>
                  <div className="report-filename">{activeResult.filename}</div>
                </div>
                <ScoreBadge score={activeResult.score} />
              </div>

              {/* Summary */}
              {activeResult.summary && (
                <div className="summary-card">
                  <strong>Summary</strong>
                  {activeResult.summary}
                </div>
              )}

              {/* 2-col grid: Strengths + Weak Areas */}
              <div className="report-grid">
                <SectionCard title="Strengths" icon="✓" color="#00E5A0">
                  <div className="tag-list">
                    {(activeResult.strengths || []).map((s, i) => (
                      <div key={i} className="tag">
                        <div className="tag-bullet" style={{ background: "rgba(0,229,160,0.15)", color: "#00E5A0" }}>{i + 1}</div>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Weak Areas" icon="△" color="#FFAD00">
                  <div className="tag-list">
                    {(activeResult.weak_areas || []).map((w, i) => (
                      <div key={i} className="tag">
                        <div className="tag-bullet" style={{ background: "rgba(255,173,0,0.15)", color: "#FFAD00" }}>{i + 1}</div>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* Full-width sections */}
              {activeResult.concept_understanding && (
                <div className="section-full" style={{ "--accent": "#7C5CFF" } as React.CSSProperties}>
                  <div className="section-header">
                    <span className="section-icon">🧩</span>
                    <h3 className="section-title" style={{ color: "#7C5CFF" }}>Concept Understanding</h3>
                  </div>
                  <div className="section-body">{activeResult.concept_understanding}</div>
                </div>
              )}

              {activeResult.structure_clarity && (
                <div className="section-full" style={{ "--accent": "#00E5FF" } as React.CSSProperties}>
                  <div className="section-header">
                    <span className="section-icon">📐</span>
                    <h3 className="section-title" style={{ color: "#00E5FF" }}>Structure & Clarity</h3>
                  </div>
                  <div className="section-body">{activeResult.structure_clarity}</div>
                </div>
              )}

              {activeResult.grammar_writing_quality && (
                <div className="section-full" style={{ "--accent": "#A78BFA" } as React.CSSProperties}>
                  <div className="section-header">
                    <span className="section-icon">✏️</span>
                    <h3 className="section-title" style={{ color: "#A78BFA" }}>Grammar & Writing Quality</h3>
                  </div>
                  <div className="section-body">{activeResult.grammar_writing_quality}</div>
                </div>
              )}

              {/* 2-col: Suggestions + Improved Version */}
              <div className="report-grid">
                <SectionCard title="Suggestions for Improvement" icon="💡" color="#FFD166">
                  <div className="tag-list">
                    {(activeResult.suggestions_for_improvement || []).map((s, i) => (
                      <div key={i} className="tag">
                        <div className="tag-bullet" style={{ background: "rgba(255,209,102,0.15)", color: "#FFD166" }}>{i + 1}</div>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Improved Version Suggestions" icon="🚀" color="#00E5FF">
                  <div className="section-body">{activeResult.improved_version_suggestions}</div>
                </SectionCard>
              </div>
            </div>
          ) : !loading && (
            <div className="no-report">
              <div className="no-report-icon">🔍</div>
              <p>Upload an assignment to generate your<br /><strong>Assignment Intelligence Report</strong></p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
