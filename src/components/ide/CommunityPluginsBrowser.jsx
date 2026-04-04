import { useState, useMemo } from "react";
import { Search, Star, Download, Check, X, Globe, User } from "lucide-react";

const COMMUNITY_PLUGINS = [
  {
    id: "prettier",
    name: "Prettier",
    author: "Prettier Team",
    version: "3.0.0",
    category: "Formatter",
    rating: 4.9,
    downloads: 2400000,
    description: "Code formatter with support for multiple languages",
    tags: ["formatting", "code-quality"],
    icon: "✨",
  },
  {
    id: "eslint",
    name: "ESLint",
    author: "OpenJS Foundation",
    version: "8.50.0",
    category: "Linter",
    rating: 4.8,
    downloads: 3100000,
    description: "Find and fix problems in your JavaScript code",
    tags: ["linting", "javascript"],
    icon: "🔍",
  },
  {
    id: "black",
    name: "Black",
    author: "Python Black",
    version: "23.9.1",
    category: "Formatter",
    rating: 4.7,
    downloads: 1800000,
    description: "The uncompromising Python code formatter",
    tags: ["python", "formatting"],
    icon: "⬛",
  },
  {
    id: "pylint",
    name: "Pylint",
    author: "PyCQA",
    version: "2.17.5",
    category: "Linter",
    rating: 4.6,
    downloads: 1500000,
    description: "Analyze Python code for errors and bad habits",
    tags: ["python", "linting"],
    icon: "🐍",
  },
  {
    id: "git-hooks",
    name: "Git Hooks",
    author: "Community",
    version: "2.9.0",
    category: "VCS",
    rating: 4.5,
    downloads: 980000,
    description: "Pre-commit hooks for Git repositories",
    tags: ["git", "automation"],
    icon: "🪝",
  },
  {
    id: "docker-support",
    name: "Docker Support",
    author: "Docker Community",
    version: "1.8.0",
    category: "DevOps",
    rating: 4.7,
    downloads: 1200000,
    description: "Docker container integration and management",
    tags: ["docker", "containers"],
    icon: "🐳",
  },
  {
    id: "rest-client",
    name: "REST Client",
    author: "Huachao",
    version: "0.25.0",
    category: "Tools",
    rating: 4.8,
    downloads: 2100000,
    description: "REST API client for testing endpoints",
    tags: ["rest", "api-testing"],
    icon: "🔌",
  },
  {
    id: "theme-dracula",
    name: "Dracula Theme",
    author: "Dracula",
    version: "2.0.0",
    category: "Theme",
    rating: 4.9,
    downloads: 3500000,
    description: "Dark theme with vibrant colors",
    tags: ["theme", "appearance"],
    icon: "🧛",
  },
];

export default function CommunityPluginsBrowser({ selectedPlugins = [], onTogglePlugin }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [...new Set(COMMUNITY_PLUGINS.map((p) => p.category))];

  const filtered = useMemo(() => {
    return COMMUNITY_PLUGINS.filter((plugin) => {
      const matchesSearch =
        plugin.name.toLowerCase().includes(search.toLowerCase()) ||
        plugin.description.toLowerCase().includes(search.toLowerCase()) ||
        plugin.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = !selectedCategory || plugin.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0f14]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#00c896]" />
            Community Plugins
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Discover and install plugins to enhance your IDE
          </p>
        </div>

        {/* Search and filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search plugins by name, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0e1018] border border-[#1e2330] rounded-lg text-white placeholder-gray-600 focus:border-[#00c896] focus:outline-none transition-colors"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                !selectedCategory
                  ? "bg-[#00c896] text-black font-medium"
                  : "bg-[#0e1018] border border-[#1e2330] text-gray-300 hover:border-[#00c896]/50"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#00c896] text-black font-medium"
                    : "bg-[#0e1018] border border-[#1e2330] text-gray-300 hover:border-[#00c896]/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Plugins grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No plugins found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((plugin) => {
              const isSelected = selectedPlugins.includes(plugin.id);

              return (
                <div
                  key={plugin.id}
                  className="bg-[#0e1018] border border-[#1e2330] rounded-lg p-4 hover:border-[#00c896]/30 transition-colors flex flex-col gap-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-2xl">{plugin.icon}</div>
                    <div className="flex items-center gap-1 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded px-1.5 py-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-yellow-300">{plugin.rating}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-white">{plugin.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" />
                      {plugin.author}
                    </p>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed flex-1">
                    {plugin.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-[#1e2330]">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {(plugin.downloads / 1000000).toFixed(1)}M
                    </div>
                    <span>v{plugin.version}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {plugin.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-[#1a1d26] border border-[#2a2d3a] rounded px-2 py-0.5 text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Install button */}
                  <button
                    onClick={() => onTogglePlugin(plugin.id)}
                    className={`flex items-center justify-center gap-2 py-2 rounded font-medium text-sm transition-colors w-full ${
                      isSelected
                        ? "bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30"
                        : "bg-[#00c896] hover:bg-[#00b084] text-black"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        Installed
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Install
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {selectedPlugins.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-[#0e1018] border border-[#00c896]/30 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-[#00c896]">{selectedPlugins.length}</span> plugin
              {selectedPlugins.length !== 1 ? "s" : ""} selected for installation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}