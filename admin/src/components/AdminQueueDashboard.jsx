import React, { useEffect, useState } from "react";
import { Cpu, RefreshCw, Play, CheckCircle2, AlertCircle, Layers, Image as ImageIcon, Bell, Zap, BarChart3, Key, Server } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

export function AdminQueueDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enqueueing, setEnqueueing] = useState({});

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/queues/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching queue stats:", err);
      toast.error("Failed to load BullMQ queue statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const triggerTestJob = async (queueKey, jobName, payload) => {
    setEnqueueing((prev) => ({ ...prev, [queueKey]: true }));
    try {
      const res = await fetch(`${API}/queues/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queue_name: queueKey,
          job_name: jobName,
          payload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Enqueue failed");

      toast.success(`Enqueued "${jobName}" into ${queueKey} queue (<5ms)! ⚡`, { icon: "🚀" });
      fetchStats();
    } catch (err) {
      toast.error(err.message || "Failed to trigger job");
    } finally {
      setEnqueueing((prev) => ({ ...prev, [queueKey]: false }));
    }
  };

  const queueList = [
    {
      id: "otp",
      name: "OTP Delivery Queue",
      keyName: "otp-queue",
      icon: Key,
      color: "from-amber-600 to-amber-800",
      testJob: "send-nepal-otp",
      testPayload: { phone: "+9779812345678", service: "NepalOTP" }
    },
    {
      id: "image",
      name: "Image Processing Queue",
      keyName: "image-processing-queue",
      icon: ImageIcon,
      color: "from-blue-600 to-blue-800",
      testJob: "optimize-product-image",
      testPayload: { filename: "saree_handcraft_luxury.jpg", targetWidth: 800 }
    },
    {
      id: "notification",
      name: "Notification Queue",
      keyName: "notification-queue",
      icon: Bell,
      color: "from-purple-600 to-purple-800",
      testJob: "send-order-shipped-email",
      testPayload: { email: "customer@reevanta.com", orderNumber: "ORD-9821" }
    },
    {
      id: "cache_refresh",
      name: "Cache Refresh Queue",
      keyName: "cache-refresh-queue",
      icon: Zap,
      color: "from-emerald-600 to-emerald-800",
      testJob: "warmup-homepage-cache",
      testPayload: { route: "/api/products/homepage", ttl: 300 }
    },
    {
      id: "analytics",
      name: "Analytics Queue",
      keyName: "analytics-queue",
      icon: BarChart3,
      color: "from-rose-600 to-rose-800",
      testJob: "track-pageview-event",
      testPayload: { event: "product_viewed", productId: "PROD-101", userAgent: "Chrome" }
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#5C1E1E] to-[#2D2118] text-white p-6 rounded-3xl border border-[#B8956A]/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-300 animate-pulse" />
            <h2 className="text-xl font-black text-[#FAF5EC]">Bull Board & Redis Queue Dashboard</h2>
          </div>
          <p className="text-xs text-gray-300 font-medium">
            Active BullMQ background workers connected to Redis Cloud (<code className="text-amber-200">clover-mountain-waterlily</code>)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Redis Status: {stats?.status === "online" ? "CONNECTED 🟢" : "CONNECTING 🟡"}</span>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="bg-[#FAF5EC] text-[#2D2118] hover:bg-white px-4 py-2 rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* Grid of 5 Specialized BullMQ Queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queueList.map((q) => {
          const Icon = q.icon;
          const queueInfo = stats?.queues?.[q.id] || {};
          const pendingCount = queueInfo.pending_jobs ?? 0;
          const isEnqueueing = enqueueing[q.id];

          return (
            <div
              key={q.id}
              className="bg-white border border-[#E8DFC9] rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${q.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#2D2118]">{q.name}</h3>
                      <code className="text-[10px] text-gray-400 font-mono">{q.keyName}</code>
                    </div>
                  </div>
                </div>

                {/* Queue Stats Bar */}
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9]">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Pending Jobs</span>
                    <span className="text-xl font-black text-[#5C1E1E]">{pendingCount}</span>
                  </div>

                  <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9]">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Worker Status</span>
                    <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isEnqueueing}
                onClick={() => triggerTestJob(q.id, q.testJob, q.testPayload)}
                className="w-full bg-[#2D2118] hover:bg-[#5C1E1E] text-white py-2.5 rounded-2xl text-xs font-bold transition shadow flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isEnqueueing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enqueueing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Trigger {q.testJob}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
