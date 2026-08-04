import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Search, ShoppingBag, Truck, CheckCircle2, Clock, MapPin, Phone, User, X,
  RotateCcw, DollarSign, RefreshCw, AlertCircle, ArrowUpRight, BarChart3,
  CreditCard, PackageCheck, ShieldCheck, FileText, ChevronRight
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const STATUS_OPTIONS = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
const RETURN_STATUS_OPTIONS = ["Return Requested", "Pickup Scheduled", "Item Inspected", "Refund Processed", "Return Rejected"];

export function OrdersPage({ orders = [], onUpdateStatus }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Statistics
  const [refundStats, setRefundStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Active view tab: "fulfillment" | "refunds_analytics"
  const [activeTab, setActiveTab] = useState("fulfillment");

  const fetchRefundStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`${API}/admin/analytics/order-refund-stats`);
      setRefundStats(res.data);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefundStats();
  }, [fetchRefundStats]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter || o.return_status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (o.order_number || "").toLowerCase().includes(q) ||
      (o.userName || "").toLowerCase().includes(q) ||
      (o.userEmail || "").toLowerCase().includes(q) ||
      (o.id || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-white p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Order Operations & Refunds
              </span>
              {refundStats && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ₹{refundStats.summary?.total_revenue?.toLocaleString()} Total Sales
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Recent Orders & Refund Statistics
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Monitor real-time fulfillment pipelines, track return requests, process customer refunds, and audit delivery metrics.
            </p>
          </div>

          <button
            onClick={fetchRefundStats}
            disabled={statsLoading}
            className="flex items-center gap-1.5 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg transition active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin" : ""}`} /> Refresh Stats
          </button>
        </div>

        {/* Inner Tabs */}
        <div className="flex gap-2 mt-5 relative z-10">
          <button
            onClick={() => setActiveTab("fulfillment")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "fulfillment"
                ? "bg-[#FAF5EC] text-[#2D2118] font-black shadow-md"
                : "bg-white/10 text-gray-200 hover:bg-white/20"
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-[#5C1E1E]" /> Order Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("refunds_analytics")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "refunds_analytics"
                ? "bg-[#FAF5EC] text-[#2D2118] font-black shadow-md"
                : "bg-white/10 text-gray-200 hover:bg-white/20"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#5C1E1E]" /> Refund & Return Analytics
          </button>
        </div>
      </div>

      {/* Summary Cards Row */}
      {refundStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Total Sales Volume</span>
              <span className="text-2xl font-black text-[#2D2118]">₹{refundStats.summary?.total_revenue?.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Total Orders</span>
              <span className="text-2xl font-black text-[#2D2118]">{refundStats.summary?.total_orders}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Total Refunds Issued</span>
              <span className="text-2xl font-black text-red-600">₹{refundStats.summary?.total_refund_amount?.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Refund Rate</span>
              <span className="text-2xl font-black text-amber-700">{refundStats.summary?.refund_rate_percent}%</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* REFUND ANALYTICS DASHBOARD VIEW */}
      {activeTab === "refunds_analytics" && refundStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Return & Refund Status Pipeline */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
                <h3 className="font-black text-sm text-[#2D2118] flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#5C1E1E]" /> Return & Refund Status Breakdown
                </h3>
                <span className="text-[10px] font-bold text-gray-500">{refundStats.summary?.total_returns_requested} total requests</span>
              </div>

              <div className="space-y-3 text-xs">
                {Object.entries(refundStats.return_status_breakdown || {}).map(([st, count]) => {
                  const percent = refundStats.summary?.total_orders > 0 ? (count / refundStats.summary.total_orders) * 100 : 0;
                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex justify-between font-bold text-[#2D2118]">
                        <span>{st}</span>
                        <span className="text-[#5C1E1E] font-black">{count} orders</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#5C1E1E] to-[#8B3A3A] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Fulfillment Status Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
                <h3 className="font-black text-sm text-[#2D2118] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#5C1E1E]" /> Order Pipeline Breakdown
                </h3>
                <span className="text-[10px] font-bold text-gray-500">{refundStats.summary?.total_orders} total orders</span>
              </div>

              <div className="space-y-3 text-xs">
                {Object.entries(refundStats.order_status_breakdown || {}).map(([st, count]) => {
                  const percent = refundStats.summary?.total_orders > 0 ? (count / refundStats.summary.total_orders) * 100 : 0;
                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex justify-between font-bold text-[#2D2118]">
                        <span>{st}</span>
                        <span className="text-emerald-700 font-black">{count} orders</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULFILLMENT & RECENT ORDERS TABLE VIEW */}
      {activeTab === "fulfillment" && (
        <div className="space-y-4">

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-[#E8DFC9] shadow-sm">
            <div>
              <h2 className="text-lg font-black text-[#2D2118]">Order Fulfillment Feed ({filteredOrders.length})</h2>
              <p className="text-xs text-gray-500">Filter orders by status or search by customer name, order number, and email.</p>
            </div>

            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by order ID, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
              />
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none bg-white p-2 rounded-2xl border border-[#E8DFC9]">
            {["all", ...STATUS_OPTIONS, ...RETURN_STATUS_OPTIONS].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap uppercase tracking-wider transition ${
                  statusFilter === st
                    ? "bg-[#5C1E1E] text-white shadow-md"
                    : "text-gray-600 hover:bg-[#FAF5EC]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Orders List Feed */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#E8DFC9] text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-700">No Orders Found</h3>
                <p className="text-xs text-gray-500">No customer orders match your current filters.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8DFC9] pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-[#2D2118] text-base">{order.order_number || order.id}</span>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {order.status}
                        </span>
                        {order.return_status && (
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3 text-red-600" /> {order.return_status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Customer: <span className="font-bold text-gray-800">{order.userName || order.userEmail || "Guest User"}</span>
                        {order.placed_at && <span className="text-gray-400 ml-2">· {new Date(order.placed_at).toLocaleDateString()}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                        className="bg-[#FAF5EC] border border-[#E8DFC9] text-xs font-bold px-3 py-2 rounded-xl text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-[#2D2118] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#5C1E1E] transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 flex-1">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[#FAF5EC] p-2 rounded-2xl min-w-[180px] border border-[#E8DFC9]">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-xl shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#2D2118] truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500">Qty: {item.qty} × ₹{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-400 font-bold block uppercase">Total Paid</span>
                      <span className="text-base font-black text-[#5C1E1E]">₹{order.total}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#E8DFC9]">
            <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
              <div>
                <h3 className="font-black text-lg text-[#2D2118]">Receipt #{selectedOrder.order_number || selectedOrder.id}</h3>
                <p className="text-xs text-gray-400">{selectedOrder.placed_at ? new Date(selectedOrder.placed_at).toLocaleString() : "—"}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-1.5">
                <p className="font-bold text-[#2D2118] flex items-center gap-1.5"><User className="w-4 h-4 text-[#5C1E1E]" /> {selectedOrder.userName}</p>
                <p className="text-gray-600 flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#5C1E1E]" /> {selectedOrder.shippingAddress?.phone || selectedOrder.phone || "N/A"}</p>
                <p className="text-gray-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#5C1E1E]" /> {selectedOrder.shippingAddress?.streetAddress || selectedOrder.shippingAddress?.line1}, {selectedOrder.shippingAddress?.city}</p>
              </div>

              <div className="border-t border-[#E8DFC9] pt-3">
                <h4 className="font-bold text-gray-700 mb-2 uppercase text-[10px] tracking-wider">Purchased Items</h4>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-xl">
                      <span className="font-bold text-[#2D2118]">{item.name} (x{item.qty})</span>
                      <span className="font-bold text-[#5C1E1E]">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E8DFC9] pt-3 flex justify-between font-black text-sm text-[#5C1E1E]">
                <span>Grand Total Paid:</span>
                <span>₹{selectedOrder.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
