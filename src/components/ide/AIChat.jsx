import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import ModelSelector, { MODELS } from "./ModelSelector";

async function callOllama(modelName, prompt) {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: modelName, prompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response;
}

async function checkOllama() {
  try {
    const res = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(2000) });
    return res.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}

async function getApiKey(provider) {
  // Try to read from localStorage (set via API Vault or settings)
  return localStorage.getItem(`aq_apikey_${provider}`) || null;
}

async function callOpenAI(modelName, messages, apiKey) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modelName, messages }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(modelName, messages, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 1024,
      messages: messages.filter((m) => m.role !== "system"),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
  const data = await res.json();
  return data.content[0].text;
}

async function callGoogle(modelName, prompt, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Google AI error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

export default function AIChat({ activeFile }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your **Aegis Quantum AI Assistant**. Select a model below and ask me anything about your code!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("builtin/aq");
  const [ollamaStatus, setOllamaStatus] = useState("unknown");
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    checkOllama().then(setOllamaStatus);
    const interval = setInterval(() => checkOllama().then(setOllamaStatus), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const context = activeFile
      ? `You are an expert Python developer and coding assistant for Aegis Quantum IDE. The user is working on "${activeFile.name}":\n\`\`\`python\n${activeFile.content}\n\`\`\`\n\n`
      : "You are an expert Python developer and coding assistant for Aegis Quantum IDE.\n\n";

    const fullPrompt = context + `User: ${text}`;
    const model = MODELS.find((m) => m.id === selectedModel);
    const chatHistory = messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    let response = "";
    try {
      if (model.provider === "builtin") {
        response = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });
      } else if (model.provider === "ollama") {
        const ollamaModel = selectedModel.replace("ollama/", "");
        response = await callOllama(ollamaModel, fullPrompt);
      } else if (model.provider === "openai") {
        const apiKey = await getApiKey("openai");
        if (!apiKey) throw new Error("OpenAI API key not found. Add it in API Vault → save as 'openai'.");
        const oaiModel = selectedModel.replace("openai/", "");
        const msgs = [{ role: "system", content: context }, ...chatHistory, { role: "user", content: text }];
        response = await callOpenAI(oaiModel, msgs, apiKey);
      } else if (model.provider === "anthropic") {
        const apiKey = await getApiKey("anthropic");
        if (!apiKey) throw new Error("Anthropic API key not found. Add it in API Vault → save as 'anthropic'.");
        const msgs = [{ role: "system", content: context }, ...chatHistory, { role: "user", content: text }];
        response = await callAnthropic(selectedModel.replace("anthropic/", ""), msgs, apiKey);
      } else if (model.provider === "google") {
        const apiKey = await getApiKey("google");
        if (!apiKey) throw new Error("Google AI API key not found. Add it in API Vault → save as 'google'.");
        response = await callGoogle(selectedModel.replace("google/", ""), fullPrompt, apiKey);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setMessages((prev) => [...prev, { role: "assistant", content: response, model: model.name }]);
    setLoading(false);
  };

  const model = MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="w-80 shrink-0 bg-[#0a0c11] border-l border-[#1e2330] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1e2330]">
        <div className="w-6 h-6 rounded-full bg-[#00c896]/20 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-[#00c896]" />
        </div>
        <span className="text-sm font-semibold text-gray-200">AQ Assistant</span>
        <div className="ml-auto flex items-center gap-1.5">
          {model?.local && (
            <div className={`w-2 h-2 rounded-full ${ollamaStatus === "online" ? "bg-[#00c896]" : "bg-red-400"}`} title={`Ollama ${ollamaStatus}`} />
          )}
          <div className="w-2 h-2 rounded-full bg-[#00c896]"></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-[#00c896]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-[#00c896]" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-[#1a2a3a] text-gray-100 border border-[#00c896]/30"
                : "bg-[#1a1d26] text-gray-200 border border-[#2a2d3a]"
            }`}>
              {msg.model && (
                <div className="text-gray-600 text-xs mb-1">via {msg.model}</div>
              )}
              <ReactMarkdown
                components={{
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-[#0d0f14] text-[#4ec9b0] px-1 rounded">{children}</code>
                    ) : (
                      <pre className="bg-[#0d0f14] text-[#4ec9b0] p-2 rounded mt-1 overflow-x-auto text-xs">
                        <code>{children}</code>
                      </pre>
                    ),
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#00c896]/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-[#00c896]" />
            </div>
            <div className="bg-[#1a1d26] border border-[#2a2d3a] rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00c896]" />
              <span className="text-xs text-gray-500">{model?.name}...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2 items-start bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <span className="text-xs text-red-300">{error}</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-[#1e2330] space-y-2">
        <ModelSelector value={selectedModel} onChange={setSelectedModel} ollamaStatus={ollamaStatus} />
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Ask ${model?.name || "AI"}...`}
            className="flex-1 bg-[#1a1d26] border border-[#2a2d3a] text-gray-100 text-xs px-3 py-2 rounded outline-none focus:border-[#00c896] transition-colors placeholder-gray-600"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-2 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 disabled:cursor-not-allowed text-black rounded transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}