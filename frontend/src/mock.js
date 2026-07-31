export const PRODUCTS_ENDPOINT = "/api/products";
export const ORDERS_ENDPOINT = "/api/orders";

export const MOCK_CATEGORIES = [
  { id: "all", name: "All Products", icon: "Sparkles" },
  { id: "clothes", name: "Clothing & Apparel", icon: "Shirt" },
  { id: "shoes", name: "Footwear & Sneakers", icon: "Footprints" },
  { id: "makeup", name: "Makeup & Beauty", icon: "Palette" },
  { id: "accessories", name: "Bags & Accessories", icon: "Watch" }
];

export const MOCK_LOOKBOOKS = [
  {
    id: "lb-1",
    title: "Y2K Streetwear Vibe",
    description: "Oversized graphic tees, chunky sneakers, and neon accents.",
    image: "https://images.pexels.com/photos/1066171/pexels-photo-1066171.jpeg?auto=compress&tinysrgb&w=800",
    itemIds: ["p1", "p3", "p7"]
  },
  {
    id: "lb-2",
    title: "Minimalist Chic Office & Brunch",
    description: "Clean silhouettes, neutral tones, and sleek accessories.",
    image: "https://images.unsplash.com/photo-1575176647993-a8a6f538e940?auto=compress&tinysrgb&w=800",
    itemIds: ["p2", "p5", "p9"]
  },
  {
    id: "lb-3",
    title: "Glam Night Out Makeup & Fit",
    description: "Matte velvet lips, highlighters, and statement stiletto heels.",
    image: "https://images.pexels.com/photos/3552894/pexels-photo-3552894.jpeg?auto=compress&tinysrgb&w=800",
    itemIds: ["p4", "p6", "p8"]
  }
];

