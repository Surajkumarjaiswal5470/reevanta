import React, { useState, useEffect, useMemo } from "react";
import {
  Star, X, Camera, Video, Eye, AlertCircle, ShieldCheck,
  Sparkles, User, ThumbsUp, Check, ChevronRight
} from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { toast } from "sonner";

/**
 * WriteReviewModal – Rich interactive modal for submitting and editing reviews.
 * Features:
 *   - Interactive star picker with hover states
 *   - Multi-criteria ratings (Fit, Quality, Value)
 *   - Photo & video upload with preview
 *   - Character counter & live validation
 *   - Anonymous toggle
 *   - Live preview tab showing how the review will appear on the storefront
 */
export function WriteReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  currentUser,
  onSubmitReview,
  existingReview = null, // Pass for editing
}) {
  const isEditing = !!existingReview;

  // Form state
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [fitRating, setFitRating] = useState(existingReview?.fitRating || 3);
  const [qualityRating, setQualityRating] = useState(existingReview?.qualityRating || 5);
  const [valueRating, setValueRating] = useState(existingReview?.valueRating || 5);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [photos, setPhotos] = useState(existingReview?.photos || []);
  const [videos, setVideos] = useState(existingReview?.videos || []);
  const [anonymous, setAnonymous] = useState(existingReview?.anonymous || false);
  const [userName, setUserName] = useState(existingReview?.userName || currentUser?.name || "");
  const [submitting, setSubmitting] = useState(false);

  // Tab state: "write" | "preview"
  const [activeTab, setActiveTab] = useState("write");

  // Video URL input
  const [videoUrlInput, setVideoUrlInput] = useState("");

  const MAX_COMMENT = 5000;
  const MIN_COMMENT = 10;

  // Update name when user resolves
  useEffect(() => {
    if (currentUser?.name && !userName) {
      setUserName(currentUser.name);
    }
  }, [currentUser]);

  const fitLabel = (val) => {
    if (val <= 2) return "Runs Small";
    if (val >= 4) return "Runs Large";
    return "True to Size";
  };

  const ratingLabel = (val) => {
    const labels = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };
    return labels[val] || "";
  };

  // Validation
  const errors = useMemo(() => {
    const e = {};
    if (!comment.trim()) e.comment = "Review text is required";
    else if (comment.trim().length < MIN_COMMENT) e.comment = `Minimum ${MIN_COMMENT} characters required`;
    if (!userName.trim() && !anonymous) e.userName = "Name is required unless posting anonymously";
    return e;
  }, [comment, userName, anonymous]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitReview({
        userName: anonymous ? "Anonymous Customer" : userName.trim(),
        rating,
        fitRating,
        qualityRating,
        valueRating,
        title: title.trim() || null,
        comment: comment.trim(),
        photos,
        videos,
        anonymous,
      });
      toast.success(isEditing ? "Review updated successfully! ✨" : "Review posted successfully! ✨");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVideo = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    if (!url.startsWith("http")) {
      toast.error("Please enter a valid video URL");
      return;
    }
    if (videos.length >= 3) {
      toast.error("Maximum 3 videos allowed per review");
      return;
    }
    setVideos([...videos, url]);
    setVideoUrlInput("");
  };

  if (!isOpen) return null;

  // ── Live Preview Renderer ──
  const PreviewCard = () => {
    const displayName = anonymous ? "Anonymous Customer" : (userName || "Customer");
    const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    return (
      <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5C1E1E] to-[#8B3A3A] text-white font-black text-xs flex items-center justify-center shadow-md">
              {anonymous ? <User className="w-4 h-4" /> : initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#2D2118]">{displayName}</span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Buyer
                </span>
              </div>
              <span className="text-[11px] text-gray-400">Just now</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
              />
            ))}
          </div>
        </div>

        {title && <h5 className="font-bold text-sm text-[#2D2118]">{title}</h5>}

        <p className="text-xs text-[#2D2118] leading-relaxed whitespace-pre-line">
          {comment || <span className="text-gray-400 italic">Your review text will appear here...</span>}
        </p>

        {(fitRating || qualityRating) && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="bg-[#FAF5EC] text-[#8B7355] border border-[#E8DFC9] text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
              Fit: {fitLabel(fitRating)}
            </span>
            <span className="bg-[#FAF5EC] text-[#8B7355] border border-[#E8DFC9] text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
              Quality: {qualityRating}/5
            </span>
            <span className="bg-[#FAF5EC] text-[#8B7355] border border-[#E8DFC9] text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
              Value: {valueRating}/5
            </span>
          </div>
        )}

        {photos.length > 0 && (
          <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
            {photos.map((url, i) => (
              <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-[#E8DFC9] shadow-sm flex-shrink-0">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {videos.length > 0 && (
          <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
            {videos.map((url, i) => (
              <div key={i} className="w-24 h-16 rounded-xl overflow-hidden border border-[#E8DFC9] shadow-sm flex-shrink-0 bg-black flex items-center justify-center">
                <Video className="w-5 h-5 text-white/70" />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Helpful (0)</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl relative border border-[#E8DFC9] max-h-[92vh] flex flex-col overflow-hidden">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 pb-0 text-center space-y-1">
          <div className="w-11 h-11 bg-[#5C1E1E] text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#5C1E1E]/30">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <h3 className="text-xl font-black text-[#2D2118]">
            {isEditing ? "Edit Your Review" : "Write a Product Review"}
          </h3>
          <p className="text-xs text-[#8B7355]">
            Sharing your experience for <strong>{productName || "this product"}</strong>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mx-6 mt-4 bg-[#FAF5EC] rounded-2xl p-1 border border-[#E8DFC9]">
          <button
            onClick={() => setActiveTab("write")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "write"
                ? "bg-white text-[#2D2118] shadow-sm"
                : "text-[#8B7355] hover:text-[#2D2118]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Write Review
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-white text-[#2D2118] shadow-sm"
                : "text-[#8B7355] hover:text-[#2D2118]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Live Preview
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">

          {activeTab === "preview" ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-[11px] text-[#8B7355] font-bold uppercase tracking-wider">
                  This is how your review will appear to other customers
                </p>
              </div>
              <PreviewCard />
              {!isValid && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Complete the required fields in the "Write Review" tab before submitting.</span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── Overall Star Rating ── */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1.5 text-center">
                  Overall Rating *
                </label>
                <div className="flex justify-center items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-0.5 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-[11px] font-bold text-[#5C1E1E] mt-1">
                  {ratingLabel(hoverRating || rating)}
                </p>
              </div>

              {/* ── Multi-Criteria Ratings ── */}
              <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] space-y-3">
                {/* Fit */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#2D2118]">
                    <span>Sizing / Fit</span>
                    <span className="text-[#5C1E1E] font-black">{fitLabel(fitRating)}</span>
                  </div>
                  <input
                    type="range" min="1" max="5" step="1" value={fitRating}
                    onChange={(e) => setFitRating(Number(e.target.value))}
                    className="w-full accent-[#5C1E1E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Runs Small</span><span>True to Size</span><span>Runs Large</span>
                  </div>
                </div>

                {/* Quality */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#2D2118]">
                    <span>Quality</span>
                    <span className="text-amber-700 font-black">{qualityRating}/5</span>
                  </div>
                  <div className="flex justify-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setQualityRating(s)} className="p-0.5">
                        <Star className={`w-5 h-5 ${s <= qualityRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#2D2118]">
                    <span>Value for Money</span>
                    <span className="text-amber-700 font-black">{valueRating}/5</span>
                  </div>
                  <div className="flex justify-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setValueRating(s)} className="p-0.5">
                        <Star className={`w-5 h-5 ${s <= valueRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Name / Anonymous ── */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider">
                    Your Name {!anonymous && "*"}
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox" checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="accent-[#5C1E1E] w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-bold text-[#8B7355]">Post anonymously</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Ananya Roy"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={anonymous}
                  className={`w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E] ${
                    anonymous ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                {errors.userName && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.userName}
                  </p>
                )}
              </div>

              {/* ── Review Title ── */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Gorgeous Saree — Fabric feels super soft!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                />
                <p className="text-right text-[10px] text-gray-400 mt-0.5">{title.length}/200</p>
              </div>

              {/* ── Detailed Review Text ── */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1">
                  Detailed Experience *
                </label>
                <textarea
                  rows={4}
                  maxLength={MAX_COMMENT}
                  placeholder="Describe fit, fabric quality, color accuracy, or delivery experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={`w-full bg-[#FAF5EC] border rounded-2xl p-3 text-xs font-semibold text-[#2D2118] focus:outline-none ${
                    errors.comment ? "border-red-300 focus:border-red-500" : "border-[#E8DFC9] focus:border-[#5C1E1E]"
                  }`}
                />
                <div className="flex justify-between mt-0.5">
                  {errors.comment ? (
                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.comment}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className={`text-[10px] ${comment.length > MAX_COMMENT * 0.9 ? "text-red-500" : "text-gray-400"}`}>
                    {comment.length}/{MAX_COMMENT}
                  </p>
                </div>
              </div>

              {/* ── Photo Upload ── */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Camera className="w-3.5 h-3.5 text-[#5C1E1E]" /> Attach Photos (Optional, max 10)
                </label>
                <ImageUploader
                  label=""
                  value=""
                  onChange={(url) => {
                    if (url && !photos.includes(url)) {
                      if (photos.length >= 10) {
                        toast.error("Maximum 10 photos allowed");
                        return;
                      }
                      setPhotos([...photos, url]);
                    }
                  }}
                />
                {photos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {photos.map((url, idx) => (
                      <div key={idx} className="w-14 h-14 rounded-xl relative border border-[#E8DFC9] overflow-hidden group">
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Video Upload ── */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Video className="w-3.5 h-3.5 text-[#5C1E1E]" /> Add Video URL (Optional, max 3)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="bg-[#5C1E1E] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#4A1717] transition"
                  >
                    Add
                  </button>
                </div>
                {videos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {videos.map((url, idx) => (
                      <div key={idx} className="relative bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-1.5 text-[10px] font-bold text-[#2D2118] flex items-center gap-2 group">
                        <Video className="w-3 h-3 text-[#5C1E1E]" />
                        <span className="truncate max-w-[120px]">{url}</span>
                        <button
                          type="button"
                          onClick={() => setVideos(videos.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Preview CTA ── */}
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] text-[#5C1E1E] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#E8DFC9]/50 transition"
              >
                <Eye className="w-3.5 h-3.5" /> Preview Before Submitting
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={submitting || !isValid}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isEditing ? "Updating..." : "Publishing..."}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? "Update Review" : "Submit Official Review"}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
