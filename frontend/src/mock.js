export const PRODUCTS_ENDPOINT = "/api/products";
export const ORDERS_ENDPOINT = "/api/orders";

export const MOCK_CATEGORIES = [
  { id: "all", name: "All Products", icon: "Sparkles" },
  { id: "cosmetics", name: "Cosmetics & Makeup", icon: "Sparkles", isPriority: true },
  { id: "skincare", name: "Skin Care", icon: "Sparkles", isPriority: true },
  { id: "haircare", name: "Hair Care & Shampoos", icon: "Sparkles", isPriority: true },
  { id: "fragrance", name: "Perfumes & Fragrances", icon: "Sparkles", isPriority: true },
  { id: "jewelry", name: "Royal Jewelry", icon: "Sparkles", isPriority: true },
  { id: "sarees", name: "Ethnic Sarees & Wear", icon: "Sparkles" },
  { id: "shoes", name: "Footwear & Shoes", icon: "Sparkles" },
  { id: "bags", name: "Bags & Accessories", icon: "Sparkles" }
];

export const COSMETICS_SUB_CATEGORIES = [
  {
    id: "lip-care",
    name: "Lipsticks & Lip Care",
    tag: "lipstick",
    icon: "💄",
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "serums",
    name: "Face Serums & Glow Oils",
    tag: "serum",
    icon: "💧",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "eye-makeup",
    name: "Eyeshadows & Palettes",
    tag: "eyeshadow",
    icon: "✨",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "face-powders",
    name: "Compacts & Powders",
    tag: "compact",
    icon: "🌸",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "setting-mists",
    name: "Fixing Sprays & Toners",
    tag: "fixer",
    icon: "🌹",
    image: "https://images.unsplash.com/photo-1608248597261-e4d09447e06a?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "hair-care",
    name: "Hair Care & Shampoos",
    tag: "shampoo",
    icon: "🧴",
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "fragrances",
    name: "Perfumes & Fragrances",
    tag: "perfume",
    icon: "🌸",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "jewelry-sub",
    name: "Royal Jewelry & Kundan",
    tag: "jewelry",
    icon: "💎",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "ethnic-wear",
    name: "Sarees & Ethnic Apparel",
    tag: "sarees",
    icon: "👗",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "footwear",
    name: "Footwear & Heels",
    tag: "shoes",
    icon: "👟",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "bags-sub",
    name: "Bags & Luxury Clutches",
    tag: "bags",
    icon: "👜",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "sunscreen",
    name: "Sunscreen & UV Shield",
    tag: "sunscreen",
    icon: "☀️",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=500&q=80"
  }
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

export const MOCK_PRODUCTS = [];
export const MOCK_FLASH_SALE_ITEMS = [];
