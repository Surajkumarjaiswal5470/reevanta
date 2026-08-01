import React from "react";
import { Truck, MapPin, Clock, ShieldCheck, CheckCircle2, Globe, HelpCircle } from "lucide-react";

export function ShippingPage({ onNavigate }) {
  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#5C1E1E] to-[#2D2118] text-white p-8 sm:p-12 rounded-3xl space-y-4 shadow-xl border border-[#B8956A]/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">Kathmandu & Global Fulfillment</span>
            <h1 className="text-3xl font-black text-[#FAF5EC]">Shipping & Delivery Policy</h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-200 max-w-3xl leading-relaxed">
          RIVAANTA Luxury Wear delivers premium Himalayan apparel, silk sarees, kurtas, and luxury beauty items directly from our flagship fulfillment hub in <strong>Kathmandu, Nepal</strong> to customer doorsteps across Nepal and 50+ countries worldwide.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">Kathmandu Valley Express</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Same-day or next-day direct door delivery within Kathmandu, Lalitpur, and Bhaktapur. Free delivery on orders over NPR 3,000.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">All-Nepal Districts</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Reliable express dispatch to Pokhara, Biratnagar, Chitwan, Dharan, Butwal, and all 77 districts within 2–4 working days.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">Worldwide Express</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            International shipping via DHL & Aramex with custom clearance support and live tracking to India, USA, UK, Australia, and UAE.
          </p>
        </div>
      </div>

      {/* Delivery Rates & Timelines Table */}
      <div className="bg-white rounded-3xl border border-[#E8DFC9] p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-[#2D2118] flex items-center gap-2">
          <span>🇳🇵</span> Shipping Rates & Estimated Timelines
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF5EC] border-b border-[#E8DFC9] text-[#2D2118] font-bold uppercase tracking-wider">
                <th className="p-4">Destination Region</th>
                <th className="p-4">Delivery Time</th>
                <th className="p-4">Shipping Charge</th>
                <th className="p-4">Free Shipping Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFC9]/50 text-gray-700">
              <tr className="hover:bg-amber-50/50">
                <td className="p-4 font-bold text-[#2D2118]">Kathmandu Valley (KTM, Lalitpur, Bhaktapur)</td>
                <td className="p-4 font-semibold text-emerald-700">24 – 48 Hours</td>
                <td className="p-4">NPR 100</td>
                <td className="p-4 font-bold text-[#5C1E1E]">FREE for orders &gt; NPR 3,000</td>
              </tr>
              <tr className="hover:bg-amber-50/50">
                <td className="p-4 font-bold text-[#2D2118]">Major Cities (Pokhara, Biratnagar, Chitwan, Butwal)</td>
                <td className="p-4">2 – 3 Working Days</td>
                <td className="p-4">NPR 200</td>
                <td className="p-4 font-bold text-[#5C1E1E]">FREE for orders &gt; NPR 5,000</td>
              </tr>
              <tr className="hover:bg-amber-50/50">
                <td className="p-4 font-bold text-[#2D2118]">Remote Districts across Nepal</td>
                <td className="p-4">3 – 5 Working Days</td>
                <td className="p-4">NPR 250</td>
                <td className="p-4 font-bold text-[#5C1E1E]">FREE for orders &gt; NPR 7,500</td>
              </tr>
              <tr className="hover:bg-amber-50/50">
                <td className="p-4 font-bold text-[#2D2118]">India Delivery</td>
                <td className="p-4">4 – 6 Working Days</td>
                <td className="p-4">INR 499 (~NPR 800)</td>
                <td className="p-4 font-bold text-[#5C1E1E]">FREE for orders &gt; INR 5,000</td>
              </tr>
              <tr className="hover:bg-amber-50/50">
                <td className="p-4 font-bold text-[#2D2118]">International (USA, UK, Aus, UAE, Europe)</td>
                <td className="p-4">5 – 7 Working Days</td>
                <td className="p-4">Calculated at Checkout</td>
                <td className="p-4 font-bold text-[#5C1E1E]">FREE for orders &gt; $250 USD</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Package Security & Inspection */}
      <div className="bg-[#FAF5EC] border border-[#E8DFC9] p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#5C1E1E] font-bold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Tamper-Proof Luxury Packaging
          </div>
          <h3 className="text-xl font-black text-[#2D2118]">Cash on Delivery & Open-Box Verification</h3>
          <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
            Every product shipped from Kathmandu is double-wrapped in moisture-proof velvet garment bags. Cash on Delivery is supported across Nepal with instant phone verification at <strong>+977 9715102007</strong>.
          </p>
        </div>
        <button
          onClick={() => onNavigate("contact")}
          className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md transition shrink-0"
        >
          Contact Support Team
        </button>
      </div>

    </div>
  );
}
