import { useEffect, useRef, useState, useCallback } from "react";
import { Trash2, Terminal as TermIcon, ChevronRight, ArrowUp, ArrowDown, Zap, Copy, Download } from "lucide-react";

// ── Runtime detection ──────────────────────────────────────────────────────
const RUNTIMES = {
  python: { label: "Python 3.10", lang: "python", version: "3.10.0", color: "#4ec9b0", ext: /\.(py)$/ },
  javascript: { label: "Node 18", lang: "javascript", version: "18.15.0", color: "#f7df1e", ext: /\.(js|mjs)$/ },
  typescript: { label: "TypeScript 5", lang: "typescript", version: "5.0.3", color: "#3178c6", ext: /\.(ts|tsx)$/ },
  go: { label: "Go 1.21", lang: "go", version: "1.21.0", color: "#00acd7", ext: /\.(go)$/ },
  rust: { label: "Rust 1.73", lang: "rust", version: "1.73.0", color: "#f74c00", ext: /\.(rs)$/ },
  cpp: { label: "C++ 17", lang: "c++", version: "10.2.0", color: "#659ad2", ext: /\.(cpp|cc|cxx)$/ },
  c: { label: "C", lang: "c", version: "10.2.0", color: "#a8b9cc", ext: /\.(c)$/ },
  ruby: { label: "Ruby 3.2", lang: "ruby", version: "3.2.0", color: "#cc342d", ext: /\.(rb)$/ },
};

function detectRuntime(fileName) {
  if (!fileName) return RUNTIMES.python;
  for (const rt of Object.values(RUNTIMES)) {
    if (rt.ext.test(fileName)) return rt;
  }
  return RUNTIMES.python;
}

// ── Context-aware suggestions ──────────────────────────────────────────────
const SUGGESTIONS = {
  python: ["python main.py", "pip install numpy", "pip list", "python -c 'import sys; print(sys.version)'", "python -m pytest"],
  javascript: ["node index.js", "npm install", "npm run dev", "npm test", "node -e 'console.log(process.version)'"],
  typescript: ["ts-node index.ts", "tsc --watch", "npx ts-node src/index.ts"],
  go: ["go run main.go", "go build .", "go test ./...", "go fmt ./...", "go mod tidy"],
  rust: ["cargo run", "cargo build", "cargo test", "cargo fmt", "cargo check"],
  cpp: ["g++ -o out main.cpp && ./out", "clang++ -std=c++17 -o out main.cpp && ./out"],
  c: ["gcc -o out main.c && ./out"],
  ruby: ["ruby main.rb", "gem install bundler", "bundle exec ruby main.rb"],
};

const UNIVERSAL_CMDS = ["clear", "help", "history", "env", "ls", "pwd", "echo $PATH"];

function getSuggestions(input, runtimeKey) {
  const all = [...(SUGGESTIONS[runtimeKey] || []), ...UNIVERSAL_CMDS];
  if (!input) return all.slice(0, 8);
  return all.filter((s) => s.startsWith(input) && s !== input).slice(0, 6);
}

// ── Piston executor ────────────────────────────────────────────────────────
async function executePiston(lang, version, code, stdin = "") {
  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: lang, version, files: [{ name: "main", content: code }], stdin }),
  });
  const data = await res.json();
  return { stdout: data.run?.output || "", stderr: data.run?.stderr || "", code: data.run?.code ?? 0 };
}

