import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ShieldCheck, Lock, Key, Database, FileText, AlertTriangle, UserCheck,
  RefreshCw, Plus, Trash2, Edit, Check, X, Download, ShieldAlert, Cpu, Globe, Search
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

export function SecurityManagerPage() {
  const [activeTab, setActiveTab] = useState("logs"); // "logs" | "ip" | "backups" | "audit" | "sessions" | "apikeys"

  // Data States
  const [loginLogs, setLoginLogs] = useState([]);
  const [ipList, setIpList] = useState([]);
  const [backups, setBackups] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showIpModal, setShowIpModal] = useState(false);
  const [ipForm, setIpForm] = useState({ ip_address: "", label: "", is_active: true });

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({ key_name: "", permissions: ["read_products", "manage_orders"] });
  const [createdSecret, setCreatedSecret] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // ── Fetch All Security Data ──
  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, iRes, bRes, aRes, sRes, kRes] = await Promise.all([
        axios.get(`${API}/admin/security/login-logs`),
        axios.get(`${API}/admin/security/ip-whitelist`),
        axios.get(`${API}/admin/security/backups`),
        axios.get(`${API}/admin/security/audit-logs`),
        axios.get(`${API}/admin/security/sessions`),
        axios.get(`${API}/admin/security/api-keys`)
      ]);
      setLoginLogs(lRes.data || []);
      setIpList(iRes.data || []);
      setBackups(bRes.data || []);
      setAuditLogs(aRes.data || []);
      setSessions(sRes.data || []);
      setApiKeys(kRes.data || []);
    } catch {
      toast.error("Failed to load security & audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  // Create IP Whitelist Rule
  const handleSaveIpRule = async (e) => {
    e.preventDefault();
    if (!ipForm.ip_address.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/admin/security/ip-whitelist`, ipForm);
      toast.success(`IP Whitelist rule '${ipForm.ip_address}' added! 🛡️`);
      setShowIpModal(false);
      setIpForm({ ip_address: "", label: "", is_active: true });
      fetchSecurityData();
    } catch {
      toast.error("Failed to add IP whitelist rule");
    } finally {
      setSubmitting(false);
    }
  };

  // Create Instant Database Backup
  const handleCreateBackup = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/admin/security/backups/create`, { backup_name: `Manual Snapshot ${new Date().toLocaleTimeString()}` });
      toast.success(`Database backup '${res.data.backup_name}' created! 💾`);
      fetchSecurityData();
    } catch {
      toast.error("Failed to create database backup");
    } finally {
      setSubmitting(false);
    }
  };

  // Create API Key
  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!keyForm.key_name.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/admin/security/api-keys`, keyForm);
      setCreatedSecret(res.data.secret_key_full);
      toast.success(`API Key '${keyForm.key_name}' generated! 🔑`);
      fetchSecurityData();
    } catch {
      toast.error("Failed to generate API Key");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-[#FAF5EC] p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Compliance & Security
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                256-bit AES Encryption Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Security, Compliance & Audit Control Center
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Audit admin login logs, track failed sign-in attempts, restrict IP access, trigger database backups, inspect immutable audit trails, and manage API keys.
            </p>
          </div>

          <button onClick={fetchSecurityData} disabled={loading} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {[
            { id: "logs", label: "Login Logs & Failed Attempts", icon: Lock },
            { id: "ip", label: `IP Whitelist (${ipList.length})`, icon: ShieldCheck },
            { id: "backups", label: `DB Backups (${backups.length})`, icon: Database },
            { id: "audit", label: `Audit Trail (${auditLogs.length})`, icon: FileText },
            { id: "sessions", label: "Active Sessions", icon: UserCheck },
            { id: "apikeys", label: `API Keys (${apiKeys.length})`, icon: Key },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeTab === t.id
                    ? "bg-[#FAF5EC] text-[#2D2118] font-black shadow-md"
                    : "bg-white/10 text-gray-200 hover:bg-white/20"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeTab === t.id ? "text-[#5C1E1E]" : "text-gray-300"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* TAB 1: LOGIN LOGS & FAILED ATTEMPTS */}
          {activeTab === "logs" && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <h3 className="font-black text-base text-[#2D2118]">Admin Sign-In Audit Stream & Failed Attempts</h3>

              <div className="space-y-3 text-xs">
                {loginLogs.map((l, i) => {
                  const isSuccess = l.status === "SUCCESS";
                  return (
                    <div key={i} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2D2118]">{l.email}</span>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${isSuccess ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-red-100 text-red-800 border-red-300"}`}>
                            {l.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">IP: {l.ip_address} · {l.user_agent}</p>
                      </div>

                      <span className="text-[10px] text-gray-400 font-bold">{l.timestamp ? new Date(l.timestamp).toLocaleString() : "Recently"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: IP WHITELIST */}
          {activeTab === "ip" && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
                <h3 className="font-black text-base text-[#2D2118]">Whitelisted IP Addresses & Subnets</h3>
                <button onClick={() => setShowIpModal(true)} className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add IP Whitelist Rule
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {ipList.map((ip, i) => (
                  <div key={i} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] flex justify-between items-center">
                    <div>
                      <span className="font-mono font-black text-sm text-[#5C1E1E]">{ip.ip_address}</span>
                      <p className="text-gray-600 font-bold text-xs">{ip.label}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Whitelisted
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DATABASE BACKUPS */}
          {activeTab === "backups" && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
                <h3 className="font-black text-base text-[#2D2118]">Database Snapshots & Recovery</h3>
                <button onClick={handleCreateBackup} disabled={submitting} className="bg-[#5C1E1E] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow">
                  <Database className="w-4 h-4" /> Create Instant Backup
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {backups.map((b, i) => (
                  <div key={i} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] flex justify-between items-center">
                    <div>
                      <span className="font-black text-sm text-[#2D2118]">{b.backup_name}</span>
                      <p className="text-gray-500 text-[11px]">{b.total_documents || 0} total documents · Size: {b.file_size_approx || "50 KB"}</p>
                    </div>
                    <span className="bg-purple-100 text-purple-800 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">Snapshot Saved</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <h3 className="font-black text-base text-[#2D2118]">Immutable Administrative Action Audit Trail</h3>

              <div className="space-y-3 text-xs">
                {auditLogs.map((a, i) => (
                  <div key={i} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2D2118]">{a.actor}</span>
                        <span className="bg-[#5C1E1E] text-white text-[9px] font-black px-2 py-0.5 rounded-full">{a.resource}</span>
                      </div>
                      <p className="text-gray-600 font-medium text-xs mt-0.5">{a.action} — {a.notes}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">{a.timestamp ? new Date(a.timestamp).toLocaleString() : "Recently"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVE SESSIONS */}
          {activeTab === "sessions" && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <h3 className="font-black text-base text-[#2D2118]">Active Admin Sign-In Sessions</h3>

              <div className="space-y-3 text-xs">
                {sessions.map((s, i) => (
                  <div key={i} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2D2118]">{s.admin_email}</span>
                        {s.is_current && <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Current Session</span>}
                      </div>
                      <p className="text-gray-500 font-mono text-[11px] mt-0.5">IP: {s.ip_address} · {s.user_agent}</p>
                    </div>
                    <button className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl font-bold">Revoke Session</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: API KEYS */}
          {activeTab === "apikeys" && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
                <h3 className="font-black text-base text-[#2D2118]">API Keys & External Service Credentials</h3>
                <button onClick={() => setShowKeyModal(true)} className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Key className="w-4 h-4" /> Generate New API Key
                </button>
              </div>

              {createdSecret && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-300 text-xs space-y-1">
                  <span className="font-black text-emerald-900 block">NEW API SECRET KEY CREATED (SAVE NOW):</span>
                  <p className="font-mono font-bold text-emerald-800 text-sm break-all">{createdSecret}</p>
                </div>
              )}

              <div className="space-y-3 text-xs">
                {apiKeys.map((k, i) => (
                  <div key={i} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-[#2D2118]">{k.key_name}</span>
                      <p className="font-mono text-gray-500 text-[11px]">{k.api_key_masked}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── ADD IP MODAL ─── */}
      {showIpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9] relative">
            <button onClick={() => setShowIpModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">Add Whitelisted IP Address</h3>

            <form onSubmit={handleSaveIpRule} className="space-y-3 text-xs">
              <input type="text" required placeholder="IP Address (e.g. 103.10.28.15) *" value={ipForm.ip_address} onChange={(e) => setIpForm({ ...ipForm, ip_address: e.target.value })} className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-mono font-bold" />
              <input type="text" placeholder="Label / Description" value={ipForm.label} onChange={(e) => setIpForm({ ...ipForm, label: e.target.value })} className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-bold" />
              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Add IP Rule</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── GENERATE API KEY MODAL ─── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9] relative">
            <button onClick={() => setShowKeyModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">Generate Scoped API Key</h3>

            <form onSubmit={handleGenerateKey} className="space-y-3 text-xs">
              <input type="text" required placeholder="API Key Name *" value={keyForm.key_name} onChange={(e) => setKeyForm({ ...keyForm, key_name: e.target.value })} className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-bold" />
              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Generate Secret Key</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
