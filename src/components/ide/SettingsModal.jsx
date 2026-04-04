import { useState, useEffect } from "react";
import { X, Palette, Type, Check } from "lucide-react";

export const EDITOR_THEMES = [
  {
    id: "dark",
    label: "Dark",
    desc: "Default dark theme",
    bg: "#0d0f14",
    surface: "#1a1d26",
    text: "#e5e7eb",
    keyword: "#569cd6",
    string: "#ce9178",
    comment: "#6a9955",
    number: "#b5cea8",
  },
  {
    id: "light",
    label: "Light",
    desc: "Clean light background",
    bg: "#ffffff",
    surface: "#f3f4f6",
    text: "#1f2937",
    keyword: "#0000ff",
    string: "#a31515",
    comment: "#008000",
    number: "#098658",
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    desc: "Maximum readability",
    bg: "#000000",
    surface: "#1a1a1a",
    text: "#ffffff",
    keyword: "#00ffff",
    string: "#ffff00",
    comment: "#7fff00",
    number: "#ff9900",
  },
  {
    id: "monokai",
    label: "Monokai",
    desc: "Popular dark theme",
    bg: "#272822",
    surface: "#3e3d32",
    text: "#f8f8f2",
    keyword: "#f92672",
    string: "#e6db74",
    comment: "#75715e",
    number: "#ae81ff",
  },
  {
    id: "nord",
    label: "Nord",
    desc: "Arctic, north-bluish",
    bg: "#2e3440",
    surface: "#3b4252",
    text: "#d8dee9",
    keyword: "#81a1c1",
    string: "#a3be8c",
    comment: "#616e88",
    number: "#b48ead",
  },
  {
    id: "dracula",
    label: "Dracula",
    desc: "Dark with vivid colors",
    bg: "#282a36",
    surface: "#44475a",
    text: "#f8f8f2",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    comment: "#6272a4",
    number: "#bd93f9",
  },
];

export const FONT_SIZES = [11, 12, 13, 14, 15, 16, 18, 20];

export function loadEditorPrefs() {
  try {
    const saved = localStorage.getItem("aq_editor_prefs");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { themeId: "dark", fontSize: 13 };
}

export function saveEditorPrefs(prefs) {
  localStorage.setItem("aq_editor_prefs", JSON.stringify(prefs));
}

function ThemePreview({ theme }) {
  return (
    <div
      className="rounded p-2 text-[9px] font-mono leading-relaxed border border-transparent overflow-hidden"
      style={{ background: theme.bg, color: theme.text, borderColor: theme.surface }}
    >
      <span style={{ color: theme.comment }}># greet user</span>{"\n"}
      <span style={{ color: theme.keyword }}>def </span>
      <span>greet():</span>{"\n"}
      {"  "}<span style={{ color: theme.keyword }}>return </span>
      <span style={{ color: theme.string }}>"Hello!"</span>
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const [prefs, setPrefs] = useState(loadEditorPrefs);

  const update = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveEditorPrefs(next);
    // Dispatch event so CodeEditor can react without a full reload
    window.dispatchEvent(new CustomEvent("aq-prefs-change", { detail: next }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0e1018] border border-[#1e2330] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2330]">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#00c896]" />
            <span className="font-semibold text-white text-sm">Editor Settings</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Syntax theme */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-200">Syntax Theme</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EDITOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => update({ themeId: theme.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    prefs.themeId === theme.id
                      ? "border-[#00c896] bg-[#00c896]/5"
                      : "border-[#2a2d3a] hover:border-gray-500 bg-[#1a1d26]"
                  }`}
                >
                  <ThemePreview theme={theme} />
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <div className="text-xs font-medium text-gray-200">{theme.label}</div>
                      <div className="text-[10px] text-gray-500">{theme.desc}</div>
                    </div>
                    {prefs.themeId === theme.id && (
                      <Check className="w-3.5 h-3.5 text-[#00c896] shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-200">Font Size</span>
              <span className="ml-auto text-xs text-[#00c896] font-mono">{prefs.fontSize}px</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => update({ fontSize: size })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                    prefs.fontSize === size
                      ? "bg-[#00c896] text-black border-[#00c896] font-bold"
                      : "bg-[#1a1d26] text-gray-400 border-[#2a2d3a] hover:border-gray-500"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {/* Slider */}
            <input
              type="range"
              min={11} max={20} value={prefs.fontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="w-full mt-3 accent-[#00c896]"
            />
          </div>

          {/* Preview */}
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Live Preview</div>
            {(() => {
              const theme = EDITOR_THEMES.find((t) => t.id === prefs.themeId) || EDITOR_THEMES[0];
              return (
                <pre
                  className="rounded-xl p-4 border overflow-x-auto"
                  style={{
                    background: theme.bg,
                    borderColor: theme.surface,
                    fontSize: prefs.fontSize,
                    lineHeight: 1.6,
                    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                  }}
                >
                  <span style={{ color: theme.comment }}># Welcome to Aegis Quantum{"\n"}</span>
                  <span style={{ color: theme.keyword }}>def </span>
                  <span style={{ color: theme.text }}>fibonacci(n):{"\n"}</span>
                  <span style={{ color: theme.text }}>    a, b = </span>
                  <span style={{ color: theme.number }}>0</span>
                  <span style={{ color: theme.text }}>, </span>
                  <span style={{ color: theme.number }}>1</span>
                  <span style={{ color: theme.text }}>{"\n"}</span>
                  <span style={{ color: theme.keyword }}>    while </span>
                  <span style={{ color: theme.text }}>a {"<"} n:{"\n"}</span>
                  <span style={{ color: theme.keyword }}>        print</span>
                  <span style={{ color: theme.text }}>(</span>
                  <span style={{ color: theme.string }}>"fib:"</span>
                  <span style={{ color: theme.text }}>, a)</span>
                </pre>
              );
            })()}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#1e2330] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[#00c896] hover:bg-[#00b084] text-black text-sm font-semibold rounded-lg transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}