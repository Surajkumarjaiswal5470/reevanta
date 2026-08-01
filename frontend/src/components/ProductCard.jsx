import React, { useState } from "react";
import { Heart, Sparkles, ShoppingBag, Eye, Bell } from "lucide-react";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../services/api";
import { toast } from "sonner";

export function ProductCard({ product, onQuickView }) {
  const { wishlist, toggleWishlist, addToCart, resellerMode } = useCart();
  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const [subscribingRestock, setSubscribingRestock] = useState(false);

  const isOutOfStock = product.inStock === false;

  const handleSubscribeRestock = async (e) => {
    e.stopPropagation();
    const userEmail = prompt(`Enter your email address to receive restock notification for '${product.name}':`);
    if (!userEmail || !userEmail.trim()) return;

    setSubscribingRestock(true);
    try {
      const res = await apiFetch(`/products/${product.id}/back-in-stock-alert`, {
        method: "POST",
        body: { email: userEmail.trim() }
      });
      toast.success(res.message || "Subscribed to restock alerts!");
    } catch (err) {
      toast.error("Failed to subscribe to restock alert");
    } finally {
      setSubscribingRestock(false);
    }
  };

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-[#E8DFC9]/60 relative"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {product.isFlashSale && (
          <span className="bg-[#5C1E1E] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> Flash Sale
          </span>
        )}
        {product.badge && (
          <span className="bg-[#2D2118] text-[#FAF5EC] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shadow-sm tracking-wider">
            {product.badge}
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        data-testid={`wishlist-btn-${product.id}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product);
        }}
        className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:text-[#5C1E1E] shadow-sm hover:scale-110 transition active:scale-95"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-[#5C1E1E] text-[#5C1E1E]" : ""}`} />
      </button>

      {/* Product Image */}
      <div
        onClick={() => onQuickView(product)}
        className="relative aspect-[3/4] bg-[#FAF5EC] overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="bg-white/90 text-[#2D2118] px-3.5 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 hover:bg-white transition"
          >
            <Eye className="w-3.5 h-3.5" /> Quick View
          </button>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
            <span className="uppercase tracking-wider font-semibold text-[#8B7355]">{product.brand || "RIVAANTA"}</span>
            {product.rating && (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                ★ {product.rating} <span className="text-gray-400 font-normal">({product.reviewsCount || 0})</span>
              </span>
            )}
          </div>

          <h3
            onClick={() => onQuickView(product)}
            className="font-bold text-[#2D2118] text-sm mt-1 line-clamp-1 cursor-pointer hover:text-[#5C1E1E] transition"
          >
            {product.name}
          </h3>
        </div>

        {/* Pricing & Actions */}
        <div>
          {resellerMode ? (
            <div className="bg-[#FAF5EC] p-2 rounded-xl border border-[#E8DFC9] mb-2">
              <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                <span>Wholesale Price:</span>
                <span className="font-bold text-[#2D2118]">₹{product.price}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-700 mt-0.5">
                <span>Reseller Profit:</span>
                <span>+₹{product.resellerMargin || 200}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-base font-black text-[#2D2118]">₹{product.price}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
              )}
              {product.discountPercent && (
                <span className="text-[10px] font-bold text-[#5C1E1E] bg-[#5C1E1E]/10 px-1.5 py-0.5 rounded">
                  {product.discountPercent}% OFF
                </span>
              )}
            </div>
          )}

          {isOutOfStock ? (
            <button
              onClick={handleSubscribeRestock}
              disabled={subscribingRestock}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 text-amber-700" />
              <span>Notify When Restocked</span>
            </button>
          ) : (
            <button
              data-testid={`add-to-cart-${product.id}`}
              onClick={() => addToCart(product)}
              className="w-full bg-[#2D2118] hover:bg-[#5C1E1E] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
