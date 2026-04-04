import { useState, useMemo } from "react";
import { Check, X, ChevronDown, ChevronRight, GitCompare, RotateCcw } from "lucide-react";

/**
 * Minimal unified diff parser → hunks with line context
 */
function computeHunks(original, modified) {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");

  // Build a simple LCS-based diff
  const n = origLines.length, m = modLines.length;
  // DP table (only keep two rows for memory)
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = origLines[i - 1] === modLines[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  // Backtrack
  const ops = []; // { type: 'equal'|'remove'|'add', origLine, modLine, text }
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      ops.unshift({ type: "equal", origLine: i, modLine: j, text: origLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: "add", origLine: null, modLine: j, text: modLines[j - 1] });
      j--;
    } else {
      ops.unshift({ type: "remove", origLine: i, modLine: null, text: origLines[i - 1] });
      i--;
    }
  }

  // Group into hunks (consecutive non-equal lines + 3 lines context)
  const CONTEXT = 3;
  const hunks = [];
  let k = 0;
  while (k < ops.length) {
    if (ops[k].type !== "equal") {
      const start = Math.max(0, k - CONTEXT);
      let end = k;
      // extend hunk to include all changed lines + trailing context
      while (end < ops.length && (ops[end].type !== "equal" || end - k < CONTEXT + 1)) end++;
      end = Math.min(ops.length, end + CONTEXT);
      // don't overlap previous hunk
      const hunkStart = hunks.length > 0 ? Math.max(start, hunks[hunks.length - 1].endIdx) : start;
      if (hunkStart < end) {
        hunks.push({ startIdx: hunkStart, endIdx: end, ops: ops.slice(hunkStart, end), accepted: null });
      }
      k = end;
    } else {
      k++;
    }
  }
  return { ops, hunks };
}

function HunkRow({ op, side }) {
  const bg =
    op.type === "add" ? "bg-green-500/10" :
    op.type === "remove" ? "bg-red-500/10" : "";
  const textColor =
    op.type === "add" ? "text-green-300" :
    op.type === "remove" ? "text-red-300" : "text-gray-500";
  const prefix =
    op.type === "add" ? "+" :
    op.type === "remove" ? "-" : " ";
  const lineNum = side === "left" ? op.origLine : op.modLine;

  if (side === "left" && op.type === "add") {
    return <div className="h-5 bg-[#0a0c11]" />;
  }
  if (side === "right" && op.type === "remove") {
    return <div className="h-5 bg-[#0a0c11]" />;
  }

  return (
    <div className={`flex items-start h-5 ${bg}`}>
      <span className="select-none w-8 shrink-0 text-right pr-2 text-gray-600 text-[10px] leading-5">
        {lineNum || ""}
      </span>
      <span className={`select-none w-3 shrink-0 text-[10px] leading-5 ${textColor}`}>{prefix}</span>
      <span className={`text-[11px] leading-5 font-mono whitespace-pre ${textColor} flex-1 min-w-0 truncate`}>
        {op.text}
      </span>
    </div>
  );
}

