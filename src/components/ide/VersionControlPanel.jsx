import { useState, useEffect, useRef } from "react";
import { GitCommit, Plus, Minus, RotateCcw, Check, ChevronDown, ChevronRight, Clock, FileCode, Tag } from "lucide-react";

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function diffLines(oldContent, newContent) {
  const oldLines = (oldContent || "").split("\n");
  const newLines = (newContent || "").split("\n");
  let added = 0, removed = 0;
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) added++;
    else if (i >= newLines.length) removed++;
    else if (oldLines[i] !== newLines[i]) { added++; removed++; }
  }
  return { added, removed };
}

export default function VersionControlPanel({ files, onRevert }) {
  const [commits, setCommits] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aq_commits") || "[]"); } catch { return []; }
  });
  const [staged, setStaged] = useState(new Set());
  const [commitMsg, setCommitMsg] = useState("");
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [view, setView] = useState("changes"); // "changes" | "history"
  const [revertConfirm, setRevertConfirm] = useState(null);
  const lastFilesRef = useRef(null);
  const [baseSnapshot, setBaseSnapshot] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aq_base_snapshot") || "null"); } catch { return null; }
  });

  // On first load with no commits, set base snapshot
  useEffect(() => {
    if (commits.length === 0 && !baseSnapshot) {
      const snap = Object.fromEntries(files.map(f => [f.id, { name: f.name, content: f.content }]));
      setBaseSnapshot(snap);
      localStorage.setItem("aq_base_snapshot", JSON.stringify(snap));
    }
  }, []);

  // Compute changed files vs last commit snapshot
  const lastSnapshot = commits.length > 0 ? commits[0].snapshot : baseSnapshot;

  const changedFiles = files.filter(f => {
    const prev = lastSnapshot?.[f.id];
    if (!prev) return true; // new file
    return prev.content !== f.content;
  });

  const newFiles = files.filter(f => !lastSnapshot?.[f.id]);
  const deletedFiles = lastSnapshot
    ? Object.entries(lastSnapshot).filter(([id]) => !files.find(f => f.id === id)).map(([id, data]) => ({ id, ...data }))
    : [];

  const allChanged = [...changedFiles, ...deletedFiles.map(f => ({ ...f, deleted: true }))];

  const toggleStage = (id) => {
    setStaged(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const stageAll = () => setStaged(new Set(allChanged.map(f => f.id)));
  const unstageAll = () => setStaged(new Set());

  const handleCommit = () => {
    if (!commitMsg.trim() || staged.size === 0) return;
    const snapshot = Object.fromEntries(files.map(f => [f.id, { name: f.name, content: f.content }]));
    const newCommit = {
      id: Date.now().toString(),
      message: commitMsg.trim(),
      timestamp: Date.now(),
      snapshot,
      stagedFiles: [...staged],
      author: "You",
      hash: Math.random().toString(36).slice(2, 9),
    };
    const updated = [newCommit, ...commits];
    setCommits(updated);
    localStorage.setItem("aq_commits", JSON.stringify(updated));
    localStorage.setItem("aq_base_snapshot", JSON.stringify(snapshot));
    setBaseSnapshot(snapshot);
    setCommitMsg("");
    setStaged(new Set());
    setView("history");
  };

  const handleRevert = (commit) => {
    setRevertConfirm(commit);
  };

  const confirmRevert = () => {
    if (!revertConfirm) return;
    const snap = revertConfirm.snapshot;
    const reverted = Object.entries(snap).map(([id, data]) => ({
      id,
      name: data.name,
      content: data.content,
      language: "python",
    }));
    onRevert(reverted, revertConfirm.snapshot);
    setRevertConfirm(null);
  };

  return (
    <div className="w-72 shrink-0 bg-[#0e1018] border-r border-[#1e2330] flex flex-col overflow-hidden text-xs select-none">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e2330] shrink-0">
        <GitCommit className="w-3.5 h-3.5 text-[#00c896]" />
        <span className="font-semibold text-gray-300 uppercase tracking-wider text-xs">Version Control</span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#1e2330] shrink-0">
        {["changes", "history"].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-1.5 capitalize text-xs border-b-2 transition-colors ${view === v ? "border-[#00c896] text-[#00c896]" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {v === "changes" ? `Changes (${allChanged.length})` : `History (${commits.length})`}
          </button>
        ))}
      </div>

      {/* CHANGES VIEW */}
      {view === "changes" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Bulk actions */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e2330] shrink-0">
            <button onClick={stageAll} className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 hover:text-[#00c896] hover:border-[#00c896]/40 transition-colors">
              <Plus className="w-3 h-3" /> Stage All
            </button>
            <button onClick={unstageAll} className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 hover:text-red-400 hover:border-red-400/40 transition-colors">
              <Minus className="w-3 h-3" /> Unstage All
            </button>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto py-1">
            {allChanged.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-600 leading-relaxed">
                <Check className="w-8 h-8 mx-auto mb-2 text-[#00c896]/40" />
                No changes detected.<br />
                <span className="text-gray-700">All files are up to date.</span>
              </div>
            ) : (
              allChanged.map(f => {
                const isStaged = staged.has(f.id);
                const prev = lastSnapshot?.[f.id];
                const diff = f.deleted ? { added: 0, removed: (prev?.content || "").split("\n").length }
                  : diffLines(prev?.content || "", f.content);
                const isNew = !prev;
                return (
                  <div key={f.id}
                    onClick={() => toggleStage(f.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded mx-1 transition-colors group ${isStaged ? "bg-[#00c896]/8 border border-[#00c896]/20" : "hover:bg-[#1a1d26]"}`}>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isStaged ? "bg-[#00c896] border-[#00c896]" : "border-[#3a3d4a] group-hover:border-[#00c896]/50"}`}>
                      {isStaged && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                    <FileCode className={`w-3 h-3 shrink-0 ${f.deleted ? "text-red-400" : isNew ? "text-[#00c896]" : "text-yellow-400"}`} />
                    <span className={`flex-1 truncate ${f.deleted ? "text-red-400 line-through" : "text-gray-300"}`}>{f.name}</span>
                    <div className="flex items-center gap-1 shrink-0 text-[10px]">
                      {diff.added > 0 && <span className="text-green-400">+{diff.added}</span>}
                      {diff.removed > 0 && <span className="text-red-400">-{diff.removed}</span>}
                      {isNew && <span className="text-[#00c896] font-bold">N</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Commit box */}
          <div className="border-t border-[#1e2330] p-3 space-y-2 shrink-0">
            <textarea
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              placeholder="Commit message…"
              rows={2}
              className="w-full bg-[#0d0f14] border border-[#2a2d3a] focus:border-[#00c896]/60 text-gray-200 px-2 py-1.5 rounded outline-none resize-none text-xs placeholder-gray-600"
            />
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{staged.size} file{staged.size !== 1 ? "s" : ""} staged</span>
              <button
                onClick={handleCommit}
                disabled={!commitMsg.trim() || staged.size === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-30 disabled:cursor-not-allowed text-black text-xs font-semibold rounded transition-colors"
              >
                <GitCommit className="w-3 h-3" /> Commit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {view === "history" && (
        <div className="flex-1 overflow-y-auto py-1">
          {commits.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-600 leading-relaxed">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              No commits yet.<br />
              <span className="text-gray-700">Stage files and commit a snapshot.</span>
            </div>
          ) : (
            commits.map((commit, idx) => {
              const isExpanded = expandedCommit === commit.id;
              const isLatest = idx === 0;
              return (
                <div key={commit.id} className="mx-1 mb-1 rounded border border-[#1e2330] hover:border-[#2a2d3a] bg-[#0a0c11] overflow-hidden transition-colors">
                  <div className="flex items-start gap-2 px-3 py-2 cursor-pointer" onClick={() => setExpandedCommit(isExpanded ? null : commit.id)}>
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${isLatest ? "bg-[#00c896]" : "bg-[#2a2d3a]"}`} />
                      {idx < commits.length - 1 && <div className="w-px flex-1 bg-[#1e2330] mt-1" style={{ minHeight: 12 }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-200 font-medium truncate">{commit.message}</span>
                        {isLatest && <span className="text-[9px] bg-[#00c896]/20 text-[#00c896] px-1 rounded shrink-0">HEAD</span>}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mt-0.5">
                        <span className="font-mono text-[#00c896]/70">{commit.hash}</span>
                        <span>{timeAgo(commit.timestamp)}</span>
                        <span>{commit.stagedFiles.length} file{commit.stagedFiles.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isLatest && (
                        <button
                          onClick={e => { e.stopPropagation(); handleRevert(commit); }}
                          title="Revert to this commit"
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1a1d26] border border-[#2a2d3a] text-gray-500 hover:text-yellow-400 hover:border-yellow-400/30 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#1e2330] px-3 py-2 space-y-1 bg-[#080a0f]">
                      <div className="text-gray-600 mb-1.5">Files in this commit:</div>
                      {Object.entries(commit.snapshot).map(([id, data]) => (
                        <div key={id} className="flex items-center gap-1.5 text-gray-400">
                          <FileCode className="w-3 h-3 text-gray-600 shrink-0" />
                          <span className="truncate">{data.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Revert confirm dialog */}
      {revertConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1a1d26] border border-[#2a2d3a] rounded-xl shadow-2xl p-5 mx-4 max-w-xs w-full">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-semibold">Revert to this commit?</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              This will restore all files to the state of commit <span className="text-[#00c896] font-mono">{revertConfirm.hash}</span>: <span className="text-gray-200">"{revertConfirm.message}"</span>.<br /><br />
              Your current unsaved changes will be lost.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRevertConfirm(null)} className="flex-1 py-1.5 rounded bg-[#0d0f14] border border-[#2a2d3a] text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
              <button onClick={confirmRevert} className="flex-1 py-1.5 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-colors">Revert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}