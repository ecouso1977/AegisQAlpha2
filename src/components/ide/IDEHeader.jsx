import { Play, MessageSquare, Loader2, X, Sun, Moon } from "lucide-react";
import { useState } from "react";

export default function IDEHeader({ activeFile, isRunning, onRun, chatOpen, onToggleChat, activeTab, setActiveTab, tabs }) {
  const [dark, setDark] = useState(true);

  return (
    <header className="flex flex-col bg-[#0a0c11] border-b border-[#1e2330] shrink-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2330]">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/user_699110fc01cd81dc0b5212a8/a08cd04ad_dark-logo.png"
            alt="Aegis Quantum"
            className="h-8 object-contain"
          />
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
            <span className="hover:text-gray-300 cursor-pointer px-2 py-1 rounded hover:bg-[#1a1d26]">File</span>
            <span className="hover:text-gray-300 cursor-pointer px-2 py-1 rounded hover:bg-[#1a1d26]">Edit</span>
            <span className="hover:text-gray-300 cursor-pointer px-2 py-1 rounded hover:bg-[#1a1d26]">View</span>
            <span className="hover:text-gray-300 cursor-pointer px-2 py-1 rounded hover:bg-[#1a1d26]">Terminal</span>
            <span className="hover:text-gray-300 cursor-pointer px-2 py-1 rounded hover:bg-[#1a1d26]">Help</span>
          </div>
        </div>

        {/* Center: active file pill */}
        <div className="flex items-center gap-2">
          {activeFile && activeTab === "Code" && (
            <span className="text-xs text-gray-400 bg-[#1a1d26] px-3 py-1 rounded border border-[#2a2d3a]">
              {activeFile.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={isRunning || !activeFile || activeTab !== "Code"}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-semibold rounded transition-colors"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunning ? "Running..." : "Run"}
          </button>

          <button
            onClick={() => setDark((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-200 bg-[#1a1d26] border border-[#2a2d3a] rounded transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
      </div>

      {/* Tab bar */}
      <div className="flex items-center px-2 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#00c896] text-[#00c896]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </header>
  );
}