import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wand2, Loader2, Copy, Check, ChevronDown, ChevronRight, Zap, BookOpen, MessageSquare, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MODES = [
  { id: "performance", label: "Performance", icon: Zap, description: "Optimize algorithms, reduce complexity" },
  { id: "readability", label: "Readability", icon: BookOpen, description: "Cleaner structure, better naming" },
  { id: "comments",   label: "Add Comments", icon: MessageSquare, description: "Docstrings & inline explanations" },
  { id: "all",        label: "Full Review",  icon: Wand2, description: "Performance + readability + comments" },
];

function SuggestionCard({ suggestion, index }) {
  const [open, setOpen] = useState(index === 0);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(suggestion.refactored_code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityColor = { high: "text-red-400 border-red-500/30 bg-red-500/5", medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5", low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" };
  const sev = suggestion.severity || "low";

  return (
    <div className={`border rounded-lg overflow-hidden ${severityColor[sev]}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold">{suggestion.title}</span>
            <span className="text-xs opacity-60 uppercase tracking-wide">{sev}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{suggestion.description}</p>
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-500 mt-0.5" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-500 mt-0.5" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          {suggestion.explanation && (
            <div className="text-xs text-gray-300 leading-relaxed prose prose-xs prose-invert max-w-none">
              <ReactMarkdown>{suggestion.explanation}</ReactMarkdown>
            </div>
          )}
          {suggestion.refactored_code && (
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Suggested Code</span>
                <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#00c896] transition-colors">
                  {copied ? <Check className="w-3 h-3 text-[#00c896]" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="bg-[#080a0f] border border-[#1e2330] rounded p-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {suggestion.refactored_code}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RefactorPanel({ file }) {
  const [mode, setMode] = useState("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    const modeLabel = MODES.find((m) => m.id === mode)?.label || "Full Review";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Python code reviewer. Analyze the following Python code and provide specific refactoring suggestions focused on: ${modeLabel}.

For each suggestion, provide:
- A short title
- A severity: "high", "medium", or "low"
- A description (1-2 sentences)
- A detailed explanation (markdown OK)
- The specific refactored_code snippet (just the relevant snippet, not entire file)

Return a JSON with:
{
  "summary": "brief overall assessment",
  "score": <0-100 code quality score>,
  "suggestions": [
    { "title": "...", "severity": "high|medium|low", "description": "...", "explanation": "...", "refactored_code": "..." }
  ]
}

File: ${file.name}

\`\`\`python
${file.content}
\`\`\``,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            score: { type: "number" },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" },
                  explanation: { type: "string" },
                  refactored_code: { type: "string" },
                },
              },
            },
          },
        },
      });
      setResult(res);
    } catch (e) {
      setError("Analysis failed. Please try again.");
    }
    setLoading(false);
  };

  const scoreColor = !result ? "" : result.score >= 80 ? "text-emerald-400" : result.score >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0f14]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#1e2330] bg-[#0a0c11] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[#00c896]" />
          <span className="text-sm font-semibold text-white">AI Refactor</span>
          {file && <span className="text-xs text-gray-500 font-mono bg-[#1a1d26] px-2 py-0.5 rounded">{file.name}</span>}
        </div>
        <button
          onClick={analyze}
          disabled={loading || !file}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 text-black text-sm font-semibold rounded transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Mode selector */}
      <div className="px-5 py-3 border-b border-[#1e2330] flex gap-2 flex-wrap shrink-0">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              title={m.description}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${
                mode === m.id
                  ? "bg-[#00c896]/15 border-[#00c896]/50 text-[#00c896]"
                  : "bg-[#1a1d26] border-[#2a2d3a] text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-3 h-3" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-xs text-red-300">{error}</div>
        )}

        {/* Summary card */}
        {result && (
          <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 flex items-start gap-4">
            <div className="text-center shrink-0">
              <div className={`text-3xl font-bold ${scoreColor}`}>{result.score}</div>
              <div className="text-xs text-gray-500 mt-0.5">/ 100</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-300 mb-1">Assessment</div>
              <p className="text-xs text-gray-400 leading-relaxed">{result.summary}</p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {result?.suggestions?.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider">{result.suggestions.length} suggestion{result.suggestions.length !== 1 ? "s" : ""}</div>
            {result.suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-600">
            <Wand2 className="w-12 h-12 opacity-20" />
            <p className="text-sm">Select a mode and click <span className="text-[#00c896]">Analyze</span></p>
            <p className="text-xs text-gray-700">AI will review your active file and suggest improvements</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-[#00c896]" />
            <p className="text-sm">Analyzing your code...</p>
          </div>
        )}
      </div>
    </div>
  );
}