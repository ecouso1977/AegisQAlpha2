import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { GitBranch, Tag, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ReleasePanel({ currentVersion = "1.0.0", onVersionUpdate }) {
  const [version, setVersion] = useState(currentVersion);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [changelog, setChangelog] = useState("");

  const bumpVersion = async (type) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('handleReleaseFlow', {
        action: `bump-${type}`,
        currentVersion: version,
      });
      setVersion(response.data.nextVersion);
      onVersionUpdate?.(response.data.nextVersion);
      setStatus({ type: 'success', message: `Version bumped to ${response.data.nextVersion}` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createRelease = async () => {
    if (!githubRepo || !releaseNotes.trim()) {
      setStatus({ type: 'error', message: 'Repository and release notes required' });
      return;
    }

    setLoading(true);
    try {
      const releaseResponse = await base44.functions.invoke('handleReleaseFlow', {
        action: 'create-release',
        newVersion: version,
        releaseNotes,
        githubRepo,
      });

      const changelogResponse = await base44.functions.invoke('handleReleaseFlow', {
        action: 'update-changelog',
        newVersion: version,
        releaseNotes,
      });

      setChangelog(changelogResponse.data.changelogEntry);
      setStatus({
        type: 'success',
        message: `Release v${version} created successfully`,
        releaseUrl: releaseResponse.data.releaseUrl,
      });
      setReleaseNotes("");
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#00c896]" />
            Release Management
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Manage versions, create GitHub releases, and maintain changelog
          </p>
        </div>

        {/* Current Version */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Current Version</p>
              <p className="text-3xl font-bold text-[#00c896] mt-2">v{version}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => bumpVersion('patch')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
              >
                Patch
              </button>
              <button
                onClick={() => bumpVersion('minor')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
              >
                Minor
              </button>
              <button
                onClick={() => bumpVersion('major')}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
              >
                Major
              </button>
            </div>
          </div>
        </div>

        {/* GitHub Repository */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <GitBranch className="w-4 h-4" />
            GitHub Repository
          </label>
          <input
            type="text"
            placeholder="owner/repo"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1d26] border border-[#2a2d3a] rounded text-sm text-white focus:border-[#00c896] outline-none"
          />
          <p className="text-xs text-gray-500">Format: username/repository</p>
        </div>

        {/* Release Notes */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <FileText className="w-4 h-4" />
            Release Notes
          </label>
          <textarea
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            placeholder="Describe changes, new features, bug fixes, and improvements..."
            className="w-full px-3 py-2 bg-[#1a1d26] border border-[#2a2d3a] rounded text-sm text-white resize-none h-40 focus:border-[#00c896] outline-none"
          />
        </div>

        {/* Status Messages */}
        {status && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              status.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm ${
                  status.type === 'success' ? 'text-green-300' : 'text-red-300'
                }`}
              >
                {status.message}
              </p>
              {status.releaseUrl && (
                <a
                  href={status.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#00c896] hover:underline mt-2 block"
                >
                  View Release →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Changelog Preview */}
        {changelog && (
          <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Changelog Entry</h3>
            <pre className="bg-[#0a0c11] p-3 rounded text-xs text-gray-400 overflow-auto max-h-32">
              {changelog}
            </pre>
          </div>
        )}

        {/* Create Release Button */}
        <button
          onClick={createRelease}
          disabled={loading || !releaseNotes.trim()}
          className="w-full py-3 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Release...
            </>
          ) : (
            <>
              <Tag className="w-4 h-4" />
              Create Release v{version}
            </>
          )}
        </button>
      </div>
    </div>
  );
}