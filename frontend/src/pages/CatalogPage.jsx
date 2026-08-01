import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SlidersHorizontal, Search, Sparkles, Share2, Check, RotateCcw, Filter, X } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { MOCK_CATEGORIES } from "../mock";
import { toast } from "sonner";

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL"];
const AVAILABLE_FABRICS = ["Silk", "Velvet", "Organza", "Cotton", "Georgette", "Chiffon"];
const AVAILABLE_OCCASIONS = ["Bridal", "Festive", "Party", "Casual", "Luxury"];
const AVAILABLE_BRANDS = ["RIVAANTA", "Himalayan Heritage", "Silk Studio", "Velvet Vogue"];
const AVAILABLE_COLORS = [
  { name: "Red", hex: "#5C1E1E" },
  { name: "Gold", hex: "#B8956A" },
  { name: "Green", hex: "#1E5C38" },
  { name: "Black", hex: "#2D2118" },
  { name: "Pink", hex: "#D47FA6" }
];

export function CatalogPage({ products, selectedCategory, onCategorySelect, onQuickView }) {
  // Read initial filter values from URL Query Params
  const getInitialFilters = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      category: params.get("category") || selectedCategory || "all",
      searchQuery: params.get("q") || "",
      size: params.get("size") || "all",
      color: params.get("color") || "all",
      brand: params.get("brand") || "all",
      fabric: params.get("fabric") || "all",
      occasion: params.get("occasion") || "all",
      minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : 0,
      maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : 10000,
      inStockOnly: params.get("inStockOnly") === "true",
      sortBy: params.get("sort") || "recommended"
    };
  };

  const [filters, setFilters] = useState(getInitialFilters);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Synchronize state changes to URL Query Parameters (Bookmarkable & Shareable)
  const syncFiltersToUrl = useCallback((newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.category && newFilters.category !== "all") params.set("category", newFilters.category);
    if (newFilters.searchQuery.trim()) params.set("q", newFilters.searchQuery.trim());
    if (newFilters.size !== "all") params.set("size", newFilters.size);
    if (newFilters.color !== "all") params.set("color", newFilters.color);
    if (newFilters.brand !== "all") params.set("brand", newFilters.brand);
    if (newFilters.fabric !== "all") params.set("fabric", newFilters.fabric);
    if (newFilters.occasion !== "all") params.set("occasion", newFilters.occasion);
    if (newFilters.minPrice > 0) params.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice < 10000) params.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.inStockOnly) params.set("inStockOnly", "true");
    if (newFilters.sortBy !== "recommended") params.set("sort", newFilters.sortBy);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, []);

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "category") onCategorySelect(value);
      syncFiltersToUrl(updated);
      return updated;
    });
  };

  const resetAllFilters = () => {
    const def = {
      category: "all",
      searchQuery: "",
      size: "all",
      color: "all",
      brand: "all",
      fabric: "all",
      occasion: "all",
      minPrice: 0,
      maxPrice: 10000,
      inStockOnly: false,
      sortBy: "recommended"
    };
    setFilters(def);
    onCategorySelect("all");
    syncFiltersToUrl(def);
    toast.info("All filters reset");
  };

  const copyShareableLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("🔗 Shareable filter link copied to clipboard!");
  };

  // Faceted Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category
      if (filters.category !== "all" && p.category !== filters.category) return false;
      
      // Search term
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = (p.brand || "").toLowerCase().includes(q);
        const matchesDesc = (p.description || "").toLowerCase().includes(q);
        const matchesTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesBrand && !matchesDesc && !matchesTags) return false;
      }

      // Size
      if (filters.size !== "all" && p.sizes) {
        if (!p.sizes.includes(filters.size)) return false;
      }

      // Color
      if (filters.color !== "all" && p.colors) {
        const matchesColorName = (p.tags || []).some((t) => t.toLowerCase().includes(filters.color.toLowerCase()));
        if (!matchesColorName) return false;
      }

      // Brand
      if (filters.brand !== "all" && p.brand !== filters.brand) return false;

      // Fabric
      if (filters.fabric !== "all") {
        const matchesFabric = (p.tags || []).some((t) => t.toLowerCase() === filters.fabric.toLowerCase()) || (p.description || "").toLowerCase().includes(filters.fabric.toLowerCase());
        if (!matchesFabric) return false;
      }

      // Price Range
      if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;

      // Stock
      if (filters.inStockOnly && p.inStock === false) return false;

      return true;
    });
  }, [products, filters]);

  // Sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (filters.sortBy === "price-low") return a.price - b.price;
      if (filters.sortBy === "price-high") return b.price - a.price;
      if (filters.sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [filteredProducts, filters.sortBy]);

  const activeFilterCount = useMemo(() => {
    let cnt = 0;
    if (filters.category !== "all") cnt++;
    if (filters.searchQuery.trim()) cnt++;
    if (filters.size !== "all") cnt++;
    if (filters.color !== "all") cnt++;
    if (filters.brand !== "all") cnt++;
    if (filters.fabric !== "all") cnt++;
    if (filters.minPrice > 0 || filters.maxPrice < 10000) cnt++;
    if (filters.inStockOnly) cnt++;
    return cnt;
  }, [filters]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#FAF5EC] border border-[#E8DFC9] p-6 sm:p-8 rounded-3xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2D2118]">Luxury Collection Catalog</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
              Discover artisanal handloom sarees, designer kurta sets, bridal lehengas & luxury cosmetics with faceted URL filters.
            </p>
          </div>
          
          <button
            onClick={copyShareableLink}
            className="flex items-center gap-2 bg-[#2D2118] hover:bg-[#5C1E1E] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Filtered View</span>
          </button>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          <button
            onClick={() => updateFilter("category", "all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
              filters.category === "all"
                ? "bg-[#2D2118] text-white shadow-sm font-black"
                : "bg-white text-gray-700 hover:bg-[#E8DFC9]/40 border border-[#E8DFC9]"
            }`}
          >
            All Products ({products.length})
          </button>
          {MOCK_CATEGORIES.filter(c => c.id !== "all").map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            const isLive = cat.id === "cosmetics" || cat.id === "beauty";
            return (
              <button
                key={cat.id}
                onClick={() => updateFilter("category", cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  filters.category === cat.id
                    ? "bg-[#5C1E1E] text-white shadow-sm font-black"
                    : isLive
                    ? "bg-amber-50 text-amber-900 border border-amber-300 font-bold hover:bg-amber-100"
                    : "bg-white text-gray-700 hover:bg-[#E8DFC9]/40 border border-[#E8DFC9]"
                }`}
              >
                <span>{cat.name}</span>
                {isLive && (
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                    LIVE
                  </span>
                )}
                {cat.comingSoon && (
                  <span className="bg-amber-800 text-amber-100 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                    SOON
                  </span>
                )}
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Priority Cosmetics Launch Banner */}
        {(filters.category === "sarees" || filters.category === "kurtas" || filters.category === "lehenga") && (
          <div className="bg-gradient-to-r from-amber-900/90 to-[#5C1E1E] text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-amber-500/30 my-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-amber-200 uppercase tracking-wider">
                  {filters.category.toUpperCase()} COLLECTION — LAUNCHING SOON!
                </h4>
                <p className="text-xs text-gray-200">
                  Our premier Cosmetics & Beauty line is <strong>NOW LIVE</strong>! Apparel pre-orders will open next month.
                </p>
              </div>
            </div>
            <button
              onClick={() => updateFilter("category", "cosmetics")}
              className="bg-amber-400 text-[#2D2118] text-xs font-black px-4 py-2 rounded-xl hover:bg-amber-300 transition whitespace-nowrap"
            >
              Shop Cosmetics Now →
            </button>
          </div>
        )}
      </div>

      {/* Filter Controls & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-3xl border border-[#E8DFC9]">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by keyword, fabric, brand or tag..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
          />
        </div>

        {/* Faceted Filter Toggle & Sort Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition ${
              showFilterDrawer || activeFilterCount > 0
                ? "bg-[#5C1E1E] text-white border-[#5C1E1E]"
                : "bg-[#FAF5EC] border-[#E8DFC9] text-[#2D2118] hover:border-[#5C1E1E]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Faceted Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-[#5C1E1E] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* FACETED FILTER DRAWER (Size, Color, Brand, Price, Fabric, Occasion, Stock) */}
      {showFilterDrawer && (
        <div className="bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-6 animate-in slide-in-from-top duration-200">
          <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
            <div className="flex items-center gap-2 font-black text-base text-[#2D2118]">
              <Filter className="w-4 h-4 text-[#5C1E1E]" />
              <span>Filter Catalog by Attributes</span>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            {/* Size Filter */}
            <div className="space-y-2">
              <label className="font-extrabold uppercase text-[#8B7355] block">Size</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => updateFilter("size", "all")}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                    filters.size === "all" ? "bg-[#2D2118] text-white border-[#2D2118]" : "bg-[#FAF5EC] text-gray-700 border-[#E8DFC9]"
                  }`}
                >
                  All
                </button>
                {AVAILABLE_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateFilter("size", s)}
                    className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                      filters.size === s ? "bg-[#5C1E1E] text-white border-[#5C1E1E]" : "bg-[#FAF5EC] text-gray-700 border-[#E8DFC9]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <label className="font-extrabold uppercase text-[#8B7355] block">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => updateFilter("brand", e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-bold text-[#2D2118]"
              >
                <option value="all">All Brands</option>
                {AVAILABLE_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Fabric Filter */}
            <div className="space-y-2">
              <label className="font-extrabold uppercase text-[#8B7355] block">Fabric / Material</label>
              <select
                value={filters.fabric}
                onChange={(e) => updateFilter("fabric", e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-bold text-[#2D2118]"
              >
                <option value="all">All Fabrics</option>
                {AVAILABLE_FABRICS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <div className="flex justify-between font-extrabold uppercase text-[#8B7355]">
                <span>Price Range</span>
                <span className="text-[#2D2118]">₹{filters.minPrice} - ₹{filters.maxPrice}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={filters.maxPrice}
                onChange={(e) => updateFilter("maxPrice", Number(e.target.value))}
                className="w-full accent-[#5C1E1E]"
              />
            </div>
          </div>

          {/* Color Palette & Stock Availability */}
          <div className="pt-4 border-t border-[#E8DFC9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-extrabold uppercase text-[#8B7355]">Color Theme:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateFilter("color", "all")}
                  className={`px-3 py-1 rounded-full font-bold text-[11px] border ${
                    filters.color === "all" ? "bg-[#2D2118] text-white" : "bg-[#FAF5EC] text-gray-700"
                  }`}
                >
                  All
                </button>
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c.name}
                    title={c.name}
                    onClick={() => updateFilter("color", c.name)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border-2 transition flex items-center justify-center ${
                      filters.color === c.name ? "border-[#2D2118] scale-110 shadow-md" : "border-white"
                    }`}
                  >
                    {filters.color === c.name && <Check className="w-3 h-3 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 font-bold text-[#2D2118] cursor-pointer bg-[#FAF5EC] px-3 py-2 rounded-xl border border-[#E8DFC9]">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => updateFilter("inStockOnly", e.target.checked)}
                className="w-4 h-4 accent-[#5C1E1E]"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>
      )}

      {/* Products Grid Results OR Launching Soon Banner */}
      {(() => {
        const isComingSoonCategory = ["sarees", "kurtas", "lehenga", "footwear", "jewelry", "sherwanis", "kids-wear"].includes(filters.category);
        const currentCategoryObj = MOCK_CATEGORIES.find(c => c.id === filters.category);
        const catName = currentCategoryObj ? currentCategoryObj.name.replace(" (Soon)", "") : "Apparel";

        if (isComingSoonCategory) {
          return (
            <div className="bg-gradient-to-br from-[#2D2118] via-[#4A1F1F] to-[#5C1E1E] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden border border-amber-500/30">
              <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Official Collection Launching Soon
              </div>

              <div className="max-w-2xl mx-auto space-y-3">
                <h2 className="text-3xl sm:text-4xl font-black text-amber-100 font-serif tracking-wide">
                  {catName} Collection
                </h2>
                <p className="text-sm text-amber-100/80 leading-relaxed font-light">
                  Our master weavers and royal artisans are crafting hand-embroidered heritage <strong>{catName}</strong> pieces for our upcoming grand fashion showcase. Pre-orders & exclusive preview invites will open shortly.
                </p>
              </div>

              {/* VIP Early Access Form */}
              <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-3">
                <p className="text-xs font-bold text-amber-200">✨ Be the First to Know & Get 15% VIP Launch Discount:</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.target.elements.contact;
                    if (input && input.value.trim()) {
                      toast.success(`🎉 You're registered! We will notify ${input.value} as soon as ${catName} launches.`);
                      input.value = "";
                    } else {
                      toast.error("Please enter your phone number or email.");
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="contact"
                    type="text"
                    placeholder="Enter phone or email address..."
                    className="flex-1 bg-white text-[#2D2118] px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-[#2D2118] font-black text-xs px-4 py-2.5 rounded-xl transition shadow active:scale-95 whitespace-nowrap"
                  >
                    Get VIP Access
                  </button>
                </form>
              </div>

              {/* Primary Call to Action -> Browse Live Cosmetics Line */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <span className="text-xs text-amber-200/80">Looking for ready-to-ship luxury items?</span>
                <button
                  onClick={() => updateFilter("category", "cosmetics")}
                  className="bg-white text-[#5C1E1E] hover:bg-amber-100 font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition duration-200 flex items-center gap-2 active:scale-95"
                >
                  <span>💄 Shop Cosmetics & Beauty Line (LIVE NOW)</span>
                </button>
              </div>
            </div>
          );
        }

        if (sortedProducts.length === 0) {
          return (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#E8DFC9] space-y-3">
              <div className="text-3xl">🛍️</div>
              <h3 className="font-bold text-[#2D2118]">No matching products found</h3>
              <p className="text-xs text-gray-500">Try adjusting or clearing your active attribute filters.</p>
              <button
                onClick={resetAllFilters}
                className="bg-[#2D2118] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow transition"
              >
                Reset All Filters
              </button>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
