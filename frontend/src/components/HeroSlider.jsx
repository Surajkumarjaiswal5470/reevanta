import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { apiFetch } from "../services/api";

const DEFAULT_SLIDES = [
  {
    id: "slide-cosmetics",
    title: "Velvet Lipsticks Collection",
    category: "cosmetics",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "slide-serum",
    title: "Vitamin C Face Serum",
    category: "beauty",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "slide-palette",
    title: "Rose Gold Eyeshadow Palette",
    category: "cosmetics",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "slide-lipliner",
    title: "Rose Lip Liner Set",
    category: "cosmetics",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "slide-fixer",
    title: "16-Hour Fixing Spray",
    category: "cosmetics",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1631214540242-3cd8c4b0b3b6?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "slide-toner",
    title: "Rose Gold Toner Mist",
    category: "beauty",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1000&q=80",
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
          const cosmeticsOnlyBanners = data.banners.filter(
            (b) => b.category === "cosmetics" || b.category === "beauty"
          );
          if (cosmeticsOnlyBanners.length > 0) {
            setSlides(cosmeticsOnlyBanners);
          }
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
      {/* ── Ultra-Clean Minimalist Banner Card ── */}
      <div
        onClick={() => handleSlideClick(activeSlide)}
        className="relative w-full h-[180px] sm:h-[260px] md:h-[320px] rounded-2xl overflow-hidden cursor-pointer border border-[#E8DFC9] shadow-sm bg-gray-900"
      >
        {/* Full Image */}
        <img
          src={activeSlide.image}
          alt={activeSlide.title}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Soft Bottom-Left Vignette (Non-intrusive) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-7 text-white">
          <div className="space-y-2 max-w-md">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-serif font-black text-white leading-tight drop-shadow">
              {activeSlide.title}
            </h2>

            <div>
              <span className="inline-flex items-center gap-1 bg-[#2D2118] hover:bg-[#5C1E1E] text-white text-[10px] sm:text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition active:scale-95">
                <span>SHOP NOW</span>
                <span>›</span>
              </span>
            </div>
          </div>
        </div>
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
