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
    id: "sarees",
    label: "Sarees",
    genders: ["all", "women"],
    image: "/category-icons/sarees.png",
  },
  {
    id: "kurtas",
    label: "Kurtas & Suits",
    genders: ["all", "women", "men"],
    image: "/category-icons/kurtas.png",
  },
  {
    id: "lehenga",
    label: "Lehenga",
    genders: ["all", "women"],
    image: "/category-icons/lehenga.png",
  },
  {
    id: "cosmetics",
    label: "Cosmetics",
    genders: ["all", "women"],
    image: "/category-icons/cosmetics.png",
  },
  {
    id: "beauty",
    label: "Beauty Care",
    genders: ["all", "women", "men"],
    image: "/category-icons/beauty.png",
  },
  {
    id: "footwear",
    label: "Footwear",
    genders: ["all", "women", "men", "kids"],
    image: "/category-icons/footwear.png",
  },
  {
    id: "jewelry",
    label: "Jewelry",
    genders: ["all", "women"],
    image: "/category-icons/jewelry.png",
  },
  {
    id: "sherwanis",
    label: "Sherwanis",
    genders: ["all", "men"],
    image: "/category-icons/sherwanis.png",
  },
  {
    id: "kids-wear",
    label: "Kids Ethnic",
    genders: ["all", "kids"],
    image: "/category-icons/kids-wear.png",
  },
];

export function CategorySlider({ onCategorySelect, onNavigate }) {
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

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none scroll-smooth py-2 px-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {filtered.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="group/item flex flex-col items-center gap-1.5 shrink-0 w-[68px] sm:w-[80px] transition-all duration-200 active:scale-95"
            >
              {/* Circular Classic Artwork Image */}
              <div className="relative w-[58px] h-[58px] sm:w-[66px] sm:h-[66px] rounded-full overflow-hidden border-2 border-[#8B7355]/30 group-hover/item:border-[#5C1E1E] shadow-sm group-hover/item:shadow-md transition-all duration-300 bg-[#FAF5EC]">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 rounded-full bg-[#5C1E1E]/0 group-hover/item:bg-[#5C1E1E]/10 transition-all duration-300" />
              </div>
              {/* Label */}
              <span className="text-[10px] sm:text-[11px] font-bold text-[#2D2118] group-hover/item:text-[#5C1E1E] transition-colors duration-200 text-center leading-tight line-clamp-2">
                {cat.label}
              </span>
            </button>
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
