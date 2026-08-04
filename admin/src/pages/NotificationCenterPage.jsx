import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Bell, CheckCircle2, AlertCircle, ShoppingBag, Package, MessageSquare, RotateCcw,
  Star, RefreshCw, CheckCheck, Trash2, ArrowUpRight, ShieldAlert, Sparkles, Filter
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const NOTIF_TYPES = [
  { id: "all", label: "All Operational Alerts" },
  { id: "ORDER", label: "📦 New Orders", icon: ShoppingBag },
  { id: "LOW_STOCK", label: "⚠️ Low Stock Warnings", icon: Package },
  { id: "RETURN_REQUEST", label: "🔄 Return Requests", icon: RotateCcw },
  { id: "REVIEW", label: "⭐ Product Reviews", icon: Star },
  { id: "CUSTOMER_MESSAGE", label: "💬 Customer Messages", icon: MessageSquare },
];

export function NotificationCenterPage({ onNavigateTab }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Notifications ──
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/notifications`);
      const d = res.data || {};
      setNotifications(d.notifications || []);
      setUnreadCount(d.unread_count || 0);
    } catch {
      toast.error("Failed to load notifications feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark Single Notification as Read
  const handleMarkRead = async (notifId) => {
    try {
      await axios.post(`${API}/admin/notifications/mark-read`, { notification_ids: [notifId] });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Notification marked as read");
    } catch {
      toast.error("Failed to update notification");
    }
  };

  // Mark All Notifications as Read
  const handleMarkAllRead = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API}/admin/notifications/mark-read`, { mark_all: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All operational notifications marked as read! ✨");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Direct Jump Action
  const handleActionClick = (targetTab, notifId) => {
    handleMarkRead(notifId);
    if (onNavigateTab && targetTab) {
      onNavigateTab(targetTab);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter === "all") return true;
    return n.type === typeFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-[#FAF5EC] p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Operations Center
              </span>
              <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} Unread Alerts
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Real-Time Notifications & Operational Alerts
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Live operational feed for New Orders, Low Stock Warnings, Customer Support Messages, Return & Refund Requests, and Product Reviews.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={submitting || unreadCount === 0}
              className="flex items-center gap-1.5 bg-[#5C1E1E] hover:bg-[#4A1717] disabled:opacity-50 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition active:scale-95"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
            <button onClick={fetchNotifications} disabled={loading} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {NOTIF_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                typeFilter === t.id
                  ? "bg-[#FAF5EC] text-[#2D2118] font-black shadow-md"
                  : "bg-white/10 text-gray-200 hover:bg-white/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] block">Unread Alerts</span>
            <span className="text-2xl font-black text-red-600">{unreadCount}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] block">Low Stock Warnings</span>
            <span className="text-2xl font-black text-amber-700">
              {notifications.filter((n) => n.type === "LOW_STOCK").length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] block">Recent Orders</span>
            <span className="text-2xl font-black text-emerald-700">
              {notifications.filter((n) => n.type === "ORDER").length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] block">Return Requests</span>
            <span className="text-2xl font-black text-purple-700">
              {notifications.filter((n) => n.type === "RETURN_REQUEST").length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notifications Feed List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-2">
          <Bell className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="font-bold text-[#2D2118]">No notifications match the filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isUnread = !n.is_read;
            let iconComponent = <Bell className="w-5 h-5 text-gray-600" />;
            let badgeBg = "bg-gray-100 text-gray-800";

            if (n.type === "ORDER") {
              iconComponent = <ShoppingBag className="w-5 h-5 text-emerald-600" />;
              badgeBg = "bg-emerald-100 text-emerald-800 border-emerald-300";
            } else if (n.type === "LOW_STOCK") {
              iconComponent = <Package className="w-5 h-5 text-amber-600" />;
              badgeBg = "bg-amber-100 text-amber-900 border-amber-300";
            } else if (n.type === "RETURN_REQUEST") {
              iconComponent = <RotateCcw className="w-5 h-5 text-purple-600" />;
              badgeBg = "bg-purple-100 text-purple-800 border-purple-300";
            } else if (n.type === "REVIEW") {
              iconComponent = <Star className="w-5 h-5 text-blue-600" />;
              badgeBg = "bg-blue-100 text-blue-800 border-blue-300";
            }

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-3xl border transition shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isUnread ? "bg-white border-[#5C1E1E]/40 shadow-md" : "bg-[#FAF5EC]/60 border-[#E8DFC9] opacity-85"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF5EC] border border-[#E8DFC9] flex items-center justify-center shrink-0 mt-0.5">
                    {iconComponent}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-sm text-[#2D2118]">{n.title}</h4>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {n.type.replace(/_/g, " ")}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{n.message}</p>
                    <span className="text-[10px] text-gray-400 font-bold block">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : "Recently"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {n.target_tab && (
                    <button
                      onClick={() => handleActionClick(n.target_tab, n.id)}
                      className="bg-[#5C1E1E] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[#4A1717] transition shadow flex items-center gap-1 shrink-0"
                    >
                      View & Manage <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-2 bg-[#FAF5EC] border border-[#E8DFC9] text-gray-600 hover:text-black rounded-xl transition shrink-0"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
