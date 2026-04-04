import { useState } from "react";
import { Search, Download, Check, Star, ExternalLink, ChevronRight, Zap, Shield, Globe, Database, CreditCard, MessageSquare, Code2, Cloud, BarChart2, Package } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Integrations", icon: Globe },
  { id: "ai", label: "AI & ML", icon: Zap },
  { id: "data", label: "Data & Analytics", icon: Database },
  { id: "devtools", label: "Dev Tools", icon: Code2 },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "monitoring", label: "Monitoring", icon: BarChart2 },
  { id: "cloud", label: "Cloud Services", icon: Cloud },
  { id: "security", label: "Security", icon: Shield },
  { id: "community", label: "Community", icon: Package },
];

const INTEGRATIONS = [
  // AI & ML
  { id: "openai", name: "OpenAI", cat: "ai", icon: "🤖", desc: "GPT-4, DALL·E 3, Whisper, TTS, Embeddings APIs", stars: 4.9, installs: "500k+", docs: "https://platform.openai.com/docs", tags: ["gpt-4", "llm", "image-gen"] },
  { id: "anthropic", name: "Anthropic Claude", cat: "ai", icon: "🧠", desc: "Claude 3.5 Sonnet, Haiku, and Opus for reasoning tasks", stars: 4.8, installs: "200k+", docs: "https://docs.anthropic.com", tags: ["claude", "llm"] },
  { id: "huggingface", name: "Hugging Face", cat: "ai", icon: "🤗", desc: "Access 500k+ models, datasets, and inference endpoints", stars: 4.9, installs: "400k+", docs: "https://huggingface.co/docs", tags: ["transformers", "inference"] },
  { id: "cohere", name: "Cohere", cat: "ai", icon: "🔮", desc: "Command, Embed, Rerank — enterprise-grade NLP APIs", stars: 4.6, installs: "80k+", docs: "https://docs.cohere.com", tags: ["embed", "classify"] },
  { id: "replicate", name: "Replicate", cat: "ai", icon: "⚡", desc: "Run open-source ML models via a simple API", stars: 4.7, installs: "120k+", docs: "https://replicate.com/docs", tags: ["diffusion", "llm", "image"] },
  { id: "together", name: "Together AI", cat: "ai", icon: "🌐", desc: "Fast inference for Llama, Mixtral, and 50+ open models", stars: 4.7, installs: "90k+", docs: "https://docs.together.ai", tags: ["llama", "mixtral"] },
  { id: "google-vertex", name: "Google Vertex AI", cat: "ai", icon: "🔵", desc: "Gemini, PaLM, AutoML, and custom model training", stars: 4.6, installs: "150k+", docs: "https://cloud.google.com/vertex-ai/docs", tags: ["gemini", "palm"] },
  { id: "langchain", name: "LangChain", cat: "ai", icon: "⛓️", desc: "Compose LLM chains, agents, and memory systems", stars: 4.8, installs: "300k+", docs: "https://docs.langchain.com", tags: ["agents", "chains"] },
  { id: "pinecone", name: "Pinecone", cat: "ai", icon: "🌲", desc: "Vector database for AI-native search and retrieval", stars: 4.7, installs: "100k+", docs: "https://docs.pinecone.io", tags: ["vector", "rag"] },
  { id: "ollama", name: "Ollama", cat: "ai", icon: "🦙", desc: "Run Llama 3, Mistral, Phi locally", stars: 4.8, installs: "250k+", docs: "https://ollama.ai/docs", tags: ["local", "llama"] },
  // Data & Analytics
  { id: "postgres", name: "PostgreSQL", cat: "data", icon: "🐘", desc: "Powerful open-source relational database", stars: 4.9, installs: "800k+", docs: "https://www.postgresql.org/docs", tags: ["sql", "rdbms"] },
  { id: "mongodb", name: "MongoDB Atlas", cat: "data", icon: "🍃", desc: "Fully managed MongoDB with search and analytics", stars: 4.7, installs: "600k+", docs: "https://www.mongodb.com/docs", tags: ["nosql", "document"] },
  { id: "redis", name: "Redis", cat: "data", icon: "🔴", desc: "In-memory data store for caching and real-time apps", stars: 4.8, installs: "700k+", docs: "https://redis.io/docs", tags: ["cache", "pub-sub"] },
  { id: "snowflake", name: "Snowflake", cat: "data", icon: "❄️", desc: "Cloud data platform for analytics at scale", stars: 4.6, installs: "200k+", docs: "https://docs.snowflake.com", tags: ["warehouse", "analytics"] },
  { id: "bigquery", name: "BigQuery", cat: "data", icon: "📊", desc: "Serverless data warehouse by Google", stars: 4.7, installs: "300k+", docs: "https://cloud.google.com/bigquery/docs", tags: ["sql", "gcp"] },
  { id: "supabase", name: "Supabase", cat: "data", icon: "⚡", desc: "Open-source Firebase alternative with Postgres", stars: 4.9, installs: "350k+", docs: "https://supabase.com/docs", tags: ["postgres", "realtime"] },
  { id: "planetscale", name: "PlanetScale", cat: "data", icon: "🪐", desc: "Serverless MySQL platform with branching", stars: 4.7, installs: "100k+", docs: "https://planetscale.com/docs", tags: ["mysql", "serverless"] },
  { id: "elasticsearch", name: "Elasticsearch", cat: "data", icon: "🔍", desc: "Distributed search and analytics engine", stars: 4.8, installs: "400k+", docs: "https://www.elastic.co/guide", tags: ["search", "kibana"] },
  // Dev Tools
  { id: "github", name: "GitHub API", cat: "devtools", icon: "🐙", desc: "Repos, issues, PRs, Actions, Packages via REST & GraphQL", stars: 4.9, installs: "1M+", docs: "https://docs.github.com/en/rest", tags: ["git", "ci"] },
  { id: "gitlab", name: "GitLab API", cat: "devtools", icon: "🦊", desc: "Complete DevOps platform API — pipelines, MRs, registry", stars: 4.7, installs: "300k+", docs: "https://docs.gitlab.com/ee/api", tags: ["git", "ci"] },
  { id: "jira", name: "Jira", cat: "devtools", icon: "🔷", desc: "Issue tracking, sprints, and project management", stars: 4.5, installs: "500k+", docs: "https://developer.atlassian.com/server/jira/platform/rest-apis", tags: ["agile", "issues"] },
  { id: "linear", name: "Linear", cat: "devtools", icon: "📐", desc: "Modern issue tracking built for engineering teams", stars: 4.9, installs: "150k+", docs: "https://linear.app/docs/graphql", tags: ["issues", "graphql"] },
  { id: "docker-hub", name: "Docker Hub", cat: "devtools", icon: "🐳", desc: "Container registry and image management", stars: 4.8, installs: "800k+", docs: "https://docs.docker.com/docker-hub", tags: ["containers", "registry"] },
  { id: "sonarqube", name: "SonarQube", cat: "devtools", icon: "🔎", desc: "Code quality and security analysis", stars: 4.6, installs: "200k+", docs: "https://docs.sonarqube.org", tags: ["quality", "security"] },
  { id: "sentry", name: "Sentry", cat: "monitoring", icon: "🚨", desc: "Application error monitoring and performance", stars: 4.8, installs: "400k+", docs: "https://docs.sentry.io", tags: ["errors", "traces"] },
  { id: "datadog", name: "Datadog", cat: "monitoring", icon: "🐶", desc: "Metrics, logs, traces, and dashboards at scale", stars: 4.7, installs: "250k+", docs: "https://docs.datadoghq.com", tags: ["metrics", "apm"] },
  { id: "grafana", name: "Grafana", cat: "monitoring", icon: "📈", desc: "Dashboards and observability for any data source", stars: 4.8, installs: "400k+", docs: "https://grafana.com/docs", tags: ["dashboards", "alerting"] },
  { id: "prometheus", name: "Prometheus", cat: "monitoring", icon: "🔥", desc: "Pull-based metrics collection and alerting", stars: 4.8, installs: "350k+", docs: "https://prometheus.io/docs", tags: ["metrics", "alerting"] },
  // Communication
  { id: "slack", name: "Slack", cat: "communication", icon: "💬", desc: "Send messages, manage channels, interact with users", stars: 4.7, installs: "600k+", docs: "https://api.slack.com", tags: ["messaging", "bots"] },
  { id: "discord", name: "Discord", cat: "communication", icon: "🎮", desc: "Bots, webhooks, guild management via Discord API", stars: 4.7, installs: "400k+", docs: "https://discord.com/developers/docs", tags: ["bots", "webhooks"] },
  { id: "twilio", name: "Twilio", cat: "communication", icon: "📞", desc: "SMS, Voice, WhatsApp, Email communications API", stars: 4.8, installs: "350k+", docs: "https://www.twilio.com/docs", tags: ["sms", "voice", "whatsapp"] },
  { id: "sendgrid", name: "SendGrid", cat: "communication", icon: "📧", desc: "Transactional and marketing email delivery", stars: 4.6, installs: "300k+", docs: "https://docs.sendgrid.com", tags: ["email", "smtp"] },
  { id: "resend", name: "Resend", cat: "communication", icon: "✉️", desc: "Developer-first email API with React templates", stars: 4.8, installs: "80k+", docs: "https://resend.com/docs", tags: ["email", "react"] },
  { id: "telegram", name: "Telegram Bot API", cat: "communication", icon: "✈️", desc: "Build bots, send messages, manage channels", stars: 4.8, installs: "500k+", docs: "https://core.telegram.org/bots/api", tags: ["bots", "messaging"] },
  // Payments
  { id: "stripe", name: "Stripe", cat: "payments", icon: "💳", desc: "Payments, subscriptions, invoicing, Connect, Radar", stars: 4.9, installs: "700k+", docs: "https://stripe.com/docs/api", tags: ["payments", "subscriptions"] },
  { id: "paypal", name: "PayPal", cat: "payments", icon: "🅿️", desc: "Checkout, subscriptions, and payouts APIs", stars: 4.4, installs: "400k+", docs: "https://developer.paypal.com/docs", tags: ["checkout", "payouts"] },
  { id: "square", name: "Square", cat: "payments", icon: "⬛", desc: "POS, online payments, and merchant tools", stars: 4.5, installs: "150k+", docs: "https://developer.squareup.com/docs", tags: ["pos", "payments"] },
  { id: "coinbase", name: "Coinbase Commerce", cat: "payments", icon: "₿", desc: "Accept crypto payments in your application", stars: 4.4, installs: "80k+", docs: "https://docs.cloud.coinbase.com", tags: ["crypto", "btc"] },
  // Cloud Services
  { id: "cloudflare", name: "Cloudflare", cat: "cloud", icon: "🌐", desc: "DNS, CDN, Workers, R2 Storage, D1 Database APIs", stars: 4.8, installs: "500k+", docs: "https://developers.cloudflare.com", tags: ["cdn", "workers", "dns"] },
  { id: "firebase", name: "Firebase", cat: "cloud", icon: "🔥", desc: "Auth, Firestore, Realtime DB, Storage, Hosting", stars: 4.8, installs: "800k+", docs: "https://firebase.google.com/docs", tags: ["auth", "firestore"] },
  { id: "auth0", name: "Auth0", cat: "security", icon: "🔐", desc: "Authentication and authorization as a service", stars: 4.7, installs: "350k+", docs: "https://auth0.com/docs", tags: ["auth", "oauth"] },
  { id: "aws-s3", name: "AWS S3 / R2", cat: "cloud", icon: "🗄️", desc: "Object storage API (compatible: S3, R2, MinIO, Wasabi)", stars: 4.8, installs: "900k+", docs: "https://docs.aws.amazon.com/s3", tags: ["storage", "s3"] },
  { id: "neon", name: "Neon (Serverless PG)", cat: "data", icon: "🌙", desc: "Serverless Postgres with branching and autoscaling", stars: 4.8, installs: "120k+", docs: "https://neon.tech/docs", tags: ["postgres", "serverless"] },
  // Security
  { id: "snyk", name: "Snyk", cat: "security", icon: "🛡️", desc: "Vulnerability scanning for code, containers, and IaC", stars: 4.7, installs: "200k+", docs: "https://docs.snyk.io", tags: ["vulnerabilities", "scanning"] },
  { id: "vault", name: "HashiCorp Vault", cat: "security", icon: "🔒", desc: "Secrets management and encryption as a service", stars: 4.8, installs: "250k+", docs: "https://developer.hashicorp.com/vault/docs", tags: ["secrets", "encryption"] },
  // Community
  { id: "npm", name: "npm Registry", cat: "community", icon: "📦", desc: "Search, install, and audit npm packages", stars: 4.8, installs: "2M+", docs: "https://docs.npmjs.com", tags: ["packages", "node"] },
  { id: "pypi", name: "PyPI", cat: "community", icon: "🐍", desc: "Python Package Index — install and search packages", stars: 4.8, installs: "1.5M+", docs: "https://pypi.org", tags: ["python", "packages"] },
  { id: "github-actions", name: "GitHub Actions", cat: "devtools", icon: "🎬", desc: "CI/CD workflows — trigger, monitor, and interact", stars: 4.9, installs: "600k+", docs: "https://docs.github.com/en/actions", tags: ["ci", "cd", "workflows"] },
  { id: "zapier", name: "Zapier Webhooks", cat: "community", icon: "⚡", desc: "Connect to 6,000+ apps via Zapier triggers & actions", stars: 4.6, installs: "400k+", docs: "https://zapier.com/developer", tags: ["automation", "webhooks"] },
  { id: "make", name: "Make (Integromat)", cat: "community", icon: "🔧", desc: "Visual workflow automation for any API", stars: 4.6, installs: "200k+", docs: "https://www.make.com/en/help", tags: ["automation", "no-code"] },
  { id: "notion", name: "Notion API", cat: "community", icon: "📝", desc: "Databases, pages, and blocks for your workspace", stars: 4.6, installs: "200k+", docs: "https://developers.notion.com", tags: ["docs", "database"] },
  { id: "airtable", name: "Airtable", cat: "community", icon: "📋", desc: "Flexible spreadsheet-database hybrid API", stars: 4.6, installs: "250k+", docs: "https://airtable.com/developers/web/api/introduction", tags: ["database", "spreadsheet"] },
];

