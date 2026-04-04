import { useState } from "react";
import { GitBranch, GitCommit, Download, Upload, Key, Loader2, Check, AlertCircle, FolderGit2, ArrowUp, ArrowDown } from "lucide-react";

const PROVIDERS = [
  { id: "github", name: "GitHub", icon: "🐙", tokenKey: "aq_gh_token", tokenHint: "ghp_...", docsUrl: "https://github.com/settings/tokens", scope: "repo scope", urlPattern: /github\.com[:/]([^/]+)\/([^/.]+)/ },
  { id: "gitlab", name: "GitLab", icon: "🦊", tokenKey: "aq_gl_token", tokenHint: "glpat-...", docsUrl: "https://gitlab.com/-/user_settings/personal_access_tokens", scope: "api scope", urlPattern: /gitlab\.com[:/]([^/]+)\/([^/.]+)/ },
  { id: "bitbucket", name: "Bitbucket", icon: "🪣", tokenKey: "aq_bb_token", tokenHint: "App password", docsUrl: "https://bitbucket.org/account/settings/app-passwords/", scope: "repository:read,write", urlPattern: /bitbucket\.org[:/]([^/]+)\/([^/.]+)/ },
];

const API_BASES = { github: "https://api.github.com", gitlab: "https://gitlab.com/api/v4", bitbucket: "https://api.bitbucket.org/2.0" };

function parseRepo(url, provider) {
  const p = PROVIDERS.find((p) => p.id === provider);
  const m = url.match(p.urlPattern);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, "") } : null;
}

async function apiFetch(provider, path, token, opts = {}) {
  let url, headers = {};
  if (provider === "github") {
    url = `${API_BASES.github}${path}`;
    headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
  } else if (provider === "gitlab") {
    url = `${API_BASES.gitlab}${path}`;
    headers = { "PRIVATE-TOKEN": token };
  } else if (provider === "bitbucket") {
    // token is "user:app_password"
    url = `${API_BASES.bitbucket}${path}`;
    headers = { Authorization: `Basic ${btoa(token)}`, "Content-Type": "application/json" };
  }
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`${provider} API error ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  return res.json();
}

async function fetchFiles(provider, owner, repo, branch, token) {
  if (provider === "github") {
    const tree = await apiFetch("github", `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, token);
    const files = tree.tree.filter((f) => f.type === "blob" && /\.(py|js|ts|jsx|tsx|go|rs|rb|java|json|md)$/.test(f.path)).slice(0, 20);
    return Promise.all(files.map(async (f) => {
      const blob = await apiFetch("github", `/repos/${owner}/${repo}/git/blobs/${f.sha}`, token);
      return { id: f.sha, name: f.path.split("/").pop(), path: f.path, content: atob(blob.content.replace(/\n/g, "")), language: "text" };
    }));
  }
  if (provider === "gitlab") {
    const encodedRepo = encodeURIComponent(`${owner}/${repo}`);
    const tree = await apiFetch("gitlab", `/projects/${encodedRepo}/repository/tree?recursive=true&per_page=100&ref=${branch}`, token);
    const files = tree.filter((f) => f.type === "blob" && /\.(py|js|ts|jsx|tsx|go|rs|md)$/.test(f.path)).slice(0, 20);
    return Promise.all(files.map(async (f) => {
      const raw = await apiFetch("gitlab", `/projects/${encodedRepo}/repository/files/${encodeURIComponent(f.path)}/raw?ref=${branch}`, token);
      return { id: f.id, name: f.name, path: f.path, content: typeof raw === "string" ? raw : JSON.stringify(raw), language: "text" };
    }));
  }
  if (provider === "bitbucket") {
    const treeData = await apiFetch("bitbucket", `/repositories/${owner}/${repo}/src/${branch}/?pagelen=50`, token);
    const files = (treeData.values || []).filter((f) => f.type === "commit_file" && /\.(py|js|ts|go|md)$/.test(f.path)).slice(0, 20);
    return Promise.all(files.map(async (f) => {
      const raw = await fetch(`${API_BASES.bitbucket}/repositories/${owner}/${repo}/src/${branch}/${f.path}`, { headers: { Authorization: `Basic ${btoa(token)}` } });
      const content = await raw.text();
      return { id: f.path, name: f.path.split("/").pop(), path: f.path, content, language: "text" };
    }));
  }
  return [];
}

