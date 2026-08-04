import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Star, ShieldCheck, ThumbsUp, Eye, Flag, Trash2, Check, X,
  MessageCircle, AlertTriangle, BarChart3, Download, Search,
  ChevronLeft, ChevronRight, RefreshCw, Ban, FileText, Clock,
  Filter, CheckCircle2, XCircle, AlertCircle, Sparkles, User
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const STATUS_BADGES = {
  approved: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", icon: CheckCircle2 },
  pending: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", icon: Clock },
  flagged: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", icon: AlertTriangle },
  rejected: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", icon: XCircle },
  spam: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", icon: Ban },
  soft_deleted: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-300", icon: Trash2 },
};

export function ReviewModerationPage() {
  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Reviews list
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  // Selected for bulk
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Reply modal
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Ban modal
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");

  // Active tab
  const [activeView, setActiveView] = useState("reviews"); // reviews | analytics | audit

  // Audit log
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // ── Fetch Analytics ──
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await axios.get(`${API}/admin/reviews/analytics`);
      setAnalytics(res.data);
    } catch {
      toast.error("Failed to load review analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ── Fetch Reviews ──
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", LIMIT);
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (reportedOnly) params.append("reported", "true");

      const res = await axios.get(`${API}/admin/reviews?${params.toString()}`);
      setReviews(res.data.reviews || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, reportedOnly]);

  // ── Fetch Audit Log ──
  const fetchAuditLog = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/reviews/audit-log?page=${auditPage}&limit=30`);
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load audit log");
    }
  }, [auditPage]);

  useEffect(() => { fetchAnalytics(); fetchReviews(); }, [fetchAnalytics, fetchReviews]);
  useEffect(() => { if (activeView === "audit") fetchAuditLog(); }, [activeView, fetchAuditLog]);
  useEffect(() => { setPage(1); }, [statusFilter, searchQuery, reportedOnly]);

  // ── Moderate single review ──
  const moderateReview = async (reviewId, status, reason = null) => {
    try {
      await axios.patch(`${API}/admin/reviews/${reviewId}/status`, {
        status,
        rejection_reason: reason,
      });
      toast.success(`Review ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "updated"}`);
      fetchReviews();
      fetchAnalytics();
    } catch {
      toast.error("Moderation action failed");
    }
  };

  // ── Bulk action ──
  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) {
      toast.error("No reviews selected");
      return;
    }
    try {
      await axios.post(`${API}/admin/reviews/bulk-action`, {
        review_ids: Array.from(selectedIds),
        action,
      });
      toast.success(`Bulk ${action} completed on ${selectedIds.size} reviews`);
      setSelectedIds(new Set());
      fetchReviews();
      fetchAnalytics();
    } catch {
      toast.error("Bulk action failed");
    }
  };

  // ── Reply to review ──
  const handleReply = async () => {
    if (!replyText.trim() || !replyModal) return;
    try {
      await axios.post(`${API}/admin/reviews/${replyModal.id}/reply`, {
        responseText: replyText.trim(),
      });
      toast.success("Reply posted successfully");
      setReplyModal(null);
      setReplyText("");
      fetchReviews();
    } catch {
      toast.error("Failed to post reply");
    }
  };

  // ── Ban user ──
  const handleBanUser = async () => {
    if (!banReason.trim() || !banModal) return;
    try {
      await axios.post(`${API}/admin/reviews/users/${banModal}/ban`, {
        reason: banReason.trim(),
        duration_days: banDays ? parseInt(banDays) : null,
      });
      toast.success("User banned from reviews");
      setBanModal(null);
      setBanReason("");
      setBanDays("");
      fetchReviews();
    } catch {
      toast.error("Failed to ban user");
    }
  };

  // ── Export ──
  const handleExport = async (format = "csv") => {
    try {
      const res = await axios.get(`${API}/admin/reviews/export?format=${format}`, {
        responseType: format === "csv" ? "blob" : "json",
      });
      if (format === "csv") {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.download = "reviews_export.csv";
        link.click();
        window.URL.revokeObjectURL(url);
      }
      toast.success(`Reviews exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed");
    }
  };

  // ── Toggle select ──
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.id)));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ─── HEADER ── */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-white p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Reviews Moderation
              </span>
              {analytics && analytics.status_counts?.pending > 0 && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {analytics.status_counts.pending} Pending
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Review Moderation Control Center
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              Approve, reject, flag reviews • Reply to customers • Manage abuse reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={() => { fetchReviews(); fetchAnalytics(); }}
              className="flex items-center gap-1.5 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-5 relative z-10">
          {[
            { id: "reviews", label: "Reviews", icon: MessageCircle },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "audit", label: "Audit Log", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeView === tab.id
                    ? "bg-[#FAF5EC] text-[#2D2118] shadow-md font-black"
                    : "bg-white/10 text-gray-200 hover:bg-white/20"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeView === tab.id ? "text-[#5C1E1E]" : "text-gray-300"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── ANALYTICS VIEW ── */}
      {activeView === "analytics" && (
        <div className="space-y-4">
          {analyticsLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : analytics && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Reviews", value: analytics.total_reviews, color: "text-[#2D2118]" },
                  { label: "Pending", value: analytics.status_counts?.pending || 0, color: "text-amber-700" },
                  { label: "Approved", value: analytics.status_counts?.approved || 0, color: "text-emerald-700" },
                  { label: "Flagged", value: analytics.status_counts?.flagged || 0, color: "text-orange-700" },
                  { label: "Reported", value: analytics.reported_count, color: "text-red-700" },
                  { label: "Avg Rating", value: analytics.avg_rating, color: "text-amber-700" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm text-center space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#8B7355]">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Rating Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8DFC9] shadow-sm">
                <h3 className="text-sm font-black text-[#2D2118] mb-4">Rating Distribution</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = analytics.breakdown?.[String(stars)] || 0;
                    const percent = analytics.total_reviews > 0 ? (count / analytics.total_reviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-xs font-bold w-6 flex items-center gap-0.5">
                          {stars}<Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-12 text-right">{count} ({Math.round(percent)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] space-y-1">
                  <p className="text-[10px] font-black uppercase text-[#8B7355]">Verified Purchase %</p>
                  <p className="text-xl font-black text-emerald-700">{analytics.verified_percent}%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] space-y-1">
                  <p className="text-[10px] font-black uppercase text-[#8B7355]">Response Rate</p>
                  <p className="text-xl font-black text-[#5C1E1E]">{analytics.response_rate}%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] space-y-1">
                  <p className="text-[10px] font-black uppercase text-[#8B7355]">With Media</p>
                  <p className="text-xl font-black text-purple-700">{analytics.with_media}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] space-y-1">
                  <p className="text-[10px] font-black uppercase text-[#8B7355]">Last 30 Days</p>
                  <p className="text-xl font-black text-[#2D2118]">{analytics.recent_30_days}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── AUDIT LOG VIEW ── */}
      {activeView === "audit" && (
        <div className="bg-white rounded-2xl border border-[#E8DFC9] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E8DFC9] flex items-center justify-between">
            <h3 className="font-black text-sm text-[#2D2118] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5C1E1E]" /> Moderation Audit Trail
            </h3>
            <span className="text-[10px] font-bold text-[#8B7355]">{auditTotal} entries</span>
          </div>
          <div className="divide-y divide-[#E8DFC9] max-h-[600px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="p-8 text-center text-xs text-gray-400">No audit entries yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 text-xs flex items-center justify-between gap-3 hover:bg-[#FAF5EC]/50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="bg-[#FAF5EC] text-[#5C1E1E] text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0">
                      {log.action?.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-[#2D2118] font-semibold truncate">
                      {log.review_id ? `Review: ${log.review_id.slice(-6)}` : log.target_user_id ? `User: ${log.target_user_id.slice(-6)}` : "—"}
                    </span>
                    {log.reason && <span className="text-gray-400 truncate">— {log.reason}</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 shrink-0">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── REVIEWS LIST VIEW ── */}
      {activeView === "reviews" && (
        <div className="space-y-4">

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm space-y-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews by text, title, or user name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>
              <button type="submit" className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#4A1717] transition">
                Search
              </button>
            </form>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: "", label: `All (${total})` },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "flagged", label: "Flagged" },
                { value: "rejected", label: "Rejected" },
                { value: "spam", label: "Spam" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === opt.value
                      ? "bg-[#5C1E1E] text-white shadow-md"
                      : "bg-[#FAF5EC] text-[#2D2118] border border-[#E8DFC9] hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              <button
                onClick={() => setReportedOnly(!reportedOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                  reportedOnly
                    ? "bg-red-100 border-red-300 text-red-800"
                    : "bg-white border-[#E8DFC9] text-gray-600"
                }`}
              >
                <Flag className="w-3.5 h-3.5" /> Reported Only
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-[#E8DFC9]">
                <span className="text-xs font-bold text-[#5C1E1E]">{selectedIds.size} selected</span>
                <button onClick={() => handleBulkAction("approve")} className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1">
                  <Check className="w-3 h-3" /> Approve
                </button>
                <button onClick={() => handleBulkAction("reject")} className="bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center gap-1">
                  <X className="w-3 h-3" /> Reject
                </button>
                <button onClick={() => handleBulkAction("spam")} className="bg-gray-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-700 transition flex items-center gap-1">
                  <Ban className="w-3 h-3" /> Spam
                </button>
                <button onClick={() => handleBulkAction("hard_delete")} className="bg-black text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-900 transition flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs font-bold text-gray-500 hover:text-gray-700 ml-2">
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Reviews Table */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400 mt-3">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#E8DFC9]">
              <MessageCircle className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-[#2D2118] mt-3">No reviews found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={selectedIds.size === reviews.length && reviews.length > 0}
                  onChange={toggleSelectAll}
                  className="accent-[#5C1E1E] w-4 h-4"
                />
                <span className="text-[11px] font-bold text-[#8B7355]">Select All</span>
              </div>

              {reviews.map((rev) => {
                const statusBadge = STATUS_BADGES[rev.status] || STATUS_BADGES.pending;
                const StatusIcon = statusBadge.icon;
                const authorName = rev.userName || "Customer";

                return (
                  <div
                    key={rev.id}
                    className={`bg-white rounded-2xl p-4 border shadow-sm transition space-y-3 ${
                      selectedIds.has(rev.id) ? "border-[#5C1E1E] ring-1 ring-[#5C1E1E]/30" : "border-[#E8DFC9]"
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(rev.id)}
                        onChange={() => toggleSelect(rev.id)}
                        className="accent-[#5C1E1E] w-4 h-4 mt-1 shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-[#2D2118]">{authorName}</span>
                          {rev.verifiedPurchase && (
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                          <span className={`${statusBadge.bg} ${statusBadge.text} text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 border ${statusBadge.border}`}>
                            <StatusIcon className="w-3 h-3" /> {(rev.status || "pending").toUpperCase()}
                          </span>
                          {rev.report_count > 0 && (
                            <span className="bg-red-50 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Flag className="w-3 h-3" /> {rev.report_count} Reports
                            </span>
                          )}
                        </div>

                        {/* Product info */}
                        {rev.product_name && (
                          <p className="text-[11px] text-[#8B7355]">
                            Product: <strong>{rev.product_name}</strong>
                          </p>
                        )}

                        {/* Stars */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < (rev.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                          ))}
                          <span className="text-[11px] font-bold text-gray-500 ml-1">
                            Trust: {rev.trust_score || "—"}
                          </span>
                        </div>

                        {rev.title && <h5 className="font-bold text-xs text-[#2D2118]">{rev.title}</h5>}
                        <p className="text-xs text-[#2D2118] leading-relaxed line-clamp-3">{rev.comment}</p>

                        {/* Spam flags */}
                        {rev.spam_flags && rev.spam_flags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rev.spam_flags.map((flag, i) => (
                              <span key={i} className="bg-red-50 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded-lg">
                                {flag.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Admin response */}
                        {rev.adminResponse && (
                          <div className="bg-[#FAF5EC] border-l-4 border-[#5C1E1E] p-2.5 rounded-r-xl">
                            <p className="text-[10px] font-black text-[#5C1E1E] uppercase">
                              Reply by {rev.adminResponse.respondedBy}
                            </p>
                            <p className="text-xs text-gray-700 italic">"{rev.adminResponse.responseText}"</p>
                          </div>
                        )}

                        {/* Date & Meta */}
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          <span>{rev.created_at ? new Date(rev.created_at).toLocaleString() : "—"}</span>
                          <span>👍 {rev.helpfulVotes || 0}</span>
                          <span>ID: {rev.id?.slice(-6)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {rev.status !== "approved" && (
                          <button
                            onClick={() => moderateReview(rev.id, "approved")}
                            className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold hover:bg-emerald-700 transition flex items-center gap-1"
                            title="Approve"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {rev.status !== "rejected" && (
                          <button
                            onClick={() => moderateReview(rev.id, "rejected")}
                            className="bg-red-600 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold hover:bg-red-700 transition flex items-center gap-1"
                            title="Reject"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        )}
                        <button
                          onClick={() => { setReplyModal(rev); setReplyText(rev.adminResponse?.responseText || ""); }}
                          className="bg-[#5C1E1E] text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold hover:bg-[#4A1717] transition flex items-center gap-1"
                          title="Reply"
                        >
                          <MessageCircle className="w-3 h-3" /> Reply
                        </button>
                        {rev.user_id && (
                          <button
                            onClick={() => setBanModal(rev.user_id)}
                            className="bg-gray-800 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold hover:bg-black transition flex items-center gap-1"
                            title="Ban User"
                          >
                            <Ban className="w-3 h-3" /> Ban
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 rounded-xl border border-[#E8DFC9] flex items-center justify-center hover:bg-[#FAF5EC] transition disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-[#2D2118]">
                    Page {page} of {pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page >= pages}
                    className="w-9 h-9 rounded-xl border border-[#E8DFC9] flex items-center justify-center hover:bg-[#FAF5EC] transition disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── REPLY MODAL ── */}
      {replyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setReplyModal(null); }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DFC9] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-[#2D2118] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5C1E1E]" /> Official Reply
              </h3>
              <button onClick={() => setReplyModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF5EC] rounded-xl text-xs border border-[#E8DFC9]">
              <p className="font-bold text-[#5C1E1E]">{replyModal.userName || "Customer"}</p>
              <p className="text-gray-600 mt-1 line-clamp-3">"{replyModal.comment}"</p>
            </div>

            <textarea
              rows={4}
              placeholder="Write your official response..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
            />

            <button
              onClick={handleReply}
              disabled={!replyText.trim()}
              className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3 rounded-2xl text-xs font-bold transition shadow-lg disabled:opacity-50"
            >
              Post Official Reply
            </button>
          </div>
        </div>
      )}

      {/* ─── BAN MODAL ── */}
      {banModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setBanModal(null); }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DFC9] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-[#2D2118] flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-600" /> Ban User from Reviews
              </h3>
              <button onClick={() => setBanModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              This will ban user <strong>{banModal.slice(-6)}</strong> from posting new reviews and flag all their existing reviews.
            </div>

            <div>
              <label className="text-xs font-bold text-[#8B7355] block mb-1">Reason *</label>
              <textarea
                rows={3}
                placeholder="Explain why this user is being banned..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8B7355] block mb-1">Duration (days, empty = permanent)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 30"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              onClick={handleBanUser}
              disabled={!banReason.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl text-xs font-bold transition shadow-lg disabled:opacity-50"
            >
              Confirm Ban
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
