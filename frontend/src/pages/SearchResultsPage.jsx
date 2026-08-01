import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Search, Filter, ArrowUpDown, MapPin, Sparkles, Loader2, PackageX, CheckCircle2 } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : 'http://localhost:8001/api');

export function SearchResultsPage({ onSelectProduct }) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedQuery = useDebounce(searchTerm, 300);

  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  // Pagination & Results State
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // IntersectionObserver Sentinel Ref for Infinite Scroll
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Fetch Search Results
  const fetchResults = async (pageNum, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = {
        q: debouncedQuery.trim() || undefined,
        category: category || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        city: city || undefined,
        sortBy,
        page: pageNum,
        limit
      };

      const res = await axios.get(`${API_BASE_URL}/search`, { params });
      const data = res.data;

      if (isInitial) {
        setProducts(data.items || []);
      } else {
        setProducts((prev) => [...prev, ...(data.items || [])]);
      }

      setTotal(data.total || 0);
      setHasMore(!!data.has_more);
    } catch (err) {
      console.error("MongoDB Atlas Search Error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reset & Re-fetch when query or filters change
  useEffect(() => {
    setPage(1);
    fetchResults(1, true);
  }, [debouncedQuery, category, minPrice, maxPrice, city, sortBy]);

  // Handle Infinite Scroll triggers
  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResults(nextPage, false);
  }, [loading, loadingMore, hasMore, page]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleLoadMore, hasMore, loading, loadingMore]);

  return (
    <div className="min-h-screen bg-[#FAF5EC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header & Search Input */}
        <div className="bg-white border border-[#E8DFC9] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#2D2118] flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#5C1E1E]" />
                <span>MongoDB Atlas Search</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Instant fuzzy search, compound filtering, relevance scoring, and infinite scroll
              </p>
            </div>

            {/* Instant Search Bar with 300ms Debounce */}
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by title, description, city, tags..."
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E] shadow-inner"
              />
              <Search className="w-5 h-5 text-[#8B7355] absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-[#E8DFC9]">
            {/* Category Filter */}
            <div>
              <label className="text-[10px] font-black text-[#8B7355] uppercase block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-bold text-[#2D2118] focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="fashion">Fashion & Clothing</option>
                <option value="shoes">Shoes & Footwear</option>
                <option value="makeup">Makeup & Cosmetics</option>
                <option value="accessories">Bags & Accessories</option>
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="text-[10px] font-black text-[#8B7355] uppercase block mb-1">Min Price (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-bold text-[#2D2118] focus:outline-none"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="text-[10px] font-black text-[#8B7355] uppercase block mb-1">Max Price (₹)</label>
              <input
                type="number"
                placeholder="10000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-bold text-[#2D2118] focus:outline-none"
              />
            </div>

            {/* Location City */}
            <div>
              <label className="text-[10px] font-black text-[#8B7355] uppercase block mb-1">City</label>
              <input
                type="text"
                placeholder="e.g. Kathmandu"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-bold text-[#2D2118] focus:outline-none"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-[10px] font-black text-[#8B7355] uppercase block mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-bold text-[#2D2118] focus:outline-none"
              >
                <option value="relevance">Relevance (Score)</option>
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between px-2 text-xs font-bold text-[#8B7355]">
          <span>
            Found <strong className="text-[#2D2118] font-extrabold">{total}</strong> products matching your query
          </span>
          {debouncedQuery && (
            <span className="bg-[#5C1E1E]/10 text-[#5C1E1E] px-3 py-1 rounded-full border border-[#5C1E1E]/20">
              Query: "{debouncedQuery}"
            </span>
          )}
        </div>

        {/* Initial Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-[#E8DFC9] animate-pulse space-y-3">
                <div className="w-full h-48 bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-dashed border-[#E8DFC9] rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto">
            <PackageX className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-black text-[#2D2118]">No products found</h3>
            <p className="text-xs text-gray-500">
              Try adjusting your search terms, fuzzy spelling, or filters.
            </p>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <div
                key={prod._id}
                onClick={() => onSelectProduct && onSelectProduct(prod)}
                className="bg-white border border-[#E8DFC9] hover:border-[#5C1E1E] rounded-3xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Thumbnail */}
                  <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-gray-100 border border-[#E8DFC9]">
                    <img
                      src={prod.thumbnail || prod.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400"}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {prod.score && prod.score > 1.0 && (
                      <span className="absolute top-2.5 right-2.5 bg-[#5C1E1E] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                        Score: {prod.score.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>{prod.category}</span>
                      {prod.location?.city && (
                        <span className="flex items-center gap-0.5 text-[#8B7355]">
                          <MapPin className="w-3 h-3" /> {prod.location.city}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#2D2118] line-clamp-1 group-hover:text-[#5C1E1E] transition">
                      {prod.title}
                    </h3>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-[#FAF5EC] mt-3 flex items-center justify-between">
                  <span className="text-base font-black text-[#5C1E1E]">
                    ₹{prod.price?.toLocaleString() || "0"}
                  </span>
                  <span className="text-[11px] font-extrabold text-[#8B7355] group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sentinel element for Infinite Scroll */}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center py-6">
          {loadingMore && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#5C1E1E] bg-white px-4 py-2 rounded-full border border-[#E8DFC9] shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading more Atlas Search results...</span>
            </div>
          )}
          {!hasMore && products.length > 0 && (
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>End of Atlas Search results</span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
