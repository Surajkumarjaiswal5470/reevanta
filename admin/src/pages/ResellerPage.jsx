import React, { useState } from "react";
import { DollarSign, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ResellerPage() {
  const [defaultMargin, setDefaultMargin] = useState(250);
  const [minWholesaleQty, setMinWholesaleQty] = useState(5);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success("Wholesale reseller settings saved successfully!");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm text-center space-y-2">
        <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto font-black">
          <DollarSign className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-[#2D2118]">Reseller Wholesale Margins</h2>
        <p className="text-xs text-gray-500">Configure global wholesale profit margins for reseller partners.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-gray-700 block mb-1">Default Profit Margin per Product (₹)</label>
          <input
            type="number"
            value={defaultMargin}
            onChange={(e) => setDefaultMargin(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs font-black text-[#5C1E1E]"
          />
        </div>

        <div>
          <label className="font-extrabold text-gray-700 block mb-1">Minimum Wholesale Order Quantity</label>
          <input
            type="number"
            value={minWholesaleQty}
            onChange={(e) => setMinWholesaleQty(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs font-black text-[#2D2118]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold hover:bg-[#2D2118] transition shadow-md"
        >
          Save Margin Rules
        </button>
      </form>
    </div>
  );
}
