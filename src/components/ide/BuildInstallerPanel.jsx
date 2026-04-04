import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Apple, Server, Package, CheckCircle, Loader2, Monitor } from "lucide-react";
import CodeEditorPreview from "./CodeEditorPreview";

const PLATFORM_CONFIGS = [
  {
    id: "windows",
    label: "Windows",
    icon: Monitor,
    size: "142 MB",
    ext: ".exe",
    version: "1.0.0",
    downloadUrl: "https://releases.aegisquantum.dev/aegis-quantum-1.0.0-win-x64.exe",
  },
  {
    id: "mac",
    label: "macOS",
    icon: Apple,
    size: "158 MB",
    ext: ".dmg",
    version: "1.0.0",
    downloadUrl: "https://releases.aegisquantum.dev/aegis-quantum-1.0.0-mac-universal.dmg",
  },
  {
    id: "linux",
    label: "Linux",
    icon: Server,
    size: "135 MB",
    ext: ".AppImage",
    version: "1.0.0",
    downloadUrl: "https://releases.aegisquantum.dev/aegis-quantum-1.0.0-linux-x64.AppImage",
  },
];

export default function BuildInstallerPanel({ files = [], onFileChange, onBuildSuccess }) {
  const [buildingPlatforms, setBuildingPlatforms] = useState(new Set());
  const [builds, setBuilds] = useState({});
  const [projectFiles, setProjectFiles] = useState(files);

  const handleFileChange = (fileId, content) => {
    setProjectFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, content } : f))
    );
    if (onFileChange) onFileChange(fileId, content);
  };

  const handleBuild = async (platform) => {
    setBuildingPlatforms((prev) => new Set(prev).add(platform.id));
    try {
      const response = await base44.functions.invoke('buildInstallers', { platform: platform.id });
      setBuilds((prev) => ({ ...prev, [platform.id]: response.data }));
      if (onBuildSuccess) onBuildSuccess();
    } catch (error) {
      console.error('Build failed:', error);
    } finally {
      setBuildingPlatforms((prev) => {
        const next = new Set(prev);
        next.delete(platform.id);
        return next;
      });
    }
  };

  const handleDownload = (build) => {
    if (build.fileUrl) {
      window.open(build.fileUrl, "_blank");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#00c896]" />
            Download Aegis Quantum
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Pre-built installers for your platform. Version 1.0.0 (Latest)
          </p>
        </div>

        {/* Version info */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#00c896] shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-300">
              IDE Version 1.0.0
            </p>
            <p className="text-xs text-gray-500">
              Built with Python 3.10, Node.js 18, and Piston Runtime
            </p>
          </div>
        </div>

        {/* Download cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLATFORM_CONFIGS.map((platform) => {
            const Icon = platform.icon;
            const build = builds[platform.id];
            const isBuilding = buildingPlatforms.has(platform.id);

            return (
              <div
                key={platform.id}
                className="bg-[#0e1018] border border-[#1e2330] rounded-xl p-6 flex flex-col gap-4 hover:border-[#00c896]/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <Icon className="w-8 h-8 text-[#00c896]" />
                  {build ? (
                    <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Built
                    </span>
                  ) : (
                    <span className="text-xs bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20 px-2 py-1 rounded">
                      Not built
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {platform.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {platform.ext} • v1.0.0
                  </p>
                </div>

                {build ? (
                  <button
                    onClick={() => handleDownload(build)}
                    className="flex items-center justify-center gap-2 py-3 bg-[#00c896] hover:bg-[#00b084] text-black font-bold rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download ({(build.size / 1024 / 1024).toFixed(0)} MB)
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuild(platform)}
                    disabled={isBuilding}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    {isBuilding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Building...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        Build Installer
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Code Editor Preview */}
        <CodeEditorPreview
          files={projectFiles}
          activeFileId={projectFiles[0]?.id}
          onFileChange={handleFileChange}
        />

        {/* System requirements */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-300">
            System Requirements
          </h3>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex gap-2">
              <span className="text-[#00c896]">•</span>
              <span>Windows: 10/11 (x64)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#00c896]">•</span>
              <span>macOS: 12.0+ (Intel or Apple Silicon)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#00c896]">•</span>
              <span>Linux: Ubuntu 20.04+ or equivalent</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#00c896]">•</span>
              <span>Minimum 4GB RAM, 2GB disk space</span>
            </li>
          </ul>
        </div>

        {/* Release notes */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Release Notes</h3>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>✓ Full Python 3.10 environment</li>
            <li>✓ Integrated Piston runtime</li>
            <li>✓ Cross-platform support</li>
            <li>✓ Auto-update mechanism</li>
            <li>✓ Plugin ecosystem</li>
          </ul>
        </div>
      </div>
    </div>
  );
}