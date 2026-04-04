import { useState } from "react";
import { RefreshCw, ExternalLink, Server, Database, Globe, Cpu, HardDrive, Activity, Zap } from "lucide-react";

const CLOUDS = [
  { id: "aws", name: "Amazon Web Services", short: "AWS", color: "#ff9900", icon: "🟠" },
  { id: "gcp", name: "Google Cloud Platform", short: "GCP", color: "#4285f4", icon: "🔵" },
  { id: "azure", name: "Microsoft Azure", short: "Azure", color: "#0078d4", icon: "🔷" },
];

const MOCK_RESOURCES = {
  aws: [
    { type: "EC2", name: "api-server-prod", status: "running", region: "us-east-1", cost: "$0.024/hr" },
    { type: "RDS", name: "postgres-main", status: "available", region: "us-east-1", cost: "$0.115/hr" },
    { type: "S3", name: "app-assets-bucket", status: "active", region: "global", cost: "$0.023/GB" },
    { type: "Lambda", name: "auth-handler", status: "active", region: "us-east-1", cost: "Pay per call" },
  ],
  gcp: [
    { type: "Cloud Run", name: "backend-service", status: "running", region: "us-central1", cost: "$0.00002400/vCPU-s" },
    { type: "Cloud SQL", name: "db-prod", status: "runnable", region: "us-central1", cost: "$0.0150/hr" },
    { type: "GCS", name: "media-storage", status: "active", region: "global", cost: "$0.020/GB" },
  ],
  azure: [
    { type: "App Service", name: "webapp-prod", status: "running", region: "eastus", cost: "$0.013/hr" },
    { type: "Azure SQL", name: "sql-database", status: "online", region: "eastus", cost: "$0.020/hr" },
    { type: "Blob Storage", name: "files-container", status: "active", region: "global", cost: "$0.018/GB" },
  ],
};

const STATUS_COLORS = {
  running: "text-[#00c896]", available: "text-[#00c896]", runnable: "text-[#00c896]",
  online: "text-[#00c896]", active: "text-blue-400", stopped: "text-red-400",
};

const TYPE_ICONS = { EC2: Server, RDS: Database, S3: HardDrive, Lambda: Zap, "Cloud Run": Globe, "Cloud SQL": Database, GCS: HardDrive, "App Service": Globe, "Azure SQL": Database, "Blob Storage": HardDrive };

export default function CloudPanel() {
  const [activeCloud, setActiveCloud] = useState("aws");
  const [connected, setConnected] = useState({ aws: true, gcp: false, azure: false });
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const resources = MOCK_RESOURCES[activeCloud] || [];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Multi-Cloud Orchestration</h2>
            <p className="text-sm text-gray-500 mt-0.5">Unified control plane for AWS, GCP, and Azure</p>
          </div>
          <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 text-xs rounded hover:text-gray-200 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Cloud selector */}
        <div className="flex gap-3">
          {CLOUDS.map((cloud) => (
            <button
              key={cloud.id}
              onClick={() => setActiveCloud(cloud.id)}
              className={`flex-1 p-3 rounded-lg border transition-colors text-left ${
                activeCloud === cloud.id
                  ? "border-[#00c896] bg-[#00c896]/5"
                  : "border-[#2a2d3a] bg-[#0e1018] hover:border-gray-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cloud.icon}</span>
                  <span className="text-sm font-medium text-white">{cloud.short}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  connected[cloud.id] ? "bg-[#00c896]/10 text-[#00c896]" : "bg-gray-500/10 text-gray-500"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${connected[cloud.id] ? "bg-[#00c896]" : "bg-gray-500"}`} />
                  {connected[cloud.id] ? "Connected" : "Disconnected"}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{cloud.name}</div>
            </button>
          ))}
        </div>

        {connected[activeCloud] ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Resources", value: resources.length, icon: Server, color: "text-blue-400" },
                { label: "Running", value: resources.filter((r) => ["running", "available", "runnable", "online"].includes(r.status)).length, icon: Activity, color: "text-[#00c896]" },
                { label: "Regions", value: [...new Set(resources.map((r) => r.region))].length, icon: Globe, color: "text-purple-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 text-center">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Resources */}
            <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e2330]">
                <span className="text-sm font-medium text-gray-300">Resources</span>
              </div>
              <div className="divide-y divide-[#1e2330]">
                {resources.map((r, i) => {
                  const Icon = TYPE_ICONS[r.type] || Server;
                  return (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-[#1a1d26] transition-colors">
                      <div className="w-8 h-8 rounded bg-[#1a1d26] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#4ec9b0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{r.name}</span>
                          <span className="text-xs bg-[#2a2d3a] px-1.5 py-0.5 rounded text-gray-400">{r.type}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.region}</div>
                      </div>
                      <div className={`text-xs font-medium ${STATUS_COLORS[r.status] || "text-gray-400"}`}>{r.status}</div>
                      <div className="text-xs text-gray-500">{r.cost}</div>
                      <button className="text-gray-500 hover:text-gray-300 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">{CLOUDS.find((c) => c.id === activeCloud)?.icon}</div>
            <div className="text-white font-medium mb-1">Not Connected</div>
            <div className="text-sm text-gray-500 mb-4">Connect your {CLOUDS.find((c) => c.id === activeCloud)?.name} account to manage resources</div>
            <button
              onClick={() => setConnected((p) => ({ ...p, [activeCloud]: true }))}
              className="px-4 py-2 bg-[#00c896] hover:bg-[#00b084] text-black text-sm font-semibold rounded transition-colors"
            >
              Connect Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}