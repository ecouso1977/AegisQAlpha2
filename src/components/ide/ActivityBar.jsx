import { Files, Search, GitBranch, Bug, Settings, History } from "lucide-react";

const ITEMS = [
  { id: "explorer", icon: Files, label: "Explorer" },
  { id: "search", icon: Search, label: "Search" },
  { id: "git", icon: GitBranch, label: "Source Control" },
  { id: "vcs", icon: History, label: "Version Control" },
  { id: "debug", icon: Bug, label: "Debug" },
];

export default function ActivityBar({ active, onChange }) {
  return (
    <div className="w-12 shrink-0 bg-[#0a0c11] border-r border-[#1e2330] flex flex-col items-center py-2 gap-1">
      {ITEMS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(active === id ? null : id)}
          title={label}
          className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
            active === id
              ? "text-[#00c896] bg-[#00c896]/10 border border-[#00c896]/30"
              : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1d26]"
          }`}
        >
          <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </button>
      ))}
      <div className="flex-1" />
      <button title="Settings" className="w-9 h-9 flex items-center justify-center rounded text-gray-500 hover:text-gray-300 hover:bg-[#1a1d26] transition-colors">
        <Settings style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}