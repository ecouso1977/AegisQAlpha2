import { useState } from "react";
import { Container, Database, Cpu, Play, Square, RefreshCw, Plus, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";

const INITIAL_ENVS = [
  { id: "1", name: "Python venv (main)", type: "venv", status: "running", port: null, created: "2 min ago" },
  { id: "2", name: "PostgreSQL 15", type: "docker", status: "running", port: 5432, created: "5 min ago" },
  { id: "3", name: "Redis Cache", type: "docker", status: "stopped", port: 6379, created: "10 min ago" },
];

const TYPE_ICONS = { venv: Cpu, docker: Container, db: Database };

const STATUS_CONFIG = {
  running: { color: "text-[#00c896]", bg: "bg-[#00c896]/10", icon: CheckCircle, label: "Running" },
  stopped: { color: "text-gray-500", bg: "bg-gray-500/10", icon: XCircle, label: "Stopped" },
  starting: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Clock, label: "Starting..." },
};

export default function InfraPanel() {
  const [envs, setEnvs] = useState(INITIAL_ENVS);

  const toggle = (id) => {
    setEnvs((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      if (e.status === "running") return { ...e, status: "stopped" };
      if (e.status === "stopped") return { ...e, status: "starting" };
      return e;
    }));
    setTimeout(() => {
      setEnvs((prev) => prev.map((e) => e.id === id && e.status === "starting" ? { ...e, status: "running" } : e));
    }, 1500);
  };

  const destroy = (id) => setEnvs((prev) => prev.filter((e) => e.id !== id));

  const spinNew = (type) => {
    const names = { venv: "Python venv", docker: "Docker Container", db: "PostgreSQL" };
    setEnvs((prev) => [...prev, {
      id: Date.now().toString(),
      name: `${names[type]} (new)`,
      type,
      status: "starting",
      port: type === "docker" ? 8080 : null,
      created: "just now",
    }]);
    setTimeout(() => {
      setEnvs((prev) => prev.map((e) => e.created === "just now" ? { ...e, status: "running", created: "1 sec ago" } : e));
    }, 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Local Infrastructure</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage virtual environments, containers, and services</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => spinNew("venv")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] hover:border-[#00c896] text-gray-300 hover:text-[#00c896] text-xs rounded transition-colors">
              <Plus className="w-3.5 h-3.5" /> Python venv
            </button>
            <button onClick={() => spinNew("docker")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] hover:border-[#00c896] text-gray-300 hover:text-[#00c896] text-xs rounded transition-colors">
              <Plus className="w-3.5 h-3.5" /> Docker Container
            </button>
            <button onClick={() => spinNew("db")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] hover:border-[#00c896] text-gray-300 hover:text-[#00c896] text-xs rounded transition-colors">
              <Plus className="w-3.5 h-3.5" /> Database
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Running", value: envs.filter((e) => e.status === "running").length, color: "text-[#00c896]" },
            { label: "Stopped", value: envs.filter((e) => e.status === "stopped").length, color: "text-gray-400" },
            { label: "Total", value: envs.length, color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Environment list */}
        <div className="space-y-3">
          {envs.map((env) => {
            const TypeIcon = TYPE_ICONS[env.type] || Container;
            const sc = STATUS_CONFIG[env.status];
            const StatusIcon = sc.icon;
            return (
              <div key={env.id} className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a1d26] border border-[#2a2d3a] flex items-center justify-center shrink-0">
                  <TypeIcon className="w-5 h-5 text-[#4ec9b0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{env.name}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {env.port ? `Port: ${env.port} · ` : ""}{env.type.toUpperCase()} · Created {env.created}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(env.id)} className="p-1.5 text-gray-400 hover:text-[#00c896] transition-colors" title={env.status === "running" ? "Stop" : "Start"}>
                    {env.status === "running" ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors" title="Restart">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => destroy(env.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" title="Destroy">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Docker section */}
        <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Container className="w-4 h-4 text-[#00c896]" />
            <span className="text-sm font-medium text-white">Dockerfile Preview</span>
          </div>
          <pre className="bg-[#080a0f] rounded p-3 text-xs text-gray-300 font-mono overflow-x-auto">{`FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]`}</pre>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 bg-[#00c896] hover:bg-[#00b084] text-black text-xs font-semibold rounded transition-colors">Build Image</button>
            <button className="px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] text-gray-300 text-xs rounded hover:border-gray-400 transition-colors">Export Dockerfile</button>
          </div>
        </div>
      </div>
    </div>
  );
}