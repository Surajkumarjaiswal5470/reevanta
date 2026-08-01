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
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#FAF5EC] border border-[#E8DFC9] shadow-sm group transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex flex-col md:flex-row items-center justify-between p-3.5 sm:p-6 lg:p-8 gap-3 sm:gap-6 md:gap-8">
        
        {/* Left Text Content */}
        <div className="w-full md:w-1/2 space-y-2 sm:space-y-3 text-left z-10">
          {activeSlide.badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5C1E1E]/10 text-[#5C1E1E] text-[9px] sm:text-[11px] font-black tracking-widest uppercase border border-[#5C1E1E]/20">
              <Sparkles className="w-3 h-3 text-[#5C1E1E]" /> {activeSlide.badge}
            </span>
          )}
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-serif font-black text-[#2D2118] leading-tight tracking-tight transition-all duration-300">
            {activeSlide.title}
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm text-[#8B7355] font-medium max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none">
            {activeSlide.subtitle}
          </p>
          <div className="pt-0.5 sm:pt-1">
            <button
              onClick={() => handleSlideClick(activeSlide)}
              className="bg-[#2D2118] hover:bg-[#5C1E1E] text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black tracking-wider uppercase shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 flex items-center gap-1.5"
            >
              <span>{activeSlide.buttonText || "EXPLORE COSMETICS"}</span>
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div
          onClick={() => handleSlideClick(activeSlide)}
          className="w-full md:w-1/2 h-[140px] sm:h-[220px] md:h-[260px] lg:h-[290px] rounded-xl sm:rounded-2xl overflow-hidden relative cursor-pointer group/img shrink-0 border border-[#E8DFC9]"
        >
          <img
            src={activeSlide.image}
            alt={activeSlide.title}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/img:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D2118]/20 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Prev / Next Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-[#E8DFC9] shadow-md flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC]"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-[#E8DFC9] shadow-md flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC]"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentIndex === idx
                ? "w-5 sm:w-6 h-1.5 sm:h-2 bg-[#2D2118]"
                : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#8B7355]/40 hover:bg-[#8B7355]"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