export const MOCK_PRODUCTS = [
  {
    id: "p1",
    name: "Oversized Vintage Graphic Hoodie",
    category: "clothes",
    brand: "UrbanRev",
    price: 1299,
    originalPrice: 2499,
    rating: 4.6,
    reviewsCount: 342,
    image: "https://images.pexels.com/photos/1066171/pexels-photo-1066171.jpeg?auto=compress&tinysrgb&w=800",
    sizes: ["S", "M", "L", "XL"],
    colors: ["#282C3F", "#FF3F6C", "#E0E0E0"],
    inStock: true,
    isFlashSale: true,
    discountPercent: 48,
    resellerMargin: 350,
    description: "Premium heavy cotton fleece hoodie with vintage wash and drop shoulder fit.",
    reviews: [
      { id: "r1", user: "Priya S.", rating: 5, comment: "Super cozy and great quality cotton!", date: "2 days ago", verified: true }
    ]
  },
  {
    id: "p2",
    name: "Chunky Platform Retro Sneakers",
    category: "shoes",
    brand: "KicksLab",
    price: 2199,
    originalPrice: 3999,
    rating: 4.8,
    reviewsCount: 512,
    image: "https://images.unsplash.com/photo-1575176647993-a8a6f538e940?auto=compress&tinysrgb&w=800",
    sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
    colors: ["#FFFFFF", "#000000", "#FF3F6C"],
    inStock: true,
    isFlashSale: true,
    discountPercent: 45,
    resellerMargin: 500,
    description: "Cloud-cushioning platform sneakers with breathable mesh and modern streetwear aesthetic.",
    reviews: [
      { id: "r2", user: "Rahul M.", rating: 5, comment: "Extremely comfortable for daily walking and looks stunning.", date: "1 week ago", verified: true }
    ]
  },
  {
    id: "p3",
    name: "Velvet Matte Lipstick & Gloss Kit",
    category: "makeup",
    brand: "GlowGasm",
    price: 699,
    originalPrice: 1299,
    rating: 4.7,
    reviewsCount: 890,
    image: "https://images.pexels.com/photos/3552894/pexels-photo-3552894.jpeg?auto=compress&tinysrgb&w=800",
    sizes: ["Standard"],
    colors: ["#8B0000", "#FF69B4", "#D2B48C"],
    inStock: true,
    isFlashSale: false,
    discountPercent: 46,
    resellerMargin: 220,
    description: "Long-lasting transfer-proof velvet matte liquid lipstick paired with high-shine lip gloss.",
    reviews: [
      { id: "r3", user: "Ananya K.", rating: 4, comment: "Stays on all day without drying lips!", date: "Yesterday", verified: true }
    ]
  },
  {
    id: "p4",
    name: "Quilted Chain Crossbody Bag",
    category: "accessories",
    brand: "AuraLux",
    price: 999,
    originalPrice: 1999,
    rating: 4.5,
    reviewsCount: 184,
    image: "https://images.pexels.com/photos/14037872/pexels-photo-14037872.jpeg?auto=compress&tinysrgb&w=800",
    sizes: ["One Size"],
    colors: ["#000000", "#F5F5DC", "#FF3F6C"],
    inStock: true,
    isFlashSale: true,
    discountPercent: 50,
    resellerMargin: 300,
    description: "Chic quilted vegan leather handbag with gold-tone heavy chain strap and secure magnetic snap.",
    reviews: []
  },
  {
    id: "p5",
    name: "Highlighter & Contour Glow Palette",
    category: "makeup",
    brand: "GlowGasm",
    price: 849,
    originalPrice: 1599,
    rating: 4.9,
    reviewsCount: 420,
    image: "https://images.pexels.com/photos/3552894/pexels-photo-3552894.jpeg?auto=compress&tinysrgb&w=800",
    sizes: ["Palette"],
    colors: ["#Golden", "#RoseGold", "#Bronze"],
    inStock: true,
    isFlashSale: false,
    discountPercent: 47,
    resellerMargin: 280,
    description: "Ultra-pigmented shimmer highlighter and sculpting contour powders for flawless definition.",
    reviews: []
  },
  {
    id: "p6",
    name: "Slim Fit Pleated Tennis Skirt",
    category: "clothes",
    brand: "UrbanRev",
    price: 799,
    originalPrice: 1499,
    rating: 4.4,
    reviewsCount: 215,
    image: "https://images.pexels.com/photos/1066171/pexels-photo-1066171.jpeg?auto=compress&tinysrgb&w=800",
    sizes: ["XS", "S", "M", "L"],
    colors: ["#000000", "#FFFFFF", "#FF3F6C", "#000080"],
    inStock: true,
    isFlashSale: false,
    discountPercent: 46,
    resellerMargin: 250,
    description: "High-waisted pleated tennis skirt with built-in safety shorts for active everyday style.",
    reviews: []
  },
  {
    id: "p7",
    name: "Minimalist Gold-Plated Hoop Earrings",
    category: "accessories",
    brand: "AuraLux",
    price: 499,
    originalPrice: 999,
    rating: 4.7,
    reviewsCount: 630,
    image: "https://images.pexels.com/photos/14037872/pexels-photo-14037872.jpeg?auto=compress&tinysrgb&w=800",
    sizes: ["Standard"],
    colors: ["#Gold", "#Silver"],
    inStock: true,
    isFlashSale: true,
    discountPercent: 50,
    resellerMargin: 180,
    description: "Tarnish-resistant 18k gold plated lightweight chunky hoops for effortless everyday elegance.",
    reviews: []
  },
  {
    id: "p8",
    name: "Running Air Cushion Sport Shoes",
    category: "shoes",
    brand: "KicksLab",
    price: 2499,
    originalPrice: 4999,
    rating: 4.9,
    reviewsCount: 780,
    image: "https://images.unsplash.com/photo-1575176647993-a8a6f538e940?auto=compress&tinysrgb&w=800",
    sizes: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
    colors: ["#000000", "#FF3F6C", "#008080"],
    inStock: true,
    isFlashSale: false,
    discountPercent: 50,
    resellerMargin: 600,
    description: "Professional running shoes with responsive air-sole cushioning and shock-absorbent outsole.",
    reviews: []
  }
];

export const MOCK_FLASH_SALE_ITEMS = MOCK_PRODUCTS.filter((p) => p.isFlashSale);
