import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { apiFetch } from "../services/api";

const DEFAULT_SLIDES = [
  {
    id: "slide-1",
    title: "New Season Essentials",
    subtitle: "Timeless styles for the modern woman.",
    category: "sarees",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1610030469668-8e450b47a4a5?auto=format&fit=crop&w=1000&q=80",
    badge: "FESTIVE COLLECTION 2026",
  },
  {
    id: "slide-2",
    title: "Bridal Heritage Lehengas",
    subtitle: "Handcrafted royal velvet & gold zari embroidery.",
    category: "lehenga",
    buttonText": "EXPLORE LEHENGAS",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80",
    badge: "BRIDAL WEAR",
  },
  {
    id: "slide-3",
    title: "Royal Silk Kurtas & Suits",
    subtitle: "Pure silk tailoring crafted for grand celebrations.",
    category: "kurtas",
    buttonText": "VIEW KURTAS",
    image: "https://images.unsplash.com/photo-1614886137916-64e663c21459?auto=format&fit=crop&w=1000&q=80",
    badge: "ROYAL SUITS",
  },
  {
    id: "slide-4",
    title: "Artisanal Velvet Cosmetics",
    subtitle: "Dewy finish, velvet lips & subtle gold sparkle ritual.",
    category: "cosmetics",
    buttonText": "SHOP COSMETICS",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
    badge: "LUXURY BEAUTY",
  },
  {
    id: "slide-5",
    title: "Embroidered Ethnic Footwear",
    subtitle: "Handcrafted zardosi juttis and luxury sandals.",
    category: "footwear",
    buttonText": "EXPLORE FOOTWEAR",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80",
    badge: "ETHNIC FOOTWEAR",
  },
  {
    id: "slide-6",
    title: "Heritage Kundan & Gold Jewelry",
    subtitle: "Exquisite royal necklaces, bangles & maang tikkas.",
    category: "jewelry",
    buttonText": "SHOP JEWELRY",
    image: "https://images.unsplash.com/photo-1515562141589-67f0d932b7d6?auto=format&fit=crop&w=1000&q=80",
    badge: "ROYAL JEWELRY",
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
      className="relative rounded-3xl overflow-hidden bg-[#FAF5EC] border border-[#E8DFC9] shadow-sm group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex flex-col md:flex-row items-center justify-between min-h-[340px] sm:min-h-[380px] p-6 sm:p-10 lg:p-12 gap-8">
        
        {/* Left Text Content */}
        <div className="w-full md:w-1/2 space-y-4 text-left z-10">
          {activeSlide.badge && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#5C1E1E]/10 text-[#5C1E1E] text-[11px] font-bold tracking-widest uppercase border border-[#5C1E1E]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#5C1E1E]" /> {activeSlide.badge}
            </span>
          )}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-[#2D2118] leading-[1.15] tracking-tight transition-all duration-300">
            {activeSlide.title}
          </h2>
          <p className="text-sm sm:text-base text-[#8B7355] font-normal max-w-md leading-relaxed">
            {activeSlide.subtitle}
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleSlideClick(activeSlide)}
              className="bg-[#2D2118] hover:bg-[#5C1E1E] text-white px-7 py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 flex items-center gap-2"
            >
              <span>{activeSlide.buttonText || "SHOP NOW"}</span>
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div
          onClick={() => handleSlideClick(activeSlide)}
          className="w-full md:w-1/2 h-[240px] sm:h-[300px] lg:h-[340px] rounded-2xl overflow-hidden relative cursor-pointer group/img shrink-0"
        >
          <img
            src={activeSlide.image}
            alt={activeSlide.title}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover/img:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D2118]/30 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Prev / Next Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 border border-[#E8DFC9] shadow-md flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC]"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 border border-[#E8DFC9] shadow-md flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC]"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentIndex === idx
                ? "w-6 h-2 bg-[#2D2118]"
                : "w-2 h-2 bg-[#8B7355]/40 hover:bg-[#8B7355]"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
