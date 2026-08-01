import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "../services/api";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("reevanta_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("reevanta_wishlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [resellerMode, setResellerMode] = useState(false);

  // Sync with MongoDB Atlas Database on Mount
  useEffect(() => {
    apiFetch("/cart")
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          setCart(res.items);
        }
      })
      .catch(() => {});
  }, []);

  // Persist to localStorage and MongoDB Atlas Database
  useEffect(() => {
    localStorage.setItem("reevanta_cart", JSON.stringify(cart));
    apiFetch("/cart", {
      method: "POST",
      body: { items: cart }
    }).catch(() => {});
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("reevanta_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product, size = "", color = "") => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.selectedSize === size && item.selectedColor === color
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].qty += 1;
        toast.success(`Updated ${product.name} quantity in cart!`);
        return updated;
      } else {
        toast.success(`Added ${product.name} to cart!`);
        return [
          ...prevCart,
          {
            ...product,
            selectedSize: size || (product.sizes && product.sizes[0]) || "",
            selectedColor: color || (product.colors && product.colors[0]) || "",
            qty: 1,
          },
        ];
      }
    });
  };

  const removeFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
    toast.info("Item removed from cart");
  };

  const updateCartQty = (index, delta) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      const newQty = updated[index].qty + delta;
      if (newQty <= 0) {
        return prevCart.filter((_, i) => i !== index);
      }
      updated[index].qty = newQty;
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    apiFetch("/cart", { method: "DELETE" }).catch(() => {});
  };

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        toast.info("Removed from Wishlist");
        return prev.filter((item) => item.id !== product.id);
      } else {
        toast.success("Added to Wishlist!");
        return [...prev, product];
      }
    });
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartTotalResellerMargin = resellerMode
    ? cart.reduce((sum, item) => sum + (item.resellerMargin || 0) * item.qty, 0)
    : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        wishlist,
        toggleWishlist,
        isCartOpen,
        setIsCartOpen,
        resellerMode,
        setResellerMode,
        cartSubtotal,
        cartTotalResellerMargin,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
