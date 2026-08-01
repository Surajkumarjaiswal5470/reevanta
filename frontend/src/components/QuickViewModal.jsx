import React, { useState, useEffect } from "react";
import { X, Heart, ShoppingBag, Sparkles, Check, Package, AlertCircle, Ruler, Star, Camera, ShieldCheck, ChevronLeft, ChevronRight, Plus, Share2, Flag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { apiFetch } from "../services/api";
import { SizeGuideModal } from "./SizeGuideModal";
import { ShadeMatcherModal } from "./ShadeMatcherModal";
import { ShareModal } from "./ShareModal";
import { ReportModal } from "./ReportModal";
import { ProductReviews } from "./ProductReviews";
import { toast } from "sonner";

const COLOR_VARIANTS = [
  { name: "Crimson Red", hex: "#5C1E1E" },
  { name: "Royal Gold", hex: "#B8956A" },
  { name: "Emerald Green", hex: "#1E5C38" },
  { name: "Midnight Black", hex: "#2D2118" }
];

export function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const { addRecentlyViewed } = useRecentlyViewed();

  // Gallery Images State
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, isHovered: false });

  // Modals state
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShadeMatcher, setShowShadeMatcher] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Variant choices
  const sizes = product?.sizes && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL"];
  const colors = COLOR_VARIANTS;
  const shades = ["Handloom Weave", "Heavy Zari Embroidery", "Pure Chanderi Silk"];

  const [selectedSize, setSelectedSize] = useState(sizes[0] || "M");
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedShade, setSelectedShade] = useState(product?.shade || shades[0]);

  // Reviews State
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0, avg_rating: 4.8, breakdown: {} });
  const [newReviewText, setNewReviewText] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newReviewPhoto, setNewReviewPhoto] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Recommendations State
  const [recommendations, setRecommendations] = useState({ frequently_bought_together: [], related_products: [] });

  // Similar Listings State
  const [similarListings, setSimilarListings] = useState([]);

  // Fetch Reviews, Recommendations, & Similar Listings, & Track Recently Viewed
  useEffect(() => {
    if (product) {
      addRecentlyViewed(product);
      const pId = product._id || product.id;
      if (pId) {
        apiFetch(`/products/${pId}/reviews`)
          .then(setReviewsData)
          .catch(() => {});
        apiFetch(`/marketplace/similar/${pId}`)
          .then((data) => setSimilarListings(Array.isArray(data) ? data : []))
          .catch(() => {});
      }
    }
  }, [product]);

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id || product._id);

  const galleryImages = [
    product.image,
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800"
  ];

  // Handle Zoom-on-Hover for Desktop
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y, isHovered: true });
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    setSubmittingReview(true);
    try {
      await apiFetch(`/products/${product.id}/reviews`, {
        method: "POST",
        body: {
          userName: "Verified Customer",
          rating: newRating,
          comment: newReviewText.trim(),
          photoUrl: newReviewPhoto.trim() || null,
          verifiedPurchase: true
        }
      });
      toast.success("Review submitted successfully!");
      setNewReviewText("");
      setNewReviewPhoto("");
      // Refresh reviews
      const updated = await apiFetch(`/products/${product.id}/reviews`);
      setReviewsData(updated);
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Add Bundle to Cart
  const handleAddBundleToCart = () => {
    addToCart(product, selectedSize, selectedColor.name);
    (recommendations.frequently_bought_together || []).forEach((item) => {
      addToCart(item, (item.sizes && item.sizes[0]) || "M", "Default");
    });
    toast.success("Frequently Bought Together bundle added to cart!");
    onClose();
  };

  // Dynamic price calculation
  const sizePriceModifier = selectedSize === "XL" || selectedSize === "XXL" ? 200 : 0;
  const variantPrice = (product.price || 1299) + sizePriceModifier;
  const isOutOfStock = product.inStock === false;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const variantProduct = {
      ...product,
      price: variantPrice,
      selectedShade,
      selectedColorName: selectedColor.name
    };
    addToCart(variantProduct, selectedSize, selectedColor.name);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative border border-[#E8DFC9] flex flex-col md:flex-row max-h-[90vh]">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:text-black shadow-md transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* LEFT: IMAGE GALLERY WITH ZOOM-ON-HOVER & MOBILE CAROUSEL */}
          <div className="w-full md:w-1/2 bg-[#FAF5EC] p-4 flex flex-col justify-between relative">
            {/* Main Active Image Display */}
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setZoomPos((prev) => ({ ...prev, isHovered: false }))}
              className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-crosshair border border-[#E8DFC9]"
            >
              <img
                src={galleryImages[activeImgIdx]}
                alt={product.name}
                className="w-full h-full object-cover"
                style={
                  zoomPos.isHovered
                    ? {
                        transform: "scale(2)",
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                      }
                    : {}
                }
              />

              {product.isFlashSale && (
                <span className="absolute top-3 left-3 bg-[#5C1E1E] text-white text-xs font-black uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Flash Deal
                </span>
              )}

              {/* Mobile Swipe Navigation Controls */}
              <button
                onClick={() => setActiveImgIdx((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-700 shadow-md md:hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveImgIdx((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-700 shadow-md md:hidden"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Carousel Bar */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                    activeImgIdx === idx ? "border-[#5C1E1E] scale-105 shadow" : "border-gray-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: DETAILS, REVIEWS, FREQUENTLY BOUGHT TOGETHER */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8B7355]">
                  {product.brand || "RIVAANTA Luxury"}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-[#2D2118] mt-0.5">{product.name}</h2>
              </div>

              {/* Price & Rating Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#2D2118]">₹{variantPrice}</span>
                  {product.originalPrice && product.originalPrice > variantPrice && (
                    <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-black text-amber-900">{reviewsData.avg_rating || 4.8}</span>
                  <span className="text-[10px] text-amber-700">({reviewsData.total || product.reviewsCount || 10} reviews)</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>

              {/* Interactive Modals Buttons (Size Guide / Shade Matcher) */}
              <div className="flex gap-2">
                {product.category === "clothes" && (
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] text-[#5C1E1E] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:border-[#5C1E1E] transition"
                  >
                    <Ruler className="w-3.5 h-3.5" /> Size Guide Chart
                  </button>
                )}

                {product.category === "makeup" && (
                  <button
                    onClick={() => setShowShadeMatcher(true)}
                    className="flex-1 bg-amber-50 border border-amber-200 text-amber-900 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:border-amber-400 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Shade-Matcher Quiz
                  </button>
                )}
              </div>

              {/* Color Swatches */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D2118] uppercase tracking-wider block">
                  Color Variant: <span className="text-[#5C1E1E]">{selectedColor.name}</span>
                </label>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full border-2 transition flex items-center justify-center ${
                        selectedColor.name === c.name ? "border-[#2D2118] scale-110 shadow-md" : "border-white"
                      }`}
                    >
                      {selectedColor.name === c.name && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D2118] uppercase tracking-wider block">
                  Select Size: <span className="text-[#5C1E1E]">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedSize === s ? "bg-[#2D2118] text-white border-[#2D2118]" : "bg-[#FAF5EC] text-gray-700 border-[#E8DFC9]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* FREQUENTLY BOUGHT TOGETHER RECOMMENDATION BUNDLE */}
              {recommendations.frequently_bought_together.length > 0 && (
                <div className="bg-[#FAF5EC] p-3.5 rounded-2xl border border-[#E8DFC9] space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#5C1E1E]">
                    💡 Frequently Bought Together Bundle
                  </div>
                  <div className="space-y-1.5">
                    {recommendations.frequently_bought_together.map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-[#E8DFC9] text-xs">
                        <div className="flex items-center gap-2">
                          <img src={rec.image} alt={rec.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <div className="font-bold text-[#2D2118] line-clamp-1">{rec.name}</div>
                            <div className="text-[10px] text-gray-500">₹{rec.price}</div>
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddBundleToCart}
                    className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-2 rounded-xl text-xs font-bold shadow transition"
                  >
                    Add Complete Bundle to Cart
                  </button>
                </div>
              )}

              {/* ENTERPRISE PRODUCT REVIEWS HUB */}
              <div className="pt-4 border-t border-[#E8DFC9]">
                <ProductReviews productId={product.id} productName={product.name} />
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-2xl border transition ${
                  isWishlisted ? "border-[#5C1E1E] bg-[#5C1E1E]/10 text-[#5C1E1E]" : "border-gray-200 text-gray-600"
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-[#5C1E1E]" : ""}`} />
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 bg-[#2D2118] hover:bg-[#5C1E1E] text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart (₹{variantPrice})</span>
              </button>
            </div>

            {/* Similar Listings Section */}
          {similarListings.length > 0 && (
            <div className="pt-6 border-t border-[#E8DFC9] space-y-4">
              <h3 className="text-base font-black text-[#2D2118] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Similar Listings You Might Like</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {similarListings.map((sim) => (
                  <div
                    key={sim._id || sim.id}
                    className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9] flex flex-col justify-between space-y-2 group hover:shadow-md transition"
                  >
                    <img src={sim.image} alt={sim.name} className="w-full h-24 object-cover rounded-xl" />
                    <div>
                      <h4 className="text-xs font-black text-[#2D2118] truncate">{sim.name}</h4>
                      <span className="text-xs font-black text-[#5C1E1E]">NPR {sim.price?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar for Share & Report Listing */}
          <div className="pt-4 border-t border-[#E8DFC9] flex items-center justify-between text-xs">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 font-bold text-[#8B7355] hover:text-[#5C1E1E] transition"
            >
              <Share2 className="w-4 h-4" /> Share Listing
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 font-bold text-red-600 hover:text-red-800 transition"
            >
              <Flag className="w-4 h-4" /> Report Listing
            </button>
          </div>

        </div>
      </div>
    </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        product={product}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        product={product}
      />

      {/* Size Guide Modal */}
      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}

      {/* Shade Matcher Quiz Modal */}
      {showShadeMatcher && (
        <ShadeMatcherModal
          onClose={() => setShowShadeMatcher(false)}
          onSelectShade={(shadeName) => setSelectedShade(shadeName)}
        />
      )}
    </>
  );
}