export default function IntegrationsPanel() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [installed, setInstalled] = useState(new Set(["openai", "github", "stripe", "sentry"]));
  const [installing, setInstalling] = useState(null);

  const install = async (id) => {
    setInstalling(id);
    await new Promise((r) => setTimeout(r, 1000));
    setInstalled((p) => new Set([...p, id]));
    setInstalling(null);
  };
  const uninstall = (id) => setInstalled((p) => { const n = new Set(p); n.delete(id); return n; });

  const filtered = INTEGRATIONS.filter((i) => {
    const matchCat = activeCat === "all" || i.cat === activeCat;
    const q = search.toLowerCase();
    const matchSearch = !search || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.tags.some((t) => t.includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d0f14]">
      {/* Sidebar */}
      <div className="w-52 shrink-0 bg-[#0a0c11] border-r border-[#1e2330] flex flex-col overflow-y-auto">
        <div className="px-3 py-3 border-b border-[#1e2330]">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Integrations</span>
          <div className="text-xs text-gray-600 mt-0.5">{installed.size} active</div>
        </div>
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveCat(id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 text-left border-l-2 transition-colors ${
              activeCat === id ? "bg-[#1a1d26] border-l-[#00c896] text-white" : "border-l-transparent text-gray-500 hover:text-gray-200 hover:bg-[#1a1d26]"
            }`}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">{label}</span>
            <span className="ml-auto text-xs text-gray-600">{id === "all" ? INTEGRATIONS.length : INTEGRATIONS.filter((i) => i.cat === id).length}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-[#1e2330] bg-[#0a0c11]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value) setActiveCat("all"); }}
              placeholder="Search integrations, APIs, tools..."
              className="w-full bg-[#1a1d26] border border-[#2a2d3a] text-gray-200 text-sm pl-9 pr-4 py-2 rounded-lg outline-none focus:border-[#00c896] placeholder-gray-600 transition-colors"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-300">{search ? "Search Results" : CATEGORIES.find((c) => c.id === activeCat)?.label}</span>
            <span className="text-xs text-gray-600">{filtered.length} integrations</span>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-600 text-sm">No integrations found for "{search}"</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((item) => {
              const isInstalled = installed.has(item.id);
              const isInstalling = installing === item.id;
              return (
                <div key={item.id} className={`bg-[#0e1018] border rounded-lg p-4 flex flex-col gap-3 transition-all ${isInstalled ? "border-[#00c896]/20" : "border-[#1e2330] hover:border-[#2a2d3a]"}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1a1d26] flex items-center justify-center text-lg shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                        {isInstalled && <span className="text-xs bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20 px-1.5 py-0.5 rounded">Active</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs bg-[#1a1d26] text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500" />{item.stars}</span>
                      <span>{item.installs}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={item.docs} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-300 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => isInstalled ? uninstall(item.id) : install(item.id)} disabled={isInstalling}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          isInstalled ? "bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 hover:text-red-400 hover:border-red-400/30"
                            : "bg-[#00c896] hover:bg-[#00b084] text-black"
                        }`}>
                        {isInstalling ? "Adding..." : isInstalled ? <><Check className="w-3 h-3" /> Added</> : <><Download className="w-3 h-3" /> Add</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}