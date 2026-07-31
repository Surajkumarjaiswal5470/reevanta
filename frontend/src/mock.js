export const PRODUCTS_ENDPOINT = "/api/products";
export const ORDERS_ENDPOINT = "/api/orders";

export const MOCK_CATEGORIES = [
  { id: "all", name: "All", icon: "Sparkles" },
  { id: "sarees", name: "Sarees", icon: "Sparkles" },
  { id: "kurtas", name: "Kurtas & Suits", icon: "Sparkles" },
  { id: "lehenga", name: "Lehenga", icon: "Sparkles" },
  { id: "cosmetics", name: "Cosmetics", icon: "Sparkles" },
  { id: "beauty", name: "Beauty Care", icon: "Sparkles" }
];

export const MOCK_LOOKBOOKS = [
  {
    id: "lb-1",
    title: "New Season Essentials",
    description: "Timeless silhouettes and hand-embroidered classics for the modern woman.",
    image: "https://images.unsplash.com/photo-1610030469668-8e450b47a4a5?auto=format&fit=crop&w=1200",
    itemIds: []
  },
  {
    id: "lb-2",
    title: "Bridal Heritage Collection",
    description: "Handpicked lehengas & sarees for the season's most memorable celebrations.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200",
    itemIds: []
  },
  {
    id: "lb-3",
    title: "Effortless Everyday Beauty",
    description: "Velvet lips, dewy skin, subtle sparkle — a curated cosmetic ritual.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200",
    itemIds: []
  }
];

// Fallback catalog (backend seeds real data on startup).
export const MOCK_PRODUCTS = [];
export const MOCK_FLASH_SALE_ITEMS = [];
