import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { apiFetch } from "../services/api";

const DEFAULT_SLIDES = [
  {
    id: "slide-cosmetics",
    title: "Artisanal Velvet Cosmetics",
    subtitle: "Dewy finish, velvet lips & subtle gold sparkle ritual.",
    category: "cosmetics",
    buttonText: "EXPLORE COSMETICS",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
    badge: "OFFICIAL LAUNCH 2026",
  },
  {
    id: "slide-serum",
    title: "Vitamin C 15% Face Serum",
    subtitle: "Brightening & hydrating serum with pure hyaluronic acid for instant radiance.",
    category: "beauty",
    buttonText: "SHOP SKINCARE",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80",
    badge: "BEST SELLER • SKINCARE",
  },
  {
    id: "slide-palette",
    title: "Rose Gold Eyeshadow Palette",
    subtitle: "12 royal heritage matte & shimmer shades for day and evening glamour.",
    category: "cosmetics",
    buttonText: "SHOP PALETTES",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=80",
    badge: "NEW ARRIVAL • LUXURY MAKEUP",
  },
  {
    id: "slide-lipliner",
    title: "Rose Lip Liner Collection",
    subtitle: "Creamy, long-wear lip liners crafted for flawless contouring and definition.",
    category: "cosmetics",
    buttonText: "EXPLORE LIP CARE",
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=80",
    badge: "LIP CARE ESSENTIAL",
  },
  {
    id: "slide-[#5C1E1E]",
    title: "16-Hour Makeup Setting Mist",
    subtitle: "Weightless 16-hour makeup fixing mist infused with hyaluronic acid.",
    category: "cosmetics",
    buttonText: "SHOP FIXER MIST",
    image: "https://images.unsplash.com/photo-1631214540242-3cd8c4b0b3b6?auto=format&fit=crop&w=1000&q=80",
    badge: "BEAUTY ESSENTIAL",
  },
  {
    id: "slide-toner",
    title: "Rose Gold Face Toner Mist",
    subtitle: "Alcohol-free botanical rose water & 24K gold toner to soothe and hydrate.",
    category: "beauty",
    buttonText: "SHOP TONER MIST",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1000&q=80",
    badge: "ORGANIC BEAUTY",
  },
];

export function HeroSlider({ onCategorySelect, onNavigate }) {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch CMS slides from backend if available
  useEffect(() => {
    apiFetch("/cms/homepage")
      .then((data) => {
        if (data?.banners && Array.isArray(data.banners) && data.banners.length > 0) {
          setSlides(data.banners);
        }
      })
      .catch(() => {});
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play timer (4.5 seconds per slide)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(nextSlide, 4500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, nextSlide]);

  const handleSlideClick = (slide) => {
    if (slide.category && onCategorySelect) {
      onCategorySelect(slide.category);
    } else if (onNavigate) {
      onNavigate("catalog");
    }
  };

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <section
      className="relative my-1 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Myntra-style Full-Bleed Banner Card ── */}
      <div
        onClick={() => handleSlideClick(activeSlide)}
        className="relative w-full h-[190px] sm:h-[260px] md:h-[320px] lg:h-[360px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border-2 border-amber-700/40 shadow-lg bg-[#2D2118]"
      >
        {/* Full Banner Image */}
        <img
          src={activeSlide.image}
          alt={activeSlide.title}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Myntra-style Dark Gradient Overlay for Crisp Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col justify-between p-4 sm:p-7 md:p-10 text-white">
          
          {/* Top Badge */}
          <div className="flex items-center gap-2">
            {activeSlide.badge && (
              <span className="inline-flex items-center gap-1.5 bg-[#5C1E1E] text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-[9px] sm:text-xs font-black tracking-widest uppercase shadow">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                {activeSlide.badge}
              </span>
            )}
          </div>

          {/* Main Title & Offer */}
          <div className="space-y-1.5 sm:space-y-2.5 max-w-lg">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-serif font-black text-white leading-tight tracking-wide drop-shadow-md">
              {activeSlide.title}
            </h2>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 font-medium line-clamp-2 drop-shadow">
              {activeSlide.subtitle}
            </p>

            {/* Myntra Green Action Pill */}
            <div className="pt-1.5 sm:pt-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-xs font-black px-4 py-2 rounded-xl shadow-md uppercase tracking-wider transition active:scale-95">
                <span>{activeSlide.buttonText || "SHOP NOW"}</span>
                <span className="text-xs">›</span>
              </span>
            </div>
          </div>
        </div>

        {/* Decorative Inner Border Accent (Myntra style dotted frame) */}
        <div className="absolute inset-2 border border-white/20 rounded-xl sm:rounded-2xl pointer-events-none" />
      </div>

      {/* Prev / Next Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-[#E8DFC9] shadow-lg flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC]"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-[#E8DFC9] shadow-lg flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC]"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* ── Myntra Bottom Dots Indicator ── */}
      <div className="flex items-center justify-center gap-1.5 pt-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentIndex === idx
                ? "w-6 h-2 bg-[#5C1E1E]"
                : "w-2 h-2 bg-[#8B7355]/40 hover:bg-[#8B7355]"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
