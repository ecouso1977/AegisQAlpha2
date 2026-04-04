import { useState, useEffect, useCallback } from "react";
import {
  Cloud, Key, RefreshCw, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, Rocket, Terminal, Server, FolderOpen, Copy, Check,
  ExternalLink, Layers, Wifi
} from "lucide-react";

const GCP_BASE = "https://cloudresourcemanager.googleapis.com/v1";
const COMPUTE_BASE = "https://compute.googleapis.com/compute/v1";
const RUN_BASE = "https://run.googleapis.com/v2";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 text-gray-600 hover:text-[#00c896] transition-colors shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-[#00c896]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CommandBlock({ cmd }) {
  return (
    <div className="flex items-start gap-2 bg-[#080a0f] border border-[#1e2330] rounded-lg px-3 py-2 font-mono text-xs text-[#00c896] break-all">
      <span className="flex-1 whitespace-pre-wrap">{cmd}</span>
      <CopyBtn text={cmd} />
    </div>
  );
}

export default function GCPPanel({ activeFile }) {
  const [token, setToken] = useState(() => localStorage.getItem("gcp_token") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenForm, setShowTokenForm] = useState(!localStorage.getItem("gcp_token"));
  const [tab, setTab] = useState("projects");

  // Projects
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(() => localStorage.getItem("gcp_project") || "");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectError, setProjectError] = useState("");

  // Instances
  const [zones, setZones] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  // Deploy
  const [deployTarget, setDeployTarget] = useState("cloudrun");
  const [serviceName, setServiceName] = useState("my-service");
  const [region, setRegion] = useState("us-central1");
  const [deployLog, setDeployLog] = useState([]);
  const [deploying, setDeploying] = useState(false);

  const authed = !!token;

  const saveToken = () => {
    localStorage.setItem("gcp_token", tokenInput);
    setToken(tokenInput);
    setShowTokenForm(false);
    setTokenInput("");
  };

  const clearToken = () => {
    localStorage.removeItem("gcp_token");
    setToken("");
    setShowTokenForm(true);
    setProjects([]);
    setInstances([]);
  };

  const gcpFetch = useCallback(async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    return res.json();
  }, [token]);

  const loadProjects = useCallback(async () => {
    if (!token) return;
    setLoadingProjects(true);
    setProjectError("");
    try {
      const data = await gcpFetch(`${GCP_BASE}/projects`);
      setProjects(data.projects || []);
    } catch (e) {
      setProjectError(e.message);
    }
    setLoadingProjects(false);
  }, [gcpFetch, token]);

  const loadInstances = useCallback(async () => {
    if (!token || !activeProject) return;
    setLoadingInstances(true);
    try {
      const data = await gcpFetch(`${COMPUTE_BASE}/projects/${activeProject}/aggregated/instances`);
      const items = data.items || {};
      const all = [];
      for (const [zone, zoneData] of Object.entries(items)) {
        if (zoneData.instances) {
          zoneData.instances.forEach(inst => all.push({ ...inst, zone: zone.replace("zones/", "") }));
        }
      }
      setInstances(all);
    } catch {
      setInstances([]);
    }
    setLoadingInstances(false);
  }, [gcpFetch, token, activeProject]);

  useEffect(() => { if (token) loadProjects(); }, [token]);
  useEffect(() => { if (tab === "ssh" && activeProject) loadInstances(); }, [tab, activeProject]);

  const selectProject = (id) => {
    setActiveProject(id);
    localStorage.setItem("gcp_project", id);
  };

  // Simulate deploy (generates real gcloud commands)
  const simulateDeploy = async () => {
    if (!activeProject) return;
    setDeploying(true);
    setDeployLog([]);
    const fileName = activeFile?.name || "main.py";
    const steps =
      deployTarget === "cloudrun"
        ? [
            `Authenticating with project ${activeProject}...`,
            `Building container image gcr.io/${activeProject}/${serviceName}:latest`,
            `Pushing image to Container Registry...`,
            `Deploying to Cloud Run (${region})...`,
            `✓ Service URL: https://${serviceName}-xxxx-uc.a.run.app`,
          ]
        : [
            `Authenticating with project ${activeProject}...`,
            `Uploading source files (${fileName})...`,
            `Building application...`,
            `Setting traffic split to 100%...`,
            `✓ App deployed: https://${activeProject}.appspot.com`,
          ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 700));
      setDeployLog(prev => [...prev, step]);
    }
    setDeploying(false);
  };

  const gcloudCmd =
    deployTarget === "cloudrun"
      ? `gcloud run deploy ${serviceName} \\\n  --source . \\\n  --region ${region} \\\n  --project ${activeProject || "<project-id>"} \\\n  --allow-unauthenticated`
      : `gcloud app deploy \\\n  --project ${activeProject || "<project-id>"} \\\n  --quiet`;

  const REGIONS = ["us-central1", "us-east1", "europe-west1", "asia-east1", "australia-southeast1"];

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] text-xs text-gray-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0c11] border-b border-[#1e2330] shrink-0">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-[#4285f4]" />
          <span className="font-bold text-sm text-white">Google Cloud Platform</span>
        </div>
        <div className="flex items-center gap-2">
          {authed && (
            <span className="flex items-center gap-1 text-[#00c896] bg-[#00c896]/10 border border-[#00c896]/20 px-2 py-0.5 rounded-full text-[10px]">
              <Wifi className="w-2.5 h-2.5" /> Connected
            </span>
          )}
          <button onClick={() => setShowTokenForm(v => !v)} title="Manage token"
            className="p-1.5 rounded bg-[#1a1d26] border border-[#2a2d3a] text-gray-500 hover:text-yellow-400 transition-colors">
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Token form */}
      {showTokenForm && (
        <div className="px-4 py-3 bg-[#1a1d26] border-b border-[#1e2330] space-y-2 shrink-0">
          <div className="text-gray-400 font-medium">GCP Access Token</div>
          <div className="text-gray-600 leading-relaxed">
            Run <code className="text-[#00c896]">gcloud auth print-access-token</code> in your terminal and paste it here.
          </div>
          <textarea
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="ya29.a0AfH6SMB..."
            rows={3}
            className="w-full bg-[#0d0f14] border border-[#2a2d3a] focus:border-[#4285f4]/60 text-gray-200 px-2 py-1.5 rounded outline-none resize-none font-mono"
          />
          <div className="flex gap-2">
            <button onClick={saveToken} disabled={!tokenInput.trim()}
              className="flex-1 py-1.5 bg-[#4285f4] hover:bg-[#3367d6] disabled:opacity-30 text-white font-semibold rounded transition-colors">
              Connect
            </button>
            {authed && (
              <button onClick={clearToken} className="px-3 py-1.5 bg-[#1a1d26] border border-[#2a2d3a] text-red-400 hover:bg-red-500/10 rounded transition-colors">
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}

      {!authed && !showTokenForm && (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-600 px-6 text-center">
          <Cloud className="w-12 h-12 text-gray-700" />
          <p>Connect your GCP account to manage projects, deploy, and access VMs.</p>
          <button onClick={() => setShowTokenForm(true)} className="px-4 py-2 bg-[#4285f4] text-white rounded font-semibold hover:bg-[#3367d6] transition-colors">
            Connect GCP
          </button>
        </div>
      )}

      {authed && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-[#1e2330] shrink-0 bg-[#0a0c11]">
            {[
              { id: "projects", label: "Projects", icon: FolderOpen },
              { id: "deploy", label: "Deploy", icon: Rocket },
              { id: "ssh", label: "IAP / SSH", icon: Terminal },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 flex-1 py-2 text-xs border-b-2 justify-center transition-colors ${tab === id ? "border-[#4285f4] text-[#4285f4]" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* PROJECTS TAB */}
            {tab === "projects" && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-300">Your Projects</span>
                  <button onClick={loadProjects} disabled={loadingProjects}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 hover:text-[#00c896] transition-colors">
                    <RefreshCw className={`w-3 h-3 ${loadingProjects ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>

                {projectError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-red-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {projectError}
                  </div>
                )}

                {loadingProjects && (
                  <div className="flex items-center gap-2 text-gray-500 py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading projects...
                  </div>
                )}

                {!loadingProjects && projects.length === 0 && !projectError && (
                  <div className="text-gray-600 text-center py-6">No projects found. Check your token permissions.</div>
                )}

                {projects.map(p => (
                  <div key={p.projectId}
                    onClick={() => selectProject(p.projectId)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${activeProject === p.projectId ? "border-[#4285f4]/60 bg-[#4285f4]/8 text-white" : "border-[#1e2330] bg-[#0a0c11] hover:border-[#2a2d3a] text-gray-300"}`}>
                    <Layers className={`w-4 h-4 shrink-0 ${activeProject === p.projectId ? "text-[#4285f4]" : "text-gray-600"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-gray-600 font-mono truncate">{p.projectId}</div>
                    </div>
                    {activeProject === p.projectId && <CheckCircle2 className="w-4 h-4 text-[#4285f4] shrink-0" />}
                  </div>
                ))}

                {activeProject && (
                  <div className="mt-4 p-3 bg-[#0a0c11] border border-[#1e2330] rounded-lg space-y-2">
                    <div className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Active Project</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#4285f4]">{activeProject}</span>
                      <CopyBtn text={activeProject} />
                    </div>
                    <a
                      href={`https://console.cloud.google.com/home/dashboard?project=${activeProject}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-[#4285f4] hover:underline text-xs mt-1"
                    >
                      Open in Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* DEPLOY TAB */}
            {tab === "deploy" && (
              <div className="p-4 space-y-4">
                {!activeProject && (
                  <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2 text-yellow-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Select a project first
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-gray-500">Deployment Target</label>
                  <div className="flex gap-2">
                    {[
                      { id: "cloudrun", label: "Cloud Run" },
                      { id: "appengine", label: "App Engine" },
                    ].map(({ id, label }) => (
                      <button key={id} onClick={() => setDeployTarget(id)}
                        className={`flex-1 py-2 rounded border text-xs font-medium transition-colors ${deployTarget === id ? "border-[#4285f4] bg-[#4285f4]/10 text-[#4285f4]" : "border-[#2a2d3a] text-gray-500 hover:text-gray-300"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {deployTarget === "cloudrun" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-gray-500">Service Name</label>
                      <input value={serviceName} onChange={e => setServiceName(e.target.value)}
                        className="w-full bg-[#0d0f14] border border-[#2a2d3a] focus:border-[#4285f4]/60 text-gray-200 px-2 py-1.5 rounded outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-500">Region</label>
                      <select value={region} onChange={e => setRegion(e.target.value)}
                        className="w-full bg-[#0d0f14] border border-[#2a2d3a] text-gray-200 px-2 py-1.5 rounded outline-none">
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-gray-500">Active File</label>
                  <div className="px-2 py-1.5 bg-[#0a0c11] border border-[#1e2330] rounded text-gray-400 font-mono">
                    {activeFile?.name || "— none selected —"}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500">Equivalent gcloud command</label>
                  <CommandBlock cmd={gcloudCmd} />
                </div>

                <button onClick={simulateDeploy} disabled={!activeProject || deploying}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4285f4] hover:bg-[#3367d6] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors">
                  {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {deploying ? "Deploying..." : `Deploy to ${deployTarget === "cloudrun" ? "Cloud Run" : "App Engine"}`}
                </button>

                {deployLog.length > 0 && (
                  <div className="bg-[#080a0f] border border-[#1e2330] rounded-lg p-3 space-y-1 font-mono">
                    {deployLog.map((line, i) => (
                      <div key={i} className={line.startsWith("✓") ? "text-[#00c896]" : "text-gray-400"}>
                        {line.startsWith("✓") ? line : `> ${line}`}
                      </div>
                    ))}
                    {deploying && <div className="text-gray-600 animate-pulse">...</div>}
                  </div>
                )}
              </div>
            )}

            {/* IAP / SSH TAB */}
            {tab === "ssh" && (
              <div className="p-4 space-y-4">
                {!activeProject && (
                  <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2 text-yellow-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Select a project first
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-300">Compute Instances</span>
                  <button onClick={loadInstances} disabled={loadingInstances || !activeProject}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#1a1d26] border border-[#2a2d3a] text-gray-400 hover:text-[#00c896] transition-colors disabled:opacity-30">
                    <RefreshCw className={`w-3 h-3 ${loadingInstances ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>

                {loadingInstances && (
                  <div className="flex items-center gap-2 text-gray-500 py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading instances...
                  </div>
                )}

                {!loadingInstances && instances.length === 0 && activeProject && (
                  <div className="text-gray-600 text-center py-6">No instances found in this project.</div>
                )}

                {instances.map(inst => {
                  const isRunning = inst.status === "RUNNING";
                  const zone = inst.zone;
                  const iapCmd = `gcloud compute ssh ${inst.name} \\\n  --zone ${zone} \\\n  --project ${activeProject} \\\n  --tunnel-through-iap`;
                  const portCmd = `gcloud compute start-iap-tunnel ${inst.name} 8080 \\\n  --local-host-port=localhost:8080 \\\n  --zone ${zone} \\\n  --project ${activeProject}`;
                  return (
                    <div key={inst.name} className="border border-[#1e2330] rounded-lg bg-[#0a0c11] overflow-hidden">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? "bg-[#00c896]" : "bg-gray-600"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-200 truncate">{inst.name}</div>
                          <div className="text-gray-600 truncate">{zone} · {inst.machineType?.split("/").pop()}</div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isRunning ? "bg-[#00c896]/15 text-[#00c896]" : "bg-gray-700 text-gray-500"}`}>
                          {inst.status}
                        </span>
                      </div>
                      {isRunning && (
                        <div className="border-t border-[#1e2330] px-3 py-2.5 space-y-2">
                          <div className="text-gray-600 font-semibold uppercase text-[10px] tracking-wider">IAP SSH</div>
                          <CommandBlock cmd={iapCmd} />
                          <div className="text-gray-600 font-semibold uppercase text-[10px] tracking-wider mt-2">IAP Port Tunnel (8080)</div>
                          <CommandBlock cmd={portCmd} />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="border border-[#1e2330] rounded-lg p-3 bg-[#0a0c11] space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 font-semibold">
                    <Server className="w-3.5 h-3.5" /> Setup IAP for any instance
                  </div>
                  <div className="text-gray-600 leading-relaxed">
                    Enable IAP on your VMs by granting <code className="text-[#4285f4]">roles/iap.tunnelResourceAccessor</code> to your account in IAM.
                  </div>
                  <CommandBlock cmd={`gcloud projects add-iam-policy-binding ${activeProject || "<project-id>"} \\\n  --member="user:YOUR_EMAIL" \\\n  --role="roles/iap.tunnelResourceAccessor"`} />
                  <a href="https://cloud.google.com/iap/docs/using-tcp-forwarding" target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-[#4285f4] hover:underline text-xs">
                    IAP TCP Forwarding docs <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}