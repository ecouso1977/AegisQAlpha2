import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, ExternalLink, ChevronRight, AlertCircle, Loader2, Monitor, Code2 } from "lucide-react";

function getLanguage(file) {
  const ext = (file?.name || "").split(".").pop().toLowerCase();
  return ext;
}

function buildHtmlBlob(file) {
  const ext = getLanguage(file);
  if (["html", "htm"].includes(ext)) return file.content;
  if (["js", "jsx"].includes(ext)) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: sans-serif; background: #1a1d26; color: #e5e7eb; padding: 2rem; }
      pre { background: #0d0f14; border: 1px solid #1e2330; border-radius: 8px; padding: 1rem; overflow: auto; }
      .error { color: #f87171; }
    </style></head><body>
    <pre id="out"></pre>
    <script>
      const _log = [], _err = [];
      const origLog = console.log; console.log = (...a) => { _log.push(a.map(String).join(' ')); origLog(...a); };
      const origErr = console.error; console.error = (...a) => { _err.push(a.map(String).join(' ')); origErr(...a); };
      window.onerror = (msg) => { document.getElementById('out').innerHTML += '<span class="error">Error: ' + msg + '</span>\\n'; };
      try {
        ${file.content}
        if (_log.length) document.getElementById('out').textContent += _log.join('\\n');
        if (_err.length) document.getElementById('out').innerHTML += '<span class="error">' + _err.join('\\n') + '</span>';
        if (!_log.length && !_err.length) document.getElementById('out').textContent = '(No output)';
      } catch(e) { document.getElementById('out').innerHTML = '<span class="error">Error: ' + e.message + '</span>'; }
    <\/script></body></html>`;
  }
  if (ext === "css") {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: sans-serif; background: #1a1d26; color: #e5e7eb; padding: 2rem; }
      .preview-box { background: white; border-radius: 12px; padding: 2rem; color: #111; }
      ${file.content}
    </style></head><body><div class="preview-box">
      <h1>CSS Preview</h1><p>This is a <strong>paragraph</strong> of text.</p>
      <button>A Button</button><a href="#">A Link</a>
      <ul><li>List item one</li><li>List item two</li></ul>
    </div></body></html>`;
  }
  if (ext === "md") {
    const escaped = file.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: -apple-system, sans-serif; background: #1a1d26; color: #e5e7eb; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.7; }
      h1,h2,h3 { color: #00c896; } code { background: #0d0f14; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
      pre { background: #0d0f14; border: 1px solid #1e2330; border-radius: 8px; padding: 1rem; overflow: auto; }
      blockquote { border-left: 3px solid #00c896; margin-left: 0; padding-left: 1rem; color: #9ca3af; }
      a { color: #4285f4; }
    </style></head><body><pre style="white-space:pre-wrap;font-family:inherit">${escaped}</pre></body></html>`;
  }
  // Python / other: show raw content nicely
  return null;
}

export default function BrowserPreviewPanel({ activeFile, files, onRun, terminalOutput, isRunning }) {
  const iframeRef = useRef(null);
  const [url, setUrl] = useState("about:blank");
  const [urlInput, setUrlInput] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pyOutput, setPyOutput] = useState(null);
  const [pyLoading, setPyLoading] = useState(false);
  const [pyError, setPyError] = useState("");
  const [mode, setMode] = useState("preview"); // "preview" | "url"
  const debounceRef = useRef(null);

  const ext = getLanguage(activeFile);
  const isWeb = ["html", "htm", "js", "jsx", "css", "md"].includes(ext);
  const isPython = ["py"].includes(ext);

  const renderInFrame = useCallback((file) => {
    if (!file || !iframeRef.current) return;
    const html = buildHtmlBlob(file);
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    iframeRef.current.src = blobUrl;
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }, []);

  const runPython = useCallback(async (file) => {
    if (!file) return;
    setPyLoading(true); setPyError(""); setPyOutput(null);
    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "python", version: "3.10.0", files: [{ name: file.name, content: file.content }] }),
      });
      const data = await res.json();
      setPyOutput({ stdout: data.run?.output || "", stderr: data.run?.stderr || "" });
    } catch (e) {
      setPyError("Failed to reach execution runtime.");
    }
    setPyLoading(false);
  }, []);

  // Auto-refresh on content change
  useEffect(() => {
    if (!autoRefresh || !activeFile) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isWeb && mode === "preview") renderInFrame(activeFile);
      if (isPython && mode === "preview") runPython(activeFile);
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [activeFile?.content, autoRefresh, mode]);

  // Initial render
  useEffect(() => {
    if (!activeFile) return;
    if (isWeb && mode === "preview") renderInFrame(activeFile);
    if (isPython && mode === "preview") runPython(activeFile);
  }, [activeFile?.id, mode]);

  const goUrl = () => {
    if (!urlInput) return;
    const u = urlInput.startsWith("http") ? urlInput : `https://${urlInput}`;
    setUrl(u);
    if (iframeRef.current) iframeRef.current.src = u;
  };

  const refresh = () => {
    if (mode === "preview") {
      if (isWeb) renderInFrame(activeFile);
      if (isPython) runPython(activeFile);
    } else {
      if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0c11] border-b border-[#1e2330] shrink-0">
        {/* Traffic lights */}
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>

        {/* Mode toggle */}
        <div className="flex bg-[#1a1d26] border border-[#2a2d3a] rounded-full p-0.5 gap-0.5 shrink-0">
          <button onClick={() => setMode("preview")}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${mode === "preview" ? "bg-[#00c896]/20 text-[#00c896]" : "text-gray-500 hover:text-gray-300"}`}>
            <Code2 className="w-2.5 h-2.5" /> Preview
          </button>
          <button onClick={() => setMode("url")}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${mode === "url" ? "bg-[#4285f4]/20 text-[#4285f4]" : "text-gray-500 hover:text-gray-300"}`}>
            <Monitor className="w-2.5 h-2.5" /> Browser
          </button>
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-1 bg-[#1a1d26] border border-[#2a2d3a] rounded-lg px-2 py-1">
          {mode === "preview" ? (
            <span className="text-xs text-gray-500 truncate font-mono flex-1">
              {activeFile ? `preview://${activeFile.name}` : "No file open"}
            </span>
          ) : (
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && goUrl()}
              placeholder="https://..."
              className="flex-1 bg-transparent text-xs text-gray-300 outline-none font-mono"
            />
          )}
          {mode === "url" && (
            <button onClick={goUrl} className="text-gray-500 hover:text-[#4285f4] transition-colors shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button onClick={refresh} title="Refresh" className="p-1.5 rounded text-gray-500 hover:text-[#00c896] bg-[#1a1d26] border border-[#2a2d3a] transition-colors shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${(isRunning || pyLoading) ? "animate-spin" : ""}`} />
        </button>

        {mode === "preview" && (
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer shrink-0 select-none">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="accent-[#00c896] w-3 h-3" />
            Auto
          </label>
        )}

        {mode === "url" && url !== "about:blank" && (
          <a href={url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-[#4285f4] transition-colors shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Python output */}
        {mode === "preview" && isPython && (
          <div className="absolute inset-0 flex flex-col bg-[#0d0f14] overflow-hidden">
            {/* Python toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0c11] border-b border-[#1e2330] text-xs text-gray-500 shrink-0">
              <span className="text-yellow-400 font-mono text-[10px]">🐍 Python Output</span>
              <span className="text-gray-700">·</span>
              <span className="font-mono">{activeFile?.name}</span>
              <button onClick={() => runPython(activeFile)} disabled={pyLoading}
                className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-[#1a1d26] border border-[#2a2d3a] rounded text-[#00c896] hover:bg-[#00c896]/10 transition-colors disabled:opacity-40">
                {pyLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                Run
              </button>
            </div>

            {pyLoading && (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-600">
                <Loader2 className="w-8 h-8 animate-spin text-[#00c896]" />
                <span className="text-sm">Executing {activeFile?.name}...</span>
              </div>
            )}

            {pyError && !pyLoading && (
              <div className="m-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" /> {pyError}
              </div>
            )}

            {pyOutput && !pyLoading && (
              <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                {pyOutput.stdout && (
                  <pre className="text-gray-200 whitespace-pre-wrap leading-relaxed">{pyOutput.stdout}</pre>
                )}
                {pyOutput.stderr && (
                  <pre className="text-red-400 whitespace-pre-wrap mt-2 leading-relaxed">{pyOutput.stderr}</pre>
                )}
                {!pyOutput.stdout && !pyOutput.stderr && (
                  <span className="text-gray-600 italic">No output produced.</span>
                )}
              </div>
            )}

            {!pyOutput && !pyLoading && !pyError && (
              <div className="flex-1 flex items-center justify-center text-gray-600 flex-col gap-2">
                <Code2 className="w-10 h-10 text-gray-700" />
                <span>Click Run or edit the file to see output</span>
              </div>
            )}
          </div>
        )}

        {/* Iframe for web files or URL mode */}
        {(mode === "url" || (mode === "preview" && isWeb)) && (
          <iframe
            ref={iframeRef}
            src="about:blank"
            title="Browser Preview"
            className="absolute inset-0 w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          />
        )}

        {/* No file / unsupported */}
        {mode === "preview" && !isWeb && !isPython && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-gray-600">
            <Monitor className="w-12 h-12 text-gray-700" />
            <p className="text-sm">{activeFile ? `No preview available for .${ext} files` : "Open a file to preview it"}</p>
            <p className="text-xs text-gray-700">Supported: HTML, JS, CSS, Markdown, Python</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#0a0c11] border-t border-[#1e2330] text-[10px] text-gray-600 shrink-0">
        <span>{activeFile ? `${activeFile.name} · ${getLanguage(activeFile).toUpperCase()}` : "No file"}</span>
        {mode === "preview" && autoRefresh && <span className="text-[#00c896]/60">● Auto-refresh on</span>}
        {mode === "url" && <span>Browser mode</span>}
      </div>
    </div>
  );
}