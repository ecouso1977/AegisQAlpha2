/**
 * Project-wide symbol indexer for AI-powered autocomplete.
 * Parses all open files and extracts functions, classes, variables, imports.
 */

const PYTHON_PATTERNS = [
  { re: /^def\s+(\w+)\s*\(([^)]*)\)/gm,     kind: "function", detail: (m) => `def ${m[1]}(${m[2]})` },
  { re: /^class\s+(\w+)/gm,                  kind: "class",    detail: (m) => `class ${m[1]}` },
  { re: /^(\w+)\s*=/gm,                       kind: "variable", detail: (m) => `${m[1]} = ...` },
  { re: /^import\s+([\w.]+)/gm,               kind: "module",   detail: (m) => `import ${m[1]}` },
  { re: /^from\s+([\w.]+)\s+import\s+(.+)/gm, kind: "module",   detail: (m) => `from ${m[1]} import ${m[2]}` },
];

const JS_PATTERNS = [
  { re: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\()/gm, kind: "function", detail: (m) => `function ${m[1] || m[2]}()` },
  { re: /class\s+(\w+)/gm,                                              kind: "class",    detail: (m) => `class ${m[1]}` },
  { re: /(?:const|let|var)\s+(\w+)\s*=/gm,                              kind: "variable", detail: (m) => `${m[1]}` },
  { re: /import\s+.*?\s+from\s+['"]([^'"]+)['"]/gm,                     kind: "module",   detail: (m) => `from '${m[1]}'` },
];

function getPatternsForFile(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (["py"].includes(ext)) return PYTHON_PATTERNS;
  if (["js", "jsx", "ts", "tsx"].includes(ext)) return JS_PATTERNS;
  return [];
}

/**
 * Build a de-duplicated list of symbol suggestions from all project files.
 * @param {Array<{id, name, content}>} files
 * @param {string} currentFileId - excluded from cross-file label tagging
 * @returns {Array<{label, detail, kind, source}>}
 */
export function buildProjectIndex(files = []) {
  const seen = new Set();
  const results = [];

  for (const file of files) {
    const patterns = getPatternsForFile(file.name);
    for (const { re, kind, detail } of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(file.content)) !== null) {
        const label = m[1] || m[2];
        if (!label || seen.has(label)) continue;
        seen.add(label);
        results.push({ label, detail: detail(m), kind, source: file.name });
      }
    }
  }
  return results;
}

/**
 * Build a compact project context string for the AI prompt.
 * Summarises each file's top-level symbols (max 30 per file).
 */
export function buildProjectContext(files = [], activeFileId = null) {
  const lines = [];
  for (const file of files) {
    if (file.id === activeFileId) continue; // active file is already in the prompt
    const patterns = getPatternsForFile(file.name);
    const symbols = [];
    for (const { re, detail } of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(file.content)) !== null && symbols.length < 30) {
        symbols.push(detail(m));
      }
    }
    if (symbols.length) lines.push(`# ${file.name}\n${symbols.join("\n")}`);
  }
  return lines.join("\n\n");
}