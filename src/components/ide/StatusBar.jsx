import { GitBranch, Wifi, Zap } from "lucide-react";

export default function StatusBar({ activeFile, isRunning }) {
  return (
    <div className="flex items-center justify-between px-4 py-0.5 bg-[#00c896] text-black text-xs shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <GitBranch style={{ width: 12, height: 12 }} />
          <span>main</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap style={{ width: 12, height: 12 }} />
          <span>Python 3.10</span>
        </div>
        {isRunning && <span className="animate-pulse font-semibold">● Running...</span>}
      </div>

      <div className="flex items-center gap-3">
        {activeFile && <span>{activeFile.name}</span>}
        <div className="flex items-center gap-1">
          <Wifi style={{ width: 12, height: 12 }} />
          <span>Piston Runtime</span>
        </div>
        <span>Aegis Quantum v1.0 · By NOBISYS</span>
      </div>
    </div>
  );
}