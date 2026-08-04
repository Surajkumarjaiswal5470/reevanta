import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Star, ThumbsUp, ThumbsDown, ShieldCheck, Camera, Video, Filter, ArrowUpDown, Plus,
  X, Check, Sparkles, AlertCircle, MessageCircle, ChevronLeft, ChevronRight, User,
  Search, Flag, Heart, Zap, Play, Eye
} from "lucide-react";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { WriteReviewModal } from "./WriteReviewModal";
import { ReviewReportModal } from "./ReviewReportModal";
import { toast } from "sonner";

/**
 * ProductReviews – Enterprise-grade product reviews section.
 *
 * Features:
 *   - Rating overview hub with distribution chart & multi-criteria metrics
 *   - Full filter bar: star rating, verified, photos, videos, text search, sort
 *   - Review cards with: anonymous, verified badge, photos, videos, reactions, reports
 *   - Photo & video lightbox
 *   - Server-side pagination
 *   - Write Review & Report Review modals
 *   - Admin/Seller reply display
 */
export function ProductReviews({ productId, productName }) {
  const { currentUser, setShowAuthModal } = useAuth();

  // Review data state
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    total: 0,
    total_unfiltered: 0,
    page: 1,
    pages: 1,
    has_more: false,
    avg_rating: 0,
    recommend_percent: 0,
    breakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
    media_count: 0,
    feature_ratings: { avg_fit: 3.0, avg_quality: 4.8, avg_value: 4.7 },
  });
  const [loading, setLoading] = useState(true);

  // Filter & Sort
  const [sortBy, setSortBy] = useState("recent");
  const [ratingFilter, setRatingFilter] = useState(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [videosOnly, setVideosOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  // Modals
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  // Lightbox
  const [lightboxMedia, setLightboxMedia] = useState(null); // { type: "image"|"video", url }

  // Votes tracking
  const [votedReviews, setVotedReviews] = useState({});

  // Fetch reviews with current filters & pagination
  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("sort_by", sortBy);
      params.append("page", page);
      params.append("limit", LIMIT);
      if (ratingFilter) params.append("rating_filter", ratingFilter);
      if (verifiedOnly) params.append("verified_only", "true");
      if (photosOnly) params.append("with_photos", "true");
      if (videosOnly) params.append("with_videos", "true");
      if (searchText) params.append("search", searchText);

      const data = await apiFetch(`/reviews/product/${productId}?${params.toString()}`);
      setReviewsData(data);
    } catch (err) {
      console.warn("Failed to load reviews:", err);
      // Fallback to old endpoint
      try {
        const params = new URLSearchParams();
        if (sortBy) params.append("sort_by", sortBy);
        if (ratingFilter) params.append("rating_filter", ratingFilter);
        if (verifiedOnly) params.append("verified_only", "true");
        if (photosOnly) params.append("photos_only", "true");
        const fallback = await apiFetch(`/products/${productId}/reviews?${params.toString()}`);
        setReviewsData(prev => ({ ...prev, ...fallback }));
      } catch {
        // silent
      }
    } finally {
      setLoading(false);
    }
  }, [productId, sortBy, ratingFilter, verifiedOnly, photosOnly, videosOnly, searchText, page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [sortBy, ratingFilter, verifiedOnly, photosOnly, videosOnly, searchText]);

  // Helpful vote toggle
  const handleVoteHelpful = async (reviewId, voteType = "helpful") => {
    try {
      const res = await apiFetch(`/reviews/${reviewId}/vote`, {
        method: "POST",
        body: { vote_type: voteType },
      });
      setReviewsData((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId ? { ...r, helpfulVotes: res.helpfulVotes, notHelpfulVotes: res.notHelpfulVotes } : r
        ),
      }));
      setVotedReviews((prev) => ({ ...prev, [reviewId]: res.userVoted ? voteType : null }));
      toast.success(res.userVoted ? "Vote recorded!" : "Vote removed");
    } catch {
      // Fallback to old endpoint
      try {
        const res = await apiFetch(`/products/reviews/${reviewId}/vote`, { method: "POST" });
        setReviewsData((prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === reviewId ? { ...r, helpfulVotes: res.helpfulVotes } : r
          ),
        }));
        setVotedReviews((prev) => ({ ...prev, [reviewId]: res.userVoted }));
      } catch {
        toast.error("Failed to vote");
      }
    }
  };

  // Submit review
  const handleSubmitReview = async (reviewData) => {
    await apiFetch(`/reviews/product/${productId}`, {
      method: "POST",
      body: {
        ...reviewData,
        userEmail: currentUser?.email || null,
      },
    });
    fetchReviews();
  };

  // Report a review
  const openReport = (review) => {
    setReportTarget(review);
    setShowReportModal(true);
  };

  // Search debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchText(searchInput.trim());
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
                {reviewsData.avg_rating || 0}
              </span>
              <span className="text-sm font-bold text-gray-400">/ 5.0</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(reviewsData.avg_rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-[#8B7355] font-medium">
              Based on <strong>{totalReviewsCount}</strong> verified customer reviews
            </p>

            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{reviewsData.recommend_percent || 0}% of customers recommend this item</span>
            </div>

            {reviewsData.media_count > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold px-3 py-1 rounded-full ml-2">
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>{reviewsData.media_count} reviews with media</span>
              </div>
            )}
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

          {/* Right Column: Feature Ratings */}
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
                <span>Small</span><span>True Fit</span><span>Large</span>
              </div>
            </div>

            {/* Quality */}
            <div className="pt-1">
              <div className="flex justify-between text-[11px] font-bold text-[#2D2118]">
                <span>Quality Score</span>
                <span className="text-amber-700">{reviewsData.feature_ratings?.avg_quality || 0} / 5</span>
              </div>
            </div>

            {/* Value */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-[#2D2118]">
                <span>Value for Money</span>
                <span className="text-amber-700">{reviewsData.feature_ratings?.avg_value || 0} / 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. FILTER & SORT CONTROLS BAR ────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
            />
          </div>
          <button
            type="submit"
            className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#4A1717] transition"
          >
            Search
          </button>
          {searchText && (
            <button
              type="button"
              onClick={() => { setSearchText(""); setSearchInput(""); }}
              className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
            >
              Clear
            </button>
          )}
        </form>

        {/* Filter Pills & Sort */}
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
              All ({totalReviewsCount})
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

          {/* Right: Toggles & Sort */}
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
              <span>Verified</span>
            </button>

            {/* Photos toggle */}
            <button
              onClick={() => setPhotosOnly(!photosOnly)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                photosOnly
                  ? "bg-amber-100 border-amber-300 text-amber-900"
                  : "bg-white border-[#E8DFC9] text-gray-600 hover:border-gray-400"
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>Photos</span>
            </button>

            {/* Videos toggle */}
            <button
              onClick={() => setVideosOnly(!videosOnly)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                videosOnly
                  ? "bg-purple-100 border-purple-300 text-purple-900"
                  : "bg-white border-[#E8DFC9] text-gray-600 hover:border-gray-400"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-purple-600" />
              <span>Videos</span>
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-1.5 text-xs font-bold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
              <option value="verified">Verified First</option>
            </select>

            {/* Write Review Button */}
            <button
              onClick={() => setShowWriteModal(true)}
              className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-[#5C1E1E]/20 transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>
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
            Try resetting your filters or be the first to share your experience!
          </p>
          <button
            onClick={() => {
              setRatingFilter(null);
              setVerifiedOnly(false);
              setPhotosOnly(false);
              setVideosOnly(false);
              setSearchText("");
              setSearchInput("");
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
            const isAnonymous = rev.anonymous || authorName === "Anonymous Customer";
            const initials = isAnonymous
              ? null
              : authorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const isUpvoted = votedReviews[rev.id] === "helpful";
            const isDownvoted = votedReviews[rev.id] === "not_helpful";

            const allPhotos = [...(rev.photos || [])];
            if (rev.photoUrl && !allPhotos.includes(rev.photoUrl)) allPhotos.push(rev.photoUrl);
            const allVideos = rev.videos || [];

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-sm hover:shadow-md transition space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5C1E1E] to-[#8B3A3A] text-white font-black text-xs flex items-center justify-center shadow-md">
                      {isAnonymous ? <User className="w-4 h-4" /> : (initials || <User className="w-4 h-4" />)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-[#2D2118]">{authorName}</span>
                        {rev.verifiedPurchase && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Buyer
                          </span>
                        )}
                        {isAnonymous && (
                          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {rev.created_at
                          ? new Date(rev.created_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
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
                          idx < (rev.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                {rev.title && (
                  <h5 className="font-bold text-sm text-[#2D2118]">{rev.title}</h5>
                )}

                {/* Body */}
                <p className="text-xs text-[#2D2118] leading-relaxed whitespace-pre-line">{rev.comment}</p>

                {/* Feature Tags */}
                {(rev.fitRating || rev.qualityRating || rev.valueRating) && (
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
                    {rev.valueRating && (
                      <span className="bg-[#FAF5EC] text-[#8B7355] border border-[#E8DFC9] text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                        Value: {rev.valueRating}/5
                      </span>
                    )}
                  </div>
                )}

                {/* Photo Gallery */}
                {allPhotos.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    {allPhotos.map((imgUrl, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => setLightboxMedia({ type: "image", url: imgUrl })}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-[#E8DFC9] hover:scale-105 transition shadow-sm relative group flex-shrink-0"
                      >
                        <img src={imgUrl} alt="Customer photo" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Video Gallery */}
                {allVideos.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    {allVideos.map((vidUrl, vIdx) => (
                      <button
                        key={vIdx}
                        onClick={() => setLightboxMedia({ type: "video", url: vidUrl })}
                        className="w-24 h-16 rounded-xl overflow-hidden border border-[#E8DFC9] hover:scale-105 transition shadow-sm relative group flex-shrink-0 bg-black/80 flex items-center justify-center"
                      >
                        <Play className="w-6 h-6 text-white/80 group-hover:text-white transition" />
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          <Video className="w-2.5 h-2.5 inline mr-0.5" />Video
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Admin/Seller Response */}
                {rev.adminResponse && (
                  <div className="mt-3 bg-[#FAF5EC] border-l-4 border-[#5C1E1E] p-3 rounded-r-xl space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#5C1E1E]" />
                      <span className="text-[11px] font-black text-[#5C1E1E] uppercase tracking-wider">
                        {rev.adminResponse.isOfficial ? "Official Response" : "Response"} from {rev.adminResponse.respondedBy || "RIVAANTA Luxury"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 italic">"{rev.adminResponse.responseText}"</p>
                    {rev.adminResponse.respondedAt && (
                      <p className="text-[10px] text-gray-400">
                        {new Date(rev.adminResponse.respondedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Bottom Bar: Votes & Report */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {/* Helpful */}
                    <button
                      onClick={() => handleVoteHelpful(rev.id, "helpful")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                        isUpvoted
                          ? "bg-[#5C1E1E] text-white border-[#5C1E1E]"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? "fill-white" : ""}`} />
                      <span>Helpful ({rev.helpfulVotes || 0})</span>
                    </button>

                    {/* Not Helpful */}
                    <button
                      onClick={() => handleVoteHelpful(rev.id, "not_helpful")}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 ${
                        isDownvoted
                          ? "bg-gray-700 text-white border-gray-700"
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <ThumbsDown className={`w-3 h-3 ${isDownvoted ? "fill-white" : ""}`} />
                    </button>
                  </div>

                  {/* Report */}
                  <button
                    onClick={() => openReport(rev)}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition flex items-center gap-1 px-2 py-1"
                    title="Report this review"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Report</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* ─── Pagination ── */}
          {reviewsData.pages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-[#E8DFC9] flex items-center justify-center text-[#2D2118] hover:bg-[#FAF5EC] transition disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, reviewsData.pages) }).map((_, i) => {
                let pageNum;
                if (reviewsData.pages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= reviewsData.pages - 2) {
                  pageNum = reviewsData.pages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                      page === pageNum
                        ? "bg-[#5C1E1E] text-white shadow-md"
                        : "border border-[#E8DFC9] text-[#2D2118] hover:bg-[#FAF5EC]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(Math.min(reviewsData.pages, page + 1))}
                disabled={page >= reviewsData.pages}
                className="w-9 h-9 rounded-xl border border-[#E8DFC9] flex items-center justify-center text-[#2D2118] hover:bg-[#FAF5EC] transition disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-[11px] text-gray-500 ml-2">
                Page {page} of {reviewsData.pages}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── 4. WRITE REVIEW MODAL ────────────────────────────────────────── */}
      <WriteReviewModal
        isOpen={showWriteModal}
        onClose={() => setShowWriteModal(false)}
        productId={productId}
        productName={productName}
        currentUser={currentUser}
        onSubmitReview={handleSubmitReview}
      />

      {/* ─── 5. REPORT REVIEW MODAL ────────────────────────────────────────── */}
      <ReviewReportModal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setReportTarget(null); }}
        reviewId={reportTarget?.id}
        reviewUserName={reportTarget?.userName}
      />

      {/* ─── 6. MEDIA LIGHTBOX OVERLAY ────────────────────────────────────── */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/20 rounded-full p-2 z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {lightboxMedia.type === "image" ? (
            <img
              src={lightboxMedia.url}
              alt="Customer photo"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
          ) : (
            <div className="max-w-3xl w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
              {lightboxMedia.url.includes("youtube.com") || lightboxMedia.url.includes("youtu.be") ? (
                <iframe
                  src={lightboxMedia.url.replace("watch?v=", "embed/")}
                  title="Review Video"
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
