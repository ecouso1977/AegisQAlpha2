import { X, Palette, Type, Layers } from "lucide-react";

export const TERMINAL_THEMES = {
  "Aegis Dark": { bg: "#080a0f", text: "#e5e7eb", accent: "#00c896", error: "#f87171", warn: "#facc15", info: "#00c896", border: "#1e2330" },
  "Dracula":    { bg: "#282a36", text: "#f8f8f2", accent: "#50fa7b", error: "#ff5555", warn: "#f1fa8c", info: "#8be9fd", border: "#44475a" },
  "Monokai":    { bg: "#272822", text: "#f8f8f2", accent: "#a6e22e", error: "#f92672", warn: "#e6db74", info: "#66d9e8", border: "#3e3d32" },
  "Solarized":  { bg: "#002b36", text: "#839496", accent: "#859900", error: "#dc322f", warn: "#b58900", info: "#268bd2", border: "#073642" },
  "Nord":       { bg: "#2e3440", text: "#d8dee9", accent: "#88c0d0", error: "#bf616a", warn: "#ebcb8b", info: "#81a1c1", border: "#3b4252" },
  "One Dark":   { bg: "#1e2127", text: "#abb2bf", accent: "#98c379", error: "#e06c75", warn: "#e5c07b", info: "#61afef", border: "#2c313a" },
  "Gruvbox":    { bg: "#282828", text: "#ebdbb2", accent: "#b8bb26", error: "#fb4934", warn: "#fabd2f", info: "#83a598", border: "#3c3836" },
  "Tokyo Night":{ bg: "#1a1b26", text: "#a9b1d6", accent: "#7aa2f7", error: "#f7768e", warn: "#e0af68", info: "#7dcfff", border: "#24283b" },
};

export const FONTS = [
  { label: "Fira Code", value: "'Fira Code', monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Cascadia Code", value: "'Cascadia Code', monospace" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Consolas", value: "Consolas, monospace" },
];

export const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16];

export default function TerminalThemePanel({ settings, onChange, onClose }) {
  const themes = Object.keys(TERMINAL_THEMES);

  const set = (key, val) => onChange({ ...settings, [key]: val });

  return (
    <div className="absolute bottom-full right-0 mb-1 w-72 bg-[#1a1d26] border border-[#2a2d3a] rounded-lg shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-[#00c896]" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Terminal Settings</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-4 max-h-80 overflow-y-auto">
        {/* Theme */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Palette className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Color Theme</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {themes.map((name) => {
              const t = TERMINAL_THEMES[name];
              return (
                <button
                  key={name}
                  onClick={() => set("theme", name)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${
                    settings.theme === name
                      ? "border-[#00c896] bg-[#00c896]/10"
                      : "border-[#2a2d3a] hover:border-[#3a3d4a]"
                  }`}
                >
                  {/* Color swatch */}
                  <div className="flex gap-0.5 shrink-0">
                    <div className="w-3 h-3 rounded-sm" style={{ background: t.bg }} />
                    <div className="w-3 h-3 rounded-sm" style={{ background: t.accent }} />
                    <div className="w-3 h-3 rounded-sm" style={{ background: t.error }} />
                  </div>
                  <span className="text-xs text-gray-300 truncate">{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Type className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Font Family</span>
          </div>
          <select
            value={settings.font}
            onChange={(e) => set("font", e.target.value)}
            className="w-full bg-[#0d0f14] border border-[#2a2d3a] text-gray-200 text-xs px-2 py-1.5 rounded outline-none focus:border-[#00c896]"
          >
            {FONTS.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Font size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Font Size</span>
            <span className="text-xs text-[#00c896]">{settings.fontSize}px</span>
          </div>
          <div className="flex gap-1">
            {FONT_SIZES.map((sz) => (
              <button
                key={sz}
                onClick={() => set("fontSize", sz)}
                className={`flex-1 py-1 rounded text-xs transition-colors ${
                  settings.fontSize === sz
                    ? "bg-[#00c896] text-black font-semibold"
                    : "bg-[#0d0f14] border border-[#2a2d3a] text-gray-400 hover:text-gray-200"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Transparency */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Window Opacity</span>
            <span className="text-xs text-[#00c896] ml-auto">{Math.round(settings.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.05}
            value={settings.opacity}
            onChange={(e) => set("opacity", parseFloat(e.target.value))}
            className="w-full accent-[#00c896]"
          />
          <div className="flex justify-between text-gray-600 text-xs mt-0.5">
            <span>Transparent</span>
            <span>Solid</span>
          </div>
        </div>

        {/* Terminal height */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Terminal Height</span>
            <span className="text-xs text-[#00c896]">{settings.height}px</span>
          </div>
          <input
            type="range"
            min={100}
            max={400}
            step={20}
            value={settings.height}
            onChange={(e) => set("height", parseInt(e.target.value))}
            className="w-full accent-[#00c896]"
          />
        </div>
      </div>
    </div>
  );
}