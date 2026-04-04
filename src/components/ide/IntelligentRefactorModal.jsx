import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Check, ChevronDown, ChevronUp, Zap, ShieldCheck, BookOpen } from "lucide-react";

const CATEGORY_ICONS = {
  performance: Zap,
  security: ShieldCheck,
  readability: BookOpen,
};

const CATEGORY_COLORS = {
  performance: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  security: "text-red-400 bg-red-400/10 border-red-400/30",
  readability: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

function DiffView({ original, improved }) {
  const origLines = original.split("\n");
  const impLines = improved.split("\n");
  const maxLen = Math.max(origLines.length, impLines.length);
  return (
    <div className="grid grid-cols-2 gap-0 text-xs font-mono overflow-auto max-h-60 border border-[#2a2d3a] rounded">
      <div className="bg-[#1a0a0a] border-r border-[#2a2d3a] p-2 overflow-auto">
        <div className="text-red-400 text-[10px] mb-1 font-sans font-semibold uppercase tracking-wider">Before</div>
        {origLines.map((line, i) => (
          <div key={i} className={`leading-5 whitespace-pre ${impLines[i] !== line ? "text-red-300 bg-red-500/10" : "text-gray-500"}`}>
            {line || " "}
          </div>
        ))}
      </div>
      <div className="bg-[#0a1a0e] p-2 overflow-auto">
        <div className="text-[#00c896] text-[10px] mb-1 font-sans font-semibold uppercase tracking-wider">After</div>
        {impLines.map((line, i) => (
          <div key={i} className={`leading-5 whitespace-pre ${origLines[i] !== line ? "text-green-300 bg-green-500/10" : "text-gray-500"}`}>
            {line || " "}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IntelligentRefactorModal({ file, onApply, onClose }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [applied, setApplied] = useState(new Set());

  const analyze = async () => {
    setLoading(true);
    setSuggestions(null);
    setApplied(new Set());
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert code reviewer. Analyze the following Python code and return a JSON list of improvement suggestions.

Each suggestion must have:
- "category": one of "performance", "security", "readability"
- "title": short description (max 8 words)
- "description": explanation of the issue and why the change helps (2-3 sentences)
- "original": the exact snippet from the code that should change (2-10 lines)
- "improved": the improved replacement snippet (same approximate length)

Return 3-6 suggestions. Only real issues, no invented ones.

Code:
\`\`\`python
${file.content}
\`\`\``,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                original: { type: "string" },
                improved: { type: "string" },
              },
            },
          },
        },
      },
    });
    setSuggestions(result?.suggestions || []);
    setLoading(false);
  };

  const applySuggestion = (idx, suggestion) => {
    const newContent = file.content.replace(suggestion.original, suggestion.improved);
    onApply(newContent);
    setApplied((prev) => new Set([...prev, idx]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[#0e1018] border border-[#2a2d3a] rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2330] shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00c896]" />
            <span className="text-sm font-semibold text-white">Intelligent Refactor</span>
            <span className="text-xs text-gray-500 bg-[#1a1d26] px-2 py-0.5 rounded border border-[#2a2d3a]">
              {file?.name}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!suggestions && !loading && (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-gray-300 font-medium mb-1">AI-Powered Code Analysis</p>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Analyzes your code for performance optimizations, security vulnerabilities, and readability improvements.
              </p>
              <button
                onClick={analyze}
                className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b084] text-black text-sm font-semibold rounded-lg transition-colors"
              >
                Analyze Code
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-[#00c896] animate-spin" />
              <span className="text-sm text-gray-400">Analyzing code with AI...</span>
            </div>
          )}

          {suggestions && suggestions.length === 0 && (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-300 font-medium">Your code looks great!</p>
              <p className="text-sm text-gray-500 mt-1">No significant improvements found.</p>
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-1">{suggestions.length} suggestions found. Click to expand and apply.</p>
              {suggestions.map((s, i) => {
                const Icon = CATEGORY_ICONS[s.category] || Zap;
                const colorCls = CATEGORY_COLORS[s.category] || "text-gray-400 bg-gray-400/10 border-gray-400/30";
                const isApplied = applied.has(i);
                const isOpen = expanded === i;
                return (
                  <div key={i} className={`border rounded-lg overflow-hidden transition-all ${isApplied ? "border-[#00c896]/40 opacity-60" : "border-[#2a2d3a]"}`}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#1a1d26] transition-colors"
                    >
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${colorCls} shrink-0`}>
                        <Icon className="w-3 h-3" />
                        {s.category}
                      </span>
                      <span className="flex-1 text-sm text-gray-200">{s.title}</span>
                      {isApplied && <Check className="w-4 h-4 text-[#00c896] shrink-0" />}
                      {!isApplied && (isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />)}
                    </button>
                    {isOpen && !isApplied && (
                      <div className="px-4 pb-4 border-t border-[#1e2330] bg-[#0a0c11]">
                        <p className="text-xs text-gray-400 my-3">{s.description}</p>
                        <DiffView original={s.original} improved={s.improved} />
                        <button
                          onClick={() => applySuggestion(i, s)}
                          className="mt-3 flex items-center gap-1.5 px-4 py-1.5 bg-[#00c896] hover:bg-[#00b084] text-black text-xs font-semibold rounded transition-colors"
                        >
                          <Check className="w-3 h-3" /> Apply Change
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestions && (
          <div className="px-5 py-3 border-t border-[#1e2330] flex items-center justify-between shrink-0">
            <span className="text-xs text-gray-600">{applied.size} of {suggestions.length} applied</span>
            <button
              onClick={analyze}
              className="text-xs text-[#00c896] hover:text-[#00b084] transition-colors"
            >
              Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}