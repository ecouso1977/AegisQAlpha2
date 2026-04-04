import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, FileCode } from "lucide-react";

export default function CodeEditorPreview({ files, activeFileId, onFileChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(activeFileId);

  useEffect(() => {
    setSelectedFileId(activeFileId);
  }, [activeFileId]);

  const activeFile = files.find((f) => f.id === selectedFileId);

  if (!activeFile) return null;

  const handleContentChange = (e) => {
    onFileChange(selectedFileId, e.target.value);
  };

  return (
    <div className="bg-[#0e1018] border border-[#1e2330] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-[#1a1d26] transition-colors border-b border-[#1e2330]"
      >
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#00c896]" />
          <span className="text-sm font-medium text-white">Review Source Code</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-3 p-4">
          {/* File selector */}
          <select
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1d26] border border-[#2a2d3a] rounded text-xs text-white focus:border-[#00c896] outline-none"
          >
            {files.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name}
              </option>
            ))}
          </select>

          {/* Code editor */}
          <div className="relative border border-[#1e2330] rounded overflow-hidden bg-[#0a0c11]">
            <textarea
              value={activeFile.content}
              onChange={handleContentChange}
              className="w-full h-64 p-4 bg-[#0a0c11] text-white font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#00c896]"
              spellCheck="false"
            />
          </div>

          {/* File info */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#1e2330]">
            <span>{activeFile.language}</span>
            <span>{activeFile.content.split('\n').length} lines</span>
          </div>
        </div>
      )}
    </div>
  );
}