import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Tag, Percent, DollarSign, Zap, ShoppingBag, Plus, Trash2, Edit, Check, X,
  Search, RefreshCw, Sparkles, Layers, ShieldCheck, Clock, TrendingUp,
  Gift, Truck, ArrowUpRight, BarChart3, Lock, Users
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const DISCOUNT_TYPES = [
  { id: "percentage", label: "% Percentage Off", icon: Percent },
  { id: "fixed", label: "Fixed ₹ Amount Off", icon: DollarSign },
  { id: "buy_x_get_y", label: "Buy X Get Y (BXGY)", icon: Gift },
  { id: "flash_sale", label: "Flash Sale Countdown", icon: Zap },
  { id: "category", label: "Category Discount", icon: Layers },
  { id: "brand", label: "Brand Discount", icon: Sparkles },
  { id: "free_shipping", label: "Free Shipping Coupon", icon: Truck },
  { id: "referral", label: "Referral Reward Code", icon: Users },
];

const emptyCoupon = {
  code: "",
  discountType: "percentage",
  discountValue: 20,
  minOrderValue: 2999,
  maxDiscount: 1500,
  maxUses: 500,
  autoApply: false,
  isActive: true,
  targetCategory: "",
  targetBrand: "",
  buyQty: 2,
  getQty: 1,
  freeShipping: false,
  referralUserEmail: "",
  flashSaleStart: "",
  flashSaleEnd: "",
  description: "",
  expiryDate: "2026-12-31"
};

