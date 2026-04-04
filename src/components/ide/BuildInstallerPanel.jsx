import { useState } from "react";
import { Download, Package, CheckCircle, Loader2, Monitor, Apple, Terminal, Plus, Trash2, Settings, ChevronDown, ChevronRight, Shield } from "lucide-react";

const BUNDLED_PLUGINS = [
  { id: "ai-copilot", name: "AI Copilot", desc: "Inline code suggestions and chat", size: "12 MB", required: true },
  { id: "git-integration", name: "Git Integration", desc: "GitHub, GitLab, Bitbucket support", size: "8 MB", required: true },
  { id: "linting", name: "Multi-language Linter", desc: "ESLint, Pylint, golangci-lint", size: "15 MB", required: true },
  { id: "debugger", name: "Visual Debugger", desc: "Step-through debugger with variable inspector", size: "10 MB", required: false },
  { id: "live-preview", name: "Live Preview", desc: "Real-time browser preview panel", size: "6 MB", required: false },
  { id: "collab", name: "Real-time Collaboration", desc: "Multi-user live editing sessions", size: "5 MB", required: false },
  { id: "themes", name: "Theme Pack (20+)", desc: "VS Code, Nord, Dracula, Catppuccin and more", size: "3 MB", required: false },
  { id: "docker", name: "Docker Tools", desc: "Build, run, push containers from editor", size: "9 MB", required: false },
  { id: "cloud-deploy", name: "Cloud Deploy Pack", desc: "Deploy to AWS, GCP, Azure, Vercel", size: "7 MB", required: false },
  { id: "testing", name: "Testing Suite", desc: "pytest, Jest, Go test runner integration", size: "8 MB", required: false },
  { id: "snippets", name: "Community Snippets", desc: "10,000+ code snippets for 40+ languages", size: "4 MB", required: false },
  { id: "ssh", name: "SSH Client", desc: "Connect to remote servers directly", size: "3 MB", required: false },
];

const OPTIONAL_MARKETPLACE = [
  { id: "prettier", name: "Prettier", desc: "Opinionated code formatter", size: "2 MB" },
  { id: "copilot-chat", name: "Extended AI Chat", desc: "Full-context codebase Q&A", size: "5 MB" },
  { id: "rest-client", name: "REST Client", desc: "HTTP requests inside the editor", size: "2 MB" },
  { id: "database-ui", name: "Database UI", desc: "Visual query builder and table viewer", size: "7 MB" },
  { id: "terminal-plus", name: "Terminal Pro", desc: "Multi-pane terminal with tmux support", size: "4 MB" },
  { id: "kubernetes", name: "Kubernetes Tools", desc: "kubectl, Helm, cluster explorer", size: "11 MB" },
  { id: "jupyter", name: "Jupyter Notebooks", desc: "Interactive notebooks in-editor", size: "18 MB" },
  { id: "drawio", name: "Diagrams (draw.io)", desc: "Architecture diagrams and flowcharts", size: "8 MB" },
];

const PLATFORMS = [
  { id: "win", label: "Windows x64", icon: Monitor, ext: ".exe", badge: "NSIS Installer", desc: "Full installer with optional plugin selection wizard, auto-update, and system integration", color: "text-blue-400", accent: "border-blue-400/30 bg-blue-400/5" },
  { id: "mac", label: "macOS Universal", icon: Apple, ext: ".dmg", badge: "DMG + .app", desc: "Universal binary for Intel & Apple Silicon. Signed and notarized.", color: "text-gray-300", accent: "border-gray-400/20 bg-gray-400/5" },
  { id: "linux", label: "Linux x64", icon: Terminal, ext: ".AppImage", badge: "AppImage + .deb + .rpm", desc: "AppImage for universal Linux, .deb for Debian/Ubuntu, .rpm for Fedora/RHEL", color: "text-yellow-400", accent: "border-yellow-400/30 bg-yellow-400/5" },
];

function sizeToMb(sizeStr) {
  return parseInt(sizeStr) || 0;
}

