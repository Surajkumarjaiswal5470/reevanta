import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { COSMETICS_SUB_CATEGORIES } from "../mock";

export function CosmeticsSubCategorySlider({ onSelectSubCategory, activeSubCategory }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 220;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="space-y-3.5 my-4">
      {/* Header Title */}
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#5C1E1E] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Curated Beauty Collections
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#2D2118]">
            Explore by Cosmetics Category
          </h2>
        </div>
      </div>

      {/* Sub-Category Slider Track */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 border border-[#E8DFC9] shadow-md flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC] -ml-2 hidden sm:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth py-1 px-0.5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {COSMETICS_SUB_CATEGORIES.map((sub) => {
            const isSelected = activeSubCategory === sub.tag;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubCategory(sub.tag)}
                className={`group/card flex items-center gap-3 shrink-0 p-2.5 pr-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer ${
                  isSelected
                    ? "bg-[#2D2118] text-white border-[#2D2118] shadow-md scale-[1.02]"
                    : "bg-white text-[#2D2118] border-[#E8DFC9] hover:border-[#5C1E1E] hover:shadow-sm"
                }`}
              >
                {/* Thumbnail image circle */}
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border border-[#E8DFC9] bg-[#FAF5EC]">
                  <img
                    src={sub.image}
                    alt={sub.name}
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                  />
                  <span className="absolute top-0.5 right-0.5 text-[10px]">
                    {sub.icon}
                  </span>
                </div>

                {/* Sub-category Name & Item Count */}
                <div>
                  <h3 className={`text-xs font-extrabold leading-snug ${isSelected ? "text-amber-200" : "text-[#2D2118]"}`}>
                    {sub.name}
                  </h3>
                  <span className={`text-[10px] font-bold ${isSelected ? "text-gray-300" : "text-[#8B7355]"}`}>
                    {sub.itemCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 border border-[#E8DFC9] shadow-md flex items-center justify-center text-[#2D2118] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#FAF5EC] -mr-2 hidden sm:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
