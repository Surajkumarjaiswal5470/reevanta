import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Star, ThumbsUp, ShieldCheck, Camera, Filter, ArrowUpDown, Plus,
  X, Check, Sparkles, AlertCircle, MessageCircle, ChevronLeft, ChevronRight, User
} from "lucide-react";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function ProductReviews({ productId, productName }) {
  const { currentUser, setShowAuthModal } = useAuth();

  // Review List State
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    total: 0,
    total_unfiltered: 0,
    avg_rating: 4.8,
    recommend_percent: 94,
    breakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
    feature_ratings: { avg_fit: 3.0, avg_quality: 4.8, avg_value: 4.7 }
  });
  const [loading, setLoading] = useState(true);

  // Filter & Sort State
  const [sortBy, setSortBy] = useState("recent"); // recent | highest | lowest | helpful
  const [ratingFilter, setRatingFilter] = useState(null); // null or 1..5
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [photosOnly, setPhotosOnly] = useState(false);

  // Write Review Modal State
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formFit, setFormFit] = useState(3); // 1=Runs Small, 3=True to Size, 5=Runs Large
  const [formQuality, setFormQuality] = useState(5);
  const [formValue, setFormValue] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formPhotoInput, setFormPhotoInput] = useState("");
  const [formPhotos, setFormPhotos] = useState([]);
  const [formName, setFormName] = useState(currentUser?.name || "");

  // Photo Lightbox State
  const [lightboxImg, setLightboxImg] = useState(null);

  // Upvoted reviews tracking
  const [votedReviews, setVotedReviews] = useState({});

  // Update pre-filled name when currentUser resolves
  useEffect(() => {
    if (currentUser?.name && !formName) {
      setFormName(currentUser.name);
    }
  }, [currentUser]);

  // Fetch reviews with current filters & sorting
  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sortBy) params.append("sort_by", sortBy);
      if (ratingFilter) params.append("rating_filter", ratingFilter);
      if (verifiedOnly) params.append("verified_only", "true");
      if (photosOnly) params.append("photos_only", "true");

      const data = await apiFetch(`/products/${productId}/reviews?${params.toString()}`);
      setReviewsData(data);
    } catch (err) {
      console.warn("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, sortBy, ratingFilter, verifiedOnly, photosOnly]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle helpful vote toggle
  const handleVoteHelpful = async (reviewId) => {
    try {
      const res = await apiFetch(`/products/reviews/${reviewId}/vote`, { method: "POST" });
      setReviewsData((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId ? { ...r, helpfulVotes: res.helpfulVotes } : r
        )
      }));
      setVotedReviews((prev) => ({ ...prev, [reviewId]: res.userVoted }));
      toast.success(res.userVoted ? "Marked review as helpful!" : "Vote removed");
    } catch {
      toast.error("Failed to vote on review");
    }
  };

  // Add photo URL to form
  const handleAddPhoto = () => {
    const url = formPhotoInput.trim();
    if (!url) return;
    if (!url.startsWith("http")) {
      toast.error("Please enter a valid image URL (starting with http:// or https://)");
      return;
    }
    if (formPhotos.length >= 4) {
      toast.error("Maximum 4 photos allowed per review");
      return;
    }
    setFormPhotos((prev) => [...prev, url]);
    setFormPhotoInput("");
  };

  // Submit Review Form
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formComment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch(`/products/${productId}/reviews`, {
        method: "POST",
        body: {
          userName: formName.trim() || (currentUser?.name || "Verified Shopper"),
          userEmail: currentUser?.email || null,
          rating: formRating,
          fitRating: formFit,
          qualityRating: formQuality,
          valueRating: formValue,
          title: formTitle.trim() || null,
          comment: formComment.trim(),
          photos: formPhotos,
        }
      });

      toast.success("Review posted successfully! ✨");
      setShowWriteModal(false);
      // Reset form
      setFormTitle("");
      setFormComment("");
      setFormPhotos([]);
      setFormPhotoInput("");
      setFormRating(5);
      // Refresh feed
      fetchReviews();
    } catch (err) {
      toast.error(err.message || "Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  const fitLabel = (val) => {
    if (val <= 2) return "Runs Small";
    if (val >= 4) return "Runs Large";
    return "True to Size";
  };

  const totalReviewsCount = reviewsData.total_unfiltered || reviewsData.total || 0;

  return (
    <div className="space-y-6">

      {/* ─── 1. RATING OVERVIEW HUB ────────────────────────────────────────── */}
      <div className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-3xl p-5 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Big Average Score Badge */}
          <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-[#E8DFC9] pb-6 md:pb-0 md:pr-6 space-y-2">
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-4xl sm:text-5xl font-black text-[#2D2118]">
                {reviewsData.avg_rating || 4.8}
              </span>
              <span className="text-sm font-bold text-gray-400">/ 5.0</span>
            </div>

            {/* Stars rendering */}
            <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(reviewsData.avg_rating || 5)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-[#8B7355] font-medium">
              Based on <strong>{totalReviewsCount}</strong> verified customer reviews
            </p>

            {/* Recommendation badge */}
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{reviewsData.recommend_percent || 94}% of customers recommend this item</span>
            </div>
          </div>

          {/* Middle Column: 5-Star Histogram Distribution */}
          <div className="md:col-span-5 space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#2D2118] mb-1">
              Rating Distribution
            </div>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewsData.breakdown?.[String(stars)] || 0;
              const percent = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
              const isSelected = ratingFilter === stars;
              return (
                <button
                  key={stars}
                  onClick={() => setRatingFilter(isSelected ? null : stars)}
                  className={`w-full flex items-center gap-2 group text-left transition rounded-lg p-0.5 ${
                    isSelected ? "bg-amber-100/60 ring-1 ring-amber-400" : "hover:bg-black/5"
                  }`}
                >
                  <span className="text-xs font-bold text-[#2D2118] w-7 flex items-center gap-0.5">
                    {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500 w-10 text-right">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Feature Ratings (Fit, Quality, Value) */}
          <div className="md:col-span-3 space-y-3 bg-white/70 p-4 rounded-2xl border border-[#E8DFC9]">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5C1E1E]">
              Fit & Quality Metrics
            </div>

            {/* Fit meter */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-[#2D2118] mb-1">
                <span>Fit</span>
                <span className="text-[#5C1E1E]">{fitLabel(reviewsData.feature_ratings?.avg_fit || 3.0)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full relative">
                <div
                  className="w-3 h-3 bg-[#5C1E1E] rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 shadow"
                  style={{ left: `${((reviewsData.feature_ratings?.avg_fit || 3) / 5) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>Small</span>
                <span>True Fit</span>
                <span>Large</span>
              </div>
            </div>

            {/* Quality Meter */}
            <div className="pt-1">
              <div className="flex justify-between text-[11px] font-bold text-[#2D2118]">
                <span>Quality Score</span>
                <span className="text-amber-700">{reviewsData.feature_ratings?.avg_quality || 4.8} / 5</span>
              </div>
            </div>

            {/* Value Meter */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-[#2D2118]">
                <span>Value for Money</span>
                <span className="text-amber-700">{reviewsData.feature_ratings?.avg_value || 4.7} / 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. FILTER & SORT CONTROLS BAR ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E8DFC9]">
        
        {/* Left: Star Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setRatingFilter(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              ratingFilter === null
                ? "bg-[#5C1E1E] text-white shadow-md shadow-[#5C1E1E]/20"
                : "bg-[#FAF5EC] text-[#2D2118] border border-[#E8DFC9] hover:bg-gray-100"
            }`}
          >
            All Ratings ({totalReviewsCount})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setRatingFilter(ratingFilter === stars ? null : stars)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                ratingFilter === stars
                  ? "bg-[#5C1E1E] text-white shadow-md shadow-[#5C1E1E]/20"
                  : "bg-[#FAF5EC] text-[#2D2118] border border-[#E8DFC9] hover:bg-gray-100"
              }`}
            >
              <span>{stars}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </button>
          ))}
        </div>

        {/* Right: Feature Toggles & Sort Dropdown + Write Review Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Verified toggle */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
              verifiedOnly
                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : "bg-white border-[#E8DFC9] text-gray-600 hover:border-gray-400"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Buyers</span>
          </button>

          {/* Photos only toggle */}
          <button
            onClick={() => setPhotosOnly(!photosOnly)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
              photosOnly
                ? "bg-amber-100 border-amber-300 text-amber-900"
                : "bg-white border-[#E8DFC9] text-gray-600 hover:border-gray-400"
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-600" />
            <span>With Photos</span>
          </button>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-1.5 text-xs font-bold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>

          {/* Write a Review Button */}
          <button
            onClick={() => setShowWriteModal(true)}
            className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-[#5C1E1E]/20 transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* ─── 3. REVIEWS CARDS FEED ────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#E8DFC9] border-t-[#5C1E1E] animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Fetching verified reviews...</p>
        </div>
      ) : reviewsData.reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-[#E8DFC9] space-y-3 p-6">
          <MessageCircle className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-[#2D2118]">No reviews match your filters</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try resetting your filters or be the first to share your experience with this item!
          </p>
          <button
            onClick={() => {
              setRatingFilter(null);
              setVerifiedOnly(false);
              setPhotosOnly(false);
            }}
            className="bg-[#2D2118] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewsData.reviews.map((rev) => {
            const authorName = rev.userName || "Customer";
            const initials = authorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const isUpvoted = votedReviews[rev.id];

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-sm hover:shadow-md transition space-y-3"
              >
                {/* Header: User Avatar + Name + Rating + Verified Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Initial Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5C1E1E] to-[#8B3A3A] text-white font-black text-xs flex items-center justify-center shadow-md">
                      {initials || <User className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#2D2118]">{authorName}</span>
                        {rev.verifiedPurchase && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {rev.created_at
                          ? new Date(rev.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })
                          : "Recently"}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < (rev.rating || 5)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                {rev.title && (
                  <h5 className="font-bold text-sm text-[#2D2118]">{rev.title}</h5>
                )}

                {/* Body Text */}
                <p className="text-xs text-[#2D2118] leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>

                {/* Feature Tags */}
                {(rev.fitRating || rev.qualityRating) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rev.fitRating && (
                      <span className="bg-[#FAF5EC] text-[#8B7355] border border-[#E8DFC9] text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                        Fit: {fitLabel(rev.fitRating)}
                      </span>
                    )}
                    {rev.qualityRating && (
                      <span className="bg-[#FAF5EC] text-[#8B7355] border border-[#E8DFC9] text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                        Quality: {rev.qualityRating}/5
                      </span>
                    )}
                  </div>
                )}

                {/* Customer Photo Gallery Thumbnails */}
                {((rev.photos && rev.photos.length > 0) || rev.photoUrl) && (
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    {(rev.photos || [rev.photoUrl]).map((imgUrl, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => setLightboxImg(imgUrl)}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-[#E8DFC9] hover:scale-105 transition shadow-sm relative group flex-shrink-0"
                      >
                        <img
                          src={imgUrl}
                          alt="Customer attachment"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Official Brand Response Box */}
                {rev.adminResponse && (
                  <div className="mt-3 bg-[#FAF5EC] border-l-4 border-[#5C1E1E] p-3 rounded-r-xl space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#5C1E1E]" />
                      <span className="text-[11px] font-black text-[#5C1E1E] uppercase tracking-wider">
                        Response from {rev.adminResponse.respondedBy || "RIVAANTA Luxury"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 italic">
                      "{rev.adminResponse.responseText}"
                    </p>
                  </div>
                )}

                {/* Bottom Bar: Helpful Upvote Button */}
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleVoteHelpful(rev.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                      isUpvoted
                        ? "bg-[#5C1E1E] text-white border-[#5C1E1E]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? "fill-white" : ""}`} />
                    <span>Helpful ({rev.helpfulVotes || 0})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 4. WRITE REVIEW MODAL ────────────────────────────────────────── */}
      {showWriteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWriteModal(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-[#E8DFC9] space-y-5 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowWriteModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1">
              <div className="w-11 h-11 bg-[#5C1E1E] text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#5C1E1E]/30">
                <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
              </div>
              <h3 className="text-xl font-black text-[#2D2118]">Write a Product Review</h3>
              <p className="text-xs text-[#8B7355]">
                Sharing your experience for <strong>{productName || "this product"}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              
              {/* Star Rating Toggle */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1.5 text-center">
                  Overall Rating *
                </label>
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= formRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Slider Toggle */}
              <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#2D2118]">
                  <span>Sizing / Fit</span>
                  <span className="text-[#5C1E1E] font-black">{fitLabel(formFit)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={formFit}
                  onChange={(e) => setFormFit(Number(e.target.value))}
                  className="w-full accent-[#5C1E1E] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Runs Small</span>
                  <span>True to Size</span>
                  <span>Runs Large</span>
                </div>
              </div>

              {/* Your Name */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Roy"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>

              {/* Review Title */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gorgeous Saree — Fabric feels super soft!"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>

              {/* Detailed Experience */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1">
                  Detailed Experience *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe fit, fabric quality, color accuracy, or delivery experience..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl p-3 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>

              {/* Photos Attachment */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1">
                  Attach Product Photos (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={formPhotoInput}
                    onChange={(e) => setFormPhotoInput(e.target.value)}
                    className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-3 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="bg-[#2D2118] text-white px-3 py-2 rounded-2xl text-xs font-bold hover:bg-[#5C1E1E] transition"
                  >
                    Add
                  </button>
                </div>

                {/* Thumbnails preview */}
                {formPhotos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {formPhotos.map((url, idx) => (
                      <div key={idx} className="w-14 h-14 rounded-xl relative border border-[#E8DFC9] overflow-hidden group">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 text-[9px]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !formComment.trim()}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 transition active:scale-95"
              >
                {submitting ? "Publishing Review..." : "Submit Official Review"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── 5. PHOTO LIGHTBOX OVERLAY ────────────────────────────────────── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/20 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Customer photo"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}

    </div>
  );
}
