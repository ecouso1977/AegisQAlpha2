import { useState } from "react";
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

const MAIN_TABS = ["Code", "Infra", "Deploy", "Cloud", "API Vault", "Plugins"];

export default function IDE() {
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

  const activeFile = files.find((f) => f.id === activeFileId);

  const updateFileContent = (content) => {
    setFiles((prev) => prev.map((f) => (f.id === activeFileId ? { ...f, content } : f)));
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
      <IDEHeader
        activeFile={activeFile}
        isRunning={isRunning}
        onRun={runCode}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={MAIN_TABS}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar active={activityTab} onChange={setActivityTab} />

        {/* Left Panel (Explorer / Search / etc) */}
        {activityTab === "explorer" && (
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onSelect={(id) => { setActiveFileId(id); setActiveTab("Code"); }}
            onAdd={addFile}
            onDelete={deleteFile}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {activeTab === "Code" && (
            <>
              <CodeEditor file={activeFile} onChange={updateFileContent} />
              <Terminal output={terminalOutput} onClear={clearTerminal} isRunning={isRunning} />
            </>
          )}
          {activeTab === "Infra" && <InfraPanel />}
          {activeTab === "Deploy" && <DeployPanel activeFile={activeFile} />}
          {activeTab === "Cloud" && <CloudPanel />}
          {activeTab === "API Vault" && <APIVault />}
          {activeTab === "Plugins" && <PluginsPanel />}
        </div>

        {/* AI Chat */}
        {chatOpen && <AIChat activeFile={activeFile} />}
      </div>

      <StatusBar activeFile={activeFile} isRunning={isRunning} />
    </div>
  );
}