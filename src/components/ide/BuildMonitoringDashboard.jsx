import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, AlertCircle, CheckCircle, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";

export default function BuildMonitoringDashboard() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const data = await base44.entities.BuildQueue.list('-created_date', 20);
        setBuilds(data);
      } catch (err) {
        console.error('Failed to fetch builds:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuilds();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.BuildQueue.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        setBuilds((prev) => {
          const filtered = prev.filter((b) => b.id !== event.id);
          return [event.data, ...filtered];
        });
      } else if (event.type === 'delete') {
        setBuilds((prev) => prev.filter((b) => b.id !== event.id));
      }
    });

    return () => unsubscribe();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Zap className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
      case 'completed':
        return 'bg-green-500/10 border-green-500/30 text-green-300';
      case 'failed':
        return 'bg-red-500/10 border-red-500/30 text-red-300';
      case 'scheduled':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-300';
    }
  };

  const calculateQueueTime = (scheduledTime, createdDate) => {
    if (!scheduledTime || !createdDate) return 'N/A';
    const scheduled = new Date(scheduledTime);
    const created = new Date(createdDate);
    const diff = Math.floor((scheduled - created) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0f14]">
        <div className="w-8 h-8 border-4 border-[#1e2330] border-t-[#00c896] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#00c896]" />
            Build Monitor
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Real-time status of all build jobs
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Builds', value: builds.length, color: 'text-blue-400' },
            { label: 'Running', value: builds.filter((b) => b.status === 'running').length, color: 'text-yellow-400' },
            { label: 'Completed', value: builds.filter((b) => b.status === 'completed').length, color: 'text-green-400' },
            { label: 'Failed', value: builds.filter((b) => b.status === 'failed').length, color: 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Builds list */}
        <div className="space-y-3">
          {builds.length === 0 ? (
            <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-8 text-center">
              <p className="text-gray-500">No builds yet. Start a build to see it here.</p>
            </div>
          ) : (
            builds.map((build) => (
              <div
                key={build.id}
                className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden hover:border-[#00c896]/30 transition-colors"
              >
                {/* Build header */}
                <button
                  onClick={() => setExpandedId(expandedId === build.id ? null : build.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#1a1d26] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(build.status)}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {build.app_name} v{build.app_version}
                      </p>
                      <p className="text-xs text-gray-500">
                        Platform: {build.platform} • Triggered by: {build.triggered_by}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(build.status)}`}>
                      {build.status.charAt(0).toUpperCase() + build.status.slice(1)}
                    </span>
                    {expandedId === build.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {expandedId === build.id && (
                  <div className="border-t border-[#1e2330] p-4 space-y-4 bg-[#0a0c11]">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Queue Time</p>
                        <p className="text-sm font-mono text-[#00c896]">
                          {calculateQueueTime(build.scheduled_time, build.created_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Build Duration</p>
                        <p className="text-sm font-mono text-[#00c896]">
                          {build.result?.duration_ms ? formatDuration(build.result.duration_ms) : 'Pending...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">File Size</p>
                        <p className="text-sm font-mono text-[#00c896]">
                          {build.result?.file_size ? `${(build.result.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Plugins */}
                    {build.enabled_plugins?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Enabled Plugins</p>
                        <div className="flex flex-wrap gap-2">
                          {build.enabled_plugins.map((plugin) => (
                            <span
                              key={plugin}
                              className="text-xs bg-[#1a1d26] border border-[#2a2d3a] rounded px-2 py-1 text-gray-300"
                            >
                              {plugin}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {build.result?.error_message && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Error</p>
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                          <p className="text-xs text-red-300 font-mono">{build.result.error_message}</p>
                        </div>
                      </div>
                    )}

                    {/* Download link */}
                    {build.result?.file_url && build.status === 'completed' && (
                      <div>
                        <a
                          href={build.result.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs bg-[#00c896] hover:bg-[#00b084] text-black font-bold px-3 py-2 rounded transition-colors"
                        >
                          Download Build
                        </a>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="pt-3 border-t border-[#1e2330] space-y-1">
                      <p className="text-xs text-gray-600">
                        Created: {new Date(build.created_date).toLocaleString()}
                      </p>
                      {build.result?.completed_at && (
                        <p className="text-xs text-gray-600">
                          Completed: {new Date(build.result.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}