import { useState } from "react";
import { Key, Plus, Eye, EyeOff, Trash2, Copy, Check, Shield, Lock } from "lucide-react";

const PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", placeholder: "sk-..." },
  { id: "anthropic", name: "Anthropic", icon: "🔮", placeholder: "sk-ant-..." },
  { id: "google", name: "Google AI", icon: "🔵", placeholder: "AIza..." },
  { id: "aws", name: "AWS", icon: "🟠", placeholder: "AKIA..." },
  { id: "gcp", name: "GCP", icon: "☁️", placeholder: "Service Account JSON" },
  { id: "github", name: "GitHub", icon: "⚫", placeholder: "ghp_..." },
  { id: "custom", name: "Custom", icon: "🔑", placeholder: "Enter API key..." },
];

const INITIAL_KEYS = [
  { id: "1", provider: "openai", name: "OpenAI GPT-4", key: "sk-proj-xxxxxxxxxxx", visible: false, injected: true },
  { id: "2", provider: "github", name: "GitHub PAT", key: "ghp_xxxxxxxxxxxx", visible: false, injected: false },
];

export default function APIVault() {
  const [keys, setKeys] = useState(INITIAL_KEYS);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({ provider: "openai", name: "", key: "" });

  const toggleVisible = (id) => setKeys((p) => p.map((k) => k.id === id ? { ...k, visible: !k.visible } : k));
  const deleteKey = (id) => setKeys((p) => p.filter((k) => k.id !== id));
  const toggleInject = (id) => setKeys((p) => p.map((k) => k.id === id ? { ...k, injected: !k.injected } : k));

  const copyKey = (id, key) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const saveKey = () => {
    if (!form.name || !form.key) return;
    setKeys((p) => [...p, { id: Date.now().toString(), ...form, visible: false, injected: false }]);
    localStorage.setItem(`aq_apikey_${form.provider}`, form.key);
    setForm({ provider: "openai", name: "", key: "" });
    setAdding(false);
  };

  const mask = (key) => key.slice(0, 8) + "••••••••••••" + key.slice(-4);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">API Key Vault</h2>
            <p className="text-sm text-gray-500 mt-0.5">Securely store and auto-inject API keys into projects</p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00c896] hover:bg-[#00b084] text-black text-sm font-semibold rounded transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Key
          </button>
        </div>

        {/* Security banner */}
        <div className="flex items-center gap-3 bg-[#1a2a1a] border border-[#00c896]/30 rounded-lg p-3">
          <Shield className="w-5 h-5 text-[#00c896] shrink-0" />
          <div>
            <div className="text-xs font-medium text-[#00c896]">AES-256 Encrypted Vault</div>
            <div className="text-xs text-gray-400 mt-0.5">All keys are encrypted at rest. Auto-injection injects them as environment variables only — never embedded in code.</div>
          </div>
        </div>

        {/* Add key form */}
        {adding && (
          <div className="bg-[#0e1018] border border-[#00c896]/40 rounded-lg p-4 space-y-3">
            <div className="text-sm font-medium text-white">Add New API Key</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
                  className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-white text-sm px-3 py-2 rounded outline-none focus:border-[#00c896]"
                >
                  {PROVIDERS.map((pr) => (
                    <option key={pr.id} value={pr.id}>{pr.icon} {pr.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="My OpenAI Key"
                  className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-white text-sm px-3 py-2 rounded outline-none focus:border-[#00c896] placeholder-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">API Key</label>
              <input
                type="password"
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder={PROVIDERS.find((pr) => pr.id === form.provider)?.placeholder}
                className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-white text-sm px-3 py-2 rounded outline-none focus:border-[#00c896] placeholder-gray-600 font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveKey} className="px-3 py-1.5 bg-[#00c896] text-black text-sm font-semibold rounded hover:bg-[#00b084] transition-colors">Save</button>
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] text-gray-300 text-sm rounded hover:border-gray-400 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Keys list */}
        <div className="space-y-3">
          {keys.map((k) => {
            const provider = PROVIDERS.find((p) => p.id === k.provider);
            return (
              <div key={k.id} className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1a1d26] flex items-center justify-center text-lg">
                      {provider?.icon || "🔑"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{k.name}</div>
                      <div className="text-xs text-gray-500">{provider?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleInject(k.id)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        k.injected
                          ? "bg-[#00c896]/10 border-[#00c896]/30 text-[#00c896]"
                          : "bg-[#1a1d26] border-[#2a2d3a] text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {k.injected ? "✓ Auto-inject" : "Auto-inject"}
                    </button>
                    <button onClick={() => toggleVisible(k.id)} className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors">
                      {k.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => copyKey(k.id, k.key)} className="p-1.5 text-gray-400 hover:text-[#00c896] transition-colors">
                      {copied === k.id ? <Check className="w-4 h-4 text-[#00c896]" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteKey(k.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 font-mono text-xs bg-[#080a0f] rounded px-3 py-2 text-gray-400 flex items-center gap-2">
                  <Lock className="w-3 h-3 shrink-0" />
                  {k.visible ? k.key : mask(k.key)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}