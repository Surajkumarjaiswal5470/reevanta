import React, { useState } from "react";
import { Search, Plus, Trash2, Edit, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export function ProductsPage({ products = [], onAddClick, onDeleteProduct, onToggleField }) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-[#E8DFC9] shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#2D2118]">Live Inventory ({filteredProducts.length})</h2>
          <p className="text-xs text-gray-500">Manage prices, flash sale tags, stock status, and product items.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
            />
          </div>

          <button
            onClick={onAddClick}
            className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#2D2118] transition whitespace-nowrap shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none bg-white p-2 rounded-2xl border border-[#E8DFC9]">
        {["all", "cosmetics", "beauty-care", "sarees", "kurtas", "lehenga"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap uppercase tracking-wider transition ${
              categoryFilter === cat
                ? "bg-[#5C1E1E] text-white shadow-md"
                : "text-gray-600 hover:bg-[#FAF5EC]"
            }`}
          >
            {cat.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-3xl border border-[#E8DFC9] shadow-sm flex gap-4 relative group">
            <img
              src={product.image}
              alt={product.name}
              className="w-24 h-32 object-cover rounded-2xl bg-gray-100 flex-shrink-0"
            />

            <div className="flex-1 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {product.category || "Cosmetics"}
                </span>
                <h4 className="font-extrabold text-sm text-[#2D2118] mt-1 line-clamp-1">{product.name}</h4>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-black text-[#5C1E1E] text-base">₹{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
                <button
                  onClick={() => onToggleField(product.id, "inStock", product.inStock)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                    product.inStock
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {product.inStock ? "In Stock ✓" : "Out of Stock ✕"}
                </button>

                <button
                  onClick={() => onToggleField(product.id, "isFlashSale", product.isFlashSale)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                    product.isFlashSale
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  ⚡ Flash Sale
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onDeleteProduct(product.id, product.name)}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
