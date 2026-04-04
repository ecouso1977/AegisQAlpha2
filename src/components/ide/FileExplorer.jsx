import { useState } from "react";
import { FilePlus, Trash2, FileCode } from "lucide-react";

export default function FileExplorer({ files, activeFileId, onSelect, onAdd, onDelete }) {
  const [newFileName, setNewFileName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    let name = newFileName.trim();
    if (!name) return;
    if (!name.endsWith(".py")) name += ".py";
    onAdd(name);
    setNewFileName("");
    setAdding(false);
  };

  return (
    <div className="w-52 shrink-0 bg-[#0e1018] border-r border-[#1e2330] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e2330]">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Explorer</span>
        <button
          onClick={() => setAdding(true)}
          className="text-gray-400 hover:text-[#00c896] transition-colors"
          title="New File"
        >
          <FilePlus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        <div className="px-2 py-1">
          <span className="text-xs text-gray-500 uppercase tracking-wider px-1">Python Files</span>
        </div>
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onSelect(file.id)}
            className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer rounded mx-1 transition-colors ${
              activeFileId === file.id
                ? "bg-[#1a2a3a] text-[#00c896]"
                : "text-gray-300 hover:bg-[#1a1d26]"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <FileCode className="w-3.5 h-3.5 shrink-0 text-[#4ec9b0]" />
              <span className="text-sm truncate">{file.name}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {adding && (
          <div className="px-3 py-2">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="filename.py"
              className="w-full bg-[#1a1d26] border border-[#00c896] text-white text-sm px-2 py-1 rounded outline-none"
            />
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-[#1e2330]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#00c896] animate-pulse"></div>
          <span className="text-xs text-gray-500">Python 3.10</span>
        </div>
      </div>
    </div>
  );
}