import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCollabSession } from "../hooks/useCollabSession";
import FileExplorer from "../components/ide/FileExplorer";
import CodeEditor from "../components/ide/CodeEditor";
import Terminal from "../components/ide/Terminal";
import AIChat from "../components/ide/AIChat";
import IDEHeader from "../components/ide/IDEHeader";
import ActivityBar from "../components/ide/ActivityBar";
import StatusBar from "../components/ide/StatusBar";
import InfraPanel from "../components/ide/InfraPanel";
import DeployPanel from "../components/ide/DeployPanel";
import CloudPanel from "../components/ide/CloudPanel";
import APIVault from "../components/ide/APIVault";
import PluginsPanel from "../components/ide/PluginsPanel";
import DebugPanel from "../components/ide/DebugPanel";
import GitPanel from "../components/ide/GitPanel";
import MarketplacePanel from "../components/ide/MarketplacePanel";
import LivePreviewPanel from "../components/ide/LivePreviewPanel";
import CollabBar from "../components/ide/CollabBar";
import RefactorPanel from "../components/ide/RefactorPanel";
import TestingPanel from "../components/ide/TestingPanel";

const DEFAULT_FILES = [
  {
    id: "1",
    name: "main.py",
    language: "python",
    content: `# Aegis Quantum — Python Environment
# Welcome to the AI-powered developer workbench

def greet(name):
    """Returns a greeting message."""
    return f"Hello, {name}! Welcome to Aegis Quantum IDE."

def fibonacci(n):
    """Generate fibonacci sequence up to n terms."""
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib[:n]

if __name__ == "__main__":
    print(greet("Developer"))
    print("Fibonacci(10):", fibonacci(10))
`,
  },
  {
    id: "2",
    name: "utils.py",
    language: "python",
    content: `# Utility functions

def flatten(lst):
    """Flatten a nested list."""
    result = []
    for item in lst:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result

def chunk(lst, size):
    """Split list into chunks of given size."""
    return [lst[i:i+size] for i in range(0, len(lst), size)]

print(flatten([1, [2, [3, 4]], 5]))
print(chunk(list(range(10)), 3))
`,
  },
  {
    id: "3",
    name: "data_analysis.py",
    language: "python",
    content: `# Data Analysis Example
import statistics

data = [12, 45, 7, 23, 89, 34, 56, 11, 78, 42]

print("Dataset:", data)
print("Mean:", statistics.mean(data))
print("Median:", statistics.median(data))
print("Stdev:", round(statistics.stdev(data), 2))
print("Min:", min(data))
print("Max:", max(data))
print("Sorted:", sorted(data))
`,
  },
];

const MAIN_TABS = ["Code", "Debug", "Live Preview", "Testing", "Refactor", "Infra", "Deploy", "Cloud", "API Vault", "Plugins", "Marketplace"];

const DEBUGGER_INJECTOR = `
import sys as __sys__, json as __json__
__debug_steps__ = []
def __tracer__(frame, event, arg):
    if event == 'line':
        try:
            locs = {k: repr(v) for k, v in frame.f_locals.items() if not k.startswith('__')}
            __debug_steps__.append({'line': frame.f_lineno - __offset__, 'locals': locs, 'func': frame.f_code.co_name})
        except: pass
    return __tracer__
__sys__.settrace(__tracer__)
`;

const DEBUGGER_FOOTER = `
__sys__.settrace(None)
print('__AQ_DEBUG__:' + __json__.dumps(__debug_steps__))
`;

