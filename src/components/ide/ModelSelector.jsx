import { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu, Wifi, WifiOff, Circle } from "lucide-react";

export const MODELS = [
  // Ollama (local)
  { id: "ollama/llama3", name: "Llama 3", provider: "ollama", family: "Meta", desc: "8B — fast general purpose", requiresKey: false, local: true },
  { id: "ollama/llama3.1", name: "Llama 3.1", provider: "ollama", family: "Meta", desc: "8B — improved reasoning", requiresKey: false, local: true },
  { id: "ollama/codellama", name: "CodeLlama", provider: "ollama", family: "Meta", desc: "Code-specialized model", requiresKey: false, local: true },
  { id: "ollama/mistral", name: "Mistral 7B", provider: "ollama", family: "Mistral AI", desc: "Fast & efficient", requiresKey: false, local: true },
  { id: "ollama/phi3", name: "Phi-3 Mini", provider: "ollama", family: "Microsoft", desc: "Small but capable", requiresKey: false, local: true },
  { id: "ollama/deepseek-coder", name: "DeepSeek Coder", provider: "ollama", family: "DeepSeek", desc: "Code-focused LLM", requiresKey: false, local: true },
  { id: "ollama/qwen2", name: "Qwen 2", provider: "ollama", family: "Alibaba", desc: "Multilingual model", requiresKey: false, local: true },
  { id: "ollama/gemma2", name: "Gemma 2", provider: "ollama", family: "Google", desc: "Open model from Google", requiresKey: false, local: true },
  // Built-in (always works)
  { id: "builtin/aq", name: "AQ Assistant", provider: "builtin", family: "Aegis Quantum", desc: "Built-in AI — always available", requiresKey: false, local: false },
  // OpenAI
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "openai", family: "OpenAI", desc: "Most capable", requiresKey: true, local: false },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", family: "OpenAI", desc: "Fast & cheap", requiresKey: true, local: false },
  // Anthropic
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", family: "Anthropic", desc: "Best for coding", requiresKey: true, local: false },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic", family: "Anthropic", desc: "Fast & affordable", requiresKey: true, local: false },
  // Google
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "google", family: "Google", desc: "Multimodal, fast", requiresKey: true, local: false },
];

const PROVIDER_COLORS = {
  ollama: "#00c896",
  builtin: "#a78bfa",
  openai: "#74aa9c",
  anthropic: "#d4956a",
  google: "#4285f4",
};

const PROVIDER_ICONS = {
  ollama: "🦙",
  builtin: "⚡",
  openai: "🤖",
  anthropic: "🔮",
  google: "🔵",
};

const GROUPS = [
  { label: "🦙 Ollama (Local — Free)", provider: "ollama" },
  { label: "⚡ Built-in", provider: "builtin" },
  { label: "🤖 OpenAI", provider: "openai" },
  { label: "🔮 Anthropic", provider: "anthropic" },
  { label: "🔵 Google", provider: "google" },
];

export default function ModelSelector({ value, onChange, ollamaStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = MODELS.find((m) => m.id === value) || MODELS[8]; // default to builtin

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 bg-[#1a1d26] border border-[#2a2d3a] hover:border-[#00c896]/50 rounded text-xs transition-colors max-w-[160px]"
      >
        <span>{PROVIDER_ICONS[current.provider]}</span>
        <span className="text-gray-200 truncate">{current.name}</span>
        {current.local && (
          <span title={ollamaStatus === "online" ? "Ollama running" : "Ollama offline"}>
            {ollamaStatus === "online"
              ? <Wifi style={{ width: 10, height: 10, color: "#00c896" }} />
              : <WifiOff style={{ width: 10, height: 10, color: "#ef4444" }} />
            }
          </span>
        )}
        <ChevronDown style={{ width: 10, height: 10, color: "#6b7280" }} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 left-0 w-72 bg-[#1a1d26] border border-[#2a2d3a] rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-[#2a2d3a]">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Model</div>
            <div className="flex items-center gap-1.5 mt-1">
              <Circle style={{ width: 8, height: 8, color: ollamaStatus === "online" ? "#00c896" : "#ef4444", fill: ollamaStatus === "online" ? "#00c896" : "#ef4444" }} />
              <span className="text-xs text-gray-500">
                Ollama: {ollamaStatus === "online" ? "Running (localhost:11434)" : "Not detected — install Ollama to use local models"}
              </span>
            </div>
          </div>
          <div className="overflow-y-auto max-h-72">
            {GROUPS.map((group) => {
              const groupModels = MODELS.filter((m) => m.provider === group.provider);
              return (
                <div key={group.provider}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-[#15181f] sticky top-0">
                    {group.label}
                  </div>
                  {groupModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { onChange(model.id); setOpen(false); }}
                      disabled={model.local && ollamaStatus !== "online"}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        value === model.id
                          ? "bg-[#00c896]/10 text-[#00c896]"
                          : "hover:bg-[#2a2d3a] text-gray-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">{model.name}</span>
                          {model.requiresKey && (
                            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-1 rounded border border-yellow-500/20">key</span>
                          )}
                          {model.local && ollamaStatus === "online" && (
                            <span className="text-xs text-[#00c896] bg-[#00c896]/10 px-1 rounded">local</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{model.desc}</div>
                      </div>
                      {value === model.id && <div className="w-1.5 h-1.5 rounded-full bg-[#00c896]" />}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}