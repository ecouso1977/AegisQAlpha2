import { useState, useRef, useEffect } from "react";
import {
  FilePlus, FolderPlus, Trash2, FileCode, Folder, FolderOpen,
  ChevronRight, ChevronDown, Pencil, Check, X
} from "lucide-react";

function getFileIcon(name) {
  if (name.endsWith(".py")) return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#4ec9b0]" />;
  if (name.endsWith(".json")) return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#ce9178]" />;
  if (name.endsWith(".md")) return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#9cdcfe]" />;
  if (name.endsWith(".txt")) return <FileCode className="w-3.5 h-3.5 shrink-0 text-gray-400" />;
  return <FileCode className="w-3.5 h-3.5 shrink-0 text-gray-400" />;
}

function InlineInput({ defaultValue = "", placeholder, onConfirm, onCancel }) {
  const [val, setVal] = useState(defaultValue);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="flex items-center gap-1 px-2 py-0.5">
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm(val.trim());
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        className="flex-1 bg-[#1a1d26] border border-[#00c896]/60 text-white text-xs px-2 py-1 rounded outline-none min-w-0"
      />
      <button onClick={() => onConfirm(val.trim())} className="text-[#00c896] hover:text-[#00b084]"><Check className="w-3 h-3" /></button>
      <button onClick={onCancel} className="text-gray-500 hover:text-gray-300"><X className="w-3 h-3" /></button>
    </div>
  );
}

// Normalize flat files into a tree structure by parsing path-like names (folder/file.py)
function buildTree(files) {
  const root = { folders: {}, files: [] };
  for (const file of files) {
    const parts = file.name.split("/");
    if (parts.length === 1) {
      root.files.push(file);
    } else {
      let node = root;
      for (let i = 0; i < parts.length - 1; i++) {
        const folder = parts[i];
        if (!node.folders[folder]) node.folders[folder] = { folders: {}, files: [] };
        node = node.folders[folder];
      }
      node.files.push({ ...file, displayName: parts[parts.length - 1] });
    }
  }
  return root;
}

function FolderNode({ name, node, depth, activeFileId, onSelect, onDelete, onRename, renamingId, setRenamingId }) {
  const [open, setOpen] = useState(true);
  const [renamingFolder, setRenamingFolder] = useState(false);

  return (
    <div>
      <div
        className="group flex items-center gap-1 px-2 py-1 hover:bg-[#1a1d26] cursor-pointer rounded mx-1 transition-colors"
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />}
        {open ? <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#e2c270]" /> : <Folder className="w-3.5 h-3.5 shrink-0 text-[#e2c270]" />}
        <span className="text-xs text-gray-300 truncate flex-1">{name}</span>
      </div>
      {open && (
        <div>
          {Object.entries(node.folders).map(([subName, subNode]) => (
            <FolderNode key={subName} name={subName} node={subNode} depth={depth + 1}
              activeFileId={activeFileId} onSelect={onSelect} onDelete={onDelete}
              onRename={onRename} renamingId={renamingId} setRenamingId={setRenamingId} />
          ))}
          {node.files.map((file) => (
            <FileNode key={file.id} file={file} depth={depth + 1}
              activeFileId={activeFileId} onSelect={onSelect} onDelete={onDelete}
              onRename={onRename} renamingId={renamingId} setRenamingId={setRenamingId} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileNode({ file, depth, activeFileId, onSelect, onDelete, onRename, renamingId, setRenamingId }) {
  const isActive = activeFileId === file.id;
  const isRenaming = renamingId === file.id;
  const displayName = file.displayName || file.name;

  if (isRenaming) {
    return (
      <div style={{ paddingLeft: depth * 12 + 8 }}>
        <InlineInput
          defaultValue={displayName}
          placeholder="filename.py"
          onConfirm={(val) => { if (val) onRename(file.id, val); setRenamingId(null); }}
          onCancel={() => setRenamingId(null)}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(file.id)}
      className={`group flex items-center justify-between px-2 py-1.5 cursor-pointer rounded mx-1 transition-colors ${
        isActive ? "bg-[#1a2a3a] text-[#00c896]" : "text-gray-300 hover:bg-[#1a1d26]"
      }`}
      style={{ paddingLeft: depth * 12 + 8 }}
    >
      <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
        {getFileIcon(displayName)}
        <span className="text-xs truncate">{displayName}</span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setRenamingId(file.id); }}
          className="text-gray-500 hover:text-[#00c896] p-0.5 transition-colors"
          title="Rename"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
          className="text-gray-500 hover:text-red-400 p-0.5 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

export default function FileExplorer({ files, activeFileId, onSelect, onAdd, onDelete, onRename, collabSession }) {
  const [addingFile, setAddingFile] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [renamingId, setRenamingId] = useState(null);

  const handleAddFile = (name) => {
    if (!name) return setAddingFile(false);
    let n = name;
    if (!n.includes(".")) n += ".py";
    onAdd(n);
    setAddingFile(false);
  };

  const handleAddFolder = (name) => {
    if (!name) return setAddingFolder(false);
    // Create a placeholder file inside the folder
    onAdd(`${name}/__init__.py`);
    setAddingFolder(false);
  };

  const tree = buildTree(files);

  return (
    <div className="w-56 shrink-0 bg-[#0e1018] border-r border-[#1e2330] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e2330]">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Explorer</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setAddingFile(true); setAddingFolder(false); }} title="New File" className="text-gray-500 hover:text-[#00c896] transition-colors">
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setAddingFolder(true); setAddingFile(false); }} title="New Folder" className="text-gray-500 hover:text-[#e2c270] transition-colors">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Workspace label */}
      <div className="px-3 py-1.5 border-b border-[#1e2330]">
        <span className="text-xs text-gray-600 uppercase tracking-wider">Workspace</span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* New file input */}
        {addingFile && (
          <InlineInput
            placeholder="filename.py"
            onConfirm={handleAddFile}
            onCancel={() => setAddingFile(false)}
          />
        )}
        {addingFolder && (
          <InlineInput
            placeholder="folder-name"
            onConfirm={handleAddFolder}
            onCancel={() => setAddingFolder(false)}
          />
        )}

        {/* Folders */}
        {Object.entries(tree.folders).map(([folderName, folderNode]) => (
          <FolderNode
            key={folderName}
            name={folderName}
            node={folderNode}
            depth={0}
            activeFileId={activeFileId}
            onSelect={onSelect}
            onDelete={onDelete}
            onRename={onRename}
            renamingId={renamingId}
            setRenamingId={setRenamingId}
          />
        ))}

        {/* Root files */}
        {tree.files.map((file) => (
          <FileNode
            key={file.id}
            file={file}
            depth={0}
            activeFileId={activeFileId}
            onSelect={onSelect}
            onDelete={onDelete}
            onRename={onRename}
            renamingId={renamingId}
            setRenamingId={setRenamingId}
          />
        ))}

        {files.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-gray-600">
            No files yet.<br />
            <button onClick={() => setAddingFile(true)} className="text-[#00c896] hover:underline mt-1">Create a file</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#1e2330] space-y-1">
        {collabSession?.isConnected && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
            <span className="text-xs text-[#00c896]">Live · {collabSession.participants?.length || 1} online</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00c896]" />
          <span className="text-xs text-gray-500">Python 3.10 · {files.length} file{files.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}