// ── Colour helpers ─────────────────────────────────────────────────────────
function lineColor(type) {
  return { output: "#e5e7eb", error: "#f87171", info: "#60a5fa", command: "#a3e635", system: "#a78bfa" }[type] || "#e5e7eb";
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdvancedTerminal({ output, onClear, isRunning, activeFile, onPipeToEditor }) {
  const runtime = detectRuntime(activeFile?.name);
  const runtimeKey = Object.keys(RUNTIMES).find((k) => RUNTIMES[k] === runtime) || "python";

  const [lines, setLines] = useState(output || []);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem("aq_term_history")) || []; } catch { return []; } });
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [executing, setExecuting] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Sync external output into lines
  useEffect(() => { setLines(output || []); }, [output]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const pushLine = useCallback((text, type = "output") => {
    setLines((prev) => [...prev, { text, type }]);
  }, []);

  const runCommand = useCallback(async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Save to history
    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, 100);
    setHistory(newHistory);
    localStorage.setItem("aq_term_history", JSON.stringify(newHistory));
    setHistoryIdx(-1);
    setInput("");
    setShowSuggestions(false);

    pushLine(`$ ${trimmed}`, "command");

    // Built-in commands
    if (trimmed === "clear") { setLines([]); onClear?.(); return; }
    if (trimmed === "help") {
      pushLine(`Aegis Quantum Terminal — Runtime: ${runtime.label}`, "system");
      pushLine(`Context commands: ${(SUGGESTIONS[runtimeKey] || []).slice(0, 4).join(", ")}`, "system");
      pushLine(`Type any shell command to execute. Use ↑↓ for history.`, "system");
      return;
    }
    if (trimmed === "history") {
      history.slice(0, 20).forEach((h, i) => pushLine(`  ${i + 1}  ${h}`, "info"));
      return;
    }
    if (trimmed === "env") {
      pushLine(`RUNTIME=${runtime.lang}  VERSION=${runtime.version}  FILE=${activeFile?.name || "none"}`, "info");
      return;
    }
    if (trimmed.startsWith("echo ")) {
      pushLine(trimmed.slice(5).replace(/\$PATH/, "/usr/bin:/usr/local/bin"), "output");
      return;
    }

    // Pipe output to editor
    if (trimmed.startsWith("pipe:")) {
      const code = trimmed.slice(5).trim() || activeFile?.content;
      if (!code) { pushLine("No code to pipe", "error"); return; }
      setExecuting(true);
      const { stdout, stderr } = await executePiston(runtime.lang, runtime.version, code);
      setExecuting(false);
      if (stdout) { pushLine(stdout, "output"); onPipeToEditor?.(stdout); pushLine("↳ Output piped to editor", "system"); }
      if (stderr) pushLine(stderr, "error");
      return;
    }

    // Try to detect if it's a "run file" command for supported runtime
    const isRunFile =
      (runtimeKey === "python" && /^python3?\s/.test(trimmed)) ||
      (runtimeKey === "javascript" && /^node\s/.test(trimmed)) ||
      (runtimeKey === "go" && /^go run/.test(trimmed)) ||
      (runtimeKey === "rust" && /^cargo run/.test(trimmed)) ||
      (runtimeKey === "ruby" && /^ruby\s/.test(trimmed));

    if (isRunFile && activeFile) {
      setExecuting(true);
      pushLine(`Running ${activeFile.name} via Piston (${runtime.label})...`, "system");
      const { stdout, stderr, code } = await executePiston(runtime.lang, runtime.version, activeFile.content);
      setExecuting(false);
      if (stdout) stdout.split("\n").filter(Boolean).forEach((l) => pushLine(l, "output"));
      if (stderr) stderr.split("\n").filter(Boolean).forEach((l) => pushLine(l, "error"));
      pushLine(`Process exited with code ${code}`, "system");
      return;
    }

    // Fallback: try to execute as code snippet via Piston
    setExecuting(true);
    let snippet = trimmed;
    // Wrap in appropriate print/log for simple expressions
    if (runtimeKey === "python" && !trimmed.includes("\n") && !trimmed.startsWith("import") && !trimmed.includes("=")) {
      snippet = `print(${trimmed})`;
    } else if (runtimeKey === "javascript" && !trimmed.includes("\n") && !trimmed.includes("=")) {
      snippet = `console.log(${trimmed})`;
    }
    const { stdout, stderr } = await executePiston(runtime.lang, runtime.version, snippet);
    setExecuting(false);
    if (stdout) stdout.split("\n").filter(Boolean).forEach((l) => pushLine(l, "output"));
    if (stderr) stderr.split("\n").filter(Boolean).forEach((l) => pushLine(l, "error"));
    if (!stdout && !stderr) pushLine("(no output)", "info");
  }, [history, runtime, runtimeKey, activeFile, onPipeToEditor, pushLine, onClear]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { runCommand(input); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[idx] || "");
      setShowSuggestions(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? "" : history[idx] || "");
      setShowSuggestions(false);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const sugs = getSuggestions(input, runtimeKey);
      if (sugs.length === 1) { setInput(sugs[0]); setShowSuggestions(false); }
      else if (sugs.length > 1) setShowSuggestions(true);
      return;
    }
    if (e.key === "Escape") { setShowSuggestions(false); }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    setHistoryIdx(-1);
    const sugs = getSuggestions(val, runtimeKey);
    setSuggestions(sugs);
    setShowSuggestions(val.length > 0 && sugs.length > 0);
  };

  const copyOutput = () => {
    const text = lines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="shrink-0 border-t border-[#1e2330] flex flex-col bg-[#080a0f]" style={{ height: 220 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e2330] shrink-0">
        <div className="flex items-center gap-2">
          <TermIcon className="w-3.5 h-3.5 text-[#00c896]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#00c896]">Terminal</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded border text-xs font-mono shrink-0" style={{ color: runtime.color, borderColor: runtime.color + "44", background: runtime.color + "11" }}>
            {runtime.label}
          </span>
          {(isRunning || executing) && <span className="text-xs text-yellow-400 animate-pulse">● running</span>}
          {activeFile && (
            <button
              title="Quick run active file"
              onClick={() => runCommand(
                runtimeKey === "python" ? `python ${activeFile.name}` :
                runtimeKey === "javascript" ? `node ${activeFile.name}` :
                runtimeKey === "go" ? `go run ${activeFile.name}` :
                runtimeKey === "rust" ? `cargo run` :
                `ruby ${activeFile.name}`
              )}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-[#00c896]/10 hover:bg-[#00c896]/20 border border-[#00c896]/30 text-[#00c896] rounded transition-colors"
            >
              <Zap className="w-3 h-3" /> Run
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyOutput} title="Copy output" className="text-gray-600 hover:text-gray-400 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setLines([]); onClear?.(); }} title="Clear" className="text-gray-600 hover:text-gray-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-1 font-mono text-xs leading-5 space-y-0.5 cursor-text" onClick={() => inputRef.current?.focus()}>
        {lines.map((line, i) => (
          <div key={i} style={{ color: lineColor(line.type), whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {line.text}
          </div>
        ))}
        {lines.length === 0 && (
          <div className="text-gray-600 italic">
            Terminal ready — runtime: <span style={{ color: runtime.color }}>{runtime.label}</span>. Type <span className="text-gray-400">help</span> or press Tab for suggestions.
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input row */}
      <div className="relative border-t border-[#1e2330] shrink-0">
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-[#0e1018] border border-[#2a2d3a] rounded-t overflow-hidden z-50 max-h-40 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={(e) => { e.preventDefault(); setInput(s); setShowSuggestions(false); inputRef.current?.focus(); }}
                className="w-full text-left px-3 py-1 text-xs font-mono text-gray-300 hover:bg-[#1a1d26] hover:text-[#00c896] transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
                {s}
              </button>
            ))}
            <div className="px-3 py-1 text-[10px] text-gray-600 border-t border-[#1e2330]">Tab to complete · Enter to run</div>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="text-[#00c896] font-mono text-xs shrink-0 select-none">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`${runtime.lang} shell — Tab for suggestions, ↑↓ history`}
            disabled={executing}
            className="flex-1 bg-transparent text-gray-200 text-xs font-mono outline-none placeholder-gray-700 caret-[#00c896]"
            autoComplete="off"
            spellCheck={false}
          />
          {executing && <span className="text-[10px] text-yellow-400 animate-pulse shrink-0">executing...</span>}
        </div>
      </div>
    </div>
  );
}