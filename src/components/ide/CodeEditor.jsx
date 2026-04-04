import { useEffect, useRef } from "react";

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
    // Strings
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g, '<span style="color:#ce9178">$1</span>')
    // Comments
    .replace(/(#[^\n]*)/g, '<span style="color:#6a9955">$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>')
    // Keywords
    .replace(
      new RegExp(`\\b(${PYTHON_KEYWORDS.join("|")})\\b`, "g"),
      '<span style="color:#569cd6">$1</span>'
    )
    // Function/class definitions
    .replace(/\b(def|class)\s+(\w+)/g, (m, kw, name) =>
      `<span style="color:#569cd6">${kw}</span> <span style="color:#dcdcaa">${name}</span>`
    );
}

export default function CodeEditor({ file, onChange }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  const syncScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = ta.value.substring(0, start) + "    " + ta.value.substring(end);
      onChange(newVal);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      }, 0);
    }
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
    <div className="flex-1 flex overflow-hidden bg-[#0d0f14] font-mono text-sm">
      {/* Line numbers */}
      <div className="select-none text-right text-gray-600 px-3 pt-4 leading-6 overflow-hidden min-w-[3rem] bg-[#0a0c11] border-r border-[#1e2330]">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i + 1}>{i + 1}</div>
        ))}
      </div>

      {/* Editor area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Highlighted layer */}
        <pre
          ref={highlightRef}
          aria-hidden="true"
          className="absolute inset-0 p-4 leading-6 text-gray-100 overflow-auto pointer-events-none whitespace-pre"
          style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace" }}
          dangerouslySetInnerHTML={{ __html: highlight(file.content) + "\n" }}
        />
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-4 leading-6 bg-transparent text-transparent caret-white resize-none outline-none overflow-auto"
          style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace", caretColor: "#00c896" }}
        />
      </div>
    </div>
  );
}