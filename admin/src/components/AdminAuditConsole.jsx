import React, { useEffect, useState } from "react";
import { ShieldCheck, Lock, Activity, Send, ToggleLeft, ToggleRight, RefreshCw, Key, Globe, Radio } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

export function AdminAuditConsole() {
  const [activeSubTab, setActiveSubTab] = useState("audit");
  const [logs, setLogs] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [featureFlags, setFeatureFlags] = useState({});
  const [loading, setLoading] = useState(false);

  // New Webhook Form State
  const [newWhName, setNewWhName] = useState("");
  const [newWhUrl, setNewWhUrl] = useState("");
  const [newWhEvent, setNewWhEvent] = useState("order.created");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Audit Logs
      const auditRes = await fetch(`${API}/audit/logs`);
      if (auditRes.ok) setLogs(await auditRes.json());

      // 2. Fetch Webhooks
      const whRes = await fetch(`${API}/webhooks`);
      if (whRes.ok) setWebhooks(await whRes.json());

      // 3. Fetch Feature Flags
      const ffRes = await fetch(`${API}/feature-flags`);
      if (ffRes.ok) setFeatureFlags(await ffRes.json());

    } catch (err) {
      console.error("Error loading enterprise console data:", err);
      toast.error("Failed to load Enterprise Security Console");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleFlag = async (flagKey, currentVal) => {
    try {
      const res = await fetch(`${API}/feature-flags/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_key: flagKey, enabled: !currentVal })
      });
      if (res.ok) {
        setFeatureFlags((prev) => ({ ...prev, [flagKey]: !currentVal }));
        toast.success(`Feature flag '${flagKey}' updated to ${!currentVal}`);
      }
    } catch (err) {
      toast.error("Failed to toggle feature flag");
    }
  };

  const handleAddWebhook = async (e) => {
    e.preventDefault();
    if (!newWhName || !newWhUrl) return;

    try {
      const res = await fetch(`${API}/webhooks/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWhName, target_url: newWhUrl, event: newWhEvent })
      });
      if (res.ok) {
        toast.success("Webhook subscription added!");
        setNewWhName("");
        setNewWhUrl("");
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to subscribe webhook");
    }
  };

  const handleTestWebhook = async (event) => {
    try {
      const res = await fetch(`${API}/webhooks/test-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload: { source: "Enterprise Security Console Test" } })
      });
      if (res.ok) {
        toast.success(`HMAC Signed Webhook '${event}' dispatched! ⚡`, { icon: "🚀" });
      }
    } catch (err) {
      toast.error("Test dispatch failed");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#5C1E1E] to-[#2D2118] text-white p-6 rounded-3xl border border-[#B8956A]/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-300 animate-pulse" />
            <h2 className="text-xl font-black text-[#FAF5EC]">Enterprise Security & Audit Console</h2>
          </div>
          <p className="text-xs text-gray-300">
            Audit Trails, HMAC-SHA256 Webhook Subscriptions, and Remote Feature Flags
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-[#FAF5EC] text-[#2D2118] hover:bg-white px-4 py-2 rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Console</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8DFC9] pb-3">
        {[
          { id: "audit", label: "Security Audit Trail", icon: Activity },
          { id: "flags", label: "Dynamic Feature Flags", icon: Radio },
          { id: "webhooks", label: "HMAC Webhooks Engine", icon: Globe }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
                isActive
                  ? "bg-[#5C1E1E] text-white shadow"
                  : "bg-white text-[#2D2118] border border-[#E8DFC9] hover:bg-[#FAF5EC]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Security Audit Trail Tab */}
      {activeSubTab === "audit" && (
        <div className="bg-white rounded-3xl border border-[#E8DFC9] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E8DFC9] font-black text-sm text-[#2D2118] flex justify-between items-center">
            <span>Recent Security Event Logs ({logs.length})</span>
            <span className="text-xs text-gray-400 font-mono">Collection: db.audit_logs</span>
          </div>

          <div className="divide-y divide-[#E8DFC9] max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-gray-400">
                No audit log entries recorded yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAF5EC]/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#5C1E1E] uppercase bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#E8DFC9]">
                        {log.action}
                      </span>
                      <span className="text-xs font-bold text-[#2D2118]">{log.actor_email}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({log.client_ip})</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Target Resource: {log.target_resource}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. Feature Flags Tab */}
      {activeSubTab === "flags" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(featureFlags).map(([flagKey, enabled]) => (
            <div
              key={flagKey}
              className="bg-white border border-[#E8DFC9] p-5 rounded-3xl shadow-sm flex items-center justify-between hover:shadow-md transition"
            >
              <div>
                <h4 className="text-xs font-black text-[#2D2118] font-mono">{flagKey}</h4>
                <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                  Status: {enabled ? "Active 🟢" : "Disabled 🔴"}
                </span>
              </div>
              <button
                onClick={() => handleToggleFlag(flagKey, enabled)}
                className="text-[#5C1E1E] hover:scale-110 transition"
              >
                {enabled ? <ToggleRight className="w-10 h-10 text-emerald-600" /> : <ToggleLeft className="w-10 h-10 text-gray-300" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. HMAC Webhooks Tab */}
      {activeSubTab === "webhooks" && (
        <div className="space-y-6">
          {/* Register Webhook Form */}
          <form onSubmit={handleAddWebhook} className="bg-white p-5 rounded-3xl border border-[#E8DFC9] space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#2D2118]">Register New Webhook Subscription</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Integration Name (e.g. ERP Systems)"
                value={newWhName}
                onChange={(e) => setNewWhName(e.target.value)}
                className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold"
              />
              <input
                type="url"
                required
                placeholder="Target Webhook URL (https://...)"
                value={newWhUrl}
                onChange={(e) => setNewWhUrl(e.target.value)}
                className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold"
              />
              <select
                value={newWhEvent}
                onChange={(e) => setNewWhEvent(e.target.value)}
                className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-bold"
              >
                <option value="order.created">order.created</option>
                <option value="order.updated">order.updated</option>
                <option value="product.low_stock">product.low_stock</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-[#5C1E1E] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow"
            >
              Subscribe Webhook
            </button>
          </form>

          {/* Subscriptions List */}
          <div className="bg-white rounded-3xl border border-[#E8DFC9] overflow-hidden shadow-sm p-4 space-y-3">
            <h4 className="text-xs font-black uppercase text-[#2D2118]">Active Webhooks</h4>
            {webhooks.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 font-semibold">No webhooks subscribed yet.</div>
            ) : (
              webhooks.map((wh) => (
                <div key={wh._id} className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9] flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#2D2118]">{wh.name}</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">{wh.event}</span>
                    </div>
                    <code className="text-[10px] text-gray-400 block mt-0.5">{wh.target_url}</code>
                  </div>
                  <button
                    onClick={() => handleTestWebhook(wh.event)}
                    className="bg-[#2D2118] text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Test Dispatch
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
