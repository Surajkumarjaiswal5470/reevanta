import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Users, ShieldCheck, ShieldAlert, Ban, CheckCircle2, Search,
  RefreshCw, Trash2, Eye, UserX, UserCheck, ShoppingBag, Star,
  Calendar, Phone, Mail, AlertTriangle, X, ChevronLeft, ChevronRight,
  DollarSign, FileText, ArrowUpRight
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

export function CustomersPage() {
  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Customers list
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "active" | "blocked"
  const [roleFilter, setRoleFilter] = useState(""); // "" | "user" | "admin"
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  // Modals
  const [blockModalUser, setBlockModalUser] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockDays, setBlockDays] = useState("");
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const [detailsModalUser, setDetailsModalUser] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // ── Fetch Summary Stats ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users/stats/summary`);
      setStats(res.data);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch Users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", LIMIT);
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      if (roleFilter) params.append("role", roleFilter);

      const res = await axios.get(`${API}/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      toast.error("Failed to load customer accounts");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, roleFilter]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [fetchStats, fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  // ── Block Customer ──
  const handleBlockCustomer = async (e) => {
    e.preventDefault();
    if (!blockReason.trim() || !blockModalUser) {
      toast.error("Please enter a reason for suspending this account");
      return;
    }

    setBlockSubmitting(true);
    try {
      const userId = blockModalUser.id || blockModalUser._id;
      const res = await axios.post(`${API}/admin/users/${userId}/block`, {
        reason: blockReason.trim(),
        duration_days: blockDays ? parseInt(blockDays) : null,
      });
      toast.success(res.data.message || "Customer account blocked");
      setBlockModalUser(null);
      setBlockReason("");
      setBlockDays("");
      fetchUsers();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to block user";
      toast.error(msg);
    } finally {
      setBlockSubmitting(false);
    }
  };

  // ── Unblock Customer ──
  const handleUnblockCustomer = async (user) => {
    const userId = user.id || user._id;
    if (!window.confirm(`Unblock account for customer "${user.name || user.email || userId}"?`)) return;

    try {
      const res = await axios.post(`${API}/admin/users/${userId}/unblock`);
      toast.success(res.data.message || "Customer account unblocked! ✨");
      fetchUsers();
      fetchStats();
    } catch {
      toast.error("Failed to unblock customer");
    }
  };

  // ── Delete Customer ──
  const handleDeleteCustomer = async (user) => {
    const userId = user.id || user._id;
    if (!window.confirm(`Permanently delete account for "${user.name || user.email || userId}"? This action cannot be undone.`)) return;

    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      toast.success("Customer account deleted permanently");
      fetchUsers();
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to delete user account";
      toast.error(msg);
    }
  };

  // ── View Customer Details ──
  const openCustomerDetails = async (user) => {
    const userId = user.id || user._id;
    setDetailsModalUser(user);
    setDetailsLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users/${userId}/details`);
      setDetailsData(res.data);
    } catch {
      toast.error("Failed to load customer profile details");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-white p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Customer Operations
              </span>
              {stats && stats.blocked_users > 0 && (
                <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Ban className="w-3 h-3 text-red-400" /> {stats.blocked_users} Suspended
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Active Customers & Account Control
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage registered buyer profiles, audit lifetime purchase metrics, monitor active accounts, and enforce account suspensions.
            </p>
          </div>

          <button
            onClick={() => { fetchUsers(); fetchStats(); }}
            disabled={loading}
            className="flex items-center gap-1.5 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg transition active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Total Customers</span>
            <span className="text-2xl font-black text-[#2D2118]">{stats?.customer_count ?? total}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Active Accounts</span>
            <span className="text-2xl font-black text-emerald-700">{stats?.active_users ?? "—"}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Suspended / Blocked</span>
            <span className="text-2xl font-black text-red-600">{stats?.blocked_users ?? 0}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">New Signups (30d)</span>
            <span className="text-2xl font-black text-[#5C1E1E]">{stats?.recent_signups_30d ?? "—"}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
            />
          </div>
          <button type="submit" className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#4A1717] transition">
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setSearchInput(""); }}
              className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
            >
              Clear
            </button>
          )}
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8DFC9] pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: "", label: `All Accounts (${total})` },
              { value: "active", label: "Active Only" },
              { value: "blocked", label: "Suspended / Blocked" },
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
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-1.5 text-xs font-bold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
            >
              <option value="">All Roles</option>
              <option value="user">Customers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List Feed */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#8B7355] mt-3">Fetching customer directory...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] space-y-3 p-6">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-[#2D2118]">No customer accounts match your criteria</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try resetting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const userId = u.id || u._id;
            const isBlocked = u.is_blocked;
            const initials = (u.name || u.email || "C").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

            return (
              <div
                key={userId}
                className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition space-y-3 ${
                  isBlocked ? "border-red-300 bg-red-50/20" : "border-[#E8DFC9] hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  {/* Left: User Avatar & Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl text-white font-black text-xs flex items-center justify-center shadow shrink-0 ${
                      isBlocked ? "bg-red-600" : u.role === "admin" ? "bg-[#2D2118]" : "bg-[#5C1E1E]"
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-[#2D2118] truncate">
                          {u.name || "Unnamed Customer"}
                        </span>
                        {u.role === "admin" && (
                          <span className="bg-[#2D2118] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                        {isBlocked ? (
                          <span className="bg-red-100 border border-red-300 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Ban className="w-3 h-3 text-red-600" /> BLOCKED
                          </span>
                        ) : (
                          <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8B7355]">
                        {u.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" /> {u.email}
                          </span>
                        )}
                        {u.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" /> {u.phone}
                          </span>
                        )}
                        <span className="text-gray-400">
                          Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recently"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Metrics Badges */}
                  <div className="flex items-center gap-3 shrink-0 bg-[#FAF5EC] px-3.5 py-2 rounded-xl border border-[#E8DFC9]">
                    <div className="text-center">
                      <span className="text-[9px] font-black uppercase text-gray-400 block">Orders</span>
                      <span className="text-xs font-black text-[#2D2118]">{u.order_count ?? 0}</span>
                    </div>
                    <div className="w-px h-6 bg-[#E8DFC9]" />
                    <div className="text-center">
                      <span className="text-[9px] font-black uppercase text-gray-400 block">Lifetime Spend</span>
                      <span className="text-xs font-black text-emerald-700">₹{u.total_spent ?? 0}</span>
                    </div>
                    <div className="w-px h-6 bg-[#E8DFC9]" />
                    <div className="text-center">
                      <span className="text-[9px] font-black uppercase text-gray-400 block">Reviews</span>
                      <span className="text-xs font-black text-amber-700">{u.review_count ?? 0}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => openCustomerDetails(u)}
                      className="px-3 py-1.5 bg-white border border-[#E8DFC9] hover:bg-gray-50 text-[#2D2118] rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#5C1E1E]" /> Details
                    </button>

                    {isBlocked ? (
                      <button
                        onClick={() => handleUnblockCustomer(u)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Unblock
                      </button>
                    ) : u.role !== "admin" ? (
                      <button
                        onClick={() => { setBlockModalUser(u); setBlockReason(""); setBlockDays(""); }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                      >
                        <UserX className="w-3.5 h-3.5" /> Block
                      </button>
                    ) : null}

                    {u.role !== "admin" && (
                      <button
                        onClick={() => handleDeleteCustomer(u)}
                        className="p-1.5 bg-white border border-[#E8DFC9] hover:bg-red-50 text-red-600 rounded-xl transition"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Suspension Warning Box if Blocked */}
                {isBlocked && u.block_reason && (
                  <div className="p-3 bg-red-100/60 border-l-4 border-red-600 rounded-r-xl text-xs text-red-900 space-y-0.5">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Suspension Reason:
                    </p>
                    <p className="italic">"{u.block_reason}"</p>
                  </div>
                )}
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

      {/* ─── BLOCK USER MODAL ─── */}
      {blockModalUser && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setBlockModalUser(null); }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DFC9] relative space-y-4 my-auto">
            <button
              onClick={() => setBlockModalUser(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#E8DFC9] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#2D2118]">Block Customer Account</h3>
                <p className="text-[11px] text-[#8B7355]">
                  Target: <strong>{blockModalUser.name || blockModalUser.email || "Customer"}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Account Suspension Consequences:
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                <li>Immediate revocation of active tokens & login sessions</li>
                <li>API endpoints will return <code>403 Forbidden</code> for this user</li>
                <li>Submitted product reviews will be automatically flagged</li>
              </ul>
            </div>

            <form onSubmit={handleBlockCustomer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8B7355] block mb-1">Reason for Block *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe why this account is being suspended (e.g. Fraudulent return activity, spam reviews)..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355] block mb-1">Duration (Days, Leave empty for permanent)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  placeholder="e.g. 30"
                  value={blockDays}
                  onChange={(e) => setBlockDays(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={blockSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {blockSubmitting ? "Suspending Account..." : "Confirm & Block Customer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER DETAILS MODAL ─── */}
      {detailsModalUser && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailsModalUser(null); }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E8DFC9] relative space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailsModalUser(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#E8DFC9] pb-3">
              <div className="w-11 h-11 rounded-2xl bg-[#5C1E1E] text-white flex items-center justify-center font-black text-sm">
                {(detailsModalUser.name || "C").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-lg text-[#2D2118]">{detailsModalUser.name || "Customer Profile"}</h3>
                <p className="text-xs text-[#8B7355]">{detailsModalUser.email || detailsModalUser.phone}</p>
              </div>
            </div>

            {detailsLoading ? (
              <div className="text-center py-12">
                <div className="w-7 h-7 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : detailsData && (
              <div className="space-y-4 text-xs">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] text-center">
                    <span className="text-[10px] font-black uppercase text-[#8B7355]">Total Orders</span>
                    <p className="text-base font-black text-[#2D2118] mt-0.5">{detailsData.orders?.length || 0}</p>
                  </div>
                  <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] text-center">
                    <span className="text-[10px] font-black uppercase text-[#8B7355]">Total Spend</span>
                    <p className="text-base font-black text-emerald-700 mt-0.5">₹{detailsData.total_spent || 0}</p>
                  </div>
                  <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] text-center">
                    <span className="text-[10px] font-black uppercase text-[#8B7355]">Reviews</span>
                    <p className="text-base font-black text-amber-700 mt-0.5">{detailsData.reviews?.length || 0}</p>
                  </div>
                </div>

                {/* Orders History */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#2D2118] uppercase text-[11px] tracking-wider">Recent Orders History</h4>
                  {detailsData.orders?.length === 0 ? (
                    <p className="text-gray-400 italic py-2">No past orders found for this customer.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {detailsData.orders?.map((o) => (
                        <div key={o.id} className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E8DFC9] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-[#5C1E1E]">Order #{o.order_number || o.id?.slice(-6)}</span>
                            <p className="text-[10px] text-gray-500">{o.items?.length || 0} items · {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-[#2D2118]">₹{o.total}</span>
                            <span className="block text-[10px] font-bold text-emerald-700">{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
