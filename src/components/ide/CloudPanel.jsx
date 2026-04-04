import { useState } from "react";
import { RefreshCw, ExternalLink, Server, Database, Globe, HardDrive, Activity, Zap, Key, Settings, ChevronDown, ChevronRight, Plus, Check, AlertCircle } from "lucide-react";

const CLOUDS = [
  {
    id: "aws", name: "Amazon Web Services", short: "AWS", color: "#ff9900", icon: "🟠",
    authFields: [
      { key: "access_key_id", label: "Access Key ID", placeholder: "AKIAIOSFODNN7EXAMPLE", type: "text" },
      { key: "secret_access_key", label: "Secret Access Key", placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", type: "password" },
      { key: "region", label: "Default Region", placeholder: "us-east-1", type: "text" },
    ],
    services: ["EC2", "ECS", "EKS", "Lambda", "RDS", "DynamoDB", "S3", "CloudFront", "API Gateway", "SQS", "SNS", "ElastiCache", "Fargate", "CodePipeline"],
    resources: [
      { type: "EC2", name: "api-server-prod", status: "running", region: "us-east-1", cost: "$0.024/hr", id: "i-0a1b2c3d4e5f" },
      { type: "RDS", name: "postgres-main", status: "available", region: "us-east-1", cost: "$0.115/hr", id: "db-prod-001" },
      { type: "S3", name: "app-assets-bucket", status: "active", region: "global", cost: "$0.023/GB", id: "arn:aws:s3:::app-assets" },
      { type: "Lambda", name: "auth-handler", status: "active", region: "us-east-1", cost: "Pay per call", id: "auth-handler-prod" },
      { type: "ECS", name: "worker-cluster", status: "running", region: "us-east-1", cost: "$0.048/hr", id: "cluster/workers" },
      { type: "CloudFront", name: "cdn-distribution", status: "active", region: "global", cost: "$0.0085/10k req", id: "E1ABCDEFGHIJ" },
    ],
  },
  {
    id: "gcp", name: "Google Cloud Platform", short: "GCP", color: "#4285f4", icon: "🔵",
    authFields: [
      { key: "project_id", label: "Project ID", placeholder: "my-project-123456", type: "text" },
      { key: "service_account_json", label: "Service Account JSON (path or paste)", placeholder: '{"type":"service_account",...}', type: "password" },
      { key: "region", label: "Default Region", placeholder: "us-central1", type: "text" },
    ],
    services: ["Compute Engine", "Cloud Run", "GKE", "Cloud Functions", "Cloud SQL", "Firestore", "GCS", "BigQuery", "Pub/Sub", "Cloud Build", "Artifact Registry", "Cloud CDN"],
    resources: [
      { type: "Cloud Run", name: "backend-service", status: "running", region: "us-central1", cost: "$0.00002400/vCPU-s", id: "backend-service" },
      { type: "Cloud SQL", name: "db-prod", status: "runnable", region: "us-central1", cost: "$0.0150/hr", id: "project:us-central1:db-prod" },
      { type: "GCS", name: "media-storage", status: "active", region: "global", cost: "$0.020/GB", id: "gs://media-storage-prod" },
      { type: "GKE", name: "k8s-cluster", status: "running", region: "us-central1", cost: "$0.10/hr", id: "projects/xxx/clusters/k8s" },
      { type: "BigQuery", name: "analytics-dataset", status: "active", region: "US", cost: "$5/TB", id: "project.analytics" },
    ],
  },
  {
    id: "azure", name: "Microsoft Azure", short: "Azure", color: "#0078d4", icon: "🔷",
    authFields: [
      { key: "tenant_id", label: "Tenant ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", type: "text" },
      { key: "client_id", label: "Client ID (App ID)", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", type: "text" },
      { key: "client_secret", label: "Client Secret", placeholder: "~xxxxxxxxxx", type: "password" },
      { key: "subscription_id", label: "Subscription ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", type: "text" },
    ],
    services: ["App Service", "AKS", "Azure Functions", "Azure SQL", "Cosmos DB", "Blob Storage", "Azure CDN", "Service Bus", "Event Hub", "DevOps Pipelines", "Container Registry"],
    resources: [
      { type: "App Service", name: "webapp-prod", status: "running", region: "eastus", cost: "$0.013/hr", id: "/subscriptions/.../webapp-prod" },
      { type: "Azure SQL", name: "sql-database", status: "online", region: "eastus", cost: "$0.020/hr", id: "sql-db-prod" },
      { type: "Blob Storage", name: "files-container", status: "active", region: "global", cost: "$0.018/GB", id: "storageaccountprod" },
      { type: "AKS", name: "k8s-cluster", status: "running", region: "eastus", cost: "$0.10/hr", id: "/subscriptions/.../k8s-cluster" },
    ],
  },
  {
    id: "do", name: "DigitalOcean", short: "DO", color: "#0080ff", icon: "🌊",
    authFields: [
      { key: "api_token", label: "Personal Access Token", placeholder: "dop_v1_xxxxxxxxxxxx", type: "password" },
    ],
    services: ["Droplets", "Kubernetes", "App Platform", "Managed DB", "Spaces", "Functions", "Load Balancers", "Volumes"],
    resources: [
      { type: "Droplet", name: "api-droplet-prod", status: "active", region: "nyc3", cost: "$24/mo", id: "droplet-12345678" },
      { type: "Managed DB", name: "postgres-cluster", status: "online", region: "nyc3", cost: "$50/mo", id: "db-cluster-001" },
      { type: "Spaces", name: "assets-space", status: "active", region: "nyc3", cost: "$5/mo", id: "assets-space" },
    ],
  },
  {
    id: "heroku", name: "Heroku", short: "Heroku", color: "#430098", icon: "🟣",
    authFields: [
      { key: "api_key", label: "API Key", placeholder: "HRKU-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", type: "password" },
    ],
    services: ["Dynos", "Postgres", "Redis", "Pipelines", "Review Apps", "Scheduler", "Add-ons"],
    resources: [
      { type: "Dyno", name: "web-1", status: "running", region: "us", cost: "$25/mo", id: "web.1" },
      { type: "Postgres", name: "postgresql-curved", status: "available", region: "us", cost: "$9/mo", id: "postgresql-curved-12345" },
    ],
  },
  {
    id: "vercel", name: "Vercel", short: "Vercel", color: "#000000", icon: "▲",
    authFields: [
      { key: "token", label: "Access Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", type: "password" },
      { key: "team_id", label: "Team ID (optional)", placeholder: "team_xxxxxxxxxxxx", type: "text" },
    ],
    services: ["Deployments", "Edge Functions", "Analytics", "Storage", "Domains", "Environment Variables"],
    resources: [
      { type: "Deployment", name: "frontend-app", status: "active", region: "global", cost: "Pay per use", id: "dpl_xxxxxxxxxxxx" },
    ],
  },
  {
    id: "railway", name: "Railway", short: "Railway", color: "#9333ea", icon: "🚂",
    authFields: [
      { key: "api_token", label: "API Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", type: "password" },
    ],
    services: ["Services", "Databases", "Volumes", "Environments", "Cron Jobs"],
    resources: [
      { type: "Service", name: "api-service", status: "running", region: "us-west2", cost: "$5/mo", id: "service-xxxx" },
      { type: "PostgreSQL", name: "db", status: "active", region: "us-west2", cost: "$5/mo", id: "db-xxxx" },
    ],
  },
];

const STATUS_COLORS = {
  running: "text-[#00c896]", available: "text-[#00c896]", runnable: "text-[#00c896]",
  online: "text-[#00c896]", active: "text-blue-400", stopped: "text-red-400", failed: "text-red-400",
};
const STATUS_DOT = {
  running: "bg-[#00c896]", available: "bg-[#00c896]", runnable: "bg-[#00c896]",
  online: "bg-[#00c896]", active: "bg-blue-400", stopped: "bg-red-400", failed: "bg-red-400",
};

function CredentialsModal({ cloud, onClose, onConnect }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showValues, setShowValues] = useState({});

  const handleConnect = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    onConnect(cloud.id, form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[#0e1018] border border-[#2a2d3a] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{cloud.icon}</span>
          <div>
            <div className="text-white font-semibold">{cloud.name}</div>
            <div className="text-xs text-gray-500">Enter your credentials to connect</div>
          </div>
        </div>
        <div className="space-y-3">
          {cloud.authFields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
              <div className="relative">
                <input
                  type={showValues[f.key] ? "text" : f.type}
                  placeholder={f.placeholder}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 text-xs px-3 py-2 rounded outline-none focus:border-[#00c896] placeholder-gray-600 font-mono"
                />
                {f.type === "password" && (
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
                    onClick={() => setShowValues((p) => ({ ...p, [f.key]: !p[f.key] }))}>
                    {showValues[f.key] ? "hide" : "show"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-600 mt-3 flex items-center gap-1">
          <Key className="w-3 h-3" />
          Credentials stored locally in this session only
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 text-sm rounded hover:text-gray-200 transition-colors">Cancel</button>
          <button onClick={handleConnect} disabled={saving} className="flex-1 py-2 bg-[#00c896] hover:bg-[#00b084] text-black text-sm font-semibold rounded transition-colors disabled:opacity-50">
            {saving ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CloudPanel() {
  const [activeCloud, setActiveCloud] = useState("aws");
  const [connected, setConnected] = useState({ aws: true });
  const [credentials, setCredentials] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [modalCloud, setModalCloud] = useState(null);
  const [expandedServices, setExpandedServices] = useState(false);
  const [expandedResource, setExpandedResource] = useState(null);

  const cloud = CLOUDS.find((c) => c.id === activeCloud);
  const isConnected = connected[activeCloud];

  const refresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1200); };

  const handleConnect = (id, creds) => {
    setConnected((p) => ({ ...p, [id]: true }));
    setCredentials((p) => ({ ...p, [id]: creds }));
  };

  const disconnect = (id) => {
    setConnected((p) => ({ ...p, [id]: false }));
    setCredentials((p) => { const n = { ...p }; delete n[id]; return n; });
  };

  return (
    <div className="flex-1 overflow-hidden flex bg-[#0d0f14]">
      {/* Sidebar: cloud list */}
      <div className="w-48 shrink-0 bg-[#0a0c11] border-r border-[#1e2330] flex flex-col overflow-y-auto">
        <div className="px-3 py-3 border-b border-[#1e2330]">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cloud Providers</span>
        </div>
        {CLOUDS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCloud(c.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-l-2 ${
              activeCloud === c.id ? "bg-[#1a1d26] border-l-[#00c896] text-white" : "border-l-transparent text-gray-400 hover:bg-[#1a1d26] hover:text-gray-200"
            }`}
          >
            <span className="text-base">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{c.short}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${connected[c.id] ? "bg-[#00c896]" : "bg-gray-600"}`} />
                <span className="text-xs text-gray-600">{connected[c.id] ? "Connected" : "Not connected"}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cloud.icon}</span>
              <div>
                <h2 className="text-base font-bold text-white">{cloud.name}</h2>
                <p className="text-xs text-gray-500">{cloud.services.length} services available</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isConnected && (
                <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 text-xs rounded hover:text-gray-200 transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Sync
                </button>
              )}
              {isConnected ? (
                <button onClick={() => disconnect(activeCloud)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-400/30 text-red-400 text-xs rounded hover:bg-red-500/20 transition-colors">
                  Disconnect
                </button>
              ) : (
                <button onClick={() => setModalCloud(cloud)} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00c896] hover:bg-[#00b084] text-black text-xs font-semibold rounded transition-colors">
                  <Key className="w-3.5 h-3.5" /> Connect
                </button>
              )}
            </div>
          </div>

          {isConnected ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Resources", value: cloud.resources.length, color: "text-blue-400" },
                  { label: "Running", value: cloud.resources.filter((r) => ["running","available","runnable","online","active"].includes(r.status)).length, color: "text-[#00c896]" },
                  { label: "Regions", value: [...new Set(cloud.resources.map((r) => r.region))].length, color: "text-purple-400" },
                  { label: "Services", value: cloud.services.length, color: "text-yellow-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Resources table */}
              <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1e2330] flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Resources</span>
                  <button className="flex items-center gap-1 text-xs text-[#00c896] hover:text-[#00b084] transition-colors">
                    <Plus className="w-3 h-3" /> Create
                  </button>
                </div>
                <div className="divide-y divide-[#1e2330]">
                  {cloud.resources.map((r, i) => (
                    <div key={i}>
                      <div
                        onClick={() => setExpandedResource(expandedResource === i ? null : i)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1d26] transition-colors cursor-pointer"
                      >
                        <div className={`w-2 h-2 rounded-full ${STATUS_DOT[r.status] || "bg-gray-500"} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white">{r.name}</span>
                            <span className="text-xs bg-[#2a2d3a] px-1.5 py-0.5 rounded text-gray-400">{r.type}</span>
                          </div>
                          <div className="text-xs text-gray-600 font-mono mt-0.5 truncate">{r.id}</div>
                        </div>
                        <div className="text-xs text-gray-500 shrink-0">{r.region}</div>
                        <div className={`text-xs font-medium shrink-0 ${STATUS_COLORS[r.status] || "text-gray-400"}`}>{r.status}</div>
                        <div className="text-xs text-gray-500 shrink-0">{r.cost}</div>
                        {expandedResource === i ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                      </div>
                      {expandedResource === i && (
                        <div className="px-4 pb-3 bg-[#0a0c11] border-t border-[#1e2330]">
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            {[["Type", r.type], ["Region", r.region], ["Status", r.status], ["Cost", r.cost], ["Resource ID", r.id]].map(([k, v]) => (
                              <div key={k} className="text-xs">
                                <span className="text-gray-600">{k}: </span>
                                <span className="text-gray-300 font-mono">{v}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button className="px-3 py-1 bg-[#1a1d26] border border-[#2a2d3a] text-xs text-gray-400 rounded hover:text-gray-200 transition-colors flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Open Console
                            </button>
                            <button className="px-3 py-1 bg-red-500/10 border border-red-400/20 text-xs text-red-400 rounded hover:bg-red-500/20 transition-colors">
                              Stop
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Available services */}
              <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedServices((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1d26] transition-colors"
                >
                  <span className="text-sm font-medium text-gray-300">Available Services ({cloud.services.length})</span>
                  {expandedServices ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                </button>
                {expandedServices && (
                  <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-[#1e2330] pt-3">
                    {cloud.services.map((s) => (
                      <span key={s} className="text-xs bg-[#1a1d26] border border-[#2a2d3a] px-2.5 py-1 rounded text-gray-400">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-10 text-center">
              <div className="text-5xl mb-4">{cloud.icon}</div>
              <div className="text-white font-semibold text-lg mb-1">Connect {cloud.short}</div>
              <div className="text-sm text-gray-500 mb-2 max-w-sm mx-auto">Provide your {cloud.name} credentials to manage resources directly from Aegis Quantum.</div>
              <div className="text-xs text-gray-600 mb-5">Requires: {cloud.authFields.map((f) => f.label).join(", ")}</div>
              <button
                onClick={() => setModalCloud(cloud)}
                className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b084] text-black font-semibold rounded-lg transition-colors"
              >
                Configure Credentials
              </button>
            </div>
          )}
        </div>
      </div>

      {modalCloud && (
        <CredentialsModal cloud={modalCloud} onClose={() => setModalCloud(null)} onConnect={handleConnect} />
      )}
    </div>
  );
}