export default function IDE() {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState("1");
  const [terminalOutput, setTerminalOutput] = useState([
    { type: "info", text: "🚀 Aegis Quantum Workbench Ready" },
    { type: "info", text: "Python 3.10 | Piston Runtime v2" },
    { type: "info", text: 'Select a file and click "Run" to execute.' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Code");
  const [activityTab, setActivityTab] = useState("explorer");
  const [breakpoints, setBreakpoints] = useState(new Set());
  const [debugSession, setDebugSession] = useState(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const collabContentRef = useRef(false);

  const handleRemoteContent = useCallback((content, isRemote) => {
    if (isRemote) {
      collabContentRef.current = true;
      setFiles((prev) => prev.map((f) => f.id === activeFileId ? { ...f, content } : f));
      setTimeout(() => { collabContentRef.current = false; }, 100);
    }
  }, [activeFileId]);

  const collab = useCollabSession({
    activeFile: files.find((f) => f.id === activeFileId),
    onContentChange: handleRemoteContent,
    currentUser,
  });

  const toggleBreakpoint = (line) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line); else next.add(line);
      return next;
    });
  };

  const startDebug = async () => {
    if (!activeFile) return;
    setActiveTab("Debug");
    setIsDebugging(true);
    setDebugSession({ loading: true, steps: [], currentIndex: 0 });
    const OFFSET = 8; // injector header lines
    const injectedCode =
      DEBUGGER_INJECTOR.replace('__offset__', String(OFFSET)) +
      activeFile.content +
      DEBUGGER_FOOTER;
    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "python", version: "3.10.0", files: [{ name: activeFile.name, content: injectedCode }] }),
      });
      const data = await res.json();
      const output = data.run?.output || "";
      const stderr = data.run?.stderr || "";
      const debugLine = output.split("\n").find((l) => l.startsWith("__AQ_DEBUG__:"));
      if (debugLine) {
        const steps = JSON.parse(debugLine.replace("__AQ_DEBUG__:", ""));
        const bpSet = breakpoints.size > 0 ? breakpoints : null;
        const filtered = bpSet ? steps.filter((s) => bpSet.has(s.line) || true) : steps;
        setDebugSession({ loading: false, steps: filtered, currentIndex: 0 });
      } else {
        const errMsg = stderr || "No debug output — check your code for syntax errors.";
        setDebugSession({ loading: false, steps: [], currentIndex: 0, error: errMsg });
        setIsDebugging(false);
      }
    } catch (e) {
      setDebugSession({ loading: false, steps: [], currentIndex: 0, error: "Failed to reach execution runtime." });
      setIsDebugging(false);
    }
  };

  const stopDebug = () => { setIsDebugging(false); setDebugSession(null); };

  const stepDebug = (type, targetIndex) => {
    setDebugSession((prev) => {
      if (!prev) return prev;
      const { currentIndex, steps } = prev;
      let next = currentIndex;
      if (type === "goto") next = targetIndex;
      else if (type === "over" || type === "into") next = Math.min(currentIndex + 1, steps.length - 1);
      return { ...prev, currentIndex: next };
    });
  };

  const continueDebug = () => {
    setDebugSession((prev) => {
      if (!prev) return prev;
      const { currentIndex, steps } = prev;
      // jump to next breakpoint or end
      const bpArr = [...breakpoints].sort((a, b) => a - b);
      const nextBP = bpArr.find((bp) => {
        const idx = steps.findIndex((s, i) => i > currentIndex && s.line === bp);
        return idx !== -1;
      });
      let next = steps.length - 1;
      if (nextBP !== undefined) {
        const idx = steps.findIndex((s, i) => i > currentIndex && s.line === nextBP);
        if (idx !== -1) next = idx;
      }
      return { ...prev, currentIndex: next };
    });
  };

  const debugLine = isDebugging && debugSession?.steps?.[debugSession.currentIndex]?.line;

  const handleNavAction = (action) => {
    if (action === "run") runCode();
    else if (action === "clear-terminal") clearTerminal();
    else if (action === "toggle-chat") setChatOpen((v) => !v);
    else if (action === "view-explorer") setActivityTab("explorer");
    else if (action === "view-git") setActivityTab("git");
    else if (action === "view-debug") setActiveTab("Debug");
    else if (action === "new-file") addFile(`untitled_${Date.now()}.py`);
    else if (action === "docs") window.open("https://aegisquantum.dev/docs", "_blank");
    else if (action === "report") window.open("https://github.com/aegis-quantum/issues", "_blank");
  };

  const handleClone = (clonedFiles, label) => {
    setFiles(clonedFiles);
    setActiveFileId(clonedFiles[0]?.id || null);
    setActiveTab("Code");
  };

  const activeFile = files.find((f) => f.id === activeFileId);

  const updateFileContent = (content) => {
    setFiles((prev) => prev.map((f) => (f.id === activeFileId ? { ...f, content } : f)));
    if (collab.isConnected && !collabContentRef.current) {
      collab.pushContent(content);
    }
  };

  const addFile = (name) => {
    const newFile = { id: Date.now().toString(), name, language: "python", content: `# ${name}\n\n` };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const deleteFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      setActiveFileId(remaining[0]?.id || null);
    }
  };

  const renameFile = (id, newName) => {
    let name = newName.trim();
    if (!name) return;
    if (!name.includes(".")) name += ".py";
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
  };

  const runCode = async () => {
    if (!activeFile) return;
    setActiveTab("Code");
    setIsRunning(true);
    setTerminalOutput((prev) => [...prev, { type: "command", text: `▶ Running ${activeFile.name}...` }]);
    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "python",
          version: "3.10.0",
          files: [{ name: activeFile.name, content: activeFile.content }],
        }),
      });
      const data = await res.json();
      const output = data.run?.output || "";
      const stderr = data.run?.stderr || "";
      if (output) output.split("\n").forEach((line) => { if (line) setTerminalOutput((p) => [...p, { type: "output", text: line }]); });
      if (stderr) stderr.split("\n").forEach((line) => { if (line) setTerminalOutput((p) => [...p, { type: "error", text: line }]); });
      if (!output && !stderr) setTerminalOutput((p) => [...p, { type: "info", text: "✓ Execution completed (no output)" }]);
    } catch {
      setTerminalOutput((p) => [...p, { type: "error", text: "❌ Failed to reach execution runtime." }]);
    }
    setIsRunning(false);
  };

  const clearTerminal = () => setTerminalOutput([]);

  return (
    <div className="flex flex-col h-screen bg-[#0d0f14] text-gray-100 overflow-hidden">
      <CollabBar
        sessionId={collab.sessionId}
        participants={collab.participants}
        onJoin={collab.join}
        onLeave={collab.leave}
        isConnected={collab.isConnected}
        currentUser={currentUser}
      />
      <IDEHeader
        activeFile={activeFile}
        isRunning={isRunning}
        onRun={runCode}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={MAIN_TABS}
        onNavAction={handleNavAction}
        files={files}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar active={activityTab} onChange={setActivityTab} />

        {/* Left Panel (Explorer / Search / etc) */}
        {activityTab === "git" && (
          <GitPanel
            onClone={handleClone}
            files={files}
            activeFile={activeFile}
          />
        )}
        {activityTab === "explorer" && (
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onSelect={(id) => { setActiveFileId(id); setActiveTab("Code"); }}
            onAdd={addFile}
            onDelete={deleteFile}
            onRename={renameFile}
            collabSession={collab}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {activeTab === "Code" && (
            <>
              <CodeEditor
                file={activeFile}
                onChange={updateFileContent}
                breakpoints={breakpoints}
                onToggleBreakpoint={toggleBreakpoint}
                debugLine={debugLine || null}
                remoteCursors={collab.remoteCursors}
                onCursorMove={collab.isConnected ? collab.pushCursor : null}
              />
              <Terminal output={terminalOutput} onClear={clearTerminal} isRunning={isRunning} />
            </>
          )}
          {activeTab === "Debug" && (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex flex-col flex-1 overflow-hidden">
                <CodeEditor
                  file={activeFile}
                  onChange={updateFileContent}
                  breakpoints={breakpoints}
                  onToggleBreakpoint={toggleBreakpoint}
                  debugLine={debugLine || null}
                  remoteCursors={collab.remoteCursors}
                  onCursorMove={collab.isConnected ? collab.pushCursor : null}
                />
              </div>
              <div className="w-72 shrink-0 border-l border-[#1e2330] overflow-hidden flex flex-col">
                <DebugPanel
                  session={debugSession}
                  onStart={startDebug}
                  onStop={stopDebug}
                  onStep={stepDebug}
                  onContinue={continueDebug}
                  isDebugging={isDebugging}
                  breakpoints={breakpoints}
                  activeFile={activeFile}
                />
              </div>
            </div>
          )}
          {activeTab === "Infra" && <InfraPanel />}
          {activeTab === "Deploy" && <DeployPanel activeFile={activeFile} />}
          {activeTab === "Cloud" && <CloudPanel />}
          {activeTab === "API Vault" && <APIVault />}
          {activeTab === "Plugins" && <PluginsPanel />}
          {activeTab === "Marketplace" && <MarketplacePanel />}
          {activeTab === "Live Preview" && <LivePreviewPanel file={activeFile} />}
          {activeTab === "Testing" && <TestingPanel files={files} />}
          {activeTab === "Refactor" && <RefactorPanel file={activeFile} />}
        </div>

        {/* AI Chat */}
        {chatOpen && <AIChat activeFile={activeFile} />}
      </div>

      <StatusBar activeFile={activeFile} isRunning={isRunning} />
    </div>
  );
}