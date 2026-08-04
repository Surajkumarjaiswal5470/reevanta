import React, { useState } from "react";
import { Flag, X, AlertTriangle, ShieldCheck } from "lucide-react";
import { apiFetch } from "../services/api";
import { toast } from "sonner";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or Fake Review", icon: "🚫" },
  { value: "inappropriate", label: "Inappropriate or Offensive Content", icon: "⚠️" },
  { value: "fake", label: "Suspected Fake / Fraudulent Review", icon: "🕵️" },
  { value: "off_topic", label: "Off-Topic or Irrelevant", icon: "📌" },
  { value: "harassment", label: "Harassment or Bullying", icon: "🛡️" },
  { value: "other", label: "Other Reason", icon: "📋" },
];

/**
 * ReviewReportModal – Allows customers to flag inappropriate reviews.
 */
export function ReviewReportModal({ isOpen, onClose, reviewId, reviewUserName }) {
  const [selectedReason, setSelectedReason] = useState("inappropriate");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !reviewId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch(`/reviews/${reviewId}/report`, {
        method: "POST",
        body: { reason: selectedReason, comment: comment.trim() || null },
      });
      setSubmitted(true);
      toast.success("Report submitted. Our moderation team will review it shortly.", { icon: "🛡️" });
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setSelectedReason("inappropriate");
        setComment("");
      }, 2000);
    } catch (err) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#E8DFC9] relative animate-in zoom-in-95 duration-200">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          /* Success State */
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-black text-lg text-[#2D2118]">Report Submitted</h3>
            <p className="text-xs text-[#8B7355]">
              Our moderation team will review this report within 24 hours.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-[#E8DFC9] pb-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#2D2118]">Report Review</h3>
                <p className="text-[11px] text-[#8B7355]">
                  Flag review by <strong>{reviewUserName || "Customer"}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason Selection */}
              <div>
                <label className="text-xs font-bold text-[#8B7355] block mb-2">Select Reason *</label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => setSelectedReason(reason.value)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2.5 ${
                        selectedReason === reason.value
                          ? "bg-red-50 border-red-300 text-red-800 ring-1 ring-red-200"
                          : "bg-[#FAF5EC] border-[#E8DFC9] text-[#2D2118] hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm">{reason.icon}</span>
                      <span>{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="text-xs font-bold text-[#8B7355] block mb-1">Additional Details (Optional)</label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe why you are reporting this review..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-medium text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <p className="text-right text-[10px] text-gray-400 mt-0.5">{comment.length}/1000</p>
              </div>

              {/* Info Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  False reports may result in restrictions on your account. Only report reviews that genuinely violate our community guidelines.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl text-xs font-bold transition shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
