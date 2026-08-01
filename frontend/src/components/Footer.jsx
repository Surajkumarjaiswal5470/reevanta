import React from "react";
import { Sparkles, Phone, Mail, MapPin } from "lucide-react";

export const Footer = React.memo(function Footer({ onNavigate }) {
  return (
    <footer className="bg-[#2D2118] text-[#FAF5EC] rounded-3xl p-6 sm:p-8 mt-12 shadow-xl border border-[#B8956A]/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#FAF5EC]/10 text-center md:text-left">
        
        {/* Brand Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5C1E1E] flex items-center justify-center text-white shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wider text-white">RIVAANTA</h3>
            <p className="text-[10px] text-[#B8956A] font-bold tracking-widest uppercase">
              Kathmandu Luxury Wear
            </p>
          </div>
        </div>

        {/* Quick Contact Info */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-5 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Kathmandu, Nepal</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-400 shrink-0" />
            <a href="tel:+9779715102007" className="font-bold text-amber-300 hover:underline">
              +977 9715102007
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-400 shrink-0" />
            <a href="mailto:support@rivaanta.com" className="hover:underline text-gray-300">
              support@rivaanta.com
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 pt-6">
        <div>© {new Date().getFullYear()} RIVAANTA Luxury Wear. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate("shipping")} className="hover:text-white transition-colors">
            Shipping
          </button>
          <span aria-hidden="true">•</span>
          <button onClick={() => onNavigate("returns")} className="hover:text-white transition-colors">
            Returns
          </button>
          <span aria-hidden="true">•</span>
          <button onClick={() => onNavigate("contact")} className="hover:text-white transition-colors">
            Contact
          </button>
        </div>
      </div>
    </footer>
  );
});