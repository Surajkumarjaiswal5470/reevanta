import React, { useState, useEffect } from "react";
import { Tag, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../services/api";
import { toast } from "sonner";

export function VouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discountType: "fixed",
    discountValue: 500,
    minOrderValue: 1500,
    maxDiscount: 1000,
    autoApply: true,
    description: "Special Discount Coupon"
  });

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const data = await apiFetch("/admin/vouchers");
      if (Array.isArray(data)) setVouchers(data);
    } catch {
      setVouchers([
        { id: "1", code: "RIVAANTA500", discountValue: 500, minOrderValue: 1500, isActive: true },
        { id: "2", code: "ROYAL1000", discountValue: 1000, minOrderValue: 3000, isActive: true }
      ]);
    }
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!newVoucher.code.trim()) {
      toast.error("Please enter a voucher code");
      return;
    }
    try {
      await apiFetch("/admin/vouchers", {
        method: "POST",
        body: newVoucher
      });
      toast.success(`Voucher '${newVoucher.code.toUpperCase()}' created!`);
      loadVouchers();
    } catch {
      toast.error("Failed to create voucher");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm">
        <h2 className="text-xl font-black text-[#2D2118]">Promo Vouchers & Discounts</h2>
        <p className="text-xs text-gray-500">Create discount coupons for customers and resellers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleCreateVoucher} className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3 text-xs">
          <h3 className="font-extrabold text-[#2D2118]">Create New Voucher</h3>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Coupon Code</label>
            <input
              type="text"
              required
              placeholder="FESTIVE500"
              value={newVoucher.code}
              onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC9] text-xs uppercase font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Discount (₹)</label>
              <input
                type="number"
                value={newVoucher.discountValue}
                onChange={(e) => setNewVoucher({ ...newVoucher, discountValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC9] text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Min Order (₹)</label>
              <input
                type="number"
                value={newVoucher.minOrderValue}
                onChange={(e) => setNewVoucher({ ...newVoucher, minOrderValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC9] text-xs font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#5C1E1E] text-white py-2.5 rounded-xl font-bold hover:bg-[#2D2118] transition"
          >
            Create Coupon
          </button>
        </form>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <h3 className="font-extrabold text-[#2D2118] text-sm">Active Coupons ({vouchers.length})</h3>
          <div className="space-y-2">
            {vouchers.map((v) => (
              <div key={v.id} className="flex justify-between items-center bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] text-xs">
                <div>
                  <span className="font-mono font-black text-[#5C1E1E] bg-[#5C1E1E]/10 px-2 py-0.5 rounded">
                    {v.code}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-1">₹{v.discountValue} Off on orders above ₹{v.minOrderValue}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
