import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem("reevanta_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const getUserId = () => {
    let id = localStorage.getItem("reevanta_user_id");
    if (!id) {
      id = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("reevanta_user_id", id);
    }
    return id;
  };

  useEffect(() => {
    try {
      localStorage.setItem("reevanta_wishlist", JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  const toggleWishlist = async (product) => {
    const pId = product._id || product.id;
    const exists = wishlist.some((item) => (item._id || item.id) === pId);

    if (exists) {
      setWishlist((prev) => prev.filter((item) => (item._id || item.id) !== pId));
      toast.success("Removed from Wishlist", { icon: "💔" });
    } else {
      setWishlist((prev) => [...prev, product]);
      toast.success("Added to Wishlist", { icon: "💖" });
    }

    // Backend Sync
    try {
      await fetch(`${API}/marketplace/wishlist/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: getUserId(), product_id: pId })
      });
    } catch (err) {
      console.error("Wishlist backend sync error:", err);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => (item._id || item.id) === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlist.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
