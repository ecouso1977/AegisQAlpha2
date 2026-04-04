import { useState } from "react";
import { Search, Star, Download, Check, ExternalLink, Zap, Shield, Database, CreditCard, GitBranch, Layers, Package, ChevronRight } from "lucide-react";

const CATEGORIES = ["Featured", "Infrastructure", "Data & Analytics", "Productivity", "Payments", "Agent Orchestration", "All Plugins"];

const PLUGINS = [
  // Featured
  { id: "datadog", name: "Datadog", description: "Monitor performance, logs, and traces directly in your IDE.", category: "Featured", icon: "🐶", stars: 4.8, installs: "120k", installed: false, color: "#7b4fff" },
  { id: "slack", name: "Slack", description: "Send messages, create channels and search conversations.", category: "Featured", icon: "💬", stars: 4.7, installs: "98k", installed: false, color: "#4A154B" },
  { id: "linear", name: "Linear", description: "Manage issues, projects, and cycles from your IDE.", category: "Featured", icon: "📐", stars: 4.9, installs: "75k", installed: true, color: "#5E6AD2" },
  { id: "figma", name: "Figma", description: "Browse and inspect Figma designs without leaving the editor.", category: "Featured", icon: "🎨", stars: 4.6, installs: "60k", installed: true, color: "#F24E1E" },
  { id: "github-copilot", name: "GitHub Copilot", description: "AI pair programmer that suggests code completions.", category: "Featured", icon: "🤖", stars: 4.9, installs: "500k", installed: false, color: "#00c896" },
  { id: "openai", name: "OpenAI Tools", description: "Integrate GPT-4, DALL·E and Whisper APIs into your workflows.", category: "Featured", icon: "⚡", stars: 4.8, installs: "200k", installed: false, color: "#10a37f" },
  // Infrastructure
  { id: "encore", name: "Encore", description: "Build backends in TypeScript with zero config.", category: "Infrastructure", icon: "🏗️", stars: 4.5, installs: "30k", installed: false, color: "#ff6b6b" },
  { id: "firebase", name: "Firebase", description: "The official Firebase plugin — deploy, auth, Firestore.", category: "Infrastructure", icon: "🔥", stars: 4.7, installs: "250k", installed: false, color: "#ffca28" },
  { id: "aws-amplify", name: "AWS Amplify", description: "Build full-stack apps with AWS hosting and auth.", category: "Infrastructure", icon: "☁️", stars: 4.4, installs: "85k", installed: false, color: "#FF9900" },
  { id: "aws-serverless", name: "AWS Serverless", description: "Design, build, deploy and test Lambda functions.", category: "Infrastructure", icon: "λ", stars: 4.6, installs: "70k", installed: false, color: "#FF9900" },
  { id: "docker", name: "Docker", description: "Manage containers and images from within the IDE.", category: "Infrastructure", icon: "🐳", stars: 4.8, installs: "400k", installed: false, color: "#2496ED" },
  { id: "terraform", name: "Terraform", description: "Write, plan and apply infrastructure as code.", category: "Infrastructure", icon: "🌍", stars: 4.7, installs: "180k", installed: false, color: "#7B42BC" },
  // Data & Analytics
  { id: "snowflake", name: "Snowflake", description: "Query and visualize Snowflake data warehouses.", category: "Data & Analytics", icon: "❄️", stars: 4.5, installs: "40k", installed: false, color: "#29B5E8" },
  { id: "bigquery", name: "BigQuery", description: "Run Google BigQuery queries and explore datasets.", category: "Data & Analytics", icon: "📊", stars: 4.6, installs: "55k", installed: false, color: "#4285F4" },
  { id: "mongodb", name: "MongoDB", description: "Browse collections, run queries and manage indexes.", category: "Data & Analytics", icon: "🍃", stars: 4.7, installs: "320k", installed: false, color: "#47A248" },
  { id: "redis", name: "Redis", description: "Inspect and manage Redis keys, streams, and pub/sub.", category: "Data & Analytics", icon: "🔴", stars: 4.6, installs: "150k", installed: false, color: "#DC382D" },
  // Productivity
  { id: "notion", name: "Notion", description: "Access your Notion pages and databases from the IDE.", category: "Productivity", icon: "📝", stars: 4.5, installs: "90k", installed: false, color: "#000000" },
  { id: "jira", name: "Jira", description: "View, create and update Jira issues without context-switching.", category: "Productivity", icon: "🔷", stars: 4.3, installs: "280k", installed: false, color: "#0052CC" },
  { id: "prettier", name: "Prettier", description: "Auto-format your code on save with Prettier.", category: "Productivity", icon: "✨", stars: 4.9, installs: "600k", installed: true, color: "#F7B93E" },
  { id: "eslint", name: "ESLint", description: "Lint JavaScript and TypeScript in real-time.", category: "Productivity", icon: "🔍", stars: 4.8, installs: "550k", installed: false, color: "#4B32C3" },
  // Payments
  { id: "stripe", name: "Stripe", description: "Test payments, manage webhooks and view transactions.", category: "Payments", icon: "💳", stars: 4.8, installs: "130k", installed: false, color: "#635BFF" },
  { id: "paypal", name: "PayPal", description: "Integrate PayPal checkout and subscriptions.", category: "Payments", icon: "🅿️", stars: 4.2, installs: "70k", installed: false, color: "#003087" },
  // Agent Orchestration
  { id: "langchain", name: "LangChain", description: "Build and test LangChain agents and chains.", category: "Agent Orchestration", icon: "⛓️", stars: 4.7, installs: "95k", installed: false, color: "#00c896" },
  { id: "autogen", name: "AutoGen", description: "Multi-agent conversation framework by Microsoft.", category: "Agent Orchestration", icon: "🤝", stars: 4.6, installs: "60k", installed: false, color: "#0078D4" },
];