async function fetchBranches(provider, owner, repo, token) {
  if (provider === "github") {
    const d = await apiFetch("github", `/repos/${owner}/${repo}/branches`, token);
    return d.map((b) => b.name);
  }
  if (provider === "gitlab") {
    const encodedRepo = encodeURIComponent(`${owner}/${repo}`);
    const d = await apiFetch("gitlab", `/projects/${encodedRepo}/repository/branches`, token);
    return d.map((b) => b.name);
  }
  if (provider === "bitbucket") {
    const d = await apiFetch("bitbucket", `/repositories/${owner}/${repo}/refs/branches?pagelen=25`, token);
    return (d.values || []).map((b) => b.name);
  }
  return [];
}

async function fetchCommits(provider, owner, repo, branch, token) {
  if (provider === "github") {
    const d = await apiFetch("github", `/repos/${owner}/${repo}/commits?sha=${branch}&per_page=15`, token);
    return d.map((c) => ({ sha: c.sha.slice(0, 7), message: c.commit.message.split("\n")[0], author: c.commit.author.name, date: c.commit.author.date.slice(0, 10) }));
  }
  if (provider === "gitlab") {
    const encodedRepo = encodeURIComponent(`${owner}/${repo}`);
    const d = await apiFetch("gitlab", `/projects/${encodedRepo}/repository/commits?ref_name=${branch}&per_page=15`, token);
    return d.map((c) => ({ sha: c.short_id, message: c.title, author: c.author_name, date: c.created_at.slice(0, 10) }));
  }
  if (provider === "bitbucket") {
    const d = await apiFetch("bitbucket", `/repositories/${owner}/${repo}/commits/${branch}?pagelen=15`, token);
    return (d.values || []).map((c) => ({ sha: c.hash.slice(0, 7), message: (c.message || "").split("\n")[0], author: c.author?.raw || "", date: c.date?.slice(0, 10) || "" }));
  }
  return [];
}

