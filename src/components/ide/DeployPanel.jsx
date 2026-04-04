import { useState } from "react";
import { Rocket, Cloud, Zap, Globe, CheckCircle, Clock, AlertCircle, ChevronRight, RefreshCw } from "lucide-react";

const TARGETS = [
  { id: "cloud-run", name: "Cloud Run", provider: "GCP", icon: "☁️", desc: "Serverless container platform", color: "#4285f4" },
  { id: "lambda", name: "AWS Lambda", provider: "AWS", icon: "⚡", desc: "Function-as-a-service", color: "#ff9900" },
  { id: "azure-app", name: "Azure App Service", provider: "Azure", icon: "🔷", desc: "Web app hosting", color: "#0078d4" },
  { id: "ecs", name: "AWS ECS", provider: "AWS", icon: "🐳", desc: "Container orchestration", color: "#ff9900" },
];

const DEPLOY_HISTORY = [
  { id: "d1", target: "Cloud Run", status: "success", time: "2 min ago", hash: "a3f9c12", duration: "43s" },
  { id: "d2", target: "AWS Lambda", status: "success", time: "1 hour ago", hash: "b7e1d45", duration: "28s" },
  { id: "d3", target: "Azure App Service", status: "failed", time: "3 hours ago", hash: "c2a8f67", duration: "12s" },
];

const STATUS_ICONS = {
  success: <CheckCircle className="w-4 h-4 text-[#00c896]" />,
  failed: <AlertCircle className="w-4 h-4 text-red-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />,
};

export default function DeployPanel({ activeFile }) {
  const [selected, setSelected] = useState("cloud-run");
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState([]);
  const [deployMode, setDeployMode] = useState("dockerfile");

  const deploy = async () => {
    setDeploying(true);
    setLogs([]);
    const target = TARGETS.find((t) => t.id === selected);
    const steps = [
      `[${new Date().toLocaleTimeString()}] 🚀 Starting deployment to ${target.name}...`,
      `[${new Date().toLocaleTimeString()}] 📦 Packaging application...`,
      `[${new Date().toLocaleTimeString()}] 🐳 Building container image...`,
      `[${new Date().toLocaleTimeString()}] ⬆️  Pushing to registry...`,
      `[${new Date().toLocaleTimeString()}] 🔄 Rolling out to ${target.provider}...`,
      `[${new Date().toLocaleTimeString()}] ✅ Deployment complete! Live at https://app-xxxx.${target.provider.toLowerCase()}.run.app`,
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 900));
      setLogs((p) => [...p, steps[i]]);
    }
    setDeploying(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Deployment Engine</h2>
          <p className="text-sm text-gray-500 mt-0.5">Zero-friction deploy to any cloud target</p>
        </div>

        {/* Deploy mode */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 space-y-3">
          <span className="text-sm font-medium text-gray-300">Deployment Mode</span>
          <div className="flex gap-3">
            {[
              { id: "dockerfile", label: "🐳 Dockerfile", desc: "Auto-generated" },
              { id: "inline", label: "⚡ Inline", desc: "No Docker needed" },
            ].map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setDeployMode(id)}
                className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                  deployMode === id
                    ? "border-[#00c896] bg-[#00c896]/5 text-[#00c896]"
                    : "border-[#2a2d3a] bg-[#1a1d26] text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs mt-0.5 opacity-70">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target selection */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 space-y-3">
          <span className="text-sm font-medium text-gray-300">Deployment Target</span>
          <div className="grid grid-cols-2 gap-3">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selected === t.id
                    ? "border-[#00c896] bg-[#00c896]/5"
                    : "border-[#2a2d3a] bg-[#1a1d26] hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.desc}</div>
                  </div>
                  {selected === t.id && <CheckCircle className="w-4 h-4 text-[#00c896] ml-auto" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deploy button */}
        <button
          onClick={deploy}
          disabled={deploying}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-50 text-black font-semibold rounded-lg transition-colors"
        >
          {deploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {deploying ? "Deploying..." : "Deploy Now"}
        </button>

        {/* Live logs */}
        {logs.length > 0 && (
          <div className="bg-[#080a0f] border border-[#1e2330] rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Deploy Logs</div>
            <div className="space-y-1 font-mono text-xs">
              {logs.map((line, i) => (
                <div key={i} className={line.includes("✅") ? "text-[#00c896]" : line.includes("❌") ? "text-red-400" : "text-gray-300"}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4">
          <div className="text-sm font-medium text-gray-300 mb-3">Recent Deployments</div>
          <div className="space-y-2">
            {DEPLOY_HISTORY.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#1a1d26] transition-colors">
                {STATUS_ICONS[d.status]}
                <div className="flex-1">
                  <div className="text-sm text-white">{d.target}</div>
                  <div className="text-xs text-gray-500">{d.hash} · {d.duration}</div>
                </div>
                <div className="text-xs text-gray-500">{d.time}</div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}