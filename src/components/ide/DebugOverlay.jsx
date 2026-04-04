import { useState } from "react";
import { Play, StepForward, ArrowDownToLine, Square, ChevronDown, ChevronRight, Bug } from "lucide-react";

// Shows inline variable values as ghost text next to the paused line
function InlineVarHints({ session }) {
  if (!session || !session.steps || session.steps.length === 0) return null;
  const step = session.steps[session.currentIndex];
  if (!step || !step.locals || Object.keys(step.locals).length === 0) return null;

  const pairs = Object.entries(step.locals).slice(0, 5);
  const lineH = 24; // must match CodeEditor leading-6
  const top = (step.line - 1) * lineH + 4;

  return (
    <div
      className="absolute right-2 z-20 pointer-events-none"
      style={{ top }}
    >
      <div className="flex items-center gap-2 h-5">
        {pairs.map(([k, v]) => (
          <span key={k} className="text-[10px] font-mono bg-[#264f78]/60 text-yellow-300 px-1.5 rounded border border-[#264f78]">
            {k} = {String(v).slice(0, 20)}
          </span>
        ))}
      </div>
    </div>
  );
}

// Floating step toolbar at top of editor
function StepToolbar({ session, isDebugging, onStop, onStep, onContinue, onStart }) {
  if (!isDebugging && !session) {
    return (
      <button
        onClick={onStart}
        className="absolute top-2 right-2 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1d26]/90 border border-[#2a2d3a] hover:border-[#00c896]/50 text-[#00c896] text-xs rounded-lg backdrop-blur-sm transition-colors shadow-lg"
      >
        <Bug className="w-3.5 h-3.5" /> Debug
      </button>
    );
  }

  const step = session?.steps?.[session.currentIndex];
  const total = session?.steps?.length || 0;
  const current = (session?.currentIndex ?? 0) + 1;
  const loading = session?.loading;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#0a0c11]/95 border border-[#2a2d3a] rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-sm">
      {/* Step indicator */}
      <span className="text-[10px] text-gray-500 font-mono mr-1">
        {loading ? "analyzing..." : total > 0 ? `${current}/${total}` : "ready"}
      </span>
      {step && (
        <span className="text-[10px] text-yellow-400 font-mono bg-yellow-400/10 px-1.5 rounded mr-1">
          L{step.line} · {step.func}()
        </span>
      )}

      <div className="w-px h-4 bg-[#2a2d3a] mx-1" />

      {/* Controls */}
      <button
        onClick={() => onStep("into")}
        disabled={loading || total === 0}
        title="Step Into"
        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:bg-blue-400/10 rounded disabled:opacity-30 transition-colors"
      >
        <ArrowDownToLine className="w-3.5 h-3.5" /> Into
      </button>
      <button
        onClick={() => onStep("over")}
        disabled={loading || total === 0}
        title="Step Over"
        className="flex items-center gap-1 px-2 py-1 text-xs text-[#00c896] hover:bg-[#00c896]/10 rounded disabled:opacity-30 transition-colors"
      >
        <StepForward className="w-3.5 h-3.5" /> Over
      </button>
      <button
        onClick={onContinue}
        disabled={loading || total === 0}
        title="Continue"
        className="flex items-center gap-1 px-2 py-1 text-xs text-green-400 hover:bg-green-400/10 rounded disabled:opacity-30 transition-colors"
      >
        <Play className="w-3.5 h-3.5" /> Continue
      </button>

      <div className="w-px h-4 bg-[#2a2d3a] mx-1" />

      <button
        onClick={onStop}
        title="Stop"
        className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:bg-red-400/10 rounded transition-colors"
      >
        <Square className="w-3.5 h-3.5" /> Stop
      </button>
    </div>
  );
}

// Variable sidebar panel
function VariableSidebar({ session }) {
  const [expanded, setExpanded] = useState(true);
  if (!session || !session.steps || session.steps.length === 0) return null;
  const step = session.steps[session.currentIndex];
  if (!step) return null;

  const locals = step.locals || {};
  const entries = Object.entries(locals);

  return (
    <div className="absolute right-0 top-12 bottom-0 w-56 z-20 bg-[#0a0c11]/95 border-l border-[#1e2330] flex flex-col backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 border-b border-[#1e2330] text-xs text-gray-400 hover:text-gray-200 transition-colors w-full"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Bug className="w-3 h-3 text-[#00c896]" />
        <span className="font-semibold uppercase tracking-wider text-[10px]">Local Variables</span>
        <span className="ml-auto text-[10px] text-gray-600">{entries.length}</span>
      </button>

      {expanded && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {entries.length === 0 && (
            <div className="text-[10px] text-gray-600 italic px-1 py-2">No locals at this step</div>
          )}
          {entries.map(([key, val]) => {
            const isNum = /^-?\d/.test(val);
            const isStr = val.startsWith("'") || val.startsWith('"');
            const isBool = val === "True" || val === "False";
            const color = isNum ? "#b5cea8" : isStr ? "#ce9178" : isBool ? "#569cd6" : "#9cdcfe";
            return (
              <div key={key} className="flex items-start gap-1.5 px-2 py-1 rounded hover:bg-[#1a1d26] group">
                <span className="text-[10px] font-mono text-[#9cdcfe] shrink-0 min-w-[60px] truncate">{key}</span>
                <span className="text-[10px] text-gray-600 shrink-0">=</span>
                <span className="text-[10px] font-mono break-all" style={{ color }}>{val}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Call stack mini */}
      <div className="border-t border-[#1e2330] p-2 shrink-0">
        <div className="text-[9px] uppercase text-gray-600 tracking-wider mb-1">Call Stack</div>
        {(session.steps || []).slice(0, session.currentIndex + 1).reverse().slice(0, 4).map((s, i) => (
          <div key={i} className={`text-[10px] font-mono px-1 py-0.5 rounded truncate ${i === 0 ? "text-yellow-400 bg-yellow-400/10" : "text-gray-600"}`}>
            {s.func}() <span className="text-gray-700">L{s.line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DebugOverlay({ session, isDebugging, onStart, onStop, onStep, onContinue }) {
  const showSidebar = isDebugging && session && !session.loading && session.steps.length > 0;

  return (
    <>
      <StepToolbar
        session={session}
        isDebugging={isDebugging}
        onStop={onStop}
        onStep={onStep}
        onContinue={onContinue}
        onStart={onStart}
      />
      {showSidebar && <InlineVarHints session={session} />}
      {showSidebar && <VariableSidebar session={session} />}
    </>
  );
}