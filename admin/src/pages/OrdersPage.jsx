import React, { useState } from "react";
import { Search, ShoppingBag, Truck, CheckCircle2, Clock, MapPin, Phone, User, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export function OrdersPage({ orders = [], onUpdateStatus }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
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
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-[#E8DFC9] shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#2D2118]">Order Fulfillment ({filteredOrders.length})</h2>
          <p className="text-xs text-gray-500">Manage customer purchases, delivery status, and shipping receipts.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
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
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none bg-white p-2 rounded-2xl border border-[#E8DFC9]">
        {["all", ...STATUS_OPTIONS].map((st) => (
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

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E8DFC9] text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-700">No Orders Found</h3>
            <p className="text-xs text-gray-500">No customer orders match your current filters.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#2D2118] text-base">{order.order_number || order.id}</span>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customer: <span className="font-bold text-gray-800">{order.userName || order.userEmail || "Guest User"}</span>
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
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#FAF5EC] p-2 rounded-2xl min-w-[180px]">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-xl" />
                    <div>
                      <p className="text-xs font-bold text-[#2D2118] line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-500">Qty: {item.qty} × ₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-[#2D2118]">Receipt #{selectedOrder.order_number || selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-1.5">
                <p className="font-bold text-[#2D2118] flex items-center gap-1.5"><User className="w-4 h-4" /> {selectedOrder.userName}</p>
                <p className="text-gray-600 flex items-center gap-1.5"><Phone className="w-4 h-4" /> {selectedOrder.shippingAddress?.phone || "N/A"}</p>
                <p className="text-gray-600 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedOrder.shippingAddress?.streetAddress}, {selectedOrder.shippingAddress?.city}</p>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-bold text-gray-700 mb-2">Purchased Items:</h4>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span>{item.name} (x{item.qty})</span>
                      <span className="font-bold">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between font-black text-sm text-[#5C1E1E]">
                <span>Total Paid:</span>
                <span>₹{selectedOrder.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
