import { Play, MessageSquare, Loader2, X, Sun, Moon, Store, Download } from "lucide-react";
import { useState } from "react";
import JSZip from "jszip";
import NavMenu from "./NavMenu";

export default function IDEHeader({ activeFile, isRunning, onRun, chatOpen, onToggleChat, activeTab, setActiveTab, tabs, onNavAction, files }) {
  const [dark, setDark] = useState(true);

  const downloadZip = async () => {
    const zip = new JSZip();
    const src = zip.folder("aegis-workspace");
    (files || []).forEach((f) => src.file(f.name, f.content));
    const deps = (files || []).reduce((acc, f) => {
      const matches = [...f.content.matchAll(/^import\s+([\w,\s{}*]+)\s+from\s+['"]([^'"]+)['"]/gm)];
      matches.forEach(([, , pkg]) => { if (!pkg.startsWith(".")) acc.add(pkg.split("/")[0]); });
      return acc;
    }, new Set());
    src.file("requirements.txt", [...deps].join("\n") || "# No external dependencies detected");
    src.file("README.md", `# Aegis Quantum Workspace\n\nExported on ${new Date().toLocaleDateString()}\n\n## Files\n${(files||[]).map(f=>"- "+f.name).join("\n")}\n`);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "aegis-workspace.zip"; a.click();
    URL.revokeObjectURL(url);
  };

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
          <NavMenu onAction={onNavAction} />
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
            onClick={downloadZip}
            title="Download workspace as ZIP"
            className="p-1.5 text-gray-400 hover:text-[#00c896] bg-[#1a1d26] border border-[#2a2d3a] rounded transition-colors"
          >
            <Download className="w-4 h-4" />
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
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#00c896] text-[#00c896]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "Marketplace" && <Store className="w-3 h-3" />}
            {tab}
          </button>
        ))}
      </div>
    </header>
  );
}