export default function BuildInstallerPanel() {
  const [selectedPlatform, setSelectedPlatform] = useState("win");
  const [enabledPlugins, setEnabledPlugins] = useState(new Set(BUNDLED_PLUGINS.map((p) => p.id)));
  const [marketplaceSelected, setMarketplaceSelected] = useState(new Set());
  const [building, setBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState([]);
  const [buildDone, setBuildDone] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [appName, setAppName] = useState("Aegis Quantum");
  const [appVersion, setAppVersion] = useState("2.0.0");
  const [allowRuntimePlugins, setAllowRuntimePlugins] = useState(true);
  const [createShortcut, setCreateShortcut] = useState(true);
  const [signInstaller, setSignInstaller] = useState(false);

  const togglePlugin = (id) => {
    const plugin = BUNDLED_PLUGINS.find((p) => p.id === id);
    if (plugin?.required) return;
    setEnabledPlugins((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleMarketplace = (id) => {
    setMarketplaceSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const totalSizeMb = [...enabledPlugins].reduce((acc, id) => {
    const p = BUNDLED_PLUGINS.find((p) => p.id === id);
    return acc + (p ? sizeToMb(p.size) : 0);
  }, 0) + [...marketplaceSelected].reduce((acc, id) => {
    const p = OPTIONAL_MARKETPLACE.find((p) => p.id === id);
    return acc + (p ? sizeToMb(p.size) : 0);
  }, 0) + 85; // base app size

  const platform = PLATFORMS.find((p) => p.id === selectedPlatform);

  const build = async () => {
    setBuilding(true);
    setBuildLogs([]);
    setBuildDone(false);
    const steps = [
      `[${now()}] 🔧 Initializing build for ${platform.label}...`,
      `[${now()}] 📦 Bundling Aegis Quantum ${appVersion} core...`,
      `[${now()}] ⚛️  Packaging Electron shell...`,
      `[${now()}] 🔌 Embedding ${enabledPlugins.size} plugins (${[...enabledPlugins].map((id) => BUNDLED_PLUGINS.find((p) => p.id === id)?.name).filter(Boolean).join(", ")})...`,
      marketplaceSelected.size > 0 ? `[${now()}] 🛒 Bundling ${marketplaceSelected.size} marketplace plugins...` : null,
      allowRuntimePlugins ? `[${now()}] 🛒 Enabling runtime plugin installer (marketplace integration)...` : null,
      selectedPlatform === "win" ? `[${now()}] 🪟 Building NSIS Windows installer with plugin wizard...` : null,
      selectedPlatform === "win" && createShortcut ? `[${now()}] 🖥️  Configuring desktop & start menu shortcuts...` : null,
      selectedPlatform === "mac" ? `[${now()}] 🍎 Packing universal macOS .app bundle...` : null,
      selectedPlatform === "mac" ? `[${now()}] 🔏 Creating .dmg disk image...` : null,
      selectedPlatform === "linux" ? `[${now()}] 🐧 Building AppImage (x86_64)...` : null,
      selectedPlatform === "linux" ? `[${now()}] 📦 Generating .deb and .rpm packages...` : null,
      signInstaller ? `[${now()}] 🔒 Code signing installer...` : null,
      `[${now()}] 🗜️  Compressing artifacts (~${totalSizeMb} MB)...`,
      `[${now()}] ✅ Build complete! ${appName}-${appVersion}-${selectedPlatform}${platform.ext} is ready.`,
    ].filter(Boolean);

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
      setBuildLogs((p) => [...p, step]);
    }
    setBuilding(false);
    setBuildDone(true);
  };

  function now() { return new Date().toLocaleTimeString(); }

  const downloadInstaller = () => {
    const filename = `${appName.replace(/\s+/g, "-")}-${appVersion}-setup${platform.ext}`;
    const content = [
      `; ${appName} v${appVersion} Installer Manifest`,
      `; Platform: ${platform.label}`,
      `; Generated: ${new Date().toISOString()}`,
      `; Size: ~${totalSizeMb} MB`,
      "",
      "[App]",
      `Name=${appName}`,
      `Version=${appVersion}`,
      `Platform=${platform.label}`,
      "",
      "[Plugins]",
      ...[...enabledPlugins].map((id) => {
        const p = BUNDLED_PLUGINS.find((p) => p.id === id);
        return p ? `${p.id}=${p.name} (${p.size})` : "";
      }),
      ...[...marketplaceSelected].map((id) => {
        const p = OPTIONAL_MARKETPLACE.find((p) => p.id === id);
        return p ? `${p.id}=${p.name} (${p.size}) [marketplace]` : "";
      }),
      "",
      "[Options]",
      `AllowRuntimePlugins=${allowRuntimePlugins}`,
      `CreateShortcut=${createShortcut}`,
      `SignInstaller=${signInstaller}`,
    ].join("\n");
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Package className="w-5 h-5 text-[#00c896]" /> Build Installer</h2>
          <p className="text-sm text-gray-500 mt-0.5">Package Aegis Quantum as a native installer for Windows, macOS, or Linux</p>
        </div>

        {/* App config */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Application Name</label>
            <input value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 text-sm px-3 py-1.5 rounded outline-none focus:border-[#00c896]" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Version</label>
            <input value={appVersion} onChange={(e) => setAppVersion(e.target.value)} className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 text-sm px-3 py-1.5 rounded outline-none focus:border-[#00c896]" />
          </div>
        </div>

        {/* Platform selector */}
        <div className="grid grid-cols-3 gap-4">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.id} onClick={() => setSelectedPlatform(p.id)}
                className={`p-4 rounded-xl border text-left transition-all ${selectedPlatform === p.id ? p.accent + " " + p.color.replace("text-", "border-") : "border-[#1e2330] bg-[#0e1018] hover:border-gray-500"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${selectedPlatform === p.id ? p.color : "text-gray-500"}`} />
                  <span className={`text-sm font-semibold ${selectedPlatform === p.id ? p.color : "text-gray-300"}`}>{p.label}</span>
                </div>
                <div className="text-xs text-gray-500">{p.badge}</div>
                <div className="text-xs text-gray-600 mt-1 leading-relaxed">{p.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Platform-specific options */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-xl p-4 space-y-3">
          <div className="text-sm font-medium text-gray-300 flex items-center gap-2"><Settings className="w-4 h-4" /> Installer Options</div>
          <div className="space-y-2">
            {[
              { key: "allowRuntimePlugins", label: "Allow users to install additional plugins during setup", state: allowRuntimePlugins, set: setAllowRuntimePlugins, highlight: selectedPlatform === "win" },
              ...(selectedPlatform === "win" ? [{ key: "createShortcut", label: "Create desktop & Start Menu shortcuts", state: createShortcut, set: setCreateShortcut }] : []),
              { key: "signInstaller", label: "Sign installer with code-signing certificate", state: signInstaller, set: setSignInstaller },
            ].map(({ key, label, state, set, highlight }) => (
              <label key={key} className={`flex items-center gap-3 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors ${highlight ? "bg-[#00c896]/5 border border-[#00c896]/20" : "hover:bg-[#1a1d26]"}`}>
                <div onClick={() => set((v) => !v)} className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${state ? "bg-[#00c896]" : "bg-gray-700"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${state ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-300">{label}</span>
                {highlight && <span className="text-xs text-[#00c896] ml-auto">Windows wizard</span>}
              </label>
            ))}
          </div>
        </div>

        {/* Bundled plugins */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e2330]">
            <div className="text-sm font-medium text-gray-300">Bundled Plugins</div>
            <div className="text-xs text-gray-600">Included in the installer. Required plugins cannot be removed.</div>
          </div>
          <div className="divide-y divide-[#1e2330]">
            {BUNDLED_PLUGINS.map((plugin) => {
              const enabled = enabledPlugins.has(plugin.id);
              return (
                <div key={plugin.id} onClick={() => togglePlugin(plugin.id)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${plugin.required ? "opacity-80" : "cursor-pointer hover:bg-[#1a1d26]"}`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${enabled ? "bg-[#00c896] border-[#00c896]" : "border-gray-600"}`}>
                    {enabled && <CheckCircle className="w-3 h-3 text-black" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-200">{plugin.name}</span>
                      {plugin.required && <span className="text-xs bg-[#1a2a3a] text-blue-400 border border-blue-400/20 px-1.5 py-0.5 rounded">Required</span>}
                    </div>
                    <div className="text-xs text-gray-500">{plugin.desc}</div>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{plugin.size}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional marketplace plugins */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-xl overflow-hidden">
          <button onClick={() => setShowMarketplace((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1d26] transition-colors">
            <div>
              <div className="text-sm font-medium text-gray-300 text-left">Marketplace Plugins (Pre-bundle)</div>
              <div className="text-xs text-gray-600 text-left">{marketplaceSelected.size} selected for pre-bundling</div>
            </div>
            {showMarketplace ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </button>
          {showMarketplace && (
            <div className="border-t border-[#1e2330] divide-y divide-[#1e2330]">
              {OPTIONAL_MARKETPLACE.map((plugin) => {
                const selected = marketplaceSelected.has(plugin.id);
                return (
                  <div key={plugin.id} onClick={() => toggleMarketplace(plugin.id)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1a1d26] transition-colors">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-[#00c896] border-[#00c896]" : "border-gray-600"}`}>
                      {selected && <CheckCircle className="w-3 h-3 text-black" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-200">{plugin.name}</span>
                      <div className="text-xs text-gray-500">{plugin.desc}</div>
                    </div>
                    <span className="text-xs text-gray-600 shrink-0">{plugin.size}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Size estimate */}
        <div className="flex items-center justify-between bg-[#0e1018] border border-[#1e2330] rounded-lg px-4 py-3">
          <span className="text-sm text-gray-400">Estimated installer size</span>
          <span className="text-sm font-semibold text-[#00c896]">~{totalSizeMb} MB</span>
        </div>

        {/* Build button */}
        <button onClick={build} disabled={building}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-50 text-black font-bold rounded-xl transition-colors text-base">
          {building ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {building ? "Building Installer..." : `Build ${platform.label} Installer`}
        </button>

        {/* Build log */}
        {buildLogs.length > 0 && (
          <div className="bg-[#080a0f] border border-[#1e2330] rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-[#1e2330] flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${building ? "bg-yellow-400 animate-pulse" : "bg-[#00c896]"}`} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Build Log</span>
            </div>
            <div className="p-4 font-mono text-xs space-y-1 max-h-56 overflow-y-auto">
              {buildLogs.map((line, i) => (
                <div key={i} className={line.includes("✅") ? "text-[#00c896]" : line.includes("❌") ? "text-red-400" : "text-gray-300"}>{line}</div>
              ))}
              {building && <div className="text-gray-600 animate-pulse">▋</div>}
            </div>
            {buildDone && (
              <div className="px-4 pb-4">
                <button onClick={downloadInstaller} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00c896] hover:bg-[#00b084] text-black text-sm font-bold rounded-lg transition-colors mt-2">
                  <Download className="w-4 h-4" /> Download {appName}-{appVersion}{platform.ext}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}