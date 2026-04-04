import { useState, useEffect, useRef, useCallback } from "react";
import { Code2, Eye, LayoutDashboard, X, FileCode } from "lucide-react";
import CodeEditor from "./CodeEditor";
import Terminal from "./Terminal";
import LivePreviewPanel from "./LivePreviewPanel";
import WorkspaceDashboard from "./WorkspaceDashboard";

const VIEW_TABS = [
  { id: "code", label: "Code", icon: Code2 },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function getFileExt(name = "") {
  const ext = name.split(".").pop();
  const colors = { py: "text-[#4ec9b0]", js: "text-yellow-400", json: "text-[#ce9178]", md: "text-blue-400", txt: "text-gray-400" };
  return colors[ext] || "text-gray-400";
}

export default function EditorTabs({
  activeFile, activeFileId, files, onSelectFile,
  onChange, breakpoints, onToggleBreakpoint, debugLine,
  remoteCursors, onCursorMove, terminalOutput, onClear, isRunning,
  collabSession, onRun,
}) {
  const [viewTab, setViewTab] = useState("code");
  const [openIds, setOpenIds] = useState(() => activeFileId ? [activeFileId] : []);
  const scrollPositions = useRef({});

  // Auto-open file when active file changes
  useEffect(() => {
    if (!activeFileId) return;
    setOpenIds((prev) => prev.includes(activeFileId) ? prev : [...prev, activeFileId]);
  }, [activeFileId]);

  const closeTab = useCallback((e, id) => {
    e.stopPropagation();
    setOpenIds((prev) => {
      const next = prev.filter((x) => x !== id);
      // If closing the active file, switch to neighbour
      if (id === activeFileId && next.length > 0) {
        const idx = Math.max(0, prev.indexOf(id) - 1);
        onSelectFile(next[idx] ?? next[0]);
      }
      return next;
    });
  }, [activeFileId, onSelectFile]);

  const handleEditorScroll = useCallback((fileId, scrollTop) => {
    scrollPositions.current[fileId] = scrollTop;
  }, []);

  const openFiles = openIds.map((id) => files.find((f) => f.id === id)).filter(Boolean);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* File tabs row */}
      <div className="flex items-end bg-[#080a0f] border-b border-[#1e2330] overflow-x-auto shrink-0" style={{ minHeight: 36 }}>
        {openFiles.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center gap-2 px-4 py-2 text-xs border-r border-[#1e2330] whitespace-nowrap transition-colors shrink-0 relative ${
                isActive
                  ? "bg-[#0d0f14] text-white border-t-2 border-t-[#00c896]"
                  : "bg-[#080a0f] text-gray-500 hover:text-gray-300 hover:bg-[#0d0f14] border-t-2 border-t-transparent"
              }`}
            >
              <FileCode className={`w-3 h-3 shrink-0 ${getFileExt(file.name)}`} />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <span
                onClick={(e) => closeTab(e, file.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ml-0.5 p-0.5 rounded cursor-pointer"
                role="button"
              >
                <X className="w-2.5 h-2.5" />
              </span>
            </button>
          );
        })}
        {openFiles.length === 0 && (
          <span className="px-4 py-2 text-xs text-gray-600 italic">No files open</span>
        )}
      </div>

      {/* View sub-tab bar */}
      <div className="flex items-center bg-[#0a0c11] border-b border-[#1e2330] px-3 gap-0.5 shrink-0">
        {VIEW_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              viewTab === id
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
      {viewTab === "code" && (
        <>
          <CodeEditor
            key={activeFileId}
            file={activeFile}
            onChange={onChange}
            breakpoints={breakpoints}
            onToggleBreakpoint={onToggleBreakpoint}
            debugLine={debugLine}
            remoteCursors={remoteCursors}
            onCursorMove={onCursorMove}
            initialScrollTop={scrollPositions.current[activeFileId] || 0}
            onScroll={(top) => handleEditorScroll(activeFileId, top)}
          />
          <Terminal output={terminalOutput} onClear={onClear} isRunning={isRunning} />
        </>
      )}
      {viewTab === "preview" && <LivePreviewPanel file={activeFile} />}
      {viewTab === "dashboard" && (
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