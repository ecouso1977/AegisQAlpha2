import { X, ChevronRight, ChevronDown, File, Folder, FileCode } from "lucide-react";
import { useState } from "react";

export default function BuildPreviewModal({ isOpen, onClose, appName, appVersion, enabledPlugins, marketplaceSelected, metadata }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(["root", "plugins", "metadata"]));

  if (!isOpen) return null;

  const toggleFolder = (path) => {
    const next = new Set(expandedFolders);
    next.has(path) ? next.delete(path) : next.add(path);
    setExpandedFolders(next);
  };

  const isExpanded = (path) => expandedFolders.has(path);

  const FileTreeNode = ({ name, type, path, children = [], indent = 0 }) => {
    const isFolder = type === "folder";
    const hasChildren = children?.length > 0;
    const expanded = isFolder && isExpanded(path);

    return (
      <div>
        <div
          className="flex items-center gap-1 px-2 py-1 hover:bg-[#1a1d26] cursor-pointer"
          style={{ paddingLeft: indent * 16 + 8 }}
          onClick={() => isFolder && toggleFolder(path)}
        >
          {isFolder && hasChildren && (
            <span className="w-4 flex items-center">
              {expanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
            </span>
          )}
          {isFolder && !hasChildren && <span className="w-4" />}
          {!isFolder && <span className="w-4" />}

          {isFolder ? (
            <Folder className="w-3.5 h-3.5 text-[#e2c270] shrink-0" />
          ) : (
            <FileCode className="w-3.5 h-3.5 text-[#4ec9b0] shrink-0" />
          )}
          <span className="text-xs text-gray-300">{name}</span>
          {isFolder && hasChildren && <span className="text-[9px] text-gray-600 ml-auto">{children.length}</span>}
        </div>
        {isFolder && expanded && children.map((child, i) => (
          <FileTreeNode key={i} {...child} indent={indent + 1} />
        ))}
      </div>
    );
  };

  // Build virtual tree
  const tree = [
    {
      name: appName,
      type: "folder",
      path: "root",
      children: [
        { name: "main.js", type: "file", path: "main" },
        { name: "index.html", type: "file", path: "html" },
        { name: "package.json", type: "file", path: "pkg" },
        {
          name: "plugins",
          type: "folder",
          path: "plugins",
          children: enabledPlugins.map((id) => ({
            name: `${id}.plugin.js`,
            type: "file",
            path: `plugin-${id}`,
          })),
        },
        ...(marketplaceSelected.length > 0 ? [{
          name: "marketplace",
          type: "folder",
          path: "marketplace",
          children: marketplaceSelected.map((id) => ({
            name: `${id}.plugin.js`,
            type: "file",
            path: `market-${id}`,
          })),
        }] : []),
        {
          name: "metadata",
          type: "folder",
          path: "metadata",
          children: [
            { name: "BUILD_METADATA.json", type: "file", path: "meta-json" },
            { name: "manifest.txt", type: "file", path: "manifest" },
          ],
        },
        { name: "README.md", type: "file", path: "readme" },
      ],
    },
  ];

  const totalFiles = enabledPlugins.length + marketplaceSelected.length + 7;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0f14] border border-[#1e2330] rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2330]">
          <div>
            <h3 className="text-lg font-semibold text-white">Build Preview</h3>
            <p className="text-xs text-gray-500 mt-0.5">{appName} v{appVersion} — Virtual File Structure</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 border-b border-[#1e2330] grid grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] text-gray-600 uppercase">Total Files</span>
            <div className="text-base font-semibold text-white">{totalFiles}</div>
          </div>
          <div>
            <span className="text-[10px] text-gray-600 uppercase">Bundled Plugins</span>
            <div className="text-base font-semibold text-[#00c896]">{enabledPlugins.length}</div>
          </div>
          <div>
            <span className="text-[10px] text-gray-600 uppercase">Marketplace</span>
            <div className="text-base font-semibold text-[#e2c270]">{marketplaceSelected.length}</div>
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-[#080a0f]">
          {tree.map((node, i) => (
            <FileTreeNode key={i} {...node} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1e2330] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1a1d26] border border-[#2a2d3a] text-gray-300 rounded-lg hover:bg-[#2a2d3a] transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}