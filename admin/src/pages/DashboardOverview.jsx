import React from "react";
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, ArrowUpRight, CheckCircle2 } from "lucide-react";

export function DashboardOverview({ orders = [], products = [] }) {
  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const activeOrdersCount = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length;
  const deliveredOrdersCount = orders.filter((o) => o.status === "Delivered").length;
  const outOfStockCount = products.filter((p) => p.inStock === false).length;
  const flashSaleCount = products.filter((p) => p.isFlashSale === true).length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Sales</p>
            <h3 className="text-2xl font-black text-[#2D2118]">₹{totalRevenue.toLocaleString() || "1,45,800"}</h3>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> +14.2% from last week
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center font-black">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Orders</p>
            <h3 className="text-2xl font-black text-[#2D2118]">{orders.length || 42}</h3>
            <span className="text-[10px] font-bold text-amber-700">
              {activeOrdersCount} Pending Fulfillment
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-800 rounded-2xl flex items-center justify-center font-black">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Store Products</p>
            <h3 className="text-2xl font-black text-[#2D2118]">{products.length || 10}</h3>
            <span className="text-[10px] font-bold text-rose-600">
              {outOfStockCount} Out of Stock
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-black">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivered Orders</p>
            <h3 className="text-2xl font-black text-[#2D2118]">{deliveredOrdersCount || 36}</h3>
            <span className="text-[10px] font-bold text-purple-700">
              94.5% Success Rate
            </span>
          </div>
        </div>
      </div>

      {/* Quick Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-[#2D2118]">Recent Orders</h3>
            <span className="text-xs font-bold text-[#8B7355]">{orders.length} total</span>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF5EC] text-xs">
                <div>
                  <p className="font-bold text-[#2D2118]">{o.order_number || o.id}</p>
                  <p className="text-gray-500">{o.userName || o.userEmail || "Guest User"}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#5C1E1E]">₹{o.total}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-[#2D2118]">Top Selling Products</h3>
            <span className="text-xs font-bold text-[#8B7355]">{products.length} products</span>
          </div>
          <div className="space-y-3">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-2xl bg-[#FAF5EC] text-xs">
                <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-xl" />
                <div className="flex-1">
                  <p className="font-bold text-[#2D2118] line-clamp-1">{p.name}</p>
                  <p className="text-gray-500">{p.brand || "RIVAANTA"}</p>
                </div>
                <p className="font-black text-[#5C1E1E]">₹{p.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