function HunkBlock({ hunk, index, onAccept, onDiscard }) {
  const [collapsed, setCollapsed] = useState(false);
  const statusColor =
    hunk.accepted === true ? "border-[#00c896]/50 bg-[#00c896]/5" :
    hunk.accepted === false ? "border-red-500/30 bg-red-500/5" :
    "border-[#2a2d3a]";

  const addCount = hunk.ops.filter((o) => o.type === "add").length;
  const removeCount = hunk.ops.filter((o) => o.type === "remove").length;

  return (
    <div className={`border rounded-lg overflow-hidden mb-3 ${statusColor}`}>
      {/* Hunk header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0e1018] border-b border-[#1e2330]">
        <button onClick={() => setCollapsed((v) => !v)} className="text-gray-500 hover:text-gray-300">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <span className="text-xs text-gray-400 font-mono">Hunk {index + 1}</span>
        {removeCount > 0 && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">-{removeCount}</span>}
        {addCount > 0 && <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">+{addCount}</span>}
        <div className="flex-1" />
        {hunk.accepted === null && (
          <>
            <button
              onClick={() => onAccept(index)}
              title="Accept change"
              className="flex items-center gap-1 px-2.5 py-1 bg-[#00c896]/10 hover:bg-[#00c896]/20 border border-[#00c896]/30 text-[#00c896] text-xs rounded transition-colors"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={() => onDiscard(index)}
              title="Discard change"
              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs rounded transition-colors"
            >
              <X className="w-3 h-3" /> Discard
            </button>
          </>
        )}
        {hunk.accepted === true && (
          <span className="text-xs text-[#00c896] flex items-center gap-1"><Check className="w-3 h-3" /> Accepted</span>
        )}
        {hunk.accepted === false && (
          <span className="text-xs text-red-400 flex items-center gap-1"><X className="w-3 h-3" /> Discarded</span>
        )}
      </div>

      {/* Diff body */}
      {!collapsed && (
        <div className="grid grid-cols-2 divide-x divide-[#1e2330] overflow-x-auto">
          <div className="bg-[#0d0f14] overflow-x-auto">
            {hunk.ops.map((op, i) => <HunkRow key={i} op={op} side="left" />)}
          </div>
          <div className="bg-[#0d0f14] overflow-x-auto">
            {hunk.ops.map((op, i) => <HunkRow key={i} op={op} side="right" />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GitDiffViewer({ files, activeFile, onApply }) {
  const [leftFileId, setLeftFileId] = useState(files[0]?.id || "");
  const [rightContent, setRightContent] = useState("");
  const [hunks, setHunks] = useState([]);
  const [computed, setComputed] = useState(false);

  const leftFile = files.find((f) => f.id === leftFileId) || files[0];

  const compute = () => {
    if (!leftFile) return;
    const base = leftFile.content;
    const modified = rightContent || base;
    const { hunks: h } = computeHunks(base, modified);
    setHunks(h.map((hk) => ({ ...hk, accepted: null })));
    setComputed(true);
  };

  const handleAccept = (idx) => {
    setHunks((prev) => prev.map((h, i) => i === idx ? { ...h, accepted: true } : h));
  };

  const handleDiscard = (idx) => {
    setHunks((prev) => prev.map((h, i) => i === idx ? { ...h, accepted: false } : h));
  };

  const applyAll = () => {
    if (!leftFile) return;
    const origLines = leftFile.content.split("\n");
    const modLines = (rightContent || leftFile.content).split("\n");
    // Build accepted result: for each hunk accepted→use mod lines, else use orig lines
    // Simple approach: start from full rightContent and revert discarded hunks
    let resultLines = modLines.slice();

    // Revert discarded hunks by replacing add-lines with remove-lines
    // This is approximated; for exact patch we'd need line mappings
    // We apply all accepted = use right side; discarded = use left side per hunk block
    // Since ops already map orig→mod, rebuild from ops
    const { ops } = computeHunks(leftFile.content, rightContent || leftFile.content);
    const acceptedHunkRanges = new Set(
      hunks.filter((h) => h.accepted === true).map((h) => `${h.startIdx}-${h.endIdx}`)
    );
    const discardedHunkRanges = new Set(
      hunks.filter((h) => h.accepted === false).map((h) => `${h.startIdx}-${h.endIdx}`)
    );

    // Reconstruct: equal→keep, add inside accepted→keep, remove inside accepted→skip,
    // add inside discarded→skip, remove inside discarded→keep
    const opInHunk = (opIdx) => {
      for (const h of hunks) {
        if (opIdx >= h.startIdx && opIdx < h.endIdx) return h;
      }
      return null;
    };

    const result = [];
    ops.forEach((op, oi) => {
      const hunk = opInHunk(oi);
      if (op.type === "equal") {
        result.push(op.text);
      } else if (op.type === "add") {
        if (!hunk || hunk.accepted === true || hunk.accepted === null) result.push(op.text);
      } else if (op.type === "remove") {
        if (hunk && hunk.accepted === false) result.push(op.text);
      }
    });

    onApply(leftFile.id, result.join("\n"));
  };

  const reset = () => { setHunks([]); setComputed(false); };

  const pending = hunks.filter((h) => h.accepted === null).length;
  const accepted = hunks.filter((h) => h.accepted === true).length;
  const discarded = hunks.filter((h) => h.accepted === false).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#0d0f14]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2330] bg-[#0a0c11] shrink-0 flex-wrap">
        <GitCompare className="w-4 h-4 text-[#00c896] shrink-0" />
        <span className="text-sm font-semibold text-gray-300 shrink-0">Git Diff Viewer</span>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Base file:</span>
          <select
            value={leftFileId}
            onChange={(e) => { setLeftFileId(e.target.value); setComputed(false); setHunks([]); }}
            className="bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 text-xs px-2 py-1 rounded outline-none focus:border-[#00c896]"
          >
            {files.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {computed && hunks.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#00c896]">✓ {accepted} accepted</span>
            <span className="text-red-400">✗ {discarded} discarded</span>
            <span className="text-gray-500">{pending} pending</span>
          </div>
        )}

        <div className="flex-1" />

        {computed && (
          <>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            {hunks.length > 0 && (
              <button
                onClick={applyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00c896] hover:bg-[#00b084] text-black text-xs font-semibold rounded transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Apply Accepted Changes
              </button>
            )}
          </>
        )}

        {!computed && (
          <button
            onClick={compute}
            disabled={!leftFile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 text-black text-xs font-semibold rounded transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5" /> Compare
          </button>
        )}
      </div>

      {!computed ? (
        /* Input area */
        <div className="flex flex-1 overflow-hidden gap-0 divide-x divide-[#1e2330]">
          {/* Left: base file (read-only) */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 py-1.5 bg-[#0a0c11] border-b border-[#1e2330] text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Base — {leftFile?.name || "Select file"}
            </div>
            <textarea
              readOnly
              value={leftFile?.content || ""}
              className="flex-1 resize-none bg-[#0d0f14] text-gray-400 text-xs font-mono p-3 outline-none leading-5 overflow-auto"
              spellCheck={false}
            />
          </div>
          {/* Right: modified version (editable) */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 py-1.5 bg-[#0a0c11] border-b border-[#1e2330] text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Modified — paste or type your new version
            </div>
            <textarea
              value={rightContent}
              onChange={(e) => setRightContent(e.target.value)}
              placeholder={leftFile?.content || "Paste modified code here..."}
              className="flex-1 resize-none bg-[#0d0f14] text-gray-200 text-xs font-mono p-3 outline-none leading-5 overflow-auto caret-[#00c896]"
              spellCheck={false}
            />
          </div>
        </div>
      ) : (
        /* Hunks view */
        <div className="flex-1 overflow-y-auto p-4">
          {hunks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="text-4xl">✅</div>
              <p className="text-gray-300 font-medium">No differences found</p>
              <p className="text-sm text-gray-500">The two versions are identical.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">{hunks.length} hunk{hunks.length !== 1 ? "s" : ""} found — review each change below</span>
                <button onClick={() => setHunks((h) => h.map((hk) => ({ ...hk, accepted: true })))}
                  className="text-xs text-[#00c896] hover:underline ml-2">Accept all</button>
                <button onClick={() => setHunks((h) => h.map((hk) => ({ ...hk, accepted: false })))}
                  className="text-xs text-red-400 hover:underline">Discard all</button>
              </div>
              {hunks.map((hunk, i) => (
                <HunkBlock key={i} hunk={hunk} index={i} onAccept={handleAccept} onDiscard={handleDiscard} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}