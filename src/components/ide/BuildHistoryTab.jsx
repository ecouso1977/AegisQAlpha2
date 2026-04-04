import { useState, useEffect } from "react";
import { Download, ExternalLink, Calendar, AlertCircle, CheckCircle, Clock, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BuildHistoryTab({ appName, appVersion }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "completed", "failed", "scheduled"

  useEffect(() => {
    loadHistory();
  }, [appName, appVersion]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.BuildQueue.filter({
        app_name: appName,
        app_version: appVersion,
      }, "-created_date", 100);
      setHistory(data);
    } catch (e) {
      console.error("Failed to load build history:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = statusFilter === "all" ? history : history.filter((h) => h.status === statusFilter);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-[#00c896]/10 text-[#00c896]";
      case "failed":
        return "bg-red-500/10 text-red-400";
      case "running":
        return "bg-yellow-500/10 text-yellow-400";
      case "scheduled":
        return "bg-blue-500/10 text-blue-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      case "running":
        return <Clock className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0d0f14]">
      {/* Header with filters */}
      <div className="px-6 py-4 border-b border-[#1e2330] flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">Build History</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-[#1a1d26] border border-[#2a2d3a] rounded text-gray-300 outline-none hover:border-[#00c896]"
          >
            <option value="all">All Builds</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* History table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">Loading history...</p>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No builds found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0a0c11] border-b border-[#1e2330]">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500 font-semibold">Status</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-semibold">Platform</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-semibold">Triggered By</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-semibold">Date</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-semibold">Duration</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-semibold">File Size</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((build) => (
                  <tr key={build.id} className="border-b border-[#1e2330] hover:bg-[#0a0c11] transition-colors">
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded w-fit ${getStatusColor(build.status)}`}>
                        {getStatusIcon(build.status)}
                        <span className="font-medium capitalize">{build.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 font-mono">{build.platform}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 capitalize">{build.triggered_by}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400">{formatDate(build.created_date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400">
                        {build.result?.duration_ms ? `${(build.result.duration_ms / 1000).toFixed(1)}s` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400">{formatFileSize(build.result?.file_size)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {build.result?.file_url && build.status === "completed" ? (
                        <a
                          href={build.result.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#00c896] hover:text-[#00b084] transition-colors"
                          title="Download installer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      ) : build.status === "failed" ? (
                        <div className="flex items-center gap-1 text-red-400 cursor-help" title={build.result?.error_message || "Build failed"}>
                          <AlertCircle className="w-3 h-3" />
                          <span>Error</span>
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}