import { useState, useRef, useEffect } from "react";
import {
  FilePlus, FolderPlus, Trash2, FileCode, Folder, FolderOpen,
  ChevronRight, ChevronDown, Pencil, Check, X, Search, FileText,
  File, FolderGit2
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(name) {
  if (!name) return <File className="w-3.5 h-3.5 shrink-0 text-gray-400" />;
  if (name.endsWith(".py"))   return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#4ec9b0]" />;
  if (name.endsWith(".js") || name.endsWith(".jsx")) return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#e2c270]" />;
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#569cd6]" />;
  if (name.endsWith(".json")) return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#ce9178]" />;
  if (name.endsWith(".md"))   return <FileText className="w-3.5 h-3.5 shrink-0 text-[#9cdcfe]" />;
  if (name.endsWith(".go"))   return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#00acd7]" />;
  if (name.endsWith(".rs"))   return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#f74c00]" />;
  return <File className="w-3.5 h-3.5 shrink-0 text-gray-400" />;
}

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
        if (!node.folders[folder]) node.folders[folder] = { folders: {}, files: [], path: parts.slice(0, i + 1).join("/") };
        node = node.folders[folder];
      }
      node.files.push({ ...file, displayName: parts[parts.length - 1] });
    }
  }
  return root;
}

// ── InlineInput ───────────────────────────────────────────────────────────────

