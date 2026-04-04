import { useState } from "react";
import { Users, LogIn, LogOut, Copy, Check, Wifi, WifiOff } from "lucide-react";

const CURSOR_COLORS = [
  "#f59e0b", "#3b82f6", "#ec4899", "#a78bfa", "#fb923c",
  "#34d399", "#60a5fa", "#f87171", "#c084fc", "#facc15",
];

export function getColorForUser(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export default function CollabBar({ sessionId, participants, onJoin, onLeave, isConnected, currentUser }) {
  const [inputId, setInputId] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (inputId.trim()) { onJoin(inputId.trim()); setShowJoin(false); setInputId(""); }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0c11] border-b border-[#1e2330]">
        <WifiOff className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-xs text-gray-600">Collaboration off</span>
        <button
          onClick={() => setShowJoin(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 hover:text-[#00c896] hover:border-[#00c896]/50 rounded transition-colors"
        >
          <LogIn className="w-3 h-3" /> Start / Join Session
        </button>
        {showJoin && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Session ID (leave blank to create new)"
              className="text-xs bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 px-2 py-1 rounded w-64 outline-none focus:border-[#00c896]/50"
            />
            <button onClick={handleJoin} className="text-xs px-3 py-1 bg-[#00c896] text-black font-semibold rounded hover:bg-[#00b084] transition-colors">
              {inputId.trim() ? "Join" : "Create"}
            </button>
            <button onClick={() => setShowJoin(false)} className="text-xs text-gray-600 hover:text-gray-300">Cancel</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-[#0a0c11] border-b border-[#1e2330]">
      <div className="flex items-center gap-1.5">
        <Wifi className="w-3.5 h-3.5 text-[#00c896]" />
        <span className="text-xs text-[#00c896] font-medium">Live Session</span>
      </div>

      <div className="flex items-center gap-1.5 bg-[#1a1d26] border border-[#2a2d3a] rounded px-2 py-0.5">
        <span className="text-xs text-gray-500 font-mono">{sessionId}</span>
        <button onClick={copySessionId} className="text-gray-500 hover:text-[#00c896] transition-colors">
          {copied ? <Check className="w-3 h-3 text-[#00c896]" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5 text-gray-500" />
        <div className="flex -space-x-1">
          {(participants || []).slice(0, 6).map((p, i) => (
            <div
              key={i}
              title={p}
              className="w-5 h-5 rounded-full border-2 border-[#0a0c11] flex items-center justify-center text-[9px] font-bold"
              style={{ backgroundColor: getColorForUser(p), color: "#000" }}
            >
              {p[0]?.toUpperCase()}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-1">{(participants || []).length}</span>
      </div>

      <button
        onClick={onLeave}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#1a1d26] border border-[#2a2d3a] text-red-400 hover:text-red-300 hover:border-red-500/40 rounded transition-colors ml-auto"
      >
        <LogOut className="w-3 h-3" /> Leave
      </button>
    </div>
  );
}