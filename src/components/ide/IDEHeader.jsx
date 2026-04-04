import { Play, MessageSquare, Loader2, X } from "lucide-react";

export default function IDEHeader({ activeFile, isRunning, onRun, chatOpen, onToggleChat }) {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#0a0c11] border-b border-[#1e2330] shrink-0">
      <div className="flex items-center gap-3">
        <img
          src="https://media.base44.com/images/public/user_699110fc01cd81dc0b5212a8/a08cd04ad_dark-logo.png"
          alt="Aegis Quantum"
          className="h-8 object-contain"
        />
      </div>

      <div className="flex items-center gap-2">
        {activeFile && (
          <span className="text-xs text-gray-400 bg-[#1a1d26] px-3 py-1 rounded border border-[#2a2d3a]">
            {activeFile.name}
          </span>
        )}

        <button
          onClick={onRun}
          disabled={isRunning || !activeFile}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold rounded transition-colors"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? "Running..." : "Run"}
        </button>

        <button
          onClick={onToggleChat}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors ${
            chatOpen
              ? "bg-[#1a2a3a] border-[#00c896] text-[#00c896]"
              : "bg-[#1a1d26] border-[#2a2d3a] text-gray-400 hover:text-gray-200"
          }`}
        >
          {chatOpen ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          AI
        </button>
      </div>
    </header>
  );
}