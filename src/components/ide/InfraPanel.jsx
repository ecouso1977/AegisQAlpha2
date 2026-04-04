import { useState } from "react";
import { Container, Database, Cpu, Play, Square, RefreshCw, Plus, Trash2, CheckCircle, XCircle, Clock, Code2, Globe, ChevronDown } from "lucide-react";

const DEV_ENV_TEMPLATES = [
  { id: "python", name: "Python 3.11", icon: "🐍", type: "venv", dockerfile: `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["python", "main.py"]`, port: 8000, packages: "pip, venv, black, ruff, pytest" },
  { id: "react", name: "React + Vite", icon: "⚛️", type: "node", dockerfile: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json .\nRUN npm install\nCOPY . .\nEXPOSE 5173\nCMD ["npm", "run", "dev", "--", "--host"]`, port: 5173, packages: "react, vite, tailwindcss, eslint" },
  { id: "nextjs", name: "Next.js 14", icon: "▲", type: "node", dockerfile: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json .\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "run", "dev"]`, port: 3000, packages: "next, react, tailwindcss, typescript" },
  { id: "go", name: "Go 1.22", icon: "🐹", type: "go", dockerfile: `FROM golang:1.22-alpine\nWORKDIR /app\nCOPY go.mod go.sum .\nRUN go mod download\nCOPY . .\nEXPOSE 8080\nCMD ["go", "run", "./cmd/main.go"]`, port: 8080, packages: "net/http, gin, chi, sqlx" },
  { id: "rust", name: "Rust (Tokio)", icon: "🦀", type: "rust", dockerfile: `FROM rust:1.77-slim\nWORKDIR /app\nCOPY Cargo.toml Cargo.lock .\nCOPY src ./src\nRUN cargo build --release\nEXPOSE 8080\nCMD ["./target/release/app"]`, port: 8080, packages: "tokio, axum, serde, sqlx" },
  { id: "node", name: "Node.js 20 (Express)", icon: "💚", type: "node", dockerfile: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json .\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["node", "index.js"]`, port: 3000, packages: "express, cors, dotenv, nodemon" },
  { id: "django", name: "Django 5", icon: "🎸", type: "venv", dockerfile: `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install django gunicorn psycopg2-binary\nCOPY . .\nEXPOSE 8000\nCMD ["gunicorn", "wsgi:application"]`, port: 8000, packages: "django, drf, celery, gunicorn" },
  { id: "fastapi", name: "FastAPI + Uvicorn", icon: "⚡", type: "venv", dockerfile: `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install fastapi uvicorn pydantic\nCOPY . .\nEXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0"]`, port: 8000, packages: "fastapi, uvicorn, pydantic, sqlalchemy" },
  { id: "springboot", name: "Spring Boot (Java 21)", icon: "☕", type: "java", dockerfile: `FROM eclipse-temurin:21-jdk-alpine\nWORKDIR /app\nCOPY mvnw pom.xml .\nRUN ./mvnw dependency:resolve\nCOPY . .\nRUN ./mvnw package -DskipTests\nEXPOSE 8080\nCMD ["java", "-jar", "target/app.jar"]`, port: 8080, packages: "spring-web, data-jpa, security, actuator" },
  { id: "dotnet", name: ".NET 8 (ASP.NET)", icon: "🔷", type: "dotnet", dockerfile: `FROM mcr.microsoft.com/dotnet/sdk:8.0\nWORKDIR /app\nCOPY *.csproj .\nRUN dotnet restore\nCOPY . .\nRUN dotnet publish -c Release -o out\nEXPOSE 5000\nCMD ["dotnet", "out/app.dll"]`, port: 5000, packages: "ASP.NET Core, EF Core, Serilog" },
  { id: "vue", name: "Vue 3 + Vite", icon: "💚", type: "node", dockerfile: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json .\nRUN npm install\nCOPY . .\nEXPOSE 5173\nCMD ["npm", "run", "dev", "--", "--host"]`, port: 5173, packages: "vue, vite, pinia, vue-router" },
  { id: "svelte", name: "SvelteKit", icon: "🔥", type: "node", dockerfile: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json .\nRUN npm install\nCOPY . .\nEXPOSE 5173\nCMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]`, port: 5173, packages: "svelte, sveltekit, vite" },
];

const DB_TEMPLATES = [
  { id: "pg", name: "PostgreSQL 16", icon: "🐘", port: 5432 },
  { id: "mysql", name: "MySQL 8", icon: "🐬", port: 3306 },
  { id: "mongo", name: "MongoDB 7", icon: "🍃", port: 27017 },
  { id: "redis", name: "Redis 7", icon: "🔴", port: 6379 },
  { id: "kafka", name: "Kafka", icon: "📨", port: 9092 },
  { id: "rabbit", name: "RabbitMQ", icon: "🐇", port: 5672 },
];

const STATUS_CONFIG = {
  running: { color: "text-[#00c896]", bg: "bg-[#00c896]/10", icon: CheckCircle, label: "Running" },
  stopped: { color: "text-gray-500", bg: "bg-gray-500/10", icon: XCircle, label: "Stopped" },
  starting: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Clock, label: "Starting..." },
};

const INITIAL_ENVS = [
  { id: "1", name: "Python venv (main)", templateId: "python", type: "venv", status: "running", port: 8000, created: "2 min ago" },
  { id: "2", name: "PostgreSQL 16", templateId: "pg", type: "db", status: "running", port: 5432, created: "5 min ago" },
  { id: "3", name: "Redis Cache", templateId: "redis", type: "db", status: "stopped", port: 6379, created: "10 min ago" },
];

