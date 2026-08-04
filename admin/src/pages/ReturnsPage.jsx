import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  RotateCcw, DollarSign, CheckCircle2, AlertCircle, RefreshCw, Search,
  Eye, Check, X, ArrowUpRight, BarChart3, Image as ImageIcon, CreditCard,
  Building, Wallet, RefreshCw as ExchangeIcon, ShieldAlert, Sparkles, Filter, Clock
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

export function ReturnsPage() {
  const [activeTab, setActiveTab] = useState("feed"); // "feed" | "exchanges" | "analytics"
  const [returnOrders, setReturnOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "approved" | "rejected"

  // Refund Approval Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    approval_status: "APPROVED",
    payout_status: "PAID",
    refund_amount: 0,
    notes: ""
  });

  // Proof Image Lightbox Modal
  const [previewImage, setPreviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Returns & Analytics ──
  const fetchReturnsData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        axios.get(`${API}/admin/returns`),
        axios.get(`${API}/admin/returns/analytics`).catch(() => ({ data: null }))
      ]);
      setReturnOrders(rRes.data || []);
      setAnalytics(aRes.data);
    } catch {
      toast.error("Failed to load return requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturnsData();
  }, [fetchReturnsData]);

  // Open Approval Modal
  const openApprovalModal = (order) => {
    setSelectedOrder(order);
    const totalAmt = order.total || 0;
    setApprovalForm({
      approval_status: "APPROVED",
      payout_status: "PAID",
      refund_amount: totalAmt,
      notes: "Refund verified and transferred to customer account."
    });
    setShowApprovalModal(true);
  };

  // Submit Refund Decision
  const handleSaveApproval = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const oId = selectedOrder.id || selectedOrder._id;
      await axios.post(`${API}/admin/returns/${oId}/approve`, approvalForm);
      toast.success(`Refund decision (${approvalForm.approval_status}) saved! ✨`);
      setShowApprovalModal(false);
      setSelectedOrder(null);
      fetchReturnsData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to process refund decision");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReturns = returnOrders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (o.order_number || "").toLowerCase().includes(q) ||
      (o.userName || "").toLowerCase().includes(q) ||
      (o.userEmail || "").toLowerCase().includes(q) ||
      (o.id || "").toLowerCase().includes(q);

    let matchesStatus = true;
    const rStatus = o.return_status || (o.return_info?.return_status);
    if (statusFilter === "pending") matchesStatus = rStatus === "Return Requested";
    if (statusFilter === "approved") matchesStatus = ["Refund Processed", "Item Inspected", "Pickup Scheduled"].includes(rStatus);
    if (statusFilter === "rejected") matchesStatus = rStatus === "Return Rejected";

    return matchesSearch && matchesStatus;
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
                Return Operations
              </span>
              <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ₹{analytics?.total_refund_amount?.toLocaleString() || 0} Total Refunds Issued
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Returns, Refunds & Replacement Exchanges
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Process customer return requests, inspect proof photos, approve monetary refunds, manage replacement size exchanges, and audit return analytics.
            </p>
          </div>

          <button onClick={fetchReturnsData} disabled={loading} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {[
            { id: "feed", label: `Return Requests (${returnOrders.length})`, icon: RotateCcw },
            { id: "analytics", label: "Return Analytics & Breakdown", icon: BarChart3 },
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

      {/* Analytics Summary Header */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] block">Total Refunds Issued</span>
              <span className="text-2xl font-black text-red-600">₹{analytics.total_refund_amount?.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] block">Total Return Volume</span>
              <span className="text-2xl font-black text-[#2D2118]">{analytics.total_returns_count} requests</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] block">Approval Rate</span>
              <span className="text-2xl font-black text-emerald-700">{analytics.approval_rate_percent}%</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] block">Pending Inspections</span>
              <span className="text-2xl font-black text-amber-700">
                {returnOrders.filter(o => (o.return_status || o.return_info?.return_status) === "Return Requested").length} pending
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* FEED TAB */}
      {activeTab === "feed" && (
        <div className="space-y-4">

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, customer name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 w-full sm:w-auto">
              {[
                { id: "all", label: "All Requests" },
                { id: "pending", label: "⏳ Pending Approval" },
                { id: "approved", label: "✅ Approved / Refunded" },
                { id: "rejected", label: "❌ Rejected" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    statusFilter === s.id ? "bg-[#5C1E1E] text-white shadow" : "bg-[#FAF5EC] text-[#2D2118]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Return Requests Feed */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-2">
              <RotateCcw className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-bold text-[#2D2118]">No return or refund requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((order) => {
                const oId = order.id || order._id;
                const rInfo = order.return_info || {};
                const rStatus = order.return_status || rInfo.return_status || "Return Requested";
                const proofImg = rInfo.proofImage || rInfo.proof_images?.[0];

                return (
                  <div key={oId} className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DFC9] shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8DFC9] pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-[#2D2118] text-base">{order.order_number || oId}</span>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                            {rStatus}
                          </span>
                          {rInfo.refundMethod && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                              Payout via {rInfo.refundMethod.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Customer: <span className="font-bold text-gray-800">{order.userName || order.userEmail || "Customer"}</span>
                          <span className="text-gray-400 ml-2">· Requested: {rInfo.created_at ? new Date(rInfo.created_at).toLocaleDateString() : "Recently"}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openApprovalModal(order)}
                          className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#4A1717] transition shadow"
                        >
                          Process Refund Approval
                        </button>
                      </div>
                    </div>

                    {/* Return Details & Reason */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-[#FAF5EC] p-3.5 rounded-2xl border border-[#E8DFC9] space-y-1">
                        <span className="text-[10px] font-black uppercase text-[#8B7355]">Reason for Return</span>
                        <p className="font-bold text-[#2D2118]">{rInfo.reason || "Defective / Changed Mind"}</p>
                        {rInfo.reasonDetails && <p className="text-gray-500 italic text-[11px]">"{rInfo.reasonDetails}"</p>}
                      </div>

                      <div className="bg-[#FAF5EC] p-3.5 rounded-2xl border border-[#E8DFC9] space-y-1">
                        <span className="text-[10px] font-black uppercase text-[#8B7355]">Order Value</span>
                        <p className="font-black text-sm text-[#5C1E1E]">₹{order.total}</p>
                        <p className="text-gray-500 text-[11px]">{order.items?.length || 1} items in order</p>
                      </div>

                      {/* Proof Image Lightbox Button */}
                      <div className="bg-[#FAF5EC] p-3.5 rounded-2xl border border-[#E8DFC9] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase text-[#8B7355]">Inspection Photo</span>
                          <p className="text-gray-600 font-bold">{proofImg ? "Proof Photo Uploaded" : "No Photo Attached"}</p>
                        </div>
                        {proofImg && (
                          <button
                            onClick={() => setPreviewImage(proofImg)}
                            className="bg-white border border-[#E8DFC9] p-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition flex items-center gap-1"
                          >
                            <ImageIcon className="w-4 h-4 text-[#5C1E1E]" /> View Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && analytics && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] space-y-6">
          <h3 className="font-black text-base text-[#2D2118]">Return Reasons Distribution</h3>
          <div className="space-y-3 text-xs">
            {Object.entries(analytics.reasons_breakdown || {}).map(([reason, count]) => (
              <div key={reason} className="space-y-1">
                <div className="flex justify-between font-bold text-[#2D2118]">
                  <span>{reason}</span>
                  <span className="text-[#5C1E1E] font-black">{count} returns</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5C1E1E] to-[#8B3A3A] rounded-full"
                    style={{ width: `${Math.max((count / (analytics.total_returns_count || 1)) * 100, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── REFUND APPROVAL MODAL ─── */}
      {showApprovalModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9] relative">
            <button onClick={() => setShowApprovalModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">Process Refund Decision for #{selectedOrder.order_number || selectedOrder.id}</h3>

            <form onSubmit={handleSaveApproval} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#8B7355] block mb-1">Approval Decision</label>
                  <select
                    value={approvalForm.approval_status}
                    onChange={(e) => setApprovalForm({ ...approvalForm, approval_status: e.target.value })}
                    className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                  >
                    <option value="APPROVED">Approve Refund</option>
                    <option value="REJECTED">Reject Return Request</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#8B7355] block mb-1">Payout Status</label>
                  <select
                    value={approvalForm.payout_status}
                    onChange={(e) => setApprovalForm({ ...approvalForm, payout_status: e.target.value })}
                    className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                  >
                    <option value="PAID">PAID (Transferred)</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="UNPAID">UNPAID (Pending)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#8B7355] block mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={approvalForm.refund_amount}
                  onChange={(e) => setApprovalForm({ ...approvalForm, refund_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold text-lg text-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="font-bold text-[#8B7355] block mb-1">Staff Explanation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes on return item inspection and payout confirmation..."
                  value={approvalForm.notes}
                  onChange={(e) => setApprovalForm({ ...approvalForm, notes: e.target.value })}
                  className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl font-bold shadow-lg transition"
              >
                {submitting ? "Saving Decision..." : "Confirm & Save Refund Decision"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── PROOF PHOTO LIGHTBOX MODAL ─── */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl w-full">
            <img src={previewImage} alt="Inspection Proof" className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white font-bold flex items-center gap-1">
              <X className="w-6 h-6" /> Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
