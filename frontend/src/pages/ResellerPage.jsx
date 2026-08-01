import React, { useState } from "react";
import { Sparkles, TrendingUp, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp, DollarSign, Package, Phone } from "lucide-react";

export function ResellerPage({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [wholesaleQty, setWholesaleQty] = useState(10);

  const faqs = [
    {
      q: "How does the RIVAANTA Kathmandu Reseller Program work?",
      a: "As a registered RIVAANTA Reseller in Nepal or internationally, you gain access to wholesale pricing (up to 40% off retail) with zero minimum inventory required. You sell to your local customers or Instagram boutique, and we handle white-label direct dispatch from Kathmandu."
    },
    {
      q: "What is the minimum order quantity for wholesale rates?",
      a: "For initial orders, the minimum quantity is just 5 pieces. For ongoing resellers, individual drop-shipping orders are fulfilled at Tier-1 wholesale discounts."
    },
    {
      q: "Can RIVAANTA deliver directly to my boutique customers across Nepal?",
      a: "Yes! We offer 100% blind white-label shipping. Packages dispatched from Kathmandu will carry your store name and branding with no RIVAANTA tags or pricing invoices attached."
    },
    {
      q: "How do I receive reseller payouts or margins?",
      a: "For Cash on Delivery orders, we collect the full payment from your buyer, deduct your wholesale product cost, and wire your profit margin directly into your eSewa, Khalti, or Nepal Bank account every Monday."
    },
    {
      q: "How do I register as a reseller today?",
      a: "Click 'Toggle Reseller Mode' in the top header or contact our Kathmandu Reseller Desk directly via call/WhatsApp at +977 9715102007."
    }
  ];

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#5C1E1E] to-[#2D2118] text-white p-8 sm:p-12 rounded-3xl space-y-4 shadow-xl border border-[#B8956A]/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Boutique & Reseller Hub — Kathmandu</span>
            <h1 className="text-3xl font-black text-[#FAF5EC]">Reseller Program & Wholesale FAQ</h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-200 max-w-3xl leading-relaxed">
          Partner with Nepal's premier luxury apparel brand. Earn high profit margins by selling handcrafted silk sarees, kurtas, bridal lehengas, and artisanal beauty products with direct Kathmandu white-label fulfillment.
        </p>
      </div>

      {/* Reseller Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            35–45%
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">High Profit Margins</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Guaranteed wholesale margin on every order with reseller pricing unlocked across all catalog items.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">Blind Drop-Shipping</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            We pack and deliver directly to your buyers in Kathmandu & across Nepal with custom invoice branding.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">Weekly Bank Payouts</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Weekly payouts via eSewa, Khalti, or direct Nepal bank transfer for collected COD earnings.
          </p>
        </div>
      </div>

      {/* Profit Margin Calculator */}
      <div className="bg-white rounded-3xl border border-[#E8DFC9] p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-[#2D2118] flex items-center gap-2">
          <span>🧮</span> Interactive Reseller Profit Estimator
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#FAF5EC] p-6 rounded-2xl border border-[#E8DFC9]">
          <div className="space-y-4">
            <label className="text-xs font-bold text-[#2D2118] uppercase tracking-wider block">
              Estimated Monthly Sales Volume (Pieces)
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={wholesaleQty}
              onChange={(e) => setWholesaleQty(Number(e.target.value))}
              className="w-full accent-[#5C1E1E]"
            />
            <div className="flex justify-between text-xs font-bold text-[#5C1E1E]">
              <span>5 Items</span>
              <span className="text-lg font-black">{wholesaleQty} Items / Month</span>
              <span>100 Items</span>
            </div>
          </div>

          <div className="bg-[#2D2118] text-white p-6 rounded-2xl space-y-2 text-center shadow-md">
            <span className="text-xs text-[#B8956A] uppercase tracking-widest font-bold">Estimated Monthly Earnings</span>
            <div className="text-3xl font-black text-amber-300">
              NPR {(wholesaleQty * 1850).toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-300">Based on average wholesale margin of NPR 1,850 per piece</p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-3xl border border-[#E8DFC9] p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-[#2D2118]">Frequently Asked Questions</h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-[#E8DFC9] rounded-2xl overflow-hidden transition">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-4 sm:p-5 font-bold text-sm text-[#2D2118] bg-[#FAF5EC]/60 hover:bg-[#FAF5EC] flex justify-between items-center"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-5 h-5 text-[#5C1E1E]" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>
              {openFaq === idx && (
                <div className="p-4 sm:p-5 text-xs text-gray-600 leading-relaxed bg-white border-t border-[#E8DFC9]/50 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reseller Hotline Banner */}
      <div className="bg-[#5C1E1E] text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">Kathmandu Reseller Desk</span>
          <h3 className="text-2xl font-black">Register as an Official RIVAANTA Reseller</h3>
          <p className="text-xs text-gray-200">
            Call or WhatsApp our reseller manager in Kathmandu directly at <strong className="text-amber-300">+977 9715102007</strong> for immediate account approval.
          </p>
        </div>
        <a
          href="tel:+9779715102007"
          className="bg-amber-400 hover:bg-amber-300 text-[#2D2118] px-6 py-3.5 rounded-2xl text-xs font-bold shadow-lg transition flex items-center gap-2 shrink-0"
        >
          <Phone className="w-4 h-4" /> Call +977 9715102007
        </a>
      </div>

    </div>
  );
}
