import React, { useState } from "react";
import { RotateCcw, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, Phone, ArrowRight } from "lucide-react";

export function ReturnsPage({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#5C1E1E] to-[#2D2118] text-white p-8 sm:p-12 rounded-3xl space-y-4 shadow-xl border border-[#B8956A]/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">Hassle-Free Guarantee</span>
            <h1 className="text-3xl font-black text-[#FAF5EC]">7-Day Return & Exchange Policy</h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-200 max-w-3xl leading-relaxed">
          At RIVAANTA Luxury Wear, we want you to adore your handcrafted ethnic attire. If the fit isn't perfect or you wish to try another shade, our <strong>Kathmandu Exchange Desk</strong> provides seamless 7-day pickup and instant replacements across Nepal.
        </p>
      </div>

      {/* 4-Step Return Process */}
      <div className="bg-white rounded-3xl border border-[#E8DFC9] p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-[#2D2118]">Simple 4-Step Exchange & Return Process</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Submit Request", desc: "Contact our Kathmandu hotline +977 9715102007 or submit order ID via your account." },
            { step: "02", title: "Quality Check", desc: "Ensure tags, original luxury packaging, and unworn garment condition remain intact." },
            { step: "03", title: "Free Pickup", desc: "Our Kathmandu courier partner picks up the item directly from your doorstep." },
            { step: "04", title: "Instant Replacement", desc: "Receive your fresh size/color or full refund via bank transfer within 24 hours." }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#FAF5EC] p-5 rounded-2xl border border-[#E8DFC9] space-y-2 relative">
              <span className="text-2xl font-black text-[#5C1E1E]">{item.step}</span>
              <h3 className="font-bold text-sm text-[#2D2118]">{item.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
            <CheckCircle2 className="w-5 h-5" /> Eligible for 100% Exchange or Refund
          </div>
          <ul className="space-y-2.5 text-xs text-gray-700">
            <li className="flex items-center gap-2">• Sizing issue or incorrect size ordered</li>
            <li className="flex items-center gap-2">• Unopened skincare & artisanal cosmetics in sealed packaging</li>
            <li className="flex items-center gap-2">• Received incorrect item or color variant</li>
            <li className="flex items-center gap-2">• Manufacturing defect reported within 48 hours of delivery</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
            <AlertCircle className="w-5 h-5" /> Non-Returnable Items
          </div>
          <ul className="space-y-2.5 text-xs text-gray-700">
            <li className="flex items-center gap-2">• Custom-tailored or altered bridal lehengas</li>
            <li className="flex items-center gap-2">• Used, washed, or altered apparel items</li>
            <li className="flex items-center gap-2">• Items without original RIVAANTA tags or luxury packaging</li>
            <li className="flex items-center gap-2">• Opened or tested cosmetics due to hygiene standards</li>
          </ul>
        </div>
      </div>

      {/* Hotline Support Banner */}
      <div className="bg-[#2D2118] text-[#FAF5EC] p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-[#B8956A]/30">
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#B8956A] uppercase tracking-wider">Need Urgent Return Assistance?</span>
          <h3 className="text-2xl font-black text-white">Kathmandu Customer Service Support</h3>
          <p className="text-xs text-gray-300 max-w-lg">
            Call or WhatsApp our Kathmandu operations desk directly at <strong className="text-amber-300">+977 9715102007</strong> for immediate assistance with returns or sizing consultations.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:+9779715102007"
            className="bg-amber-400 hover:bg-amber-300 text-[#2D2118] px-6 py-3 rounded-2xl text-xs font-bold shadow-lg transition flex items-center gap-2"
          >
            <Phone className="w-4 h-4" /> Call +977 9715102007
          </a>
          <button
            onClick={() => onNavigate("contact")}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl text-xs font-bold transition border border-white/20"
          >
            Write Support
          </button>
        </div>
      </div>

    </div>
  );
}
