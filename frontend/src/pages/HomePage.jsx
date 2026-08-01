import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { HeroSlider } from "../components/HeroSlider";
import { Footer } from "../components/Footer";
import { MOCK_CATEGORIES } from "../mock";
import { apiFetch } from "../services/api";

export function HomePage({ products, onCategorySelect, onQuickView, onNavigate }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 45 });
  const [personalizedData, setPersonalizedData] = useState({ recommendedForYou: [], trendingLuxury: [] });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Personalized Recommendations
  useEffect(() => {
    apiFetch("/homepage/personalized")
      .then((data) => {
        if (data) setPersonalizedData(data);
      })
      .catch(() => {});
  }, []);

  const flashSaleProducts = products.filter((p) => p.isFlashSale);
  // Sort products so Cosmetics & Beauty appear first
  const cosmeticsFirstProducts = [...products].sort((a, b) => {
    const aIsLive = a.category === "cosmetics" || a.category === "beauty";
    const bIsLive = b.category === "cosmetics" || b.category === "beauty";
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    return 0;
  });
  const featuredProducts = cosmeticsFirstProducts.slice(0, 8);

  return (
    <div className="space-y-3 sm:space-y-6 lg:space-y-8 pb-12 pt-0 -mt-6 sm:-mt-2">

      {/* ── 6 Slide Cosmetics & Beauty Hero Carousel (FLUSH ZERO GAP POSITION) ── */}
      <div className="mt-0">
        <HeroSlider onCategorySelect={onCategorySelect} onNavigate={onNavigate} />
      </div>

      {/* ── Top Instant Featured Items Showcase ── */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8B7355] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" /> Handpicked Arrivals
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2D2118]">Trending Luxury Cosmetics</h2>
          </div>
          <button
            onClick={() => onNavigate("catalog")}
            className="text-xs font-bold text-[#5C1E1E] hover:underline flex items-center gap-1"
          >
            Explore Full Catalog <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      </section>

      {/* PERSONALIZED RECOMMENDATIONS SHOWCASE */}
      {personalizedData.recommendedForYou.length > 0 && (
        <section className="space-y-6 bg-gradient-to-r from-amber-50/70 to-orange-50/70 p-6 sm:p-8 rounded-3xl border border-amber-200/80">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Tailored For Your Taste
              </span>
              <h2 className="text-2xl font-black text-[#2D2118]">Recommended For You</h2>
            </div>
            <button
              onClick={() => onNavigate("catalog")}
              className="text-xs font-bold text-[#5C1E1E] hover:underline flex items-center gap-1"
            >
              See All Recommendations <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {personalizedData.recommendedForYou.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
            ))}
          </div>
        </section>
      )}




      {/* Flash Sale Banner */}
      {flashSaleProducts.length > 0 && (
        <section className="bg-[#5C1E1E] text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/20 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-400 text-[#5C1E1E] rounded-2xl flex items-center justify-center font-black">
                ⚡
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-amber-300">24-Hour Flash Deals</h2>
                <p className="text-xs text-gray-200">Limited quantities available at special wholesale prices</p>
              </div>
            </div>

            {/* Countdown timer pill */}
            <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-mono font-bold">
              <span>Ends in:</span>
              <span className="bg-amber-400 text-[#2D2118] px-2 py-0.5 rounded-lg">
                {String(timeLeft.hours).padStart(2, "0")}h
              </span>
              <span>:</span>
              <span className="bg-amber-400 text-[#2D2118] px-2 py-0.5 rounded-lg">
                {String(timeLeft.minutes).padStart(2, "0")}m
              </span>
              <span>:</span>
              <span className="bg-amber-400 text-[#2D2118] px-2 py-0.5 rounded-lg">
                {String(timeLeft.seconds).padStart(2, "0")}s
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {flashSaleProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#8B7355]">Handpicked Arrivals</span>
          <h2 className="text-2xl font-black text-[#2D2118]">Featured Luxury Wardrobe</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      </section>

      {/* Reusable Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