export default function GitPanel({ onClone, files, activeFile }) {
  const [provider, setProvider] = useState("github");
  const [token, setToken] = useState(() => localStorage.getItem(PROVIDERS[0].tokenKey) || "");
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoInfo, setRepoInfo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState("");
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [section, setSection] = useState("repo");

  const prov = PROVIDERS.find((p) => p.id === provider);
  const tok = token || tokenInput;

  const switchProvider = (id) => {
    setProvider(id);
    const saved = localStorage.getItem(PROVIDERS.find((p) => p.id === id).tokenKey) || "";
    setToken(saved);
    setTokenInput("");
    setRepoInfo(null);
    setBranches([]);
    setCommits([]);
    setError("");
    setSuccess("");
  };

  const saveToken = () => {
    localStorage.setItem(prov.tokenKey, tokenInput);
    setToken(tokenInput);
    setShowTokenForm(false);
  };

  const cloneRepo = async () => {
    const parsed = parseRepo(repoUrl, provider);
    if (!parsed) { setError(`Invalid ${prov.name} URL`); return; }
    setError(""); setLoading("clone");
    try {
      let defaultBranch = "main", fullName = `${parsed.owner}/${parsed.repo}`, description = "";
      if (provider === "github") {
        const rd = await apiFetch("github", `/repos/${parsed.owner}/${parsed.repo}`, tok);
        defaultBranch = rd.default_branch; description = rd.description || "";
      } else if (provider === "gitlab") {
        const encodedRepo = encodeURIComponent(`${parsed.owner}/${parsed.repo}`);
        const rd = await apiFetch("gitlab", `/projects/${encodedRepo}`, tok);
        defaultBranch = rd.default_branch || "main"; description = rd.description || "";
      } else if (provider === "bitbucket") {
        const rd = await apiFetch("bitbucket", `/repositories/${parsed.owner}/${parsed.repo}`, tok);
        defaultBranch = rd.mainbranch?.name || "main"; description = rd.description || "";
      }
      const loaded = await fetchFiles(provider, parsed.owner, parsed.repo, defaultBranch, tok);
      setRepoInfo({ owner: parsed.owner, repo: parsed.repo, defaultBranch, fullName, description, provider });
      setCurrentBranch(defaultBranch);
      onClone(loaded.length > 0 ? loaded : [{ id: "readme", name: "README.md", path: "README.md", content: `# ${parsed.repo}\n\n${description}`, language: "markdown" }], `${parsed.repo} (${defaultBranch})`);
      setSuccess(`Cloned ${loaded.length} files from ${fullName}`);
      const brs = await fetchBranches(provider, parsed.owner, parsed.repo, tok);
      setBranches(brs);
      const cms = await fetchCommits(provider, parsed.owner, parsed.repo, defaultBranch, tok);
      setCommits(cms);
    } catch (e) { setError(e.message); }
    setLoading("");
  };

  const switchBranch = async (branch) => {
    if (!repoInfo) return;
    setLoading("branch"); setError("");
    try {
      const loaded = await fetchFiles(provider, repoInfo.owner, repoInfo.repo, branch, tok);
      setCurrentBranch(branch);
      onClone(loaded, `${repoInfo.repo} (${branch})`);
      const cms = await fetchCommits(provider, repoInfo.owner, repoInfo.repo, branch, tok);
      setCommits(cms);
      setSuccess(`Switched to ${branch}`);
    } catch (e) { setError(e.message); }
    setLoading("");
  };

  const pushFile = async () => {
    if (!repoInfo || !activeFile || !commitMsg) { setError("Need a commit message and active file"); return; }
    if (provider !== "github") { setError("Push currently supported for GitHub only"); return; }
    setLoading("push"); setError("");
    try {
      let fileSha = null;
      try {
        const ex = await apiFetch("github", `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${activeFile.path || activeFile.name}?ref=${currentBranch}`, tok);
        fileSha = ex.sha;
      } catch {}
      await apiFetch("github", `/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${activeFile.path || activeFile.name}`, tok, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commitMsg, content: btoa(unescape(encodeURIComponent(activeFile.content))), branch: currentBranch, ...(fileSha ? { sha: fileSha } : {}) }),
      });
      setSuccess(`Pushed "${activeFile.name}"`);
      setCommitMsg("");
      const cms = await fetchCommits(provider, repoInfo.owner, repoInfo.repo, currentBranch, tok);
      setCommits(cms);
    } catch (e) { setError(e.message); }
    setLoading("");
  };

  return (
    <div className="w-64 shrink-0 bg-[#0e1018] border-r border-[#1e2330] flex flex-col overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e2330]">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-3.5 h-3.5 text-[#00c896]" />
          <span className="font-semibold text-gray-300 uppercase tracking-wider text-xs">Source Control</span>
        </div>
        <button onClick={() => setShowTokenForm((v) => !v)} title="Token" className="text-gray-500 hover:text-yellow-400 transition-colors">
          <Key className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Provider tabs */}
      <div className="flex border-b border-[#1e2330]">
        {PROVIDERS.map((p) => (
          <button key={p.id} onClick={() => switchProvider(p.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs transition-colors border-b-2 ${provider === p.id ? "border-[#00c896] text-[#00c896] bg-[#00c896]/5" : "border-transparent text-gray-600 hover:text-gray-300"}`}>
            <span>{p.icon}</span><span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Token form */}
      {showTokenForm && (
        <div className="px-3 py-2 bg-[#1a1d26] border-b border-[#1e2330] space-y-2">
          <div className="text-gray-400">{prov.name} Token ({prov.scope})</div>
          <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder={prov.tokenHint}
            className="w-full bg-[#0d0f14] border border-[#2a2d3a] text-gray-200 px-2 py-1 rounded outline-none focus:border-[#00c896]" />
          <button onClick={saveToken} className="w-full py-1 bg-[#00c896] hover:bg-[#00b084] text-black font-semibold rounded">Save Token</button>
          <a href={prov.docsUrl} target="_blank" rel="noreferrer" className="text-[#00c896] underline block">Create token →</a>
        </div>
      )}

      {/* Repo info */}
      {repoInfo && (
        <div className="px-3 py-2 bg-[#1a2a3a]/40 border-b border-[#1e2330]">
          <div className="text-[#00c896] font-medium truncate">{repoInfo.fullName}</div>
          {repoInfo.description && <div className="text-gray-500 truncate text-xs">{repoInfo.description}</div>}
          <div className="flex items-center gap-1.5 mt-1"><GitBranch className="w-3 h-3 text-gray-500" /><span className="text-gray-400">{currentBranch}</span></div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex border-b border-[#1e2330] shrink-0">
        {["repo", "branches", "commits", "push"].map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className={`flex-1 py-1.5 capitalize transition-colors border-b-2 text-xs ${section === s ? "border-[#00c896] text-[#00c896]" : "border-transparent text-gray-600 hover:text-gray-300"}`}>
            {s === "push" ? "↑Push" : s === "repo" ? "Clone" : s.slice(0, 6)}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && <div className="mx-2 mt-2 flex items-start gap-1.5 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5"><AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" /><span className="text-red-300 leading-relaxed">{error}</span></div>}
      {success && <div className="mx-2 mt-2 flex items-center gap-1.5 bg-[#00c896]/10 border border-[#00c896]/30 rounded px-2 py-1.5"><Check className="w-3 h-3 text-[#00c896]" /><span className="text-[#00c896]">{success}</span></div>}

      <div className="flex-1 overflow-y-auto">
        {section === "repo" && (
          <div className="p-3 space-y-3">
            <div className="text-gray-500">Clone a {prov.name} repository.</div>
            <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && cloneRepo()}
              placeholder={`https://${prov.id === "bitbucket" ? "bitbucket.org" : prov.id === "gitlab" ? "gitlab.com" : "github.com"}/owner/repo`}
              className="w-full bg-[#0d0f14] border border-[#2a2d3a] text-gray-200 px-2 py-1.5 rounded outline-none focus:border-[#00c896]" />
            <button onClick={cloneRepo} disabled={!repoUrl || !tok || loading === "clone"}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 text-black font-semibold rounded transition-colors">
              {loading === "clone" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {loading === "clone" ? "Cloning..." : "Clone Repository"}
            </button>
            {!tok && <div className="text-yellow-500 flex items-center gap-1.5"><Key className="w-3 h-3" /> Add your {prov.name} token first</div>}
          </div>
        )}

        {section === "branches" && (
          <div className="p-2 space-y-1">
            {!repoInfo && <div className="text-gray-600 text-center py-8">Clone a repo first</div>}
            {loading === "branch" && <div className="flex items-center gap-2 text-gray-500 py-4 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Switching...</div>}
            {branches.map((b) => (
              <button key={b} onClick={() => b !== currentBranch && switchBranch(b)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${b === currentBranch ? "bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20" : "text-gray-400 hover:bg-[#1a1d26]"}`}>
                <GitBranch className="w-3 h-3 shrink-0" /><span className="truncate">{b}</span>
                {b === currentBranch && <Check className="w-3 h-3 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {section === "commits" && (
          <div className="p-2 space-y-1">
            {!repoInfo && <div className="text-gray-600 text-center py-8">Clone a repo first</div>}
            {commits.map((c, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-[#1a1d26]">
                <GitCommit className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-gray-300 truncate leading-tight">{c.message}</div>
                  <div className="text-gray-600 flex gap-2 mt-0.5"><span className="text-[#00c896] font-mono">{c.sha}</span><span>{c.author}</span><span>{c.date}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {section === "push" && (
          <div className="p-3 space-y-3">
            {!repoInfo && <div className="text-gray-600 text-center py-8">Clone a repo first</div>}
            {repoInfo && (
              <>
                <div className="text-gray-500">Commit &amp; push active file to <span className="text-[#00c896]">{currentBranch}</span></div>
                {provider !== "github" && <div className="text-yellow-500 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1.5">Push currently supported for GitHub only.</div>}
                <div className="bg-[#1a1d26] rounded px-2 py-1.5 border border-[#2a2d3a]">
                  <div className="text-gray-500 mb-1">Active file</div>
                  <div className="text-gray-200 truncate">{activeFile?.name || "— none selected —"}</div>
                </div>
                <textarea value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} placeholder="Commit message..." rows={3}
                  className="w-full bg-[#0d0f14] border border-[#2a2d3a] text-gray-200 px-2 py-1.5 rounded outline-none focus:border-[#00c896] resize-none" />
                <button onClick={pushFile} disabled={!activeFile || !commitMsg || loading === "push" || provider !== "github"}
                  className="w-full flex items-center justify-center gap-2 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded transition-colors">
                  {loading === "push" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUp className="w-3.5 h-3.5" />}
                  {loading === "push" ? "Pushing..." : "Commit & Push"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}