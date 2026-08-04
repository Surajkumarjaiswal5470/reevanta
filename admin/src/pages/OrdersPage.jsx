import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Search, ShoppingBag, Truck, CheckCircle2, Clock, MapPin, Phone, User, X,
  RotateCcw, DollarSign, RefreshCw, AlertCircle, ArrowUpRight, BarChart3,
  CreditCard, PackageCheck, ShieldCheck, FileText, ChevronRight, Gift,
  Edit, Printer, QrCode, Plus, Check, Tag, Building
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const STATUS_OPTIONS = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Refunded"];
const RETURN_STATUS_OPTIONS = ["Return Requested", "Pickup Scheduled", "Item Inspected", "Refund Processed", "Return Rejected"];
const COURIER_OPTIONS = ["Nepal Express", "DHL Express", "FedEx International", "Aramex", "Custom Courier"];

export function OrdersPage({ orders = [], onUpdateStatus }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalTab, setOrderModalTab] = useState("details"); // "details" | "tracking" | "timeline" | "gift"

  // Thermal Shipping Label Modal
  const [showShippingLabel, setShowShippingLabel] = useState(false);
  const [labelOrder, setLabelOrder] = useState(null);

  // Statistics
  const [refundStats, setRefundStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Active view tab: "fulfillment" | "refunds_analytics"
  const [activeTab, setActiveTab] = useState("fulfillment");

  // Form states for modal
  const [trackingForm, setTrackingForm] = useState({ courier: "Nepal Express", trackingNumber: "", trackingUrl: "" });
  const [shipmentForm, setShipmentForm] = useState({ courier: "Nepal Express", tracking_number: "", tracking_url: "" });
  const [giftForm, setGiftForm] = useState({ is_gift: true, gift_message: "", gift_wrap: true, hide_prices_on_packing_slip: true });
  const [editAddressForm, setEditAddressForm] = useState({ streetAddress: "", city: "", phone: "" });

  const [submitting, setSubmitting] = useState(false);

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

  // Open Order Modal
  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setOrderModalTab("details");
    setTrackingForm({
      courier: order.courier || "Nepal Express",
      trackingNumber: order.tracking_number || "",
      trackingUrl: order.tracking_url || ""
    });
    setGiftForm({
      is_gift: order.gift_info?.is_gift ?? order.isGift ?? false,
      gift_message: order.gift_info?.gift_message || order.giftMessage || "",
      gift_wrap: order.gift_info?.gift_wrap ?? true,
      hide_prices_on_packing_slip: order.gift_info?.hide_prices_on_packing_slip ?? true
    });
    setEditAddressForm({
      streetAddress: order.shippingAddress?.streetAddress || order.shippingAddress?.line1 || "",
      city: order.shippingAddress?.city || "",
      phone: order.shippingAddress?.phone || order.phone || ""
    });
  };

  // Save Primary Tracking Details
  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const oId = selectedOrder.id || selectedOrder._id;
      await axios.patch(`${API}/admin/orders/${oId}/tracking`, trackingForm);
      toast.success("Courier tracking details assigned! ✨");
      fetchRefundStats();
    } catch {
      toast.error("Failed to save tracking info");
    } finally {
      setSubmitting(false);
    }
  };

  // Create Split Shipment
  const handleCreateSplitShipment = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !shipmentForm.tracking_number) return;
    setSubmitting(true);
    try {
      const oId = selectedOrder.id || selectedOrder._id;
      const res = await axios.post(`${API}/admin/orders/${oId}/shipments`, {
        items: selectedOrder.items || [],
        courier: shipmentForm.courier,
        tracking_number: shipmentForm.tracking_number,
        tracking_url: shipmentForm.tracking_url,
        status: "Shipped"
      });
      toast.success("Split shipment package created! 📦");
      setSelectedOrder(res.data);
      setShipmentForm({ courier: "Nepal Express", tracking_number: "", tracking_url: "" });
    } catch {
      toast.error("Failed to create split shipment");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Gift Options
  const handleSaveGiftOptions = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const oId = selectedOrder.id || selectedOrder._id;
      await axios.patch(`${API}/admin/orders/${oId}/gift`, giftForm);
      toast.success("Gift order options saved!");
    } catch {
      toast.error("Failed to save gift options");
    } finally {
      setSubmitting(false);
    }
  };

  // Print Thermal Label
  const handlePrintThermalLabel = (order) => {
    setLabelOrder(order);
    setShowShippingLabel(true);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter || o.return_status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (o.order_number || "").toLowerCase().includes(q) ||
      (o.userName || "").toLowerCase().includes(q) ||
      (o.userEmail || "").toLowerCase().includes(q) ||
      (o.tracking_number || "").toLowerCase().includes(q) ||
      (o.id || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
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
                Order Operations Suite
              </span>
              {refundStats && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ₹{refundStats.summary?.total_revenue?.toLocaleString()} Total Revenue
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Enterprise Order Management & Split Shipments
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage order fulfillment pipelines, tracking numbers, split shipments, audit timelines, gift wrapping, and thermal shipping labels.
            </p>
          </div>

          <button
            onClick={fetchRefundStats}
            disabled={statsLoading}
            className="flex items-center gap-1.5 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg transition active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin" : ""}`} /> Refresh Analytics
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
              <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Total Refunds</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
              <h3 className="font-black text-sm text-[#2D2118] flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#5C1E1E]" /> Return & Refund Breakdown
              </h3>
              <span className="text-[10px] font-bold text-gray-500">{refundStats.summary?.total_returns_requested} requests</span>
            </div>
            <div className="space-y-3 text-xs">
              {Object.entries(refundStats.return_status_breakdown || {}).map(([st, count]) => (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between font-bold text-[#2D2118]">
                    <span>{st}</span>
                    <span className="text-[#5C1E1E] font-black">{count} orders</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5C1E1E] rounded-full" style={{ width: `${Math.max((count / (refundStats.summary?.total_orders || 1)) * 100, count > 0 ? 10 : 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
              <h3 className="font-black text-sm text-[#2D2118] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#5C1E1E]" /> Order Fulfillment Pipeline
              </h3>
              <span className="text-[10px] font-bold text-gray-500">{refundStats.summary?.total_orders} total</span>
            </div>
            <div className="space-y-3 text-xs">
              {Object.entries(refundStats.order_status_breakdown || {}).map(([st, count]) => (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between font-bold text-[#2D2118]">
                    <span>{st}</span>
                    <span className="text-emerald-700 font-black">{count} orders</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.max((count / (refundStats.summary?.total_orders || 1)) * 100, count > 0 ? 10 : 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULFILLMENT & RECENT ORDERS TABLE VIEW */}
      {activeTab === "fulfillment" && (
        <div className="space-y-4">

          {/* Search Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-[#E8DFC9] shadow-sm">
            <div>
              <h2 className="text-lg font-black text-[#2D2118]">Order Feed & Split Shipments ({filteredOrders.length})</h2>
              <p className="text-xs text-gray-500">Search by customer name, order number, tracking number, or status.</p>
            </div>

            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order #, customer, tracking #..."
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
              </div>
            ) : (
              filteredOrders.map((order) => {
                const oId = order.id || order._id;
                const isGift = order.gift_info?.is_gift || order.isGift;
                const hasTracking = bool(order.tracking_number);
                const shipmentCount = order.shipments?.length || 0;

                return (
                  <div key={oId} className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8DFC9] pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-[#2D2118] text-base">{order.order_number || oId}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {order.status}
                          </span>
                          {order.return_status && (
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-red-600" /> {order.return_status}
                            </span>
                          )}
                          {isGift && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200 flex items-center gap-1">
                              <Gift className="w-3 h-3 text-pink-600" /> Gift Wrapped
                            </span>
                          )}
                          {hasTracking && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              {order.courier}: {order.tracking_number}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Customer: <span className="font-bold text-gray-800">{order.userName || order.userEmail || "Guest User"}</span>
                          {order.placed_at && <span className="text-gray-400 ml-2">· {new Date(order.placed_at).toLocaleDateString()}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(oId, e.target.value)}
                          className="bg-[#FAF5EC] border border-[#E8DFC9] text-xs font-bold px-3 py-2 rounded-xl text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => handlePrintThermalLabel(order)}
                          className="p-2 bg-[#FAF5EC] border border-[#E8DFC9] hover:bg-gray-100 text-[#2D2118] rounded-xl transition"
                          title="Print Thermal Shipping Label"
                        >
                          <Printer className="w-4 h-4 text-[#5C1E1E]" />
                        </button>

                        <button
                          onClick={() => openOrderModal(order)}
                          className="bg-[#2D2118] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#5C1E1E] transition"
                        >
                          View & Edit
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
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── FULL ORDER INSPECTOR & EDIT MODAL ─── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto border border-[#E8DFC9] relative">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
              <div>
                <h3 className="font-black text-lg text-[#2D2118]">Order #{selectedOrder.order_number || selectedOrder.id}</h3>
                <p className="text-xs text-gray-400">{selectedOrder.placed_at ? new Date(selectedOrder.placed_at).toLocaleString() : "—"}</p>
              </div>
              <button
                onClick={() => handlePrintThermalLabel(selectedOrder)}
                className="bg-[#5C1E1E] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Print Thermal Label
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E8DFC9] gap-4 text-xs font-bold">
              <button onClick={() => setOrderModalTab("details")} className={`pb-2 border-b-2 ${orderModalTab === "details" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>1. Items & Address</button>
              <button onClick={() => setOrderModalTab("tracking")} className={`pb-2 border-b-2 ${orderModalTab === "tracking" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>2. Split Shipments & Courier</button>
              <button onClick={() => setOrderModalTab("timeline")} className={`pb-2 border-b-2 ${orderModalTab === "timeline" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>3. Audit Timeline</button>
              <button onClick={() => setOrderModalTab("gift")} className={`pb-2 border-b-2 ${orderModalTab === "gift" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>4. Gift & Packing</button>
            </div>

            {/* TAB 1: DETAILS & ADDRESS */}
            {orderModalTab === "details" && (
              <div className="space-y-4 text-xs">
                <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-2">
                  <p className="font-bold text-[#2D2118] flex items-center gap-1.5"><User className="w-4 h-4 text-[#5C1E1E]" /> {selectedOrder.userName || "Guest Customer"}</p>
                  <p className="text-gray-600 flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#5C1E1E]" /> {selectedOrder.shippingAddress?.phone || selectedOrder.phone || "N/A"}</p>
                  <p className="text-gray-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#5C1E1E]" /> {selectedOrder.shippingAddress?.streetAddress || selectedOrder.shippingAddress?.line1}, {selectedOrder.shippingAddress?.city}</p>
                </div>

                <div className="border-t border-[#E8DFC9] pt-3">
                  <h4 className="font-bold text-gray-700 mb-2 uppercase text-[10px] tracking-wider">Purchased Items ({selectedOrder.items?.length})</h4>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-gray-50 rounded-xl border border-[#E8DFC9]">
                        <span className="font-bold text-[#2D2118]">{item.name} (x{item.qty})</span>
                        <span className="font-bold text-[#5C1E1E]">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between font-black text-sm text-[#5C1E1E] pt-2 border-t border-[#E8DFC9]">
                  <span>Total Amount Paid:</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>
            )}

            {/* TAB 2: COURIER & SPLIT SHIPMENTS */}
            {orderModalTab === "tracking" && (
              <div className="space-y-4 text-xs">
                {/* Assign Courier Form */}
                <form onSubmit={handleSaveTracking} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-3">
                  <h4 className="font-bold text-[#5C1E1E]">Assign Courier & Tracking Number</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={trackingForm.courier}
                      onChange={(e) => setTrackingForm({ ...trackingForm, courier: e.target.value })}
                      className="bg-white border p-2.5 rounded-xl font-bold"
                    >
                      {COURIER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Tracking # (e.g. TRK-887766)"
                      value={trackingForm.trackingNumber}
                      onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                      className="bg-white border p-2.5 rounded-xl font-bold"
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl font-bold">Save Primary Tracking</button>
                </form>

                {/* Create Split Shipment Form */}
                <form onSubmit={handleCreateSplitShipment} className="bg-gray-50 p-4 rounded-2xl border border-[#E8DFC9] space-y-3">
                  <h4 className="font-bold text-[#2D2118]">Create Split Shipment Package</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={shipmentForm.courier}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, courier: e.target.value })}
                      className="bg-white border p-2.5 rounded-xl font-bold"
                    >
                      {COURIER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Split Package Tracking #"
                      value={shipmentForm.tracking_number}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, tracking_number: e.target.value })}
                      className="bg-white border p-2.5 rounded-xl font-bold"
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="bg-[#2D2118] text-white px-4 py-2 rounded-xl font-bold">Create Split Package</button>
                </form>
              </div>
            )}

            {/* TAB 3: AUDIT TIMELINE */}
            {orderModalTab === "timeline" && (
              <div className="space-y-3 text-xs max-h-64 overflow-y-auto p-2">
                {(!selectedOrder.timeline_events || selectedOrder.timeline_events.length === 0) ? (
                  <div className="space-y-2">
                    {(selectedOrder.timeline || []).map((t, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-[#E8DFC9]">
                        <CheckCircle2 className={`w-4 h-4 ${t.completed ? "text-emerald-600" : "text-gray-300"}`} />
                        <div>
                          <p className="font-bold text-[#2D2118]">{t.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  selectedOrder.timeline_events.map((ev, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E8DFC9] space-y-1">
                      <div className="flex justify-between font-bold text-[#2D2118]">
                        <span>{ev.action}</span>
                        <span className="text-[10px] text-gray-400">{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-600 text-[11px]">Actor: {ev.actor}</p>
                      {ev.notes && <p className="text-gray-500 text-[10px] italic">{ev.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: GIFT OPTIONS */}
            {orderModalTab === "gift" && (
              <form onSubmit={handleSaveGiftOptions} className="space-y-3 text-xs">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={giftForm.is_gift}
                    onChange={(e) => setGiftForm({ ...giftForm, is_gift: e.target.checked })}
                    className="accent-[#5C1E1E] w-4 h-4"
                  />
                  <span>Mark as Gift Order</span>
                </label>

                <div>
                  <label className="font-bold text-[#8B7355] block mb-1">Personalized Gift Message</label>
                  <textarea
                    rows={3}
                    placeholder="Message to print on gift card..."
                    value={giftForm.gift_message}
                    onChange={(e) => setGiftForm({ ...giftForm, gift_message: e.target.value })}
                    className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-medium"
                  />
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Save Gift Options</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── PRINTABLE THERMAL SHIPPING LABEL POPUP ─── */}
      {showShippingLabel && labelOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-black relative">
            <button onClick={() => setShowShippingLabel(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>

            {/* Thermal Label Graphic Format (4x6 format) */}
            <div className="border-2 border-black p-4 space-y-3 font-mono text-black text-xs rounded-xl bg-white">
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <span className="font-black text-base tracking-widest uppercase">RIVAANTA</span>
                <span className="font-bold text-[10px] uppercase border border-black px-2 py-0.5">{labelOrder.courier || "EXPRESS SHIP"}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">TRACKING NUMBER</p>
                  <p className="font-black text-sm">{labelOrder.tracking_number || `TRK-SR-${(labelOrder.id || labelOrder._id).slice(-8)}`}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center border border-black rounded">
                  <QrCode className="w-8 h-8 text-black" />
                </div>
              </div>

              <div className="border-b border-gray-300 pb-2 space-y-0.5">
                <p className="text-[10px] text-gray-500 uppercase">DELIVER TO:</p>
                <p className="font-black text-sm">{labelOrder.userName || "Customer"}</p>
                <p className="font-bold">{labelOrder.shippingAddress?.streetAddress || labelOrder.shippingAddress?.line1}, {labelOrder.shippingAddress?.city}</p>
                <p className="text-[11px]">Phone: {labelOrder.shippingAddress?.phone || labelOrder.phone || "N/A"}</p>
              </div>

              <div className="pt-1">
                <p className="text-[10px] text-gray-500 uppercase">ITEMS ({labelOrder.items?.length}):</p>
                <p className="text-[11px] truncate font-bold">{(labelOrder.items || []).map(i => `${i.name} (x${i.qty})`).join(", ")}</p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-[#2D2118] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow"
            >
              <Printer className="w-4 h-4" /> Print Thermal Label (4x6)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
