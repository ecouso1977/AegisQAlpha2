import { Download, Monitor, Apple, Server, Package, CheckCircle } from "lucide-react";

const INSTALLERS = [
  {
    id: "win",
    label: "Windows",
    icon: Monitor,
    size: "142 MB",
    ext: ".exe",
    version: "1.0.0",
  },
  {
    id: "mac",
    label: "macOS",
    icon: Apple,
    size: "158 MB",
    ext: ".dmg",
    version: "1.0.0",
  },
  {
    id: "linux",
    label: "Linux",
    icon: Server,
    size: "135 MB",
    ext: ".AppImage",
    version: "1.0.0",
  },
];

export default function BuildInstallerPanel() {
  const handleDownload = (installer) => {
    const filename = `aegis-quantum-${installer.version}${installer.ext}`;
    // In production, this would be a real download URL
    const url = `/downloads/${filename}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
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
          {INSTALLERS.map((installer) => {
            const Icon = installer.icon;
            return (
              <div
                key={installer.id}
                className="bg-[#0e1018] border border-[#1e2330] rounded-xl p-6 flex flex-col gap-4 hover:border-[#00c896]/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <Icon className="w-8 h-8 text-[#00c896]" />
                  <span className="text-xs bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20 px-2 py-1 rounded">
                    {installer.size}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {installer.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {installer.ext} • v{installer.version}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(installer)}
                  className="flex items-center justify-center gap-2 py-3 bg-[#00c896] hover:bg-[#00b084] text-black font-bold rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            );
          })}
        </div>

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