function InlineInput({ defaultValue = "", placeholder, onConfirm, onCancel, depth = 0 }) {
  const [val, setVal] = useState(defaultValue);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="flex items-center gap-1 py-0.5 pr-2" style={{ paddingLeft: depth * 12 + 8 }}>
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
      <button onClick={() => onConfirm(val.trim())} className="text-[#00c896] hover:text-[#00b084] p-0.5"><Check className="w-3 h-3" /></button>
      <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 p-0.5"><X className="w-3 h-3" /></button>
    </div>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-[#1a1d26] border border-[#2a2d3a] rounded-lg shadow-2xl py-1 min-w-[160px]"
      style={{ top: y, left: x }}
    >
      {items.map((item, i) =>
        item === "divider" ? (
          <div key={i} className="my-1 border-t border-[#2a2d3a]" />
        ) : (
          <button
            key={i}
            onClick={() => { item.action(); onClose(); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
              item.danger ? "text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:bg-[#2a2d3a]"
            }`}
          >
            {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

// ── FileNode ──────────────────────────────────────────────────────────────────

function FileNode({ file, depth, activeFileId, onSelect, onDelete, onRename, renamingId, setRenamingId }) {
  const isActive = activeFileId === file.id;
  const isRenaming = renamingId === file.id;
  const displayName = file.displayName || file.name;
  const [ctxMenu, setCtxMenu] = useState(null);

  if (isRenaming) {
    return (
      <InlineInput
        depth={depth}
        defaultValue={displayName}
        placeholder="filename.py"
        onConfirm={(val) => { if (val) onRename(file.id, val); setRenamingId(null); }}
        onCancel={() => setRenamingId(null)}
      />
    );
  }

  return (
    <>
      <div
        onClick={() => onSelect(file.id)}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
        className={`group flex items-center justify-between py-1 cursor-pointer rounded mx-1 transition-colors ${
          isActive ? "bg-[#1a2a3a] text-[#00c896]" : "text-gray-300 hover:bg-[#1a1d26]"
        }`}
        style={{ paddingLeft: depth * 12 + 8, paddingRight: 8 }}
      >
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
          {getFileIcon(displayName)}
          <span className="text-xs truncate">{displayName}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setRenamingId(file.id); }} className="text-gray-500 hover:text-[#00c896] p-0.5" title="Rename">
            <Pencil className="w-2.5 h-2.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="text-gray-500 hover:text-red-400 p-0.5" title="Delete">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: "Open", icon: FileCode, action: () => onSelect(file.id) },
            { label: "Rename", icon: Pencil, action: () => setRenamingId(file.id) },
            "divider",
            { label: "Delete", icon: Trash2, danger: true, action: () => onDelete(file.id) },
          ]}
        />
      )}
    </>
  );
}

// ── FolderNode ────────────────────────────────────────────────────────────────

function FolderNode({ name, node, depth, activeFileId, onSelect, onDelete, onRename, onAddFile, onAddFolder, renamingId, setRenamingId }) {
  const [open, setOpen] = useState(true);
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [addingFileHere, setAddingFileHere] = useState(false);
  const [addingFolderHere, setAddingFolderHere] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);

  const folderPath = node.path || name;

  const handleAddFileHere = (filename) => {
    if (filename) onAddFile(`${folderPath}/${filename.includes(".") ? filename : filename + ".py"}`);
    setAddingFileHere(false);
  };

  const handleAddFolderHere = (folderName) => {
    if (folderName) onAddFile(`${folderPath}/${folderName}/__init__.py`);
    setAddingFolderHere(false);
  };

  const handleRenameFolder = (newName) => {
    if (newName && newName !== name) onRename(folderPath, newName, true);
    setRenamingFolder(false);
  };

  const handleDeleteFolder = () => {
    onDelete(folderPath, true);
  };

  const fileCount = node.files.length + Object.keys(node.folders).length;

  return (
    <>
      <div>
        {renamingFolder ? (
          <InlineInput
            depth={depth}
            defaultValue={name}
            placeholder="folder-name"
            onConfirm={handleRenameFolder}
            onCancel={() => setRenamingFolder(false)}
          />
        ) : (
          <div
            className="group flex items-center gap-1 py-1 hover:bg-[#1a1d26] cursor-pointer rounded mx-1 transition-colors"
            style={{ paddingLeft: depth * 12 + 8, paddingRight: 8 }}
            onClick={() => setOpen((v) => !v)}
            onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
          >
            {open ? <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />}
            {open ? <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#e2c270]" /> : <Folder className="w-3.5 h-3.5 shrink-0 text-[#e2c270]" />}
            <span className="text-xs text-gray-300 truncate flex-1">{name}</span>
            <span className="text-[9px] text-gray-600 opacity-0 group-hover:opacity-100 mr-1">{fileCount}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
              <button onClick={(e) => { e.stopPropagation(); setAddingFileHere(true); setOpen(true); }} className="text-gray-500 hover:text-[#00c896] p-0.5" title="New File">
                <FilePlus className="w-2.5 h-2.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setAddingFolderHere(true); setOpen(true); }} className="text-gray-500 hover:text-[#e2c270] p-0.5" title="New Folder">
                <FolderPlus className="w-2.5 h-2.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setRenamingFolder(true); }} className="text-gray-500 hover:text-[#00c896] p-0.5" title="Rename">
                <Pencil className="w-2.5 h-2.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(); }} className="text-gray-500 hover:text-red-400 p-0.5" title="Delete Folder">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}

        {open && (
          <div>
            {addingFileHere && (
              <InlineInput
                depth={depth + 1}
                placeholder="filename.py"
                onConfirm={handleAddFileHere}
                onCancel={() => setAddingFileHere(false)}
              />
            )}
            {addingFolderHere && (
              <InlineInput
                depth={depth + 1}
                placeholder="folder-name"
                onConfirm={handleAddFolderHere}
                onCancel={() => setAddingFolderHere(false)}
              />
            )}
            {Object.entries(node.folders).map(([subName, subNode]) => (
              <FolderNode key={subName} name={subName} node={subNode} depth={depth + 1}
                activeFileId={activeFileId} onSelect={onSelect} onDelete={onDelete}
                onRename={onRename} onAddFile={onAddFile} onAddFolder={onAddFolder}
                renamingId={renamingId} setRenamingId={setRenamingId} />
            ))}
            {node.files.map((file) => (
              <FileNode key={file.id} file={file} depth={depth + 1}
                activeFileId={activeFileId} onSelect={onSelect} onDelete={onDelete}
                onRename={onRename} renamingId={renamingId} setRenamingId={setRenamingId} />
            ))}
          </div>
        )}
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: "New File", icon: FilePlus, action: () => { setAddingFileHere(true); setOpen(true); } },
            { label: "New Folder", icon: FolderPlus, action: () => { setAddingFolderHere(true); setOpen(true); } },
            "divider",
            { label: "Rename", icon: Pencil, action: () => setRenamingFolder(true) },
            { label: "Delete Folder", icon: Trash2, danger: true, action: handleDeleteFolder },
          ]}
        />
      )}
    </>
  );
}

// ── FileExplorer (main) ───────────────────────────────────────────────────────

export default function FileExplorer({ files, activeFileId, onSelect, onAdd, onDelete, onRename, collabSession }) {
  const [addingFile, setAddingFile] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [search, setSearch] = useState("");

  const handleAddFile = (name) => {
    if (!name) return setAddingFile(false);
    onAdd(name.includes(".") ? name : name + ".py");
    setAddingFile(false);
  };

  const handleAddFolder = (name) => {
    if (!name) return setAddingFolder(false);
    onAdd(`${name}/__init__.py`);
    setAddingFolder(false);
  };

  const handleDeleteFolder = (folderPath, isFolder) => {
    if (!isFolder) return onDelete(folderPath);
    // Delete all files whose name starts with this folder path
    files.filter((f) => f.name.startsWith(folderPath + "/")).forEach((f) => onDelete(f.id));
  };

  const handleRenameFolder = (oldPath, newName, isFolder) => {
    if (!isFolder) return;
    // Rename all files in this folder
    files
      .filter((f) => f.name.startsWith(oldPath + "/"))
      .forEach((f) => {
        const rest = f.name.slice(oldPath.length);
        const parentParts = oldPath.split("/");
        parentParts[parentParts.length - 1] = newName;
        onRename(f.id, parentParts.join("/") + rest);
      });
  };

  const filteredFiles = search
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const tree = buildTree(files);

  return (
    <div className="w-60 shrink-0 bg-[#0e1018] border-r border-[#1e2330] flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e2330] shrink-0">
        <div className="flex items-center gap-1.5">
          <FolderGit2 className="w-3.5 h-3.5 text-[#00c896]" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Explorer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setAddingFile(true); setAddingFolder(false); }} title="New File" className="text-gray-500 hover:text-[#00c896] transition-colors">
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setAddingFolder(true); setAddingFile(false); }} title="New Folder" className="text-gray-500 hover:text-[#e2c270] transition-colors">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-[#1e2330] shrink-0">
        <div className="flex items-center gap-1.5 bg-[#1a1d26] border border-[#2a2d3a] rounded px-2 py-1">
          <Search className="w-3 h-3 text-gray-600 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="flex-1 bg-transparent text-xs text-gray-300 outline-none placeholder-gray-600 min-w-0"
          />
          {search && <button onClick={() => setSearch("")}><X className="w-3 h-3 text-gray-500" /></button>}
        </div>
      </div>

      {/* Workspace label */}
      <div className="px-3 py-1 border-b border-[#1e2330] shrink-0">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Workspace · {files.length} file{files.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* New file/folder inputs at root level */}
        {addingFile && (
          <InlineInput depth={0} placeholder="filename.py" onConfirm={handleAddFile} onCancel={() => setAddingFile(false)} />
        )}
        {addingFolder && (
          <InlineInput depth={0} placeholder="folder-name" onConfirm={handleAddFolder} onCancel={() => setAddingFolder(false)} />
        )}

        {/* Search results */}
        {filteredFiles ? (
          filteredFiles.length === 0 ? (
            <div className="px-4 py-4 text-xs text-gray-600 text-center">No files match "{search}"</div>
          ) : (
            filteredFiles.map((file) => (
              <FileNode key={file.id} file={file} depth={0}
                activeFileId={activeFileId} onSelect={onSelect} onDelete={onDelete}
                onRename={onRename} renamingId={renamingId} setRenamingId={setRenamingId} />
            ))
          )
        ) : (
          <>
            {Object.entries(tree.folders).map(([folderName, folderNode]) => (
              <FolderNode key={folderName} name={folderName} node={folderNode} depth={0}
                activeFileId={activeFileId} onSelect={onSelect}
                onDelete={handleDeleteFolder} onRename={handleRenameFolder}
                onAddFile={onAdd} onAddFolder={onAdd}
                renamingId={renamingId} setRenamingId={setRenamingId} />
            ))}
            {tree.files.map((file) => (
              <FileNode key={file.id} file={file} depth={0}
                activeFileId={activeFileId} onSelect={onSelect} onDelete={onDelete}
                onRename={onRename} renamingId={renamingId} setRenamingId={setRenamingId} />
            ))}
          </>
        )}

        {files.length === 0 && !addingFile && (
          <div className="px-4 py-8 text-center text-xs text-gray-600 leading-relaxed">
            No files yet.<br />
            <button onClick={() => setAddingFile(true)} className="text-[#00c896] hover:underline mt-1 block mx-auto">+ Create a file</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#1e2330] shrink-0 space-y-1">
        {collabSession?.isConnected && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
            <span className="text-xs text-[#00c896]">Live · {collabSession.participants?.length || 1} online</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00c896]" />
          <span className="text-xs text-gray-600">Python 3.10 · Piston Runtime</span>
        </div>
      </div>
    </div>
  );
}