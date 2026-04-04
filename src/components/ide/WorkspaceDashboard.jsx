import { FileCode, Play, Zap, Users, GitBranch, CheckCircle, Clock, BarChart2 } from "lucide-react";

function StatCard({ icon: Icon, label, value, color = "text-[#00c896]" }) {
  return (
    <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-[#1a1d26] ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function WorkspaceDashboard({ files, terminalOutput, collabSession, onRun, activeFile, isRunning }) {
  const totalLines = files.reduce((acc, f) => acc + (f.content?.split("\n").length || 0), 0);
  const errors = terminalOutput.filter((t) => t.type === "error").length;
  const runs = terminalOutput.filter((t) => t.type === "command").length;
  const participants = collabSession?.participants?.length || 0;

  const recentOutput = terminalOutput.slice(-6);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0f14] p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Workspace Dashboard</h2>
            <p className="text-xs text-gray-500 mt-0.5">Aegis Quantum · Python 3.10 · Piston Runtime</p>
          </div>
          <button
            onClick={onRun}
            disabled={isRunning || !activeFile}
            className="flex items-center gap-2 px-4 py-2 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 text-black text-sm font-semibold rounded transition-colors"
          >
            <Play className="w-4 h-4" />
            {isRunning ? "Running..." : `Run ${activeFile?.name || ""}`}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FileCode} label="Files" value={files.length} color="text-[#00c896]" />
          <StatCard icon={BarChart2} label="Lines of Code" value={totalLines} color="text-blue-400" />
          <StatCard icon={Play} label="Runs" value={runs} color="text-purple-400" />
          <StatCard icon={CheckCircle} label={errors ? "Errors" : "Clean"} value={errors || "✓"} color={errors ? "text-red-400" : "text-emerald-400"} />
        </div>

        {/* Two-col layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Files */}
          <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2330] flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-[#00c896]" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Project Files</span>
            </div>
            <div className="divide-y divide-[#1e2330]">
              {files.map((f) => {
                const lines = f.content?.split("\n").length || 0;
                const isActive = f.id === activeFile?.id;
                return (
                  <div key={f.id} className={`flex items-center justify-between px-4 py-2.5 ${isActive ? "bg-[#1a2a3a]" : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#00c896] shrink-0" />}
                      <span className={`text-sm truncate ${isActive ? "text-[#00c896]" : "text-gray-300"}`}>{f.name}</span>
                    </div>
                    <span className="text-xs text-gray-600 shrink-0">{lines} lines</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terminal / Recent output */}
          <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2330] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Recent Output</span>
            </div>
            <div className="p-3 font-mono text-xs space-y-1 min-h-[120px]">
              {recentOutput.length === 0 && <p className="text-gray-600 p-2">No output yet. Run a file to see results.</p>}
              {recentOutput.map((line, i) => (
                <div key={i} className={`${line.type === "error" ? "text-red-400" : line.type === "command" ? "text-[#00c896]" : "text-gray-300"}`}>
                  {line.text}
                </div>
              ))}
            </div>
          </div>

          {/* Collab */}
          <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2330] flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Collaboration</span>
            </div>
            <div className="px-4 py-4">
              {collabSession?.isConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00c896] animate-pulse" />
                    <span className="text-sm text-[#00c896]">Live session active</span>
                  </div>
                  <p className="text-xs text-gray-500">Session: <span className="text-gray-300 font-mono">{collabSession.sessionId}</span></p>
                  <p className="text-xs text-gray-500">{participants} participant{participants !== 1 ? "s" : ""} connected</p>
                </div>
              ) : (
                <div className="text-xs text-gray-500">No active session. Start one from the CollabBar above.</div>
              )}
            </div>
          </div>

          {/* Git */}
          <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2330] flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Version Control</span>
            </div>
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-300">main</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded">up to date</span>
              </div>
              <p className="text-xs text-gray-600">{files.length} file{files.length !== 1 ? "s" : ""} in workspace · Use the Git panel to connect a repo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}