export function CouponManagerPage() {
  const [coupons, setCoupons] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState("basic"); // "basic" | "rules" | "flash"
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Vouchers & Analytics ──
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, aRes, cRes, bRes] = await Promise.all([
        axios.get(`${API}/admin/vouchers`),
        axios.get(`${API}/admin/vouchers/analytics`).catch(() => ({ data: null })),
        axios.get(`${API}/admin/categories`).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/catalog/brands`).catch(() => ({ data: [] }))
      ]);
      setCoupons(vRes.data || []);
      setAnalytics(aRes.data);
      setCategoriesList(cRes.data || []);
      setBrandsList(bRes.data || []);
    } catch {
      toast.error("Failed to load coupon catalog data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCoupon(null);
    setCouponForm(emptyCoupon);
    setModalTab("basic");
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || 0,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || "",
      maxUses: coupon.maxUses || 500,
      autoApply: coupon.autoApply ?? false,
      isActive: coupon.isActive ?? true,
      targetCategory: coupon.targetCategory || "",
      targetBrand: coupon.targetBrand || "",
      buyQty: coupon.buyQty || 2,
      getQty: coupon.getQty || 1,
      freeShipping: coupon.freeShipping ?? false,
      referralUserEmail: coupon.referralUserEmail || "",
      flashSaleStart: coupon.flashSaleStart || "",
      flashSaleEnd: coupon.flashSaleEnd || "",
      description: coupon.description || "",
      expiryDate: coupon.expiryDate || "2026-12-31"
    });
    setModalTab("basic");
    setShowModal(true);
  };

  // Save Coupon Form
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingCoupon) {
        const cId = editingCoupon.id || editingCoupon._id;
        await axios.patch(`${API}/admin/vouchers/${cId}`, couponForm);
        toast.success(`Coupon code '${couponForm.code}' updated! ✨`);
      } else {
        await axios.post(`${API}/admin/vouchers`, couponForm);
        toast.success(`New Coupon code '${couponForm.code}' created! ✨`);
      }
      setShowModal(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save coupon code");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (cId, code) => {
    if (!window.confirm(`Delete coupon code "${code}"?`)) return;
    try {
      await axios.delete(`${API}/admin/vouchers/${cId}`);
      toast.success(`Coupon code "${code}" deleted`);
      fetchAllData();
    } catch {
      toast.error("Failed to delete coupon code");
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (c.code || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || c.discountType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-[#FAF5EC] p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Promotions Suite
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {analytics?.active_vouchers || 0} Active Coupon Codes
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Enterprise Coupons & Discounts Engine
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage percentage/fixed codes, automatic checkout rules, Buy X Get Y (BXGY), flash sales, category/brand rules, free shipping, and coupon analytics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Coupon Code
            </button>
            <button onClick={fetchAllData} disabled={loading} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {[{ id: "all", label: `All Rules (${coupons.length})` }, ...DISCOUNT_TYPES].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                typeFilter === t.id
                  ? "bg-[#FAF5EC] text-[#2D2118] font-black shadow-md"
                  : "bg-white/10 text-gray-200 hover:bg-white/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Metric Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] block">Total Revenue via Coupons</span>
              <span className="text-2xl font-black text-emerald-700">₹{analytics.total_revenue_generated?.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] block">Total Savings Granted</span>
              <span className="text-2xl font-black text-[#5C1E1E]">₹{analytics.total_discount_granted?.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] block">Total Redemptions</span>
              <span className="text-2xl font-black text-[#2D2118]">{analytics.total_uses} uses</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#8B7355] block">Active Coupon Rules</span>
              <span className="text-2xl font-black text-amber-700">{analytics.active_vouchers} rules</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
          />
        </div>
        <span className="text-xs font-bold text-[#8B7355] shrink-0">
          Showing {filteredCoupons.length} coupons
        </span>
      </div>

      {/* Coupons Feed Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-2">
          <Tag className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="font-bold text-[#2D2118]">No coupon rules match filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((c) => {
            const cId = c.id || c._id;
            const currentUses = c.currentUses || 0;
            const maxUses = c.maxUses || 500;

            return (
              <div key={cId} className="bg-white rounded-2xl p-5 border border-[#E8DFC9] shadow-sm hover:shadow transition space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-[#5C1E1E] bg-[#FAF5EC] px-3 py-1 rounded-xl border border-[#E8DFC9]">
                        {c.code}
                      </span>
                      {c.autoApply && (
                        <span className="bg-purple-100 text-purple-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-300">
                          Auto-Apply
                        </span>
                      )}
                    </div>

                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${c.isActive ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-gray-100 text-gray-600 border-gray-300"}`}>
                      {c.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="pt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-[#2D2118]">
                        {c.discountType === "percentage" && `${c.discountValue}% OFF`}
                        {c.discountType === "fixed" && `₹${c.discountValue} OFF`}
                        {c.discountType === "buy_x_get_y" && `BUY ${c.buyQty || 2} GET ${c.getQty || 1}`}
                        {c.discountType === "free_shipping" && `FREE SHIPPING`}
                        {c.discountType === "flash_sale" && `⚡ ${c.discountValue}% FLASH SALE`}
                        {c.discountType === "category" && `${c.discountValue}% OFF on ${c.targetCategory}`}
                        {c.discountType === "brand" && `${c.discountValue}% OFF on ${c.targetBrand}`}
                      </span>
                      {c.minOrderValue > 0 && (
                        <span className="text-[10px] font-bold text-gray-500">Min: ₹{c.minOrderValue}</span>
                      )}
                    </div>

                    <p className="text-gray-600 text-xs">{c.description || "Promotional coupon code"}</p>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                        <span>Redemption: {currentUses} / {maxUses}</span>
                        <span>Exp: {c.expiryDate || "No Expiry"}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#5C1E1E] rounded-full" style={{ width: `${Math.min((currentUses / maxUses) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8DFC9] flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold text-emerald-700">₹{c.totalRevenueGenerated || 0} Gen.</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEditModal(c)} className="p-2 bg-[#FAF5EC] border border-[#E8DFC9] text-[#2D2118] rounded-xl hover:bg-gray-100 transition">
                      <Edit className="w-3.5 h-3.5 text-[#5C1E1E]" />
                    </button>
                    <button onClick={() => handleDeleteCoupon(cId, c.code)} className="p-2 bg-white border border-[#E8DFC9] hover:bg-red-50 text-red-600 rounded-xl transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE / EDIT COUPON MODAL ─── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-[#E8DFC9] relative my-auto max-h-[92vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#E8DFC9] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5C1E1E] text-white flex items-center justify-center font-bold">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#2D2118]">{editingCoupon ? "Edit Coupon Rule" : "Create New Coupon Code"}</h3>
                <p className="text-xs text-[#8B7355]">Percentage, BXGY, Flash Sales, Category/Brand Rules</p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E8DFC9] gap-4 text-xs font-bold">
              <button type="button" onClick={() => setModalTab("basic")} className={`pb-2 border-b-2 ${modalTab === "basic" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>1. Code & Type</button>
              <button type="button" onClick={() => setModalTab("rules")} className={`pb-2 border-b-2 ${modalTab === "rules" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>2. Discount Values & Targets</button>
              <button type="button" onClick={() => setModalTab("flash")} className={`pb-2 border-b-2 ${modalTab === "flash" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}>3. Flash Sale & Limits</button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              {modalTab === "basic" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Coupon Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ROYAL20"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-mono font-black text-[#5C1E1E] uppercase"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Discount Rule Type</label>
                      <select
                        value={couponForm.discountType}
                        onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                        className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-bold text-[#2D2118]"
                      >
                        {DISCOUNT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. 20% OFF on orders over ₹2,999"
                      value={couponForm.description}
                      onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={couponForm.autoApply}
                        onChange={(e) => setCouponForm({ ...couponForm, autoApply: e.target.checked })}
                        className="accent-[#5C1E1E] w-4 h-4"
                      />
                      <span>Auto-Apply at Checkout</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={couponForm.isActive}
                        onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                        className="accent-[#5C1E1E] w-4 h-4"
                      />
                      <span>Is Active & Published</span>
                    </label>
                  </div>
                </div>
              )}

              {modalTab === "rules" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Discount Value (% or ₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={couponForm.discountValue}
                        onChange={(e) => setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Minimum Order Value (₹)</label>
                      <input
                        type="number"
                        value={couponForm.minOrderValue}
                        onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  {couponForm.discountType === "category" && (
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Target Category</label>
                      <select
                        value={couponForm.targetCategory}
                        onChange={(e) => setCouponForm({ ...couponForm, targetCategory: e.target.value })}
                        className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                      >
                        <option value="">Select Category...</option>
                        {categoriesList.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  {couponForm.discountType === "brand" && (
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Target Brand</label>
                      <select
                        value={couponForm.targetBrand}
                        onChange={(e) => setCouponForm({ ...couponForm, targetBrand: e.target.value })}
                        className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                      >
                        <option value="">Select Brand...</option>
                        {brandsList.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                  )}

                  {couponForm.discountType === "buy_x_get_y" && (
                    <div className="grid grid-cols-2 gap-3 bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9]">
                      <div>
                        <label className="font-bold text-[#8B7355] block mb-1">Buy Quantity (X)</label>
                        <input
                          type="number"
                          value={couponForm.buyQty}
                          onChange={(e) => setCouponForm({ ...couponForm, buyQty: parseInt(e.target.value) || 1 })}
                          className="w-full bg-white border p-2 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#8B7355] block mb-1">Get Quantity (Y)</label>
                        <input
                          type="number"
                          value={couponForm.getQty}
                          onChange={(e) => setCouponForm({ ...couponForm, getQty: parseInt(e.target.value) || 1 })}
                          className="w-full bg-white border p-2 rounded-xl font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={couponForm.freeShipping}
                      onChange={(e) => setCouponForm({ ...couponForm, freeShipping: e.target.checked })}
                      className="accent-[#5C1E1E] w-4 h-4"
                    />
                    <span>Include Free Shipping Waiver</span>
                  </label>
                </div>
              )}

              {modalTab === "flash" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Max Uses Limit</label>
                      <input
                        type="number"
                        value={couponForm.maxUses}
                        onChange={(e) => setCouponForm({ ...couponForm, maxUses: parseInt(e.target.value) || 500 })}
                        className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Expiry Date (YYYY-MM-DD)</label>
                      <input
                        type="date"
                        value={couponForm.expiryDate}
                        onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                        className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="bg-[#FAF5EC] p-3.5 rounded-2xl border border-[#E8DFC9] space-y-2">
                    <h4 className="font-bold text-[#5C1E1E] flex items-center gap-1.5"><Zap className="w-4 h-4" /> Flash Sale Timers</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-600 block mb-1">Flash Start Datetime</label>
                        <input
                          type="datetime-local"
                          value={couponForm.flashSaleStart ? couponForm.flashSaleStart.slice(0, 16) : ""}
                          onChange={(e) => setCouponForm({ ...couponForm, flashSaleStart: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                          className="w-full bg-white border p-2 rounded-xl font-medium"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-600 block mb-1">Flash End Datetime</label>
                        <input
                          type="datetime-local"
                          value={couponForm.flashSaleEnd ? couponForm.flashSaleEnd.slice(0, 16) : ""}
                          onChange={(e) => setCouponForm({ ...couponForm, flashSaleEnd: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                          className="w-full bg-white border p-2 rounded-xl font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl font-bold shadow-lg transition"
              >
                {submitting ? "Saving Coupon Rule..." : "Save Coupon Rule & Publish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
