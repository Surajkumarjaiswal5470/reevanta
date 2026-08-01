import React, { useState } from "react";
import { Flag, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

const REASON_OPTIONS = [
  "Misleading or Inaccurate Information",
  "Prohibited, Counterfeit or Replica Item",
  "Incorrect Category or Pricing",
  "Inappropriate or Offensive Content",
  "Suspected Fraud or Scam",
  "Other Reason"
];

export function ReportModal({ isOpen, onClose, product }) {
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${API}/marketplace/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product._id || product.id,
          reporter_user_id: localStorage.getItem("reevanta_user_id") || "guest",
          reason: selectedReason,
          details
        })
      });

      if (res.ok) {
        toast.success("Report submitted. Our moderation desk will review this listing shortly.", { icon: "🛡️" });
        onClose();
      } else {
        toast.error("Failed to submit report");
      }
    } catch (err) {
      toast.error("Network error while submitting report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#E8DFC9] relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
          <div className="flex items-center gap-2 text-[#5C1E1E]">
            <Flag className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-[#2D2118]">Report Listing</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9] text-xs">
          <span className="font-black text-[#5C1E1E]">Reporting: </span>
          <span className="font-bold text-[#2D2118]">{product.name}</span>
        </div>

        <form onSubmit={handleSubmitReport} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#8B7355] block mb-1">Select Reason for Report *</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-bold text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
            >
              {REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8B7355] block mb-1">Additional Details (Optional)</label>
            <textarea
              rows={3}
              placeholder="Describe the issue with this product listing..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-medium text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3 rounded-2xl text-xs font-bold transition shadow disabled:opacity-50"
          >
            {submitting ? "Submitting Report..." : "Submit Report"}
          </button>
        </form>

      </div>
    </div>
  );
}
