import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Users, Search, ShieldAlert, ShieldCheck, ShoppingBag, DollarSign,
  Crown, Star, Award, Mail, Phone, MapPin, Calendar, Clock, Lock, Unlock,
  Plus, Check, X, RefreshCw, ChevronRight, Wallet, Heart, ShoppingCart,
  FileText, MessageSquare, ArrowUpRight, AlertCircle, Sparkles
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const TIER_BADGES = {
  "VIP Royal": { label: "👑 VIP Royal", bg: "bg-amber-100 text-amber-900 border-amber-300" },
  "Gold Patron": { label: "🥇 Gold Patron", bg: "bg-yellow-100 text-yellow-900 border-yellow-300" },
  "Silver Shopper": { label: "🥈 Silver Shopper", bg: "bg-slate-100 text-slate-900 border-slate-300" },
  "Bronze Member": { label: "🥉 Bronze Member", bg: "bg-orange-100 text-orange-900 border-orange-200" }
};

export function CustomersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Customer Profile Drawer & Details
  const [selectedUser, setSelectedUser] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState("profile"); // "profile" | "orders" | "assets" | "wallet" | "notes"

  // Modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletForm, setWalletForm] = useState({ amount: 500, points: 50, action_type: "CREDIT", reason: "VIP Promotional Bonus" });
  const [newNoteText, setNewNoteText] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Customers List ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/admin/users?limit=100`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (tierFilter !== "all") url += `&tier=${encodeURIComponent(tierFilter)}`;

      const res = await axios.get(url);
      setUsers(res.data.users || []);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, tierFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch Full Customer Details Deep-Dive
  const openCustomerProfile = async (user) => {
    setSelectedUser(user);
    setDrawerTab("profile");
    setDetailsLoading(true);
    try {
      const uId = user.id || user._id;
      const res = await axios.get(`${API}/admin/users/${uId}/details`);
      setCustomerDetails(res.data);
    } catch {
      toast.error("Failed to fetch customer deep-dive details");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Adjust Wallet Funds or Points
  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const uId = selectedUser.id || selectedUser._id;
      await axios.post(`${API}/admin/users/${uId}/wallet-adjust`, walletForm);
      toast.success(`Wallet / Points successfully ${walletForm.action_type.toLowerCase()}ed! ✨`);
      setShowWalletModal(false);
      openCustomerProfile(selectedUser);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to adjust wallet");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Internal Staff Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newNoteText.trim()) return;
    setSubmitting(true);
    try {
      const uId = selectedUser.id || selectedUser._id;
      await axios.post(`${API}/admin/users/${uId}/notes`, { text: newNoteText });
      toast.success("Staff note added!");
      setNewNoteText("");
      openCustomerProfile(selectedUser);
    } catch {
      toast.error("Failed to add staff note");
    } finally {
      setSubmitting(false);
    }
  };

  // Block User
  const handleBlockUser = async (e) => {
    e.preventDefault();
    if (!selectedUser || !blockReason.trim()) return;
    setSubmitting(true);
    try {
      const uId = selectedUser.id || selectedUser._id;
      await axios.post(`${API}/admin/users/${uId}/block`, { reason: blockReason });
      toast.success(`Account blocked successfully`);
      setShowBlockModal(false);
      setBlockReason("");
      openCustomerProfile(selectedUser);
      fetchUsers();
    } catch {
      toast.error("Failed to block user");
    } finally {
      setSubmitting(false);
    }
  };

  // Unblock User
  const handleUnblockUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const uId = selectedUser.id || selectedUser._id;
      await axios.post(`${API}/admin/users/${uId}/unblock`);
      toast.success(`Account unblocked successfully! ✨`);
      openCustomerProfile(selectedUser);
      fetchUsers();
    } catch {
      toast.error("Failed to unblock user");
    } finally {
      setSubmitting(false);
    }
  };

  const totalVIPs = users.filter(u => u.tier === "VIP Royal").length;
  const totalBlocked = users.filter(u => u.is_blocked).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-[#FAF5EC] p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Customer CRM
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                👑 {totalVIPs} VIP Royals · 🚫 {totalBlocked} Blocked
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Customer Management & Loyalty CRM
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Monitor customer profiles, purchase history, saved addresses, live carts, wishlist items, loyalty rewards, wallet balances, staff notes, and account suspension.
            </p>
          </div>

          <button onClick={fetchUsers} disabled={loading} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tier Filters */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {[
            { id: "all", label: `All (${users.length})` },
            { id: "VIP Royal", label: "👑 VIP Royal" },
            { id: "Gold Patron", label: "🥇 Gold Patron" },
            { id: "Silver Shopper", label: "🥈 Silver Shopper" },
            { id: "Bronze Member", label: "🥉 Bronze Member" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTierFilter(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                tierFilter === t.id
                  ? "bg-[#FAF5EC] text-[#2D2118] font-black shadow-md"
                  : "bg-white/10 text-gray-200 hover:bg-white/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusFilter === "all" ? "bg-[#5C1E1E] text-white" : "bg-[#FAF5EC] text-[#2D2118]"}`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setStatusFilter("blocked")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusFilter === "blocked" ? "bg-red-600 text-white" : "bg-red-50 text-red-700"}`}
          >
            Blocked Only ({totalBlocked})
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-2">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="font-bold text-[#2D2118]">No customers match current filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8DFC9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EC] text-[#8B7355] uppercase tracking-wider font-extrabold border-b border-[#E8DFC9]">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Segmentation Tier</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFC9]">
                {users.map((user) => {
                  const uId = user.id || user._id;
                  const tierData = TIER_BADGES[user.tier] || TIER_BADGES["Bronze Member"];

                  return (
                    <tr key={uId} className="hover:bg-[#FAF5EC]/40 transition">
                      <td className="p-4 font-bold text-[#2D2118]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#5C1E1E] text-white flex items-center justify-center font-black uppercase shrink-0">
                            {(user.name || user.email || "C")[0]}
                          </div>
                          <div>
                            <p className="font-black text-sm text-[#2D2118]">{user.name || "Guest Customer"}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{user.email || user.phone || "No contact"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${tierData.bg}`}>
                          {tierData.label}
                        </span>
                      </td>

                      <td className="p-4 font-black text-sm text-[#5C1E1E]">
                        ₹{user.total_spent?.toLocaleString() || 0}
                      </td>

                      <td className="p-4 font-bold text-[#2D2118]">
                        {user.order_count || 0} orders
                      </td>

                      <td className="p-4">
                        {user.is_blocked ? (
                          <span className="bg-red-100 text-red-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-red-300">
                            Blocked
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => openCustomerProfile(user)}
                          className="bg-[#FAF5EC] border border-[#E8DFC9] hover:bg-gray-100 text-[#2D2118] px-3.5 py-1.5 rounded-xl font-bold text-xs transition"
                        >
                          View Profile & CRM
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER DEEP-DIVE PROFILE DRAWER ─── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white max-w-xl w-full h-full p-6 space-y-4 shadow-2xl border-l border-[#E8DFC9] overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#5C1E1E] text-white flex items-center justify-center font-black text-lg uppercase shadow">
                    {(selectedUser.name || selectedUser.email || "C")[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#2D2118]">{selectedUser.name || "Guest Customer"}</h3>
                    <p className="text-xs text-gray-400 font-mono">{selectedUser.email} · {selectedUser.phone || "No Phone"}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-[#E8DFC9] gap-4 text-xs font-bold overflow-x-auto scrollbar-none">
                <button onClick={() => setDrawerTab("profile")} className={`pb-2 border-b-2 whitespace-nowrap ${drawerTab === "profile" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>1. Overview & Tier</button>
                <button onClick={() => setDrawerTab("orders")} className={`pb-2 border-b-2 whitespace-nowrap ${drawerTab === "orders" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>2. Orders ({customerDetails?.order_count || 0})</button>
                <button onClick={() => setDrawerTab("assets")} className={`pb-2 border-b-2 whitespace-nowrap ${drawerTab === "assets" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>3. Cart & Wishlist</button>
                <button onClick={() => setDrawerTab("wallet")} className={`pb-2 border-b-2 whitespace-nowrap ${drawerTab === "wallet" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>4. Wallet & Rewards</button>
                <button onClick={() => setDrawerTab("notes")} className={`pb-2 border-b-2 whitespace-nowrap ${drawerTab === "notes" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>5. Notes & Security</button>
              </div>

              {detailsLoading ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : customerDetails && (
                <>
                  {/* TAB 1: OVERVIEW & TIER */}
                  {drawerTab === "profile" && (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9]">
                          <span className="text-[10px] font-black uppercase text-[#8B7355]">Segmentation Tier</span>
                          <p className="text-base font-black text-[#5C1E1E] mt-1">{customerDetails.tier}</p>
                        </div>
                        <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9]">
                          <span className="text-[10px] font-black uppercase text-[#8B7355]">Total Spend</span>
                          <p className="text-base font-black text-[#2D2118] mt-1">₹{customerDetails.total_spent}</p>
                        </div>
                        <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9]">
                          <span className="text-[10px] font-black uppercase text-[#8B7355]">Wallet Funds</span>
                          <p className="text-base font-black text-emerald-700 mt-1">₹{customerDetails.wallet_balance}</p>
                        </div>
                        <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9]">
                          <span className="text-[10px] font-black uppercase text-[#8B7355]">Loyalty Rewards</span>
                          <p className="text-base font-black text-purple-700 mt-1">{customerDetails.loyalty_points} PTS</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl border border-[#E8DFC9] space-y-2">
                        <h4 className="font-bold text-[#2D2118]">Contact Info & Account Meta</h4>
                        <p className="text-gray-600">Email: <span className="font-semibold text-gray-800">{customerDetails.email}</span></p>
                        <p className="text-gray-600">Phone: <span className="font-semibold text-gray-800">{customerDetails.phone || "N/A"}</span></p>
                        <p className="text-gray-600">Registered: <span className="font-semibold text-gray-800">{customerDetails.created_at ? new Date(customerDetails.created_at).toLocaleDateString() : "—"}</span></p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PURCHASE HISTORY */}
                  {drawerTab === "orders" && (
                    <div className="space-y-3 text-xs">
                      {customerDetails.orders.length === 0 ? (
                        <p className="text-gray-400 italic text-center py-6">No order history for this customer</p>
                      ) : (
                        customerDetails.orders.map((o) => (
                          <div key={o.id || o._id} className="p-3 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9] space-y-2">
                            <div className="flex justify-between font-bold text-[#2D2118]">
                              <span>#{o.order_number || o.id}</span>
                              <span className="text-[#5C1E1E] font-black">₹{o.total}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-500">
                              <span>Status: <strong className="text-emerald-700">{o.status}</strong></span>
                              <span>{o.placed_at ? new Date(o.placed_at).toLocaleDateString() : "—"}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: CART & WISHLIST */}
                  {drawerTab === "assets" && (
                    <div className="space-y-4 text-xs">
                      <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-2">
                        <h4 className="font-bold text-[#5C1E1E] flex items-center gap-1.5"><ShoppingCart className="w-4 h-4" /> Saved Active Cart ({customerDetails.cart_items?.length || 0})</h4>
                        {(!customerDetails.cart_items || customerDetails.cart_items.length === 0) ? (
                          <p className="text-gray-400 italic">Cart is empty</p>
                        ) : (
                          customerDetails.cart_items.map((ci, i) => (
                            <div key={i} className="flex justify-between text-[11px] p-2 bg-white rounded-xl border border-[#E8DFC9]">
                              <span>{ci.name || ci.product_id} (x{ci.qty || 1})</span>
                              <span className="font-bold text-[#5C1E1E]">₹{ci.price || 0}</span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-2">
                        <h4 className="font-bold text-[#5C1E1E] flex items-center gap-1.5"><Heart className="w-4 h-4" /> Active Wishlist ({customerDetails.wishlist_items?.length || 0})</h4>
                        {(!customerDetails.wishlist_items || customerDetails.wishlist_items.length === 0) ? (
                          <p className="text-gray-400 italic">Wishlist is empty</p>
                        ) : (
                          customerDetails.wishlist_items.map((wi, i) => (
                            <div key={i} className="flex justify-between text-[11px] p-2 bg-white rounded-xl border border-[#E8DFC9]">
                              <span>{wi.name || wi.product_id}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: WALLET & REWARDS */}
                  {drawerTab === "wallet" && (
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9]">
                        <div>
                          <p className="font-bold text-[#2D2118]">Current Wallet Balance: <span className="text-[#5C1E1E] font-black text-base">₹{customerDetails.wallet_balance}</span></p>
                          <p className="font-bold text-[#2D2118]">Loyalty Rewards: <span className="text-purple-700 font-black text-base">{customerDetails.loyalty_points} PTS</span></p>
                        </div>
                        <button onClick={() => setShowWalletModal(true)} className="bg-[#5C1E1E] text-white px-3.5 py-2 rounded-xl font-bold shadow">
                          Adjust Balance / Points
                        </button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-[#8B7355] uppercase text-[10px] tracking-wider">Rewards Ledger History</h4>
                        {(!customerDetails.points_ledger || customerDetails.points_ledger.length === 0) ? (
                          <p className="text-gray-400 italic text-center py-4">No wallet transactions recorded</p>
                        ) : (
                          customerDetails.points_ledger.map((l, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-xl border border-[#E8DFC9] flex justify-between items-center">
                              <div>
                                <p className="font-bold text-[#2D2118]">{l.reason}</p>
                                <p className="text-[10px] text-gray-400">{new Date(l.timestamp).toLocaleString()}</p>
                              </div>
                              <span className={`font-black text-xs ${l.action_type === "CREDIT" ? "text-emerald-700" : "text-red-600"}`}>
                                {l.action_type === "CREDIT" ? "+" : "-"}₹{l.amount} / {l.points} PTS
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: NOTES & SECURITY */}
                  {drawerTab === "notes" && (
                    <div className="space-y-4 text-xs">
                      {/* Account Block Control */}
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-red-900">Account Security Status</p>
                          <p className="text-[11px] text-red-700">{customerDetails.is_blocked ? `Blocked: ${customerDetails.block_reason || "Suspended"}` : "Account is Active"}</p>
                        </div>
                        {customerDetails.is_blocked ? (
                          <button onClick={handleUnblockUser} disabled={submitting} className="bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold">
                            Unblock Account
                          </button>
                        ) : (
                          <button onClick={() => setShowBlockModal(true)} className="bg-red-700 text-white px-3.5 py-1.5 rounded-xl font-bold">
                            Block Account
                          </button>
                        )}
                      </div>

                      {/* Internal Notes Feed */}
                      <form onSubmit={handleAddNote} className="space-y-2">
                        <label className="font-bold text-[#8B7355] block">Add Staff Internal Note</label>
                        <textarea
                          rows={2}
                          placeholder="Record customer preferences or service notes..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-medium"
                        />
                        <button type="submit" disabled={submitting} className="bg-[#2D2118] text-white px-4 py-2 rounded-xl font-bold">
                          Add Staff Note
                        </button>
                      </form>

                      <div className="space-y-2 pt-2 border-t border-[#E8DFC9]">
                        <h4 className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">Internal Notes Feed</h4>
                        {(!customerDetails.internal_notes || customerDetails.internal_notes.length === 0) ? (
                          <p className="text-gray-400 italic">No staff notes recorded</p>
                        ) : (
                          customerDetails.internal_notes.map((n, i) => (
                            <div key={i} className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E8DFC9] space-y-1">
                              <p className="font-semibold text-[#2D2118]">{n.text}</p>
                              <p className="text-[10px] text-gray-400">By {n.admin} on {new Date(n.timestamp).toLocaleString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ADJUST WALLET MODAL ─── */}
      {showWalletModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9] relative">
            <button onClick={() => setShowWalletModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">Adjust Wallet Funds & Rewards</h3>

            <form onSubmit={handleAdjustWallet} className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button type="button" onClick={() => setWalletForm({ ...walletForm, action_type: "CREDIT" })} className={`flex-1 py-2 rounded-xl font-bold ${walletForm.action_type === "CREDIT" ? "bg-emerald-700 text-white" : "bg-gray-100"}`}>Credit (+)</button>
                <button type="button" onClick={() => setWalletForm({ ...walletForm, action_type: "DEBIT" })} className={`flex-1 py-2 rounded-xl font-bold ${walletForm.action_type === "DEBIT" ? "bg-red-600 text-white" : "bg-gray-100"}`}>Debit (-)</button>
              </div>

              <input type="number" placeholder="Wallet Amount (₹)" value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: parseFloat(e.target.value) || 0 })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <input type="number" placeholder="Loyalty Points (PTS)" value={walletForm.points} onChange={(e) => setWalletForm({ ...walletForm, points: parseInt(e.target.value) || 0 })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <input type="text" required placeholder="Reason for adjustment *" value={walletForm.reason} onChange={(e) => setWalletForm({ ...walletForm, reason: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-semibold" />

              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Apply Adjustment</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── BLOCK USER REASON MODAL ─── */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-red-200 relative">
            <button onClick={() => setShowBlockModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-red-900">Block Customer Account</h3>

            <form onSubmit={handleBlockUser} className="space-y-3 text-xs">
              <textarea
                required
                rows={3}
                placeholder="Reason for blocking customer account..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full bg-red-50 border border-red-200 rounded-xl p-3 font-medium text-red-900"
              />
              <button type="submit" disabled={submitting} className="w-full bg-red-700 text-white py-3 rounded-xl font-bold">Confirm Account Suspension</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