function PluginCard({ plugin, onToggle }) {
  return (
    <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 hover:border-[#2a2d3a] transition-all flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: plugin.color + "22", border: `1px solid ${plugin.color}44` }}>
          {plugin.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{plugin.name}</span>
            {plugin.installed && <span className="text-xs bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20 px-1.5 py-0.5 rounded">Installed</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{plugin.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{plugin.stars}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{plugin.installs}</span>
        </div>
        <button
          onClick={() => onToggle(plugin.id)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
            plugin.installed
              ? "bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 hover:text-red-400 hover:border-red-400/30"
              : "bg-[#00c896] hover:bg-[#00b084] text-black"
          }`}
        >
          {plugin.installed ? <><Check className="w-3 h-3" /> Installed</> : <><Download className="w-3 h-3" /> Install</>}
        </button>
      </div>
    </div>
  );
}

export default function MarketplacePanel() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Featured");
  const [plugins, setPlugins] = useState(PLUGINS);

  const togglePlugin = (id) => {
    setPlugins((prev) => prev.map((p) => p.id === id ? { ...p, installed: !p.installed } : p));
  };

  const filtered = plugins.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All Plugins" || category === "Featured" ? (category === "All Plugins" ? true : p.category === "Featured") : p.category === category;
    return matchSearch && matchCat;
  });

  const installedCount = plugins.filter((p) => p.installed).length;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d0f14]">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-[#1e2330] bg-[#0a0c11] flex flex-col">
        <div className="px-4 py-3 border-b border-[#1e2330]">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Marketplace</div>
          <div className="text-xs text-gray-600 mt-0.5">{installedCount} plugins installed</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between group ${
                category === cat ? "bg-[#00c896]/10 text-[#00c896]" : "text-gray-500 hover:text-gray-200 hover:bg-[#1a1d26]"
              }`}
            >
              {cat}
              <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${category === cat ? "opacity-100" : ""}`} />
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1e2330]">
          <button className="w-full text-left px-3 py-2 rounded text-sm text-gray-500 hover:text-gray-200 hover:bg-[#1a1d26] transition-colors">
            Documentation
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-[#1e2330] bg-[#0a0c11]">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value) setCategory("All Plugins"); }}
              placeholder="Search skills, rules, subagents, MCPs, and hooks..."
              className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 text-sm pl-9 pr-4 py-2 rounded-lg outline-none focus:border-[#00c896] placeholder-gray-600 transition-colors"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">{search ? "Search Results" : category}</span>
            <span className="text-xs text-gray-600">{filtered.length} plugins</span>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-600">No plugins found for "{search}"</div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <PluginCard key={p.id} plugin={p} onToggle={togglePlugin} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}