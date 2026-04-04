import { useState } from "react";
import { Download, Check, Star, Zap, Database, Globe, Box, Cpu, BarChart2, Search } from "lucide-react";

const PLUGINS = [
  { id: "fastapi", name: "FastAPI Kit", category: "Framework", icon: "⚡", desc: "FastAPI project templates, route generator, and OpenAPI preview", stars: 4.9, installed: true, featured: true },
  { id: "flask", name: "Flask Toolkit", category: "Framework", icon: "🌶️", desc: "Flask blueprints, Jinja2 helpers, and dev server launcher", stars: 4.7, installed: true, featured: false },
  { id: "docker", name: "Docker Manager", category: "Infra", icon: "🐳", desc: "Build, run, and inspect Docker containers without leaving the IDE", stars: 4.8, installed: true, featured: true },
  { id: "postgres", name: "PostgreSQL Connector", category: "Data", icon: "🐘", desc: "Query editor, schema browser, and migration runner for PostgreSQL", stars: 4.6, installed: false, featured: false },
  { id: "redis", name: "Redis Viewer", category: "Data", icon: "🔴", desc: "Inspect and manage Redis keys, TTLs, and pub/sub channels", stars: 4.5, installed: false, featured: false },
  { id: "k8s", name: "Kubernetes Lite", category: "Infra", icon: "☸️", desc: "View pods, services, and deployments across clusters", stars: 4.7, installed: false, featured: true },
  { id: "prompt", name: "Prompt Builder", category: "AI", icon: "🧠", desc: "Visual prompt engineering, variable injection, and model comparison", stars: 4.9, installed: true, featured: true },
  { id: "benchmark", name: "Model Benchmarker", category: "AI", icon: "📊", desc: "Compare latency, cost, and output quality across LLM providers", stars: 4.4, installed: false, featured: false },
  { id: "node", name: "Node.js Templates", category: "Framework", icon: "🟢", desc: "Express, Fastify, and NestJS starter templates with hot reload", stars: 4.6, installed: false, featured: false },
  { id: "ollama", name: "Ollama Integration", category: "AI", icon: "🦙", desc: "Run open-source models locally via Ollama — Llama, Mistral, Phi, and more", stars: 4.8, installed: false, featured: true },
];

const CATEGORIES = ["All", "Framework", "Infra", "Data", "AI"];
const CATEGORY_ICONS = { Framework: Zap, Infra: Box, Data: Database, AI: Cpu, All: Globe };

export default function PluginsPanel() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [installed, setInstalled] = useState(new Set(PLUGINS.filter((p) => p.installed).map((p) => p.id)));
  const [installing, setInstalling] = useState(null);

  const install = async (id) => {
    setInstalling(id);
    await new Promise((r) => setTimeout(r, 1400));
    setInstalled((p) => new Set([...p, id]));
    setInstalling(null);
  };
  const uninstall = (id) => setInstalled((p) => { const n = new Set(p); n.delete(id); return n; });

  const filtered = PLUGINS.filter((p) => {
    const matchCat = filter === "All" || p.category === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Plugin Marketplace</h2>
          <p className="text-sm text-gray-500 mt-0.5">Extend Aegis Quantum with pre-built integrations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Installed", value: installed.size, color: "text-[#00c896]" },
            { label: "Available", value: PLUGINS.length - installed.size, color: "text-blue-400" },
            { label: "Featured", value: PLUGINS.filter((p) => p.featured).length, color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plugins..."
              className="w-full bg-[#0e1018] border border-[#1e2330] text-white text-sm pl-9 pr-3 py-2 rounded outline-none focus:border-[#00c896] placeholder-gray-600 transition-colors"
            />
          </div>
          <div className="flex gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                    filter === cat
                      ? "bg-[#00c896]/10 border border-[#00c896]/40 text-[#00c896]"
                      : "bg-[#0e1018] border border-[#1e2330] text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Icon style={{ width: 12, height: 12 }} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plugin grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((plugin) => {
            const isInstalled = installed.has(plugin.id);
            const isInstalling = installing === plugin.id;
            return (
              <div key={plugin.id} className={`bg-[#0e1018] border rounded-lg p-4 transition-colors ${
                plugin.featured ? "border-[#00c896]/20" : "border-[#1e2330]"
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1d26] flex items-center justify-center text-xl">
                      {plugin.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{plugin.name}</span>
                        {plugin.featured && (
                          <span className="text-xs bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-400/20">Featured</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{plugin.category}</span>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-400">{plugin.stars}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => isInstalled ? uninstall(plugin.id) : install(plugin.id)}
                    disabled={isInstalling}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${
                      isInstalled
                        ? "bg-[#00c896]/10 border-[#00c896]/30 text-[#00c896] hover:bg-red-500/10 hover:border-red-400/30 hover:text-red-400"
                        : "bg-[#1a1d26] border-[#2a2d3a] text-gray-400 hover:border-[#00c896] hover:text-[#00c896]"
                    }`}
                  >
                    {isInstalling ? (
                      <span className="animate-pulse">Installing...</span>
                    ) : isInstalled ? (
                      <><Check className="w-3 h-3" /> Installed</>
                    ) : (
                      <><Download className="w-3 h-3" /> Install</>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">{plugin.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}