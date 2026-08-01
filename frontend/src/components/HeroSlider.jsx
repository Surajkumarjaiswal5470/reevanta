import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../services/api";

const DEFAULT_SLIDES = [
  {
    id: "slide-cosmetics",
    title: "Velvet Lipsticks Collection",
    category: "cosmetics",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "slide-serum",
    title: "Vitamin C Face Serum",
    category: "beauty",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "slide-palette",
    title: "Rose Gold Eyeshadow Palette",
    category: "cosmetics",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "slide-lipliner",
    title: "Rose Lip Liner Set",
    category: "cosmetics",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "slide-fixer",
    title: "16-Hour Fixing Spray",
    category: "cosmetics",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1631214540242-3cd8c4b0b3b6?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "slide-toner",
    title: "Rose Gold Toner Mist",
    category: "beauty",
    buttonText: "SHOP NOW",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1400&q=80",
  },
];

const AUTOPLAY_MS = 4500;

export function HeroSlider({ onCategorySelect, onNavigate }) {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  const touchStartX = useRef(null);
  const sectionRef = useRef(null);

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
      .catch(() => { });
  }, []);

  // Preload all slide images so the slide transition never shows a blank frame
  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, [slides]);

  const goTo = useCallback(
    (index) => {
      setCurrentIndex(((index % slides.length) + slides.length) % slides.length);
      setProgressKey((k) => k + 1); // restart the progress bar animation
    },
    [slides.length]
  );

  const nextSlide = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const prevSlide = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  // Auto-play timer
  useEffect(() => {
    if (isPaused || slides.length <= 1 || prefersReducedMotion.current) return;
    const timer = setInterval(nextSlide, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, nextSlide]);

  // Keyboard navigation when the slider has focus
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  };

  // Touch swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;
    if (deltaX > SWIPE_THRESHOLD) prevSlide();
    else if (deltaX < -SWIPE_THRESHOLD) nextSlide();
    touchStartX.current = null;
  };

  const handleSlideClick = (slide) => {
    if (slide.category && onCategorySelect) {
      onCategorySelect(slide.category);
    } else if (onNavigate) {
      onNavigate("catalog");
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative my-1 group select-none outline-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      {/* ── Sliding Track ── */}
      <div className="relative w-full h-[180px] sm:h-[260px] md:h-[320px] rounded-2xl overflow-hidden border border-[#E8DFC9] shadow-sm bg-gray-900">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div
              key={slide.id ?? idx}
              className="relative w-full h-full flex-shrink-0 cursor-pointer"
              onClick={() => handleSlideClick(slide)}
              aria-hidden={idx !== currentIndex}
            >
              <img
                src={slide.image}
                alt={slide.title}
                loading={idx === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover object-center"
              />

              {/* Bottom-left vignette + copy */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-7 text-white">
                <div className="space-y-2 max-w-md">
                  {slide.category && (
                    <span className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#E8DFC9]/80 font-semibold">
                      {slide.category}
                    </span>
                  )}
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-serif font-black text-white leading-tight drop-shadow">
                    {slide.title}
                  </h2>

                  <div>
                    <span className="inline-flex items-center gap-1 bg-[#2D2118] hover:bg-[#5C1E1E] text-white text-[10px] sm:text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition-all duration-200 active:scale-95 hover:pr-4">
                      <span>{slide.buttonText || "SHOP NOW"}</span>
                      <span>›</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Autoplay progress bar (top edge, subtle) */}
        {!isPaused && !prefersReducedMotion.current && slides.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 z-10">
            <div
              key={progressKey}
              className="h-full bg-[#E8DFC9] origin-left"
              style={{
                animation: `hero-progress ${AUTOPLAY_MS}ms linear forwards`,
              }}
            />
          </div>
        )}

        {/* Screen-reader-only live status */}
        <span className="sr-only" aria-live="polite">
          {`Slide ${currentIndex + 1} of ${slides.length}: ${slides[currentIndex]?.title ?? ""}`}
        </span>
      </div>

      {/* Prev / Next Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-[#E8DFC9] shadow-lg flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5C1E1E]"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-[#E8DFC9] shadow-lg flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5C1E1E]"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* ── Dots Indicator ── */}
      <div className="flex items-center justify-center gap-1.5 pt-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`transition-all duration-300 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5C1E1E] ${currentIndex === idx
              ? "w-6 h-2 bg-[#5C1E1E]"
              : "w-2 h-2 bg-[#8B7355]/40 hover:bg-[#8B7355]"
              }`}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={currentIndex === idx}
          />
        ))}
      </div>

      <style>{`
        @keyframes hero-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}