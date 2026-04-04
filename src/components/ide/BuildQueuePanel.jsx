import { useState, useEffect } from "react";
import { Calendar, Clock, Webhook, Copy, Trash2, Play, Pause, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BuildQueuePanel({ appName, appVersion, platform, enabledPlugins, marketplaceSelected }) {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("now"); // "now", "scheduled", "webhook"
  const [scheduledTime, setScheduledTime] = useState("");
  const [webhookToken, setWebhookToken] = useState(null);
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);

  useEffect(() => {
    loadQueues();
  }, []);

  const loadQueues = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.BuildQueue.filter({
        app_name: appName,
        app_version: appVersion,
      }, "-created_date", 50);
      setQueues(data);
    } catch (e) {
      console.error("Failed to load build queues:", e);
    } finally {
      setLoading(false);
    }
  };

  const createBuild = async () => {
    try {
      const now = new Date().toISOString();
      const token = Math.random().toString(36).substring(7);
      
      await base44.entities.BuildQueue.create({
        app_name: appName,
        app_version: appVersion,
        status: scheduleMode === "now" ? "running" : "scheduled",
        scheduled_time: scheduleMode === "scheduled" ? scheduledTime : null,
        triggered_by: scheduleMode === "webhook" ? "webhook" : scheduleMode === "scheduled" ? "scheduled" : "manual",
        platform: platform.id,
        enabled_plugins: enabledPlugins,
        marketplace_selected: marketplaceSelected,
        webhook_token: scheduleMode === "webhook" ? token : null,
        is_recurring: false,
      });

      if (scheduleMode === "webhook") {
        setWebhookToken(token);
      }

      setScheduleMode("now");
      setScheduledTime("");
      loadQueues();
    } catch (e) {
      console.error("Failed to create build:", e);
    }
  };

  const cancelBuild = async (id) => {
    try {
      await base44.entities.BuildQueue.delete(id);
      loadQueues();
    } catch (e) {
      console.error("Failed to cancel build:", e);
    }
  };

  const webhookUrl = webhookToken ? `${window.location.origin}/api/build-webhook/${webhookToken}` : "";

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-[#00c896]" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14] space-y-6">
      {/* Schedule Build */}
      <div className="bg-[#0a0c11] border border-[#1e2330] rounded-xl p-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Schedule Build</h4>

        <div className="flex gap-2">
          {[
            { id: "now", label: "Now", icon: Play },
            { id: "scheduled", label: "Scheduled", icon: Calendar },
            { id: "webhook", label: "Webhook", icon: Webhook },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setScheduleMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                scheduleMode === id
                  ? "bg-[#00c896] text-black"
                  : "bg-[#1a1d26] border border-[#2a2d3a] text-gray-300 hover:border-[#00c896]"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {scheduleMode === "scheduled" && (
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Scheduled Time</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1d26] border border-[#2a2d3a] rounded text-xs text-gray-300 focus:border-[#00c896] outline-none"
            />
          </div>
        )}

        {scheduleMode === "webhook" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Trigger builds via webhook. Copy the URL below and use it in your CI/CD pipeline.</p>
            {webhookToken && (
              <div className="bg-[#1a1d26] border border-[#2a2d3a] rounded p-2">
                <div className="text-[10px] text-gray-500 mb-1">Webhook URL</div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 bg-[#080a0f] px-2 py-1 text-xs text-gray-300 rounded outline-none"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                    className="p-1 text-gray-500 hover:text-[#00c896]"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={createBuild}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00c896] hover:bg-[#00b084] text-black font-bold rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          {scheduleMode === "scheduled" ? "Schedule Build" : scheduleMode === "webhook" ? "Create Webhook" : "Start Build Now"}
        </button>
      </div>

      {/* Build Queue */}
      <div className="bg-[#0a0c11] border border-[#1e2330] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1e2330]">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Build Queue</h4>
        </div>

        <div className="overflow-y-auto max-h-96">
          {queues.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-600">No builds scheduled</div>
          ) : (
            queues.map((queue) => (
              <div
                key={queue.id}
                className="px-4 py-3 border-b border-[#1e2330] last:border-b-0 flex items-center gap-3 hover:bg-[#0d0f14] transition-colors"
              >
                {getStatusIcon(queue.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-300">{queue.platform}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      queue.status === "completed" ? "bg-[#00c896]/20 text-[#00c896]" :
                      queue.status === "failed" ? "bg-red-500/20 text-red-400" :
                      queue.status === "running" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      {queue.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {queue.triggered_by === "webhook" ? "Webhook" : queue.scheduled_time ? `Scheduled: ${new Date(queue.scheduled_time).toLocaleString()}` : "Manual"}
                  </div>
                </div>
                {["scheduled", "running"].includes(queue.status) && (
                  <button
                    onClick={() => cancelBuild(queue.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    title="Cancel"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}