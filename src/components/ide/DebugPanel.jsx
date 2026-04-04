import { useState } from "react";
import {
  Play, Square, SkipForward, ChevronRight, ChevronDown,
  Bug, Layers, AlignLeft, Circle, AlertCircle, Loader2
} from "lucide-react";

export default function DebugPanel({ session, onStart, onStop, onStep, onContinue, isDebugging, breakpoints, activeFile }) {
  const [expandedVars, setExpandedVars] = useState({});
  const [activeSection, setActiveSection] = useState("variables");

  const currentStep = session?.steps?.[session.currentIndex];
  const totalSteps = session?.steps?.length || 0;

  const toggleVar = (key) => setExpandedVars((p) => ({ ...p, [key]: !p[key] }));

  const typeColor = (val) => {
    if (val === "None") return "text-gray-400";
    if (val === "True" || val === "False") return "text-purple-400";
    if (!isNaN(Number(val))) return "text-[#b5cea8]";
    if (val.startsWith("'") || val.startsWith('"')) return "text-[#ce9178]";
    if (val.startsWith("[") || val.startsWith("{") || val.startsWith("(")) return "text-yellow-300";
    return "text-gray-200";
  };

  const sections = ["variables", "stack", "breakpoints"];

  return (
    <div className="h-full flex flex-col bg-[#0a0c11] text-xs font-mono">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#1e2330] bg-[#0e1018] shrink-0">
        <Bug className="w-3.5 h-3.5 text-[#00c896] mr-1" />
        <span className="text-gray-400 font-semibold mr-2 text-xs">DEBUGGER</span>

        {!isDebugging ? (
          <button
            onClick={onStart}
            disabled={!activeFile}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#00c896] hover:bg-[#00b084] disabled:opacity-40 text-black text-xs font-semibold rounded transition-colors"
          >
            <Bug className="w-3 h-3" />
            Start Debug
          </button>
        ) : (
          <>
            <button
              onClick={onContinue}
              disabled={session?.currentIndex >= totalSteps - 1}
              title="Continue (F5)"
              className="p-1.5 rounded hover:bg-[#1a1d26] text-[#00c896] disabled:opacity-30 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onStep("over")}
              disabled={session?.currentIndex >= totalSteps - 1}
              title="Step Over (F10)"
              className="p-1.5 rounded hover:bg-[#1a1d26] text-blue-400 disabled:opacity-30 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onStep("into")}
              disabled={session?.currentIndex >= totalSteps - 1}
              title="Step Into (F11)"
              className="p-1.5 rounded hover:bg-[#1a1d26] text-yellow-400 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStop}
              title="Stop"
              className="p-1.5 rounded hover:bg-[#1a1d26] text-red-400 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            <div className="ml-auto flex items-center gap-2 text-gray-500">
              <span>Step {(session?.currentIndex ?? 0) + 1} / {totalSteps}</span>
            </div>
          </>
        )}

        {session?.loading && (
          <div className="flex items-center gap-1.5 ml-2 text-yellow-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Tracing...</span>
          </div>
        )}
      </div>

      {/* Current line indicator */}
      {isDebugging && currentStep && (
        <div className="px-3 py-1.5 bg-[#264f78]/30 border-b border-[#264f78]/50 flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-300">
            Line {currentStep.line} — <span className="text-gray-400">{currentStep.func}()</span>
          </span>
        </div>
      )}

      {session?.error && (
        <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/30 flex items-start gap-2 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <span className="text-red-300 text-xs leading-relaxed">{session.error}</span>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex border-b border-[#1e2330] shrink-0">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 py-1.5 text-xs capitalize transition-colors border-b-2 ${
              activeSection === s
                ? "border-[#00c896] text-[#00c896]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {s === "breakpoints" ? `BP (${breakpoints.size})` : s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Variables */}
        {activeSection === "variables" && (
          <div className="p-2 space-y-0.5">
            {!isDebugging && (
              <div className="text-gray-600 text-center py-8">Start debugger to inspect variables</div>
            )}
            {isDebugging && !currentStep && (
              <div className="text-gray-600 text-center py-8">No variables yet — step through code</div>
            )}
            {currentStep && Object.entries(currentStep.locals || {}).map(([key, val]) => (
              <div key={key} className="rounded hover:bg-[#1a1d26] transition-colors">
                <div
                  className="flex items-center gap-2 px-2 py-1 cursor-pointer"
                  onClick={() => toggleVar(key)}
                >
                  {(val.startsWith("[") || val.startsWith("{")) ? (
                    expandedVars[key]
                      ? <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                      : <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />
                  ) : (
                    <div className="w-3 h-3 shrink-0" />
                  )}
                  <span className="text-[#9cdcfe] shrink-0">{key}</span>
                  <span className="text-gray-600">=</span>
                  <span className={`truncate ${typeColor(val)}`}>{val}</span>
                </div>
                {expandedVars[key] && (val.startsWith("[") || val.startsWith("{")) && (
                  <div className="ml-8 px-2 py-1 text-gray-400 whitespace-pre-wrap break-all bg-[#0d0f14] rounded mb-1">
                    {val}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Call Stack */}
        {activeSection === "stack" && (
          <div className="p-2 space-y-0.5">
            {!isDebugging && (
              <div className="text-gray-600 text-center py-8">Start debugger to see call stack</div>
            )}
            {isDebugging && session?.steps?.slice(0, (session.currentIndex ?? 0) + 1).filter((s, i, arr) =>
              i === arr.length - 1 || s.func !== arr[i + 1]?.func
            ).reverse().map((step, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded ${i === 0 ? "bg-[#264f78]/20 border border-[#264f78]/40" : "hover:bg-[#1a1d26]"}`}>
                <Layers className="w-3 h-3 text-gray-500 shrink-0" />
                <span className={i === 0 ? "text-yellow-300" : "text-gray-400"}>{step.func}()</span>
                <span className="text-gray-600 ml-auto">line {step.line}</span>
              </div>
            ))}
          </div>
        )}

        {/* Breakpoints */}
        {activeSection === "breakpoints" && (
          <div className="p-2 space-y-0.5">
            {breakpoints.size === 0 && (
              <div className="text-gray-600 text-center py-8">
                <div>No breakpoints set</div>
                <div className="text-gray-700 mt-1">Click line numbers in the editor</div>
              </div>
            )}
            {[...breakpoints].sort((a, b) => a - b).map((line) => (
              <div key={line} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a1d26]">
                <Circle className="w-3 h-3 text-red-400 fill-red-400 shrink-0" />
                <span className="text-gray-300">{activeFile?.name}</span>
                <span className="text-gray-500 ml-auto">line {line}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step slider */}
      {isDebugging && totalSteps > 0 && (
        <div className="px-3 py-2 border-t border-[#1e2330] shrink-0">
          <input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={session?.currentIndex ?? 0}
            onChange={(e) => onStep("goto", Number(e.target.value))}
            className="w-full accent-[#00c896]"
          />
          <div className="flex justify-between text-gray-600 text-xs mt-0.5">
            <span>Start</span>
            <span>End</span>
          </div>
        </div>
      )}
    </div>
  );
}