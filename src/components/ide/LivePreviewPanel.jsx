import { useState, useRef, useEffect } from "react";
import { Play, RefreshCw, Loader2, BarChart2, Globe, Table2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#00c896", "#4ec9b0", "#569cd6", "#ce9178", "#dcdcaa", "#c586c0", "#f87171", "#facc15"];

function DataTable({ data }) {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  return (
    <div className="overflow-auto rounded-lg border border-[#1e2330]">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#1a1d26]">
            {keys.map((k) => <th key={k} className="px-3 py-2 text-left text-gray-400 font-medium border-b border-[#1e2330]">{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-[#0d0f14]" : "bg-[#0a0c11]"}>
              {keys.map((k) => <td key={k} className="px-3 py-1.5 text-gray-300 border-b border-[#1e2330]/50">{String(row[k])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartView({ chartData, chartType }) {
  if (!chartData || chartData.length === 0) return null;
  const keys = Object.keys(chartData[0]).filter((k) => k !== "name" && k !== "label");

  if (chartType === "bar") return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
        <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#1a1d26", border: "1px solid #2a2d3a", borderRadius: 6, color: "#e5e7eb" }} />
        <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
        {keys.map((k, i) => <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );

  if (chartType === "line") return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" />
        <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#1a1d26", border: "1px solid #2a2d3a", borderRadius: 6, color: "#e5e7eb" }} />
        <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
        {keys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );

  if (chartType === "pie") return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={chartData} dataKey={keys[0] || "value"} nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: "#1a1d26", border: "1px solid #2a2d3a", borderRadius: 6, color: "#e5e7eb" }} />
      </PieChart>
    </ResponsiveContainer>
  );

  return null;
}

export default function LivePreviewPanel({ file }) {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState("auto"); // auto | bar | line | pie | table | html

  const runAndAnalyze = async () => {
    if (!file) return;
    setLoading(true); setError(""); setOutput(null);

    // Run code via Piston
    let rawOutput = "";
    let rawError = "";
    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "python", version: "3.10.0", files: [{ name: file.name, content: file.content }] }),
      });
      const data = await res.json();
      rawOutput = data.run?.output || "";
      rawError = data.run?.stderr || "";
    } catch (e) {
      setError("Failed to reach execution runtime.");
      setLoading(false);
      return;
    }

    if (rawError && !rawOutput) {
      setError(rawError);
      setLoading(false);
      return;
    }

    // Use AI to parse the output into structured visual data
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a data visualization assistant. Given this Python code and its output, return a JSON object describing how to visualize it.

Python code:
\`\`\`python
${file.content}
\`\`\`

Output:
${rawOutput}

Return ONLY valid JSON (no markdown) with this schema:
{
  "type": "bar" | "line" | "pie" | "table" | "html" | "text",
  "title": string,
  "description": string,
  "chartData": [ { "name": string, ...numericFields } ] | null,
  "tableData": [ { ...fields } ] | null,
  "html": string | null,
  "summary": string
}

Rules:
- If output has numbers/stats → use "bar" chart
- If output has sequences/time series → use "line" chart
- If output has categorical proportions → use "pie"
- If output is tabular → use "table"
- If code produces HTML/CSS → use "html"
- Otherwise → "text"
- chartData must have a "name" field and numeric value fields
- Keep it concise and focused on the actual data`,
        response_json_schema: {
          type: "object",
          properties: {
            type: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            chartData: { type: "array", items: { type: "object" } },
            tableData: { type: "array", items: { type: "object" } },
            html: { type: "string" },
            summary: { type: "string" },
          },
        },
      });
      setOutput({ ...result, rawOutput });
      if (result.type && previewMode === "auto") setPreviewMode(result.type);
    } catch (e) {
      setOutput({ type: "text", rawOutput, summary: rawOutput });
    }
    setLoading(false);
  };

  const activeType = previewMode === "auto" ? output?.type : previewMode;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d0f14]">
      {/* Left: Code */}
      <div className="w-2/5 shrink-0 border-r border-[#1e2330] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2330] bg-[#0a0c11]">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {file?.name || "No file selected"}
          </span>
          <button
            onClick={runAndAnalyze}
            disabled={!file || loading}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 text-black text-xs font-semibold rounded transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {loading ? "Analyzing..." : "Run & Preview"}
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-gray-300 leading-6 whitespace-pre bg-[#0d0f14]">
          {file?.content || <span className="text-gray-600">Select a file to preview</span>}
        </div>
      </div>

      {/* Right: Visual Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1e2330] bg-[#0a0c11]">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">Preview</span>
          {["auto", "bar", "line", "pie", "table", "html"].map((m) => (
            <button
              key={m}
              onClick={() => setPreviewMode(m)}
              className={`px-2.5 py-1 rounded text-xs transition-colors capitalize ${previewMode === m ? "bg-[#00c896]/20 text-[#00c896] border border-[#00c896]/30" : "text-gray-500 hover:text-gray-300 border border-transparent"}`}
            >
              {m}
            </button>
          ))}
          {output && (
            <button onClick={runAndAnalyze} className="ml-auto text-gray-500 hover:text-gray-300 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!output && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
              <BarChart2 className="w-12 h-12 opacity-30" />
              <p className="text-sm">Click <span className="text-[#00c896]">Run & Preview</span> to visualize your code output</p>
              <p className="text-xs text-gray-700">Supports charts, tables, HTML, and more</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#00c896]" />
              <p className="text-sm">Running code & generating preview...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <pre className="text-xs text-red-300 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {output && !loading && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-lg font-semibold text-white">{output.title || file?.name}</h2>
                {output.description && <p className="text-sm text-gray-500 mt-1">{output.description}</p>}
              </div>

              {/* Chart */}
              {(activeType === "bar" || activeType === "line" || activeType === "pie") && output.chartData?.length > 0 && (
                <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4">
                  <ChartView chartData={output.chartData} chartType={activeType} />
                </div>
              )}

              {/* Table */}
              {activeType === "table" && output.tableData?.length > 0 && (
                <DataTable data={output.tableData} />
              )}

              {/* HTML */}
              {activeType === "html" && output.html && (
                <div className="bg-white rounded-lg overflow-hidden border border-[#1e2330]">
                  <iframe
                    srcDoc={output.html}
                    className="w-full h-80"
                    sandbox="allow-scripts"
                    title="HTML Preview"
                  />
                </div>
              )}

              {/* Summary / raw */}
              {output.summary && (
                <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">AI Summary</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{output.summary}</p>
                </div>
              )}

              {/* Raw output */}
              {output.rawOutput && (
                <div className="bg-[#080a0f] border border-[#1e2330] rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Raw Output</div>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">{output.rawOutput}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}