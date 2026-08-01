import React, { useState, useEffect } from "react";
import { Sliders, Sparkles, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../services/api";
import { toast } from "sonner";

export function CmsManagerPage() {
  const [cmsData, setCmsData] = useState({ banners: [], subCategories: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCmsData();
  }, []);

  const loadCmsData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/cms/homepage");
      if (data) setCmsData(data);
    } catch {
      toast.error("Failed to load CMS configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-[#2D2118]">CMS Banners & Subcategories</h2>
          <p className="text-xs text-gray-500">Manage hero slider carousels and homepage category browsing tags.</p>
        </div>
      </div>

      {/* Hero Sliders List */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4">
        <h3 className="font-extrabold text-[#2D2118] text-sm">Active Hero Slider Banners</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(cmsData.banners || []).map((slide, idx) => (
            <div key={idx} className="bg-[#FAF5EC] rounded-2xl overflow-hidden border border-[#E8DFC9]">
              <img src={slide.image} alt={slide.title} className="w-full h-32 object-cover" />
              <div className="p-3 text-xs space-y-1">
                <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                  Slide #{idx + 1}
                </span>
                <h4 className="font-bold text-[#2D2118]">{slide.title}</h4>
                <p className="text-gray-500 line-clamp-1">{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
