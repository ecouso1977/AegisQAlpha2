import { useState } from "react";
import { Code2, Eye, LayoutDashboard } from "lucide-react";
import CodeEditor from "./CodeEditor";
import Terminal from "./Terminal";
import LivePreviewPanel from "./LivePreviewPanel";
import WorkspaceDashboard from "./WorkspaceDashboard";

const TABS = [
  { id: "code", label: "Code", icon: Code2 },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function EditorTabs({
  activeFile, onChange, breakpoints, onToggleBreakpoint, debugLine,
  remoteCursors, onCursorMove, terminalOutput, onClear, isRunning,
  files, collabSession, onRun,
}) {
  const [tab, setTab] = useState("code");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Sub-tab bar */}
      <div className="flex items-center bg-[#0a0c11] border-b border-[#1e2330] px-3 gap-0.5 shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-[#00c896] text-[#00c896]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "code" && (
        <>
          <CodeEditor
            file={activeFile}
            onChange={onChange}
            breakpoints={breakpoints}
            onToggleBreakpoint={onToggleBreakpoint}
            debugLine={debugLine}
            remoteCursors={remoteCursors}
            onCursorMove={onCursorMove}
          />
          <Terminal output={terminalOutput} onClear={onClear} isRunning={isRunning} />
        </>
      )}
      {tab === "preview" && <LivePreviewPanel file={activeFile} />}
      {tab === "dashboard" && (
        <WorkspaceDashboard
          files={files}
          terminalOutput={terminalOutput}
          collabSession={collabSession}
          onRun={onRun}
          activeFile={activeFile}
          isRunning={isRunning}
        />
      )}
    </div>
  );
}