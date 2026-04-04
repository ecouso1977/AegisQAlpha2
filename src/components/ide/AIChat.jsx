import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

export default function AIChat({ activeFile }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your **Aegis Quantum AI Assistant**. I can help you write, debug, and explain Python code. Share your file or ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const context = activeFile
      ? `The user is working on a Python file called "${activeFile.name}". Here is the current code:\n\`\`\`python\n${activeFile.content}\n\`\`\`\n\n`
      : "";

    const prompt = `You are an expert Python developer and coding assistant for Aegis Quantum IDE. Be concise and helpful.\n\n${context}User question: ${text}`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  return (
    <div className="w-80 shrink-0 bg-[#0a0c11] border-l border-[#1e2330] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1e2330]">
        <div className="w-6 h-6 rounded-full bg-[#00c896]/20 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-[#00c896]" />
        </div>
        <span className="text-sm font-semibold text-gray-200">AQ Assistant</span>
        <div className="ml-auto w-2 h-2 rounded-full bg-[#00c896]"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-[#00c896]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-[#00c896]" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#1a2a3a] text-gray-100 border border-[#00c896]/30"
                  : "bg-[#1a1d26] text-gray-200 border border-[#2a2d3a]"
              }`}
            >
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
            <div className="bg-[#1a1d26] border border-[#2a2d3a] rounded-lg px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00c896]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-[#1e2330]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about your code..."
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