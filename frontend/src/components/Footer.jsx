import React from "react";
import { MapPin, Phone, Mail, Clock, Sparkles } from "lucide-react";

export function Footer({ onNavigate }) {
  return (
    <footer className="bg-[#2D2118] text-[#FAF5EC] rounded-3xl p-8 sm:p-12 space-y-8 mt-16 shadow-2xl border border-[#B8956A]/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#FAF5EC]/10">
        
        {/* Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="w-9 h-9 rounded-xl bg-[#5C1E1E] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wider text-white">RIVAANTA</h3>
              <p className="text-[10px] text-[#B8956A] font-bold tracking-widest uppercase">Kathmandu Luxury Wear</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Premium Himalayan ethnic wear, organza & silk sarees, designer kurtas, bridal lehengas, and luxury beauty products for discerning shoppers across Nepal and worldwide.
          </p>
        </div>

        {/* Shop Categories */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-widest text-[#B8956A] mb-3">Shop Categories</h4>
          <ul className="space-y-2.5 text-xs text-gray-300 font-medium">
            <li>
              <button onClick={() => onNavigate("catalog")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> Organza & Silk Sarees
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("catalog")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> Designer Kurtas & Sets
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("catalog")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> Bridal & Party Lehengas
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("catalog")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> Artisanal Makeup & Skincare
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Care Links */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-widest text-[#B8956A] mb-3">Customer Care</h4>
          <ul className="space-y-2.5 text-xs text-gray-300 font-medium">
            <li>
              <button onClick={() => onNavigate("orders")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> Order Tracking
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("shipping")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> Shipping & Delivery
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("returns")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> Returns & Exchanges
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("reseller-faq")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> Reseller Program & FAQ
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("about")} className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span> About Our Brand
              </button>
            </li>
          </ul>
        </div>

        {/* Contact Us - Kathmandu Nepal */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-widest text-[#B8956A] mb-3">Contact Us</h4>
          <div className="space-y-2.5 text-xs text-gray-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Kathmandu, Nepal</p>
                <p className="text-[11px] text-gray-400">Durbar Marg Luxury Hub, Kathmandu 44600</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <a href="tel:+9779715102007" className="font-bold text-amber-300 hover:underline">
                +977 9715102007
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <a href="mailto:support@reevanta.com" className="hover:underline text-gray-300">
                support@reevanta.com
              </a>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Sun – Fri: 10:00 AM – 7:00 PM NPT</span>
            </div>

            <button
              onClick={() => onNavigate("contact")}
              className="mt-2 w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-2 rounded-xl text-xs font-bold transition border border-amber-500/30 flex items-center justify-center gap-1.5 shadow"
            >
              <Mail className="w-3.5 h-3.5" /> Direct Contact Form
            </button>
          </div>
        </div>

      </div>

      {/* Footer Bottom Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <div>
          © 2026 RIVAANTA Luxury Wear, Kathmandu Nepal. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate("shipping")} className="hover:text-white transition">Shipping Policy</button>
          <span>•</span>
          <button onClick={() => onNavigate("returns")} className="hover:text-white transition">Return Policy</button>
          <span>•</span>
          <button onClick={() => onNavigate("contact")} className="hover:text-white transition">Contact</button>
        </div>
      </div>
    </footer>
  );
}
