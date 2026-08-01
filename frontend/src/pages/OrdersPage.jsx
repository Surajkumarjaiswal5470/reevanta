import React, { useState, useEffect, useCallback } from "react";
import { Package, Truck, Clock, CheckCircle2, ChevronRight, XCircle, RotateCcw, Building2, Smartphone, ShieldCheck, Calendar, AlertCircle } from "lucide-react";
import { apiFetch } from "../services/api";
import { OrderTimeline } from "../components/OrderTimeline";
import { ReturnModal } from "../components/ReturnModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function OrdersPage() {
  const { currentUser, setShowAuthModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch("/orders/mine");
      setOrders(data || []);
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await apiFetch(`/orders/${orderId}/cancel`, { method: "POST" });
      toast.success("Order cancelled");
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: "Cancelled" } : null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to cancel order");
    }
  };

  // Helper to calculate 7-day return window eligibility
  const getReturnWindowInfo = (order) => {
    if (order.status !== "Delivered") return null;
    const deliveredAtStr = order.delivered_at || order.placed_at;
    const deliveredDt = new Date(deliveredAtStr);
    const deadlineDt = new Date(deliveredDt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const isEligible = now <= deadlineDt;
    const daysLeft = Math.max(0, Math.ceil((deadlineDt - now) / (1000 * 60 * 60 * 24)));
    
    return {
      isEligible,
      deadlineFormatted: deadlineDt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      daysLeft
    };
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-[#E8DFC9] space-y-4 max-w-md mx-auto my-12 p-8">
        <div className="w-16 h-16 bg-[#FAF5EC] text-[#5C1E1E] rounded-full mx-auto flex items-center justify-center text-2xl font-bold">
          📦
        </div>
        <h2 className="text-xl font-black text-[#2D2118]">View Your Orders</h2>
        <p className="text-xs text-gray-500">Please sign in to track your shipments, view purchase history & manage returns.</p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="bg-[#5C1E1E] text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-xs text-gray-500">
        Loading your orders & return requests...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Header Banner */}
      <div className="bg-[#FAF5EC] border border-[#E8DFC9] p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2D2118]">My Orders, Delivery & Returns</h1>
          <p className="text-xs text-gray-600 mt-1">
            Track live shipment status, view 7-day return eligibility, and request bank refunds.
          </p>
        </div>
        <span className="bg-[#2D2118] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
          {orders.length} Total Orders
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] space-y-3">
          <div className="text-3xl">🛍️</div>
          <h3 className="font-bold text-[#2D2118]">No orders placed yet</h3>
          <p className="text-xs text-gray-500">Explore our catalog and place your first order today.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isCancelled = order.status === "Cancelled";
            const isDelivered = order.status === "Delivered";
            const returnInfo = order.return_info;
            const returnWindow = getReturnWindowInfo(order);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#E8DFC9] p-6 shadow-sm space-y-6"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-[#2D2118]">{order.order_number}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isCancelled
                            ? "bg-red-100 text-red-700"
                            : isDelivered
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {order.status}
                      </span>

                      {returnInfo && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> {returnInfo.return_status} ({returnInfo.return_id})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Placed on {new Date(order.placed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Total Amount</div>
                      <div className="font-black text-base text-[#2D2118]">₹{order.total}</div>
                    </div>

                    {/* Cancel Order Button */}
                    {!isCancelled && !["Shipped", "Out for Delivery", "Delivered"].includes(order.status) && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-xs font-bold text-red-600 hover:underline border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50"
                      >
                        Cancel Order
                      </button>
                    )}

                    {/* Amazon / Meesho Style Request Return Button */}
                    {isDelivered && !returnInfo && returnWindow && returnWindow.isEligible && (
                      <button
                        onClick={() => setReturnModalOrder(order)}
                        className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-1.5 active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                        <span>Request Return & Refund</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 7-DAY RETURN WINDOW BANNER FOR DELIVERED ITEMS */}
                {isDelivered && !returnInfo && returnWindow && (
                  <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    returnWindow.isEligible ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}>
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 shrink-0 ${returnWindow.isEligible ? "text-emerald-600" : "text-gray-400"}`} />
                      <div>
                        <strong>7-Day Return Policy Window:</strong>{" "}
                        {returnWindow.isEligible ? (
                          <span>Eligible for Return & Bank Refund until <strong>{returnWindow.deadlineFormatted}</strong> ({returnWindow.daysLeft} days remaining)</span>
                        ) : (
                          <span>Return window closed on {returnWindow.deadlineFormatted}.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTIVE RETURN REQUEST DETAILS & REFUND BANK SUMMARY CARD */}
                {returnInfo && (
                  <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-purple-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-purple-950">Return Request #{returnInfo.return_id}</h4>
                          <p className="text-[11px] text-purple-700">Reason: {returnInfo.reason}</p>
                        </div>
                      </div>
                      <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        {returnInfo.return_status}
                      </span>
                    </div>

                    {/* Refund Bank / Wallet Destination Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-2xl border border-purple-100">
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Refund Amount</span>
                        <span className="font-black text-emerald-700 text-sm">₹{order.total}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase font-bold">Refund Destination</span>
                        <span className="font-bold text-[#2D2118] flex items-center gap-1 mt-0.5">
                          {returnInfo.refund_method === "bank_account" && returnInfo.bank_details ? (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{returnInfo.bank_details.bankName} (A/C: ••••{returnInfo.bank_details.accountNumber?.slice(-4)})</span>
                            </>
                          ) : returnInfo.refund_method === "digital_wallet" && returnInfo.wallet_details ? (
                            <>
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{returnInfo.wallet_details.walletType} ({returnInfo.wallet_details.walletNumberOrId})</span>
                            </>
                          ) : (
                            <span>Original Payment Method / COD Source</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Return Progress Timeline */}
                    {order.return_timeline && (
                      <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                          Return & Refund Progress Tracker
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          {order.return_timeline.map((stepItem, sIdx) => (
                            <div key={sIdx} className={`p-3 rounded-xl border flex flex-col justify-between ${
                              stepItem.completed ? "bg-purple-100/60 border-purple-300 text-purple-950 font-bold" : "bg-gray-50 border-gray-200 text-gray-400"
                            }`}>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className={`w-3.5 h-3.5 ${stepItem.completed ? "text-purple-700" : "text-gray-300"}`} />
                                <span className="text-[11px]">{stepItem.status}</span>
                              </div>
                              <span className="text-[9px] text-gray-500 mt-1 line-clamp-1">{stepItem.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Items preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex gap-3 bg-[#FAF5EC]/50 p-2.5 rounded-2xl border border-[#E8DFC9]/40">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-14 h-16 object-cover rounded-xl" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-xs text-[#2D2118] line-clamp-1">{item.name}</h4>
                        <p className="text-[11px] text-gray-500">Qty: {item.qty} × ₹{item.price}</p>
                        {item.selectedSize && <p className="text-[10px] text-gray-400">Size: {item.selectedSize}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Live Timeline */}
                {!isCancelled && order.timeline && (
                  <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9]">
                    <h4 className="text-xs font-bold text-[#2D2118] mb-3 uppercase tracking-wider">
                      Live Delivery Timeline
                    </h4>
                    <OrderTimeline steps={order.timeline} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Return & Refund Request Modal */}
      {returnModalOrder && (
        <ReturnModal
          order={returnModalOrder}
          onClose={() => setReturnModalOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}

    </div>
  );
}
