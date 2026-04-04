import { useEffect, useRef, useState } from "react";
import { Trash2, Terminal as TermIcon, Settings2 } from "lucide-react";
import TerminalThemePanel, { TERMINAL_THEMES } from "./TerminalThemePanel";

const DEFAULT_SETTINGS = { theme: "Aegis Dark", font: "'Fira Code', monospace", fontSize: 12, opacity: 1, height: 176 };

export default function Terminal({ output, onClear, isRunning }) {
  const endRef = useRef(null);
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aq_term_settings")) || DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; }
  });
  const [showPanel, setShowPanel] = useState(false);

  const saveSettings = (s) => { setSettings(s); localStorage.setItem("aq_term_settings", JSON.stringify(s)); };
  const theme = TERMINAL_THEMES[settings.theme] || TERMINAL_THEMES["Aegis Dark"];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const colorMap = {
    output: theme.text,
    error: theme.error,
    info: theme.info,
    command: theme.warn,
  };

  return (
    <div
      className="shrink-0 border-t flex flex-col relative"
      style={{
        height: settings.height,
        backgroundColor: theme.bg,
        borderColor: theme.border,
        opacity: settings.opacity,
      }}
    >
      <div className="flex items-center justify-between px-4 py-1.5 border-b" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2">
          <TermIcon className="w-3.5 h-3.5" style={{ color: theme.accent }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>Terminal</span>
          {isRunning && (
            <span className="text-xs animate-pulse" style={{ color: theme.warn }}>● running</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowPanel((v) => !v)}
              title="Terminal Settings"
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
            {showPanel && (
              <TerminalThemePanel
                settings={settings}
                onChange={saveSettings}
                onClose={() => setShowPanel(false)}
              />
            )}
          </div>
          <button onClick={onClear} className="text-gray-500 hover:text-gray-300 transition-colors" title="Clear">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto p-3 space-y-0.5"
        style={{ fontFamily: settings.font, fontSize: settings.fontSize }}
      >
        {output.map((line, i) => (
          <div key={i} style={{ color: colorMap[line.type] || theme.text }}>
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}