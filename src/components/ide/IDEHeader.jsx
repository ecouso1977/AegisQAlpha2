import { Play, MessageSquare, Loader2, X, Sun, Moon, Store, Download } from "lucide-react";
import { useEffect, useState } from "react";
import JSZip from "jszip";
import NavMenu from "./NavMenu";

export default function IDEHeader({ activeFile, isRunning, onRun, chatOpen, onToggleChat, activeTab, setActiveTab, tabs, onNavAction, files }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const root = document.getElementById("ide-root") || document.body;
    if (dark) {
      root.classList.add("ide-dark");
      root.classList.remove("ide-light");
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      root.classList.add("ide-light");
      root.classList.remove("ide-dark");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [dark]);

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
            src={dark
              ? "https://media.base44.com/images/public/user_699110fc01cd81dc0b5212a8/a08cd04ad_dark-logo.png"
              : "https://media.base44.com/images/public/69d0b26066dc23493b4330f7/2e593a76e_light-logo.png"
            }
            alt="Aegis Quantum"
            className="h-8 object-contain"
          />
          <NavMenu onAction={onNavAction} />
        </div>

        {/* Center: branding + active file */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold tracking-widest text-[#00c896] uppercase select-none">
            Aegis Quantum IDE
          </span>
          <span className="text-[9px] tracking-[0.2em] text-gray-500 uppercase select-none">
            by Nobisys Corporation
          </span>
          {activeFile && activeTab === "Code" && (
            <span className="text-xs text-gray-500 bg-[#1a1d26] px-2 py-0.5 rounded border border-[#2a2d3a] mt-0.5">
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

          {/* Theme switcher pill */}
          <div className="flex items-center bg-[#1a1d26] border border-[#2a2d3a] rounded-full p-0.5 gap-0.5">
            <button
              onClick={() => setDark(false)}
              title="Light theme"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                !dark ? "bg-yellow-400 text-black shadow" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              onClick={() => setDark(true)}
              title="Dark theme"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                dark ? "bg-[#2a3a4a] text-[#00c896] shadow" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>

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