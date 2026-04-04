import { useEffect, useRef } from "react";
import { Trash2, Terminal as TermIcon } from "lucide-react";

export default function Terminal({ output, onClear, isRunning }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const colorMap = {
    output: "text-gray-100",
    error: "text-red-400",
    info: "text-[#00c896]",
    command: "text-yellow-400",
  };

  return (
    <div className="h-44 shrink-0 bg-[#080a0f] border-t border-[#1e2330] flex flex-col">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#1e2330]">
        <div className="flex items-center gap-2">
          <TermIcon className="w-3.5 h-3.5 text-[#00c896]" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Terminal</span>
          {isRunning && (
            <span className="text-xs text-yellow-400 animate-pulse">● running</span>
          )}
        </div>
        <button
          onClick={onClear}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Clear"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
        {output.map((line, i) => (
          <div key={i} className={colorMap[line.type] || "text-gray-300"}>
            {line.type === "command" ? line.text : `${line.text}`}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}