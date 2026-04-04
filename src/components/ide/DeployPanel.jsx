import { useState } from "react";
import { Rocket, CheckCircle, Clock, AlertCircle, ChevronRight, RefreshCw, Settings, Globe, Key, ExternalLink, ChevronDown } from "lucide-react";

const TARGETS = [
  // GCP
  { id: "cloud-run", name: "Cloud Run", provider: "GCP", icon: "☁️", desc: "Serverless containers", color: "#4285f4",
    fields: [{ key: "project_id", label: "Project ID" }, { key: "region", label: "Region", default: "us-central1" }, { key: "service_name", label: "Service Name" }],
    steps: ["Authenticating with GCP...", "Building container image...", "Pushing to Artifact Registry...", "Deploying to Cloud Run...", "Setting up traffic routing...", "✅ Live at https://{service}-xxxx-uc.a.run.app"] },
  { id: "gke", name: "GKE (Kubernetes)", provider: "GCP", icon: "☸️", desc: "Managed Kubernetes", color: "#4285f4",
    fields: [{ key: "project_id", label: "Project ID" }, { key: "cluster", label: "Cluster Name" }, { key: "namespace", label: "Namespace", default: "default" }],
    steps: ["Connecting to GKE cluster...", "Building Docker image...", "Pushing to GCR...", "Applying Kubernetes manifests...", "Rolling out deployment...", "✅ Deployment complete on GKE"] },
  { id: "cloud-functions", name: "Cloud Functions", provider: "GCP", icon: "⚡", desc: "Serverless functions", color: "#4285f4",
    fields: [{ key: "project_id", label: "Project ID" }, { key: "region", label: "Region", default: "us-central1" }, { key: "function_name", label: "Function Name" }],
    steps: ["Packaging function...", "Uploading source archive...", "Building function...", "✅ Function deployed"] },
  // AWS
  { id: "lambda", name: "AWS Lambda", provider: "AWS", icon: "⚡", desc: "Serverless functions", color: "#ff9900",
    fields: [{ key: "region", label: "Region", default: "us-east-1" }, { key: "function_name", label: "Function Name" }, { key: "role_arn", label: "IAM Role ARN" }],
    steps: ["Authenticating with AWS...", "Packaging Lambda function...", "Uploading to S3...", "Updating function code...", "Publishing new version...", "✅ Lambda function live"] },
  { id: "ecs", name: "AWS ECS / Fargate", provider: "AWS", icon: "🐳", desc: "Container orchestration", color: "#ff9900",
    fields: [{ key: "region", label: "Region", default: "us-east-1" }, { key: "cluster", label: "Cluster Name" }, { key: "service", label: "Service Name" }],
    steps: ["Authenticating with AWS...", "Building container image...", "Pushing to ECR...", "Updating ECS task definition...", "Triggering service update...", "✅ ECS service updated"] },
  { id: "elastic-beanstalk", name: "Elastic Beanstalk", provider: "AWS", icon: "🌱", desc: "PaaS deployment", color: "#ff9900",
    fields: [{ key: "region", label: "Region", default: "us-east-1" }, { key: "app_name", label: "Application Name" }, { key: "env_name", label: "Environment Name" }],
    steps: ["Packaging application bundle...", "Uploading to S3...", "Creating new application version...", "Deploying to environment...", "✅ Elastic Beanstalk updated"] },
  // Azure
  { id: "azure-app", name: "Azure App Service", provider: "Azure", icon: "🔷", desc: "Web app hosting", color: "#0078d4",
    fields: [{ key: "subscription_id", label: "Subscription ID" }, { key: "resource_group", label: "Resource Group" }, { key: "app_name", label: "App Name" }],
    steps: ["Authenticating with Azure...", "Building application...", "Pushing to Azure Container Registry...", "Updating App Service...", "✅ App Service deployed"] },
  { id: "azure-functions", name: "Azure Functions", provider: "Azure", icon: "⚡", desc: "Serverless functions", color: "#0078d4",
    fields: [{ key: "subscription_id", label: "Subscription ID" }, { key: "function_app", label: "Function App Name" }],
    steps: ["Authenticating with Azure...", "Packaging function...", "Deploying to Azure Functions...", "✅ Function app updated"] },
  { id: "aks", name: "AKS (Kubernetes)", provider: "Azure", icon: "☸️", desc: "Managed Kubernetes", color: "#0078d4",
    fields: [{ key: "subscription_id", label: "Subscription ID" }, { key: "cluster", label: "Cluster Name" }, { key: "namespace", label: "Namespace", default: "default" }],
    steps: ["Connecting to AKS...", "Building container...", "Pushing to ACR...", "Applying manifests...", "✅ AKS deployment complete"] },
  // Other
  { id: "digitalocean-app", name: "DO App Platform", provider: "DigitalOcean", icon: "🌊", desc: "PaaS hosting", color: "#0080ff",
    fields: [{ key: "api_token", label: "DO API Token" }, { key: "app_id", label: "App ID" }],
    steps: ["Authenticating with DigitalOcean...", "Triggering deployment...", "Building application...", "✅ DO App deployed"] },
  { id: "heroku", name: "Heroku", provider: "Heroku", icon: "🟣", desc: "PaaS deployment", color: "#430098",
    fields: [{ key: "api_key", label: "Heroku API Key" }, { key: "app_name", label: "App Name" }],
    steps: ["Authenticating with Heroku...", "Pushing to Heroku git...", "Building dyno...", "Restarting app...", "✅ Heroku deployment complete"] },
  { id: "railway", name: "Railway", provider: "Railway", icon: "🚂", desc: "Modern PaaS", color: "#9333ea",
    fields: [{ key: "token", label: "Railway Token" }, { key: "project_id", label: "Project ID" }, { key: "service_id", label: "Service ID" }],
    steps: ["Connecting to Railway...", "Triggering build...", "Deploying service...", "✅ Railway deployment live"] },
  { id: "vercel", name: "Vercel", provider: "Vercel", icon: "▲", desc: "Frontend/edge deploy", color: "#000000",
    fields: [{ key: "token", label: "Vercel Token" }, { key: "project_id", label: "Project ID" }],
    steps: ["Authenticating with Vercel...", "Uploading project...", "Building...", "Assigning domains...", "✅ Vercel deployment live"] },
];

