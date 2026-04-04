import { useRef, useState, useEffect, useCallback, useRef as useDebounceRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { SUGGESTIONS, KIND_COLORS, KIND_LABELS } from "./pythonSuggestions";

const PYTHON_KEYWORDS = [
  "def", "class", "import", "from", "return", "if", "elif", "else",
  "for", "while", "in", "not", "and", "or", "is", "True", "False",
  "None", "print", "range", "len", "str", "int", "float", "list",
  "dict", "set", "try", "except", "finally", "with", "as", "pass",
  "break", "continue", "lambda", "yield", "assert", "del", "global",
  "nonlocal", "raise", "self", "__name__", "__main__",
];

function highlight(code) {
  if (!code) return "";
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g, '<span style="color:#ce9178">$1</span>')
    .replace(/(#[^\n]*)/g, '<span style="color:#6a9955">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>')
    .replace(new RegExp(`\\b(${PYTHON_KEYWORDS.join("|")})\\b`, "g"), '<span style="color:#569cd6">$1</span>')
    .replace(/\b(def|class)\s+(\w+)/g, (m, kw, name) =>
      `<span style="color:#569cd6">${kw}</span> <span style="color:#dcdcaa">${name}</span>`
    );
}

function getWordAtCursor(text, cursorPos) {
  const before = text.slice(0, cursorPos);
  const match = before.match(/[\w.]+$/);
  return match ? match[0] : "";
}

export default function CodeEditor({ file, onChange, breakpoints = new Set(), onToggleBreakpoint, debugLine = null, remoteCursors = [], onCursorMove }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const [autocomplete, setAutocomplete] = useState({ visible: false, items: [], index: 0, pos: { top: 0, left: 0 }, word: "" });
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiDebounceRef = useRef(null);
  const lastCursorRef = useRef(0);

  const syncScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const computeCaretCoords = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return { top: 0, left: 0 };
    const { selectionStart, value } = ta;
    const lines = value.slice(0, selectionStart).split("\n");
    const lineIndex = lines.length - 1;
    const lineH = 24; // leading-6
    const charW = 9.6; // approx monospace char width
    const col = lines[lineIndex].length;
    return {
      top: lineIndex * lineH + lineH + 4,
      left: col * charW + 48, // 48px offset for line numbers
    };
  }, []);

  const showSuggestions = useCallback((value, cursor) => {
    const word = getWordAtCursor(value, cursor);
    if (word.length < 1) {
      setAutocomplete((a) => ({ ...a, visible: false }));
      return;
    }
    const lower = word.toLowerCase();
    const filtered = SUGGESTIONS.filter((s) =>
      s.label.toLowerCase().startsWith(lower) && s.label.toLowerCase() !== lower
    ).slice(0, 10);
    if (filtered.length === 0) {
      setAutocomplete((a) => ({ ...a, visible: false }));
      return;
    }
    const pos = computeCaretCoords();
    setAutocomplete({ visible: true, items: filtered, index: 0, pos, word });
  }, [computeCaretCoords]);

  const applyCompletion = useCallback((item) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { value, selectionStart } = ta;
    const word = getWordAtCursor(value, selectionStart);
    const before = value.slice(0, selectionStart - word.length);
    const after = value.slice(selectionStart);
    const insertion = item.label;
    const newVal = before + insertion + after;
    onChange(newVal);
    setAutocomplete((a) => ({ ...a, visible: false }));
    setTimeout(() => {
      ta.focus();
      const pos = before.length + insertion.length;
      ta.selectionStart = ta.selectionEnd = pos;
    }, 0);
  }, [onChange]);

  const handleKeyDown = (e) => {
    // Accept AI suggestion with Tab when no autocomplete
    if (e.key === "Tab" && aiSuggestion && !autocomplete.visible) {
      e.preventDefault();
      const ta = textareaRef.current;
      const { value, selectionStart } = ta;
      const newVal = value.slice(0, selectionStart) + aiSuggestion + value.slice(selectionStart);
      onChange(newVal);
      setAiSuggestion("");
      const newPos = selectionStart + aiSuggestion.length;
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = newPos; }, 0);
      return;
    }
    if (e.key === "Escape" && aiSuggestion) {
      setAiSuggestion("");
      return;
    }
    if (autocomplete.visible) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAutocomplete((a) => ({ ...a, index: Math.min(a.index + 1, a.items.length - 1) }));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAutocomplete((a) => ({ ...a, index: Math.max(a.index - 1, 0) }));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyCompletion(autocomplete.items[autocomplete.index]);
        return;
      }
      if (e.key === "Escape") {
        setAutocomplete((a) => ({ ...a, visible: false }));
        return;
      }
    }

    if (e.key === "Tab" && !autocomplete.visible) {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = ta.value.substring(0, start) + "    " + ta.value.substring(end);
      onChange(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; }, 0);
    }
  };

  const fetchAISuggestion = useCallback(async (value, cursor) => {
    const prefix = value.slice(0, cursor);
    const lastLine = prefix.split("\n").pop();
    if (lastLine.trim().length < 3) return;
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Python code autocomplete engine (like GitHub Copilot). Given the code prefix below, suggest ONLY the next 1-3 lines of code that naturally complete it. Output ONLY the raw code continuation — no markdown, no explanation, no backticks, no extra text.

Code so far:
\`\`\`python
${prefix}
\`\`\`

Continuation (raw code only):`,
      });
      const suggestion = (result || "").replace(/^```[\w]*\n?|```$/g, "").trimEnd();
      if (suggestion && lastCursorRef.current === cursor) {
        setAiSuggestion(suggestion);
      }
    } catch {}
    setAiLoading(false);
  }, []);

  const handleChange = (e) => {
    const { value, selectionStart } = e.target;
    onChange(value);
    showSuggestions(value, selectionStart);
    setAiSuggestion("");
    lastCursorRef.current = selectionStart;
    clearTimeout(aiDebounceRef.current);
    aiDebounceRef.current = setTimeout(() => fetchAISuggestion(value, selectionStart), 900);
  };

  const handleClick = () => {
    const ta = textareaRef.current;
    if (ta) { showSuggestions(ta.value, ta.selectionStart); setAiSuggestion(""); }
  };

  const handleKeyUp = (e) => {
    if (!onCursorMove) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const lines = ta.value.slice(0, ta.selectionStart).split("\n");
    onCursorMove(lines.length, lines[lines.length - 1].length);
  };

  const lines = (file?.content || "").split("\n").length;

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0f14] text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Create or select a file to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d0f14] font-mono text-sm relative">
      {/* Line numbers + breakpoint gutter */}
      <div className="select-none text-right text-gray-600 pt-4 leading-6 overflow-hidden min-w-[3.5rem] bg-[#0a0c11] border-r border-[#1e2330] cursor-pointer">
        {Array.from({ length: lines }, (_, i) => {
          const lineNum = i + 1;
          const isBP = breakpoints.has(lineNum);
          const isActive = debugLine === lineNum;
          return (
            <div
              key={lineNum}
              onClick={() => onToggleBreakpoint?.(lineNum)}
              className={`relative flex items-center justify-end pr-2 group transition-colors ${
                isActive ? "bg-[#264f78]/40" : isBP ? "bg-red-500/10" : "hover:bg-[#1a1d26]"
              }`}
            >
              {isBP && (
                <span className="absolute left-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" style={{top: '50%', transform: 'translateY(-50%)'}} />
              )}
              {isActive && (
                <span className="absolute left-1 text-yellow-400" style={{fontSize: 10, top: '50%', transform: 'translateY(-50%)'}}>▶</span>
              )}
              <span className={isActive ? "text-yellow-400" : isBP ? "text-red-400" : "text-gray-600"}>{lineNum}</span>
            </div>
          );
        })}
      </div>

      {/* Editor area */}
      <div className="relative flex-1 overflow-hidden">
        {/* AI loading indicator */}
        {aiLoading && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-[#1a1d26]/80 border border-[#2a2d3a] rounded px-2 py-0.5">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-[#00c896]" />
            <span className="text-xs text-gray-500">AI</span>
          </div>
        )}

        {/* Ghost text suggestion overlay */}
        {aiSuggestion && !aiLoading && (
          <div
            className="absolute inset-0 p-4 leading-6 pointer-events-none overflow-hidden whitespace-pre select-none"
            style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace" }}
          >
            <span style={{ color: "transparent" }}>{file.content.slice(0, textareaRef.current?.selectionStart ?? 0)}</span><span style={{ color: "#6b7280", opacity: 0.7 }}>{aiSuggestion}</span>
          </div>
        )}

        {/* Tab hint */}
        {aiSuggestion && !aiLoading && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-[#1a1d26]/90 border border-[#00c896]/30 rounded px-2 py-0.5">
            <span className="text-xs text-[#00c896]">Tab</span>
            <span className="text-xs text-gray-500">accept</span>
            <span className="text-xs text-gray-600 ml-1">Esc dismiss</span>
          </div>
        )}

        {/* Highlighted layer */}
        <pre
          ref={highlightRef}
          aria-hidden="true"
          className="absolute inset-0 p-4 leading-6 text-gray-100 overflow-auto pointer-events-none whitespace-pre"
          style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace" }}
          dangerouslySetInnerHTML={{ __html: highlight(file.content) + "\n" }}
        />
        {/* Textarea */}
        {remoteCursors.map((cursor, i) => {
          const lineH = 24;
          const charW = 9.6;
          const top = (cursor.line - 1) * lineH + 4;
          const left = cursor.col * charW;
          return (
            <div key={i} className="absolute pointer-events-none z-20" style={{ top, left }}>
              <div className="w-0.5 h-5 absolute" style={{ backgroundColor: cursor.color }} />
              <div
                className="absolute -top-5 left-1 text-[9px] font-bold px-1 rounded whitespace-nowrap"
                style={{ backgroundColor: cursor.color, color: "#000" }}
              >
                {cursor.user_name || cursor.user_email}
              </div>
            </div>
          );
        })}
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={handleChange}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onClick={handleClick}
          onBlur={() => setTimeout(() => setAutocomplete((a) => ({ ...a, visible: false })), 150)}
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-4 leading-6 bg-transparent text-transparent caret-white resize-none outline-none overflow-auto"
          style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace", caretColor: "#00c896" }}
        />

        {/* Autocomplete dropdown */}
        {autocomplete.visible && (
          <div
            className="absolute z-50 bg-[#1a1d26] border border-[#3a3d4a] rounded shadow-2xl overflow-hidden"
            style={{ top: autocomplete.pos.top, left: autocomplete.pos.left, minWidth: 260, maxWidth: 360 }}
          >
            {autocomplete.items.map((item, i) => (
              <div
                key={item.label}
                onMouseDown={(e) => { e.preventDefault(); applyCompletion(item); }}
                className={`flex items-start gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                  i === autocomplete.index ? "bg-[#264f78]" : "hover:bg-[#2a2d3a]"
                }`}
              >
                <span
                  className="text-xs font-bold rounded px-1 shrink-0 mt-0.5"
                  style={{ color: KIND_COLORS[item.kind], backgroundColor: `${KIND_COLORS[item.kind]}22` }}
                >
                  {KIND_LABELS[item.kind]}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-gray-100 text-xs font-mono">{item.label}</span>
                  <span className="text-gray-500 text-xs ml-2 truncate">{item.detail}</span>
                </div>
              </div>
            ))}
            <div className="px-3 py-1 border-t border-[#2a2d3a] flex gap-3 text-gray-600 text-xs">
              <span>↑↓ navigate</span>
              <span>↵/Tab accept</span>
              <span>Esc dismiss</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}