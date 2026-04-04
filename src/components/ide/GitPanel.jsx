import { useState, useEffect } from "react";
import {
  GitBranch, GitCommit, Download, Upload, RefreshCw,
  ChevronDown, ChevronRight, Key, Loader2, Check, AlertCircle,
  FolderGit2, Plus, ArrowDown, ArrowUp, RotateCcw
} from "lucide-react";

function getToken() { return localStorage.getItem("aq_apikey_github") || ""; }

async function ghFetch(path, token, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.json();
}

function parseRepo(url) {
  const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, "") } : null;
}

export default function GitPanel({ onClone, files, activeFile }) {
  const [token, setToken] = useState(getToken);
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenForm, setShowTokenForm] = useState(!getToken());

  const [repoUrl, setRepoUrl] = useState("");
  const [repoInfo, setRepoInfo] = useState(null); // { owner, repo, defaultBranch }
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState("");
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [section, setSection] = useState("repo"); // repo | branches | commits | push

  const tok = token || tokenInput;

  const saveToken = () => {
    localStorage.setItem("aq_apikey_github", tokenInput);
    setToken(tokenInput);
    setShowTokenForm(false);
  };

  const cloneRepo = async () => {
    const parsed = parseRepo(repoUrl);
    if (!parsed) { setError("Invalid GitHub URL"); return; }
    setError(""); setLoading("clone");
    try {
      const repoData = await ghFetch(`/repos/${parsed.owner}/${parsed.repo}`, tok);
      const branch = repoData.default_branch;
      // Fetch file tree
      const treeData = await ghFetch(
        `/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`, tok
      );
      const pyFiles = treeData.tree.filter((f) => f.type === "blob" && f.path.endsWith(".py")).slice(0, 20);
      const loaded = await Promise.all(
        pyFiles.map(async (f) => {
          const blob = await ghFetch(`/repos/${parsed.owner}/${parsed.repo}/git/blobs/${f.sha}`, tok);
          const content = atob(blob.content.replace(/\n/g, ""));
          return { id: f.sha, name: f.path.split("/").pop(), path: f.path, content, language: "python" };
        })
      );
      if (loaded.length === 0) {
        // No py files — show README
        const readme = treeData.tree.find((f) => f.path.toLowerCase() === "readme.md");
        if (readme) {
          const blob = await ghFetch(`/repos/${parsed.owner}/${parsed.repo}/git/blobs/${readme.sha}`, tok);
          const content = atob(blob.content.replace(/\n/g, ""));
          loaded.push({ id: readme.sha, name: "README.md", path: "README.md", content, language: "markdown" });
        }
      }
      setRepoInfo({ owner: parsed.owner, repo: parsed.repo, defaultBranch: branch, fullName: repoData.full_name, description: repoData.description });
      setCurrentBranch(branch);
      onClone(loaded, `${parsed.repo} (${branch})`);
      setSuccess(`Cloned ${loaded.length} files from ${repoData.full_name}`);
      // Load branches & commits
      loadBranches(parsed.owner, parsed.repo);
      loadCommits(parsed.owner, parsed.repo, branch);
    } catch (e) { setError(e.message); }
    setLoading("");
  };

  const loadBranches = async (owner, repo) => {
    try {
      const data = await ghFetch(`/repos/${owner}/${repo}/branches`, tok);
      setBranches(data.map((b) => b.name));
    } catch (e) { setError(e.message); }
  };

  const loadCommits = async (owner, repo, branch) => {
    try {
      const data = await ghFetch(`/repos/${owner}/${repo}/commits?sha=${branch}&per_page=15`, tok);
      setCommits(data.map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0],
        author: c.commit.author.name,
        date: c.commit.author.date.slice(0, 10),
      })));
    } catch (e) { setError(e.message); }
  };

  const switchBranch = async (branch) => {
    if (!repoInfo) return;
    setLoading("branch"); setError("");
    try {
      const treeData = await ghFetch(
        `/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${branch}?recursive=1`, tok
      );
      const pyFiles = treeData.tree.filter((f) => f.type === "blob" && f.path.endsWith(".py")).slice(0, 20);
      const loaded = await Promise.all(
        pyFiles.map(async (f) => {
          const blob = await ghFetch(`/repos/${repoInfo.owner}/${repoInfo.repo}/git/blobs/${f.sha}`, tok);
          const content = atob(blob.content.replace(/\n/g, ""));
          return { id: f.sha, name: f.path.split("/").pop(), path: f.path, content, language: "python" };
        })
      );
      setCurrentBranch(branch);
      onClone(loaded, `${repoInfo.repo} (${branch})`);
      loadCommits(repoInfo.owner, repoInfo.repo, branch);
      setSuccess(`Switched to ${branch}`);
    } catch (e) { setError(e.message); }
    setLoading("");
  };

  const pushFile = async () => {
    if (!repoInfo || !activeFile || !commitMsg) { setError("Need a commit message and active file"); return; }
    setLoading("push"); setError("");
    try {
      // Get current file SHA
      let fileSha = null;
      try {
        const existing = await ghFetch(
          `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${activeFile.path || activeFile.name}?ref=${currentBranch}`, tok
        );
        fileSha = existing.sha;
      } catch {}
      const body = {
        message: commitMsg,
        content: btoa(unescape(encodeURIComponent(activeFile.content))),
        branch: currentBranch,
        ...(fileSha ? { sha: fileSha } : {}),
      };
      await ghFetch(`/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${activeFile.path || activeFile.name}`, tok, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSuccess(`Pushed "${activeFile.name}" — ${commitMsg}`);
      setCommitMsg("");
      loadCommits(repoInfo.owner, repoInfo.repo, currentBranch);
    } catch (e) { setError(e.message); }
    setLoading("");
  };

  const SECTIONS = ["repo", "branches", "commits", "push"];

  return (
    <div className="w-64 shrink-0 bg-[#0e1018] border-r border-[#1e2330] flex flex-col overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e2330]">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-3.5 h-3.5 text-[#00c896]" />
          <span className="font-semibold text-gray-300 uppercase tracking-wider text-xs">Source Control</span>
        </div>
        <button onClick={() => setShowTokenForm((v) => !v)} title="GitHub Token" className="text-gray-500 hover:text-yellow-400 transition-colors">
          <Key className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Token form */}
      {showTokenForm && (
        <div className="px-3 py-2 bg-[#1a1d26] border-b border-[#1e2330] space-y-2">
          <div className="text-gray-400 text-xs">GitHub Personal Access Token</div>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ghp_..."
            className="w-full bg-[#0d0f14] border border-[#2a2d3a] text-gray-200 px-2 py-1 rounded outline-none focus:border-[#00c896] text-xs"
          />
          <button onClick={saveToken} className="w-full py-1 bg-[#00c896] hover:bg-[#00b084] text-black text-xs font-semibold rounded">
            Save Token
          </button>
          <div className="text-gray-600 text-xs">Needs <code>repo</code> scope. <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-[#00c896] underline">Create one →</a></div>
        </div>
      )}

      {/* Repo info banner */}
      {repoInfo && (
        <div className="px-3 py-2 bg-[#1a2a3a]/40 border-b border-[#1e2330]">
          <div className="text-[#00c896] font-medium truncate">{repoInfo.fullName}</div>
          <div className="text-gray-500 truncate">{repoInfo.description}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <GitBranch className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400">{currentBranch}</span>
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex border-b border-[#1e2330] shrink-0">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`flex-1 py-1.5 capitalize transition-colors border-b-2 text-xs ${
              section === s ? "border-[#00c896] text-[#00c896]" : "border-transparent text-gray-600 hover:text-gray-300"
            }`}
          >
            {s === "push" ? "↑Push" : s === "repo" ? "Clone" : s.slice(0, 6)}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-2 mt-2 flex items-start gap-1.5 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5">
          <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
          <span className="text-red-300 text-xs leading-relaxed">{error}</span>
        </div>
      )}
      {success && (
        <div className="mx-2 mt-2 flex items-center gap-1.5 bg-[#00c896]/10 border border-[#00c896]/30 rounded px-2 py-1.5">
          <Check className="w-3 h-3 text-[#00c896]" />
          <span className="text-[#00c896] text-xs">{success}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Clone */}
        {section === "repo" && (
          <div className="p-3 space-y-3">
            <div className="text-gray-500">Clone a GitHub repository to load its Python files into the editor.</div>
            <div className="space-y-2">
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && cloneRepo()}
                placeholder="https://github.com/owner/repo"
                className="w-full bg-[#0d0f14] border border-[#2a2d3a] text-gray-200 px-2 py-1.5 rounded outline-none focus:border-[#00c896] text-xs"
              />
              <button
                onClick={cloneRepo}
                disabled={!repoUrl || !tok || loading === "clone"}
                className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 text-black text-xs font-semibold rounded transition-colors"
              >
                {loading === "clone" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {loading === "clone" ? "Cloning..." : "Clone Repository"}
              </button>
            </div>
            {!tok && (
              <div className="text-yellow-500 text-xs flex items-center gap-1.5">
                <Key className="w-3 h-3" /> Add your GitHub token first
              </div>
            )}
          </div>
        )}

        {/* Branches */}
        {section === "branches" && (
          <div className="p-2 space-y-1">
            {!repoInfo && <div className="text-gray-600 text-center py-8">Clone a repo first</div>}
            {loading === "branch" && (
              <div className="flex items-center gap-2 text-gray-500 py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Switching branch...
              </div>
            )}
            {branches.map((b) => (
              <button
                key={b}
                onClick={() => b !== currentBranch && switchBranch(b)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  b === currentBranch
                    ? "bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20"
                    : "text-gray-400 hover:bg-[#1a1d26] hover:text-gray-200"
                }`}
              >
                <GitBranch className="w-3 h-3 shrink-0" />
                <span className="truncate">{b}</span>
                {b === currentBranch && <Check className="w-3 h-3 ml-auto shrink-0" />}
              </button>
            ))}
            {repoInfo && branches.length === 0 && (
              <div className="text-gray-600 text-center py-4">No branches loaded</div>
            )}
          </div>
        )}

        {/* Commits */}
        {section === "commits" && (
          <div className="p-2 space-y-1">
            {!repoInfo && <div className="text-gray-600 text-center py-8">Clone a repo first</div>}
            {commits.map((c, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-[#1a1d26]">
                <GitCommit className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-gray-300 truncate leading-tight">{c.message}</div>
                  <div className="text-gray-600 flex gap-2 mt-0.5">
                    <span className="text-[#00c896] font-mono">{c.sha}</span>
                    <span>{c.author}</span>
                    <span>{c.date}</span>
                  </div>
                </div>
              </div>
            ))}
            {repoInfo && commits.length === 0 && (
              <div className="text-gray-600 text-center py-4">No commits</div>
            )}
          </div>
        )}

        {/* Push */}
        {section === "push" && (
          <div className="p-3 space-y-3">
            {!repoInfo && <div className="text-gray-600 text-center py-8">Clone a repo first</div>}
            {repoInfo && (
              <>
                <div className="text-gray-500">Commit &amp; push active file to <span className="text-[#00c896]">{currentBranch}</span></div>
                <div className="bg-[#1a1d26] rounded px-2 py-1.5 border border-[#2a2d3a]">
                  <div className="text-gray-500 text-xs mb-1">Active file</div>
                  <div className="text-gray-200 truncate">{activeFile?.name || "— none selected —"}</div>
                </div>
                <textarea
                  value={commitMsg}
                  onChange={(e) => setCommitMsg(e.target.value)}
                  placeholder="Commit message..."
                  rows={3}
                  className="w-full bg-[#0d0f14] border border-[#2a2d3a] text-gray-200 px-2 py-1.5 rounded outline-none focus:border-[#00c896] text-xs resize-none"
                />
                <button
                  onClick={pushFile}
                  disabled={!activeFile || !commitMsg || loading === "push"}
                  className="w-full flex items-center justify-center gap-2 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded transition-colors"
                >
                  {loading === "push" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUp className="w-3.5 h-3.5" />}
                  {loading === "push" ? "Pushing..." : "Commit & Push"}
                </button>
                <button
                  onClick={() => loadCommits(repoInfo.owner, repoInfo.repo, currentBranch)}
                  className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#1a1d26] hover:bg-[#2a2d3a] border border-[#2a2d3a] text-gray-400 text-xs rounded transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Pull (refresh commits)
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}