const PROVIDERS = ["All", "GCP", "AWS", "Azure", "DigitalOcean", "Heroku", "Railway", "Vercel"];

const STATUS_ICONS = {
  success: <CheckCircle className="w-4 h-4 text-[#00c896]" />,
  failed: <AlertCircle className="w-4 h-4 text-red-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />,
};

export default function DeployPanel({ activeFile }) {
  const [selected, setSelected] = useState("cloud-run");
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState([]);
  const [providerFilter, setProviderFilter] = useState("All");
  const [config, setConfig] = useState({});
  const [showConfig, setShowConfig] = useState(false);
  const [deployHistory, setDeployHistory] = useState([
    { id: "d1", target: "Cloud Run", status: "success", time: "2 min ago", hash: "a3f9c12", duration: "43s" },
    { id: "d2", target: "AWS Lambda", status: "success", time: "1 hour ago", hash: "b7e1d45", duration: "28s" },
    { id: "d3", target: "AKS", status: "failed", time: "3 hours ago", hash: "c2a8f67", duration: "12s" },
  ]);

  const target = TARGETS.find((t) => t.id === selected);
  const filtered = TARGETS.filter((t) => providerFilter === "All" || t.provider === providerFilter);

  const deploy = async () => {
    setDeploying(true);
    setLogs([]);
    for (const step of target.steps) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      setLogs((p) => [...p, `[${new Date().toLocaleTimeString()}] ${step}`]);
    }
    setDeployHistory((p) => [
      { id: Date.now().toString(), target: target.name, status: "success", time: "just now", hash: Math.random().toString(36).slice(2, 9), duration: `${Math.floor(Math.random() * 60 + 20)}s` },
      ...p,
    ]);
    setDeploying(false);
  };

  const providerColor = { GCP: "text-blue-400", AWS: "text-orange-400", Azure: "text-blue-300", DigitalOcean: "text-cyan-400", Heroku: "text-purple-400", Railway: "text-purple-300", Vercel: "text-gray-300" };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d0f14]">
      {/* Target sidebar */}
      <div className="w-56 shrink-0 bg-[#0a0c11] border-r border-[#1e2330] flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-[#1e2330]">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deploy Targets</span>
        </div>
        {/* Provider filter */}
        <div className="px-2 py-2 border-b border-[#1e2330] flex flex-wrap gap-1">
          {PROVIDERS.map((p) => (
            <button key={p} onClick={() => setProviderFilter(p)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${providerFilter === p ? "bg-[#00c896]/15 text-[#00c896]" : "text-gray-600 hover:text-gray-300"}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => { setSelected(t.id); setConfig({}); setLogs([]); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors border-l-2 ${
                selected === t.id ? "bg-[#1a1d26] border-l-[#00c896] text-white" : "border-l-transparent text-gray-400 hover:bg-[#1a1d26] hover:text-gray-200"
              }`}>
              <span className="text-base shrink-0">{t.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{t.name}</div>
                <div className={`text-xs ${providerColor[t.provider] || "text-gray-500"}`}>{t.provider}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{target.icon}</span>
              <div>
                <h2 className="text-base font-bold text-white">{target.name}</h2>
                <p className="text-xs text-gray-500">{target.desc} · {target.provider}</p>
              </div>
            </div>
            <button onClick={() => setShowConfig((v) => !v)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${showConfig ? "bg-[#00c896]/10 border-[#00c896]/30 text-[#00c896]" : "bg-[#1a1d26] border-[#2a2d3a] text-gray-400 hover:text-gray-200"}`}>
              <Settings className="w-3.5 h-3.5" /> Configure
            </button>
          </div>

          {/* Configuration fields */}
          {showConfig && (
            <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Key className="w-3.5 h-3.5" /> Target Configuration
              </div>
              <div className="grid grid-cols-2 gap-3">
                {target.fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                    <input
                      value={config[f.key] ?? f.default ?? ""}
                      onChange={(e) => setConfig((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.default || f.label}
                      className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 text-xs px-2.5 py-1.5 rounded outline-none focus:border-[#00c896] placeholder-gray-600 font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1 pt-1">
                <CheckCircle className="w-3 h-3 text-[#00c896]" /> Configuration stored in session only
              </div>
            </div>
          )}

          {/* Active file info */}
          {activeFile && (
            <div className="flex items-center gap-2 bg-[#0e1018] border border-[#1e2330] rounded-lg px-4 py-2.5 text-xs text-gray-400">
              <Globe className="w-3.5 h-3.5 text-[#00c896]" />
              Deploying: <span className="text-white font-mono">{activeFile.name}</span>
              <span className="ml-auto text-gray-600">{activeFile.content?.split("\n").length || 0} lines</span>
            </div>
          )}

          {/* Deploy button */}
          <button onClick={deploy} disabled={deploying}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-50 text-black font-bold rounded-lg transition-colors text-sm">
            {deploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {deploying ? "Deploying..." : `Deploy to ${target.name}`}
          </button>

          {/* Live logs */}
          {logs.length > 0 && (
            <div className="bg-[#080a0f] border border-[#1e2330] rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-[#1e2330] flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${deploying ? "bg-yellow-400 animate-pulse" : "bg-[#00c896]"}`} />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deploy Log</span>
              </div>
              <div className="p-4 space-y-1 font-mono text-xs max-h-56 overflow-y-auto">
                {logs.map((line, i) => (
                  <div key={i} className={line.includes("✅") ? "text-[#00c896]" : line.includes("❌") ? "text-red-400" : "text-gray-300"}>
                    {line}
                  </div>
                ))}
                {deploying && <div className="text-gray-600 animate-pulse">▋</div>}
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2330]">
              <span className="text-sm font-medium text-gray-300">Deployment History</span>
            </div>
            <div className="divide-y divide-[#1e2330]">
              {deployHistory.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1d26] transition-colors">
                  {STATUS_ICONS[d.status]}
                  <div className="flex-1">
                    <div className="text-sm text-white">{d.target}</div>
                    <div className="text-xs text-gray-600 font-mono">{d.hash} · {d.duration}</div>
                  </div>
                  <div className="text-xs text-gray-500">{d.time}</div>
                  <button className="text-gray-600 hover:text-gray-300 transition-colors"><ExternalLink className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}