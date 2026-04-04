import { useState } from "react";
import { Play, CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, ChevronRight, FlaskConical, Loader2 } from "lucide-react";

function detectFramework(files) {
  for (const f of files) {
    if (f.content.includes("import unittest") || f.content.includes("from unittest")) return "unittest";
    if (f.content.includes("import pytest") || f.content.includes("@pytest") || f.content.includes("def test_")) return "pytest";
  }
  return null;
}

function detectTestFiles(files) {
  return files.filter((f) =>
    f.name.startsWith("test_") || f.name.endsWith("_test.py") || f.name === "tests.py"
  );
}

function buildTestRunner(file, framework) {
  if (framework === "unittest") {
    return `${file.content}

import unittest, json, sys, io, traceback

loader = unittest.TestLoader()
suite = loader.loadTestsFromModule(__import__('__main__'))
results = []
for test in suite:
    buf = io.StringIO()
    runner = unittest.TextTestRunner(stream=buf, verbosity=0)
    result = runner.run(test)
    name = str(test)
    if result.wasSuccessful():
        results.append({"name": name, "status": "pass", "message": ""})
    elif result.failures:
        results.append({"name": name, "status": "fail", "message": result.failures[0][1]})
    elif result.errors:
        results.append({"name": name, "status": "error", "message": result.errors[0][1]})
print("__AQ_TEST__:" + json.dumps(results))
`;
  }

  // For pytest-style (def test_*) — extract and run manually
  return `${file.content}

import json, traceback, inspect, sys

_results = []
_globs = {k: v for k, v in globals().items()}
for _name, _fn in list(_globs.items()):
    if _name.startswith("test_") and callable(_fn):
        try:
            _fn()
            _results.append({"name": _name, "status": "pass", "message": ""})
        except AssertionError as e:
            _results.append({"name": _name, "status": "fail", "message": str(e) or "Assertion failed"})
        except Exception as e:
            _results.append({"name": _name, "status": "error", "message": traceback.format_exc()})
print("__AQ_TEST__:" + json.dumps(_results))
`;
}

const STATUS_ICONS = {
  pass: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  fail: <XCircle className="w-4 h-4 text-red-400" />,
  error: <AlertCircle className="w-4 h-4 text-orange-400" />,
};

const STATUS_COLORS = {
  pass: "text-emerald-400",
  fail: "text-red-400",
  error: "text-orange-400",
};

function TestRow({ result }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#1e2330] rounded-lg overflow-hidden">
      <button
        onClick={() => result.message && setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#0e1018] hover:bg-[#1a1d26] transition-colors text-left"
      >
        {STATUS_ICONS[result.status]}
        <span className="flex-1 text-sm text-gray-200 font-mono">{result.name}</span>
        <span className={`text-xs font-semibold uppercase ${STATUS_COLORS[result.status]}`}>{result.status}</span>
        {result.message && (
          open ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>
      {open && result.message && (
        <div className="px-4 py-3 bg-[#080a0f] border-t border-[#1e2330]">
          <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">{result.message}</pre>
        </div>
      )}
    </div>
  );
}

export default function TestingPanel({ files }) {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [activeFileId, setActiveFileId] = useState(null);
  const [ran, setRan] = useState(false);

  const framework = detectFramework(files);
  const testFiles = detectTestFiles(files);

  const targetFileId = activeFileId || testFiles[0]?.id || files[0]?.id;
  const targetFile = files.find((f) => f.id === targetFileId);

  const runTests = async () => {
    if (!targetFile) return;
    setRunning(true); setError(""); setResults([]); setRan(false);
    const detectedFramework = framework || "pytest";
    const code = buildTestRunner(targetFile, detectedFramework);
    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "python", version: "3.10.0", files: [{ name: targetFile.name, content: code }] }),
      });
      const data = await res.json();
      const output = data.run?.output || "";
      const stderr = data.run?.stderr || "";
      const testLine = output.split("\n").find((l) => l.startsWith("__AQ_TEST__:"));
      if (testLine) {
        const parsed = JSON.parse(testLine.replace("__AQ_TEST__:", ""));
        setResults(parsed);
      } else {
        setError(stderr || output || "No test results found. Make sure your file has test functions (def test_*) or unittest.TestCase classes.");
      }
    } catch {
      setError("Failed to reach execution runtime.");
    }
    setRunning(false); setRan(true);
  };

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail" || r.status === "error").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0f14]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2330] bg-[#0a0c11]">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[#00c896]" />
          <span className="text-sm font-semibold text-white">Test Runner</span>
          {framework && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#00c896]/10 border border-[#00c896]/30 text-[#00c896]">
              {framework}
            </span>
          )}
          {!framework && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
              auto-detect
            </span>
          )}
        </div>
        <button
          onClick={runTests}
          disabled={running || !targetFile}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 text-black text-sm font-semibold rounded transition-colors"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {running ? "Running..." : "Run Tests"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File selector sidebar */}
        <div className="w-52 shrink-0 border-r border-[#1e2330] bg-[#0a0c11] overflow-y-auto">
          <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-[#1e2330]">Files</div>
          {files.map((f) => {
            const isTest = f.name.startsWith("test_") || f.name.endsWith("_test.py");
            return (
              <button
                key={f.id}
                onClick={() => setActiveFileId(f.id)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                  f.id === targetFileId ? "bg-[#00c896]/10 text-[#00c896]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1d26]"
                }`}
              >
                {isTest && <FlaskConical className="w-3 h-3 shrink-0" />}
                <span className="truncate font-mono">{f.name}</span>
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Summary bar */}
          {ran && results.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-[#0e1018] border border-[#1e2330] rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{passed}</span>
                <span className="text-sm text-gray-500">passed</span>
              </div>
              <div className="w-px h-8 bg-[#1e2330]" />
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{failed}</span>
                <span className="text-sm text-gray-500">failed</span>
              </div>
              <div className="w-px h-8 bg-[#1e2330]" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">{results.length} total</span>
              </div>
              {/* Progress bar */}
              <div className="flex-1 h-2 bg-[#1e2330] rounded-full overflow-hidden ml-2">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${results.length ? (passed / results.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <pre className="text-xs text-red-300 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* Test list */}
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r, i) => <TestRow key={i} result={r} />)}
            </div>
          )}

          {/* Empty state */}
          {!running && !ran && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-600">
              <FlaskConical className="w-12 h-12 opacity-30" />
              <p className="text-sm">Select a file and click <span className="text-[#00c896]">Run Tests</span></p>
              <p className="text-xs text-gray-700">Supports <code className="text-gray-500">unittest</code> and <code className="text-gray-500">pytest</code>-style test functions</p>
            </div>
          )}

          {ran && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-600">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm">No tests found in this file</p>
              <p className="text-xs text-gray-700">Add functions starting with <code className="text-gray-500">test_</code> or <code className="text-gray-500">unittest.TestCase</code> classes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}