import { useState, useRef, useEffect } from "react";

const MENUS = {
  File: [
    { label: "New File", shortcut: "Ctrl+N", action: "new-file" },
    { label: "Open File...", shortcut: "Ctrl+O", action: "open-file" },
    { divider: true },
    { label: "Save", shortcut: "Ctrl+S", action: "save" },
    { label: "Save All", shortcut: "Ctrl+Shift+S", action: "save-all" },
    { divider: true },
    { label: "Close File", shortcut: "Ctrl+W", action: "close-file" },
  ],
  Edit: [
    { label: "Undo", shortcut: "Ctrl+Z", action: "undo" },
    { label: "Redo", shortcut: "Ctrl+Y", action: "redo" },
    { divider: true },
    { label: "Cut", shortcut: "Ctrl+X", action: "cut" },
    { label: "Copy", shortcut: "Ctrl+C", action: "copy" },
    { label: "Paste", shortcut: "Ctrl+V", action: "paste" },
    { divider: true },
    { label: "Find", shortcut: "Ctrl+F", action: "find" },
    { label: "Replace", shortcut: "Ctrl+H", action: "replace" },
    { label: "Format Document", shortcut: "Shift+Alt+F", action: "format" },
  ],
  View: [
    { label: "Explorer", shortcut: "Ctrl+Shift+E", action: "view-explorer" },
    { label: "Source Control", shortcut: "Ctrl+Shift+G", action: "view-git" },
    { label: "Debug", shortcut: "Ctrl+Shift+D", action: "view-debug" },
    { divider: true },
    { label: "Toggle AI Chat", shortcut: "Ctrl+Shift+A", action: "toggle-chat" },
    { label: "Toggle Terminal", shortcut: "Ctrl+`", action: "toggle-terminal" },
    { divider: true },
    { label: "Zoom In", shortcut: "Ctrl++", action: "zoom-in" },
    { label: "Zoom Out", shortcut: "Ctrl+-", action: "zoom-out" },
  ],
  Terminal: [
    { label: "New Terminal", shortcut: "Ctrl+Shift+`", action: "new-terminal" },
    { label: "Clear Terminal", shortcut: "Ctrl+K", action: "clear-terminal" },
    { divider: true },
    { label: "Run Active File", shortcut: "F5", action: "run" },
    { label: "Stop Execution", shortcut: "Shift+F5", action: "stop" },
  ],
  Help: [
    { label: "Documentation", action: "docs" },
    { label: "Keyboard Shortcuts", shortcut: "Ctrl+K Ctrl+S", action: "shortcuts" },
    { divider: true },
    { label: "Report Issue", action: "report" },
    { label: "About Aegis Quantum", action: "about" },
  ],
};

export default function NavMenu({ onAction }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAction = (action) => {
    setOpen(null);
    onAction?.(action);
  };

  return (
    <div ref={ref} className="hidden md:flex items-center gap-0.5 text-xs text-gray-500 relative">
      {Object.keys(MENUS).map((menu) => (
        <div key={menu} className="relative">
          <button
            onClick={() => setOpen(open === menu ? null : menu)}
            className={`px-2.5 py-1.5 rounded transition-colors ${open === menu ? "bg-[#1a1d26] text-gray-200" : "hover:text-gray-300 hover:bg-[#1a1d26]"}`}
          >
            {menu}
          </button>
          {open === menu && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#1a1d26] border border-[#2a2d3a] rounded-lg shadow-2xl z-[100] overflow-hidden py-1">
              {MENUS[menu].map((item, i) =>
                item.divider ? (
                  <div key={i} className="my-1 border-t border-[#2a2d3a]" />
                ) : (
                  <button
                    key={i}
                    onClick={() => handleAction(item.action)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-300 hover:bg-[#264f78] hover:text-white transition-colors text-left"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="text-gray-600 text-xs ml-4">{item.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}