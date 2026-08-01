import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/*
 * ─── Gender / Audience Tabs ───
 */
const GENDER_TABS = [
  { id: "all", label: "ALL" },
  { id: "women", label: "WOMEN" },
  { id: "men", label: "MEN" },
  { id: "kids", label: "KIDS" },
];

/*
 * ─── Category Items ───
 * Uses local classic royal burgundy & gold circular artwork images
 */
const CATEGORIES = [
  {
    id: "cosmetics",
    label: "Cosmetics",
    genders: ["all", "women"],
    image: "/category-icons/cosmetics.png",
    isPriority: true,
  },
  {
    id: "beauty",
    label: "Beauty Care",
    genders: ["all", "women", "men"],
    image: "/category-icons/beauty.png",
    isPriority: true,
  },
  {
    id: "sarees",
    label: "Sarees",
    genders: ["all", "women"],
    image: "/category-icons/sarees.png",
    comingSoon: true,
  },
  {
    id: "kurtas",
    label: "Kurtas & Suits",
    genders: ["all", "women", "men"],
    image: "/category-icons/kurtas.png",
    comingSoon: true,
  },
  {
    id: "lehenga",
    label: "Lehenga",
    genders: ["all", "women"],
    image: "/category-icons/lehenga.png",
    comingSoon: true,
  },
  {
    id: "footwear",
    label: "Footwear",
    genders: ["all", "women", "men", "kids"],
    image: "/category-icons/footwear.png",
    comingSoon: true,
  },
  {
    id: "jewelry",
    label: "Jewelry",
    genders: ["all", "women"],
    image: "/category-icons/jewelry.png",
    comingSoon: true,
  },
  {
    id: "sherwanis",
    label: "Sherwanis",
    genders: ["all", "men"],
    image: "/category-icons/sherwanis.png",
    comingSoon: true,
  },
  {
    id: "kids-wear",
    label: "Kids Ethnic",
    genders: ["all", "kids"],
    image: "/category-icons/kids-wear.png",
    comingSoon: true,
  },
];

function CategorySliderImpl({ onCategorySelect, onNavigate }) {
  const [activeGender, setActiveGender] = useState("all");
  const scrollRef = useRef(null);

  const filtered = CATEGORIES.filter((c) => c.genders.includes(activeGender));

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleCategoryClick = (catId) => {
    if (onCategorySelect) onCategorySelect(catId);
    if (onNavigate) onNavigate("catalog");
  };

  return (
    <section className="space-y-1.5 py-0 my-0">

      {/* ── Gender Tab Bar ── */}
      <div className="flex items-center gap-0 bg-[#FAF5EC] rounded-2xl p-0.5 border border-[#E8DFC9] shadow-sm overflow-x-auto scrollbar-none">
        {GENDER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveGender(tab.id)}
            className={`flex-1 min-w-[65px] py-1.5 px-3 rounded-xl text-[11px] font-black tracking-[0.15em] uppercase transition-all duration-200 whitespace-nowrap ${
              activeGender === tab.id
                ? "bg-[#2D2118] text-white shadow-md"
                : "text-[#8B7355] hover:text-[#2D2118] hover:bg-[#E8DFC9]/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Category Carousel ── */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 border border-[#E8DFC9] shadow-lg flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC] -ml-1 hidden sm:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scroll Track */}
        <div
          ref={scrollRef}
          className="flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
        >
          {filtered.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="flex flex-col items-center gap-1 min-w-[70px] sm:min-w-[85px] cursor-pointer group/item flex-shrink-0"
            >
              {/* Circular Icon Container */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-700 shadow-md group-hover/item:scale-105 transition-transform duration-200">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#2D2118] relative">
                  <img
                    src={cat.image}
                    alt={cat.label}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  {cat.comingSoon && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-[8px] font-black text-amber-300 uppercase tracking-widest bg-[#5C1E1E]/90 px-1.5 py-0.5 rounded-full border border-amber-400/30">
                        SOON
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Label */}
              <span className="text-[11px] font-extrabold text-[#2D2118] group-hover/item:text-[#5C1E1E] transition-colors text-center leading-tight">
                {cat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 border border-[#E8DFC9] shadow-lg flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC] -mr-1 hidden sm:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

export const CategorySlider = React.memo(CategorySliderImpl);
