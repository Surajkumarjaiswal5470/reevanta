import React from "react";
import { Sparkles, MapPin, Heart, Award, ShieldCheck, Users, Phone } from "lucide-react";

export function AboutPage({ onNavigate }) {
  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      
      {/* Header Hero */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#5C1E1E] to-[#2D2118] text-white p-8 sm:p-14 rounded-3xl space-y-6 shadow-xl border border-[#B8956A]/30 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">Himalayan Heritage & Craftsmanship</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#FAF5EC]">About RIVAANTA Luxury Wear</h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-200 max-w-3xl leading-relaxed">
          Founded in the cultural heart of <strong>Kathmandu, Nepal</strong>, RIVAANTA brings together centuries-old Himalayan textile traditions, handcrafted silk weaving, intricate zardozi embroidery, and modern luxury aesthetics for the global fashion connoisseur.
        </p>
      </div>

      {/* Brand Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">Master Weavers of Nepal</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Every Organza saree, Designer Kurta, and Pashmina shawl is crafted by seasoned Himalayan artisans adhering to strict quality benchmarks.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">Fair Wages & Sustainability</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            We empower local artisan communities across Nepal with fair wages, safe studio environments, and eco-friendly dye techniques.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-[#2D2118]">Luxury Packaging & Care</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Dispatched directly from our Kathmandu studio in signature velvet bags and sturdy keepsake boxes with authentic certification.
          </p>
        </div>
      </div>

      {/* Flagship Studio Card */}
      <div className="bg-white rounded-3xl border border-[#E8DFC9] p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#5C1E1E] font-bold text-xs uppercase tracking-widest">
            <MapPin className="w-4 h-4 text-emerald-600" /> Kathmandu Flagship Studio & Head Office
          </div>
          <h2 className="text-2xl font-black text-[#2D2118]">Visit Our Studio in Kathmandu</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Located at Durbar Marg Luxury Hub in Kathmandu, Nepal, our flagship studio showcases bridal wear consultations, custom sizing fittings, and wholesale reseller meetings.
          </p>

          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9] space-y-2 text-xs">
            <div><strong className="text-[#2D2118]">📍 Store Address:</strong> Durbar Marg Luxury Hub, Kathmandu 44600, Nepal</div>
            <div><strong className="text-[#2D2118]">📞 Phone & WhatsApp:</strong> <a href="tel:+9779715102007" className="text-[#5C1E1E] font-bold">+977 9715102007</a></div>
            <div><strong className="text-[#2D2118]">✉️ Email:</strong> support@reevanta.com</div>
          </div>

          <button
            onClick={() => onNavigate("contact")}
            className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md transition"
          >
            Book Fitting Appointment
          </button>
        </div>

        <div className="bg-[#FAF5EC] p-8 rounded-3xl border border-[#E8DFC9] space-y-4 text-center">
          <div className="text-4xl font-black text-[#5C1E1E]">10,000+</div>
          <p className="text-xs font-bold text-[#2D2118]">Delighted Customers Across Nepal & Globally</p>
          <div className="h-0.5 bg-[#E8DFC9] my-4" />
          <div className="text-3xl font-black text-[#8B7355]">500+</div>
          <p className="text-xs font-bold text-[#2D2118]">Active Boutique Resellers Partnered</p>
        </div>
      </div>

    </div>
  );
}