export default function InfraPanel() {
  const [envs, setEnvs] = useState(INITIAL_ENVS);
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [showAddDb, setShowAddDb] = useState(false);
  const [dockerPreview, setDockerPreview] = useState(null);

  const toggle = (id) => {
    setEnvs((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      if (e.status === "running") return { ...e, status: "stopped" };
      return { ...e, status: "starting" };
    }));
    setTimeout(() => setEnvs((prev) => prev.map((e) => e.id === id && e.status === "starting" ? { ...e, status: "running" } : e)), 1500);
  };

  const destroy = (id) => setEnvs((prev) => prev.filter((e) => e.id !== id));

  const addEnv = (template) => {
    setEnvs((prev) => [...prev, { id: Date.now().toString(), name: template.name, templateId: template.id, type: template.type, status: "starting", port: template.port, created: "just now" }]);
    setTimeout(() => setEnvs((prev) => prev.map((e) => e.created === "just now" ? { ...e, status: "running", created: "1 sec ago" } : e)), 1800);
    setShowAddEnv(false);
  };

  const addDb = (db) => {
    setEnvs((prev) => [...prev, { id: Date.now().toString(), name: db.name, templateId: db.id, type: "db", status: "starting", port: db.port, created: "just now" }]);
    setTimeout(() => setEnvs((prev) => prev.map((e) => e.created === "just now" ? { ...e, status: "running", created: "1 sec ago" } : e)), 1800);
    setShowAddDb(false);
  };

  const getDockerfile = (env) => {
    const t = DEV_ENV_TEMPLATES.find((t) => t.id === env.templateId);
    return t?.dockerfile || null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Dev Environments & Infrastructure</h2>
            <p className="text-sm text-gray-500 mt-0.5">Spin up any runtime, database, or service locally</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowAddEnv((v) => !v); setShowAddDb(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs rounded transition-colors ${showAddEnv ? "bg-[#00c896]/10 border-[#00c896]/30 text-[#00c896]" : "bg-[#1a1d26] border-[#2a2d3a] text-gray-300 hover:border-[#00c896]"}`}>
              <Code2 className="w-3.5 h-3.5" /> + Runtime
            </button>
            <button onClick={() => { setShowAddDb((v) => !v); setShowAddEnv(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs rounded transition-colors ${showAddDb ? "bg-[#00c896]/10 border-[#00c896]/30 text-[#00c896]" : "bg-[#1a1d26] border-[#2a2d3a] text-gray-300 hover:border-[#00c896]"}`}>
              <Database className="w-3.5 h-3.5" /> + Database
            </button>
          </div>
        </div>

        {/* Runtime picker */}
        {showAddEnv && (
          <div className="bg-[#0e1018] border border-[#00c896]/20 rounded-xl p-4">
            <div className="text-sm font-medium text-gray-300 mb-3">Choose Runtime Environment</div>
            <div className="grid grid-cols-3 gap-2">
              {DEV_ENV_TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => addEnv(t)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[#1a1d26] border border-[#2a2d3a] rounded-lg text-left hover:border-[#00c896] hover:bg-[#00c896]/5 transition-colors group">
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-gray-200 group-hover:text-[#00c896]">{t.name}</div>
                    <div className="text-xs text-gray-600">:{t.port}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DB picker */}
        {showAddDb && (
          <div className="bg-[#0e1018] border border-[#00c896]/20 rounded-xl p-4">
            <div className="text-sm font-medium text-gray-300 mb-3">Choose Database / Message Broker</div>
            <div className="grid grid-cols-3 gap-2">
              {DB_TEMPLATES.map((db) => (
                <button key={db.id} onClick={() => addDb(db)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[#1a1d26] border border-[#2a2d3a] rounded-lg text-left hover:border-[#00c896] hover:bg-[#00c896]/5 transition-colors group">
                  <span className="text-xl">{db.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-gray-200 group-hover:text-[#00c896]">{db.name}</div>
                    <div className="text-xs text-gray-600">:{db.port}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
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
            const sc = STATUS_CONFIG[env.status];
            const StatusIcon = sc.icon;
            const dockerfile = getDockerfile(env);
            return (
              <div key={env.id} className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1a1d26] border border-[#2a2d3a] flex items-center justify-center text-xl shrink-0">
                    {DEV_ENV_TEMPLATES.find((t) => t.id === env.templateId)?.icon || DB_TEMPLATES.find((t) => t.id === env.templateId)?.icon || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{env.name}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />{sc.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{env.port ? `Port :${env.port} · ` : ""}{env.type.toUpperCase()} · Created {env.created}</div>
                    {env.port && env.status === "running" && (
                      <div className="flex items-center gap-1 mt-1">
                        <Globe className="w-3 h-3 text-[#00c896]" />
                        <span className="text-xs text-[#00c896] font-mono">localhost:{env.port}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {dockerfile && (
                      <button onClick={() => setDockerPreview(dockerPreview === env.id ? null : env.id)} className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors" title="Dockerfile">
                        <Container className="w-4 h-4" />
                      </button>
                    )}
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
                {dockerPreview === env.id && dockerfile && (
                  <div className="border-t border-[#1e2330] px-4 pb-4">
                    <div className="text-xs text-gray-500 mb-2 mt-3">Generated Dockerfile</div>
                    <pre className="bg-[#080a0f] rounded p-3 text-xs text-gray-300 font-mono overflow-x-auto">{dockerfile}</pre>
                    <div className="flex gap-2 mt-2">
                      <button className="px-3 py-1.5 bg-[#00c896] hover:bg-[#00b084] text-black text-xs font-semibold rounded transition-colors">Build Image</button>
                      <button className="px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] text-gray-300 text-xs rounded hover:border-gray-400 transition-colors">Export Dockerfile</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}