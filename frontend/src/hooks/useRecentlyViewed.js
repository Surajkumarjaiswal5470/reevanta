import { useState, useEffect } from "react";

const STORAGE_KEY = "reevanta_recently_viewed";

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const addRecentlyViewed = (product) => {
    if (!product || (!product.id && !product._id)) return;
    const pId = product._id || product.id;

    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => (item._id || item.id) !== pId);
      const updated = [product, ...filtered].slice(0, 12); // Keep last 12
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return { recentlyViewed, addRecentlyViewed };
}
