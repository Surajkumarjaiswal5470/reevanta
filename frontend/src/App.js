import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Search,
  Share2,
  TrendingUp,
  Percent,
  CheckCircle2,
  Star,
  X,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  User,
  ExternalLink,
  MessageCircle,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_LOOKBOOKS, MOCK_FLASH_SALE_ITEMS } from "./mock";

export default function App() {
  const [activeTab, setActiveTab] = useState("home"); // home, catalog, lookbooks, wishlist, orders
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [resellerMode, setResellerMode] = useState(false);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [orders, setOrders] = useState([
    {
      id: "ORD-98214",
      date: "2026-03-30",
      items: [{ name: "Oversized Vintage Graphic Hoodie", qty: 1, price: 1299 }],
      total: 1299,
      status: "Out for Delivery",
      payment: "COD"
    }
  ]);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart, 2: Address, 3: Reseller Margin (if enabled), 4: Success
  const [shippingDetails, setShippingDetails] = useState({
    name: "Priya Sharma",
    phone: "+91 98765 43210",
    address: "Flat 402, Sunshine Heights, MG Road",
    city: "Bangalore",
    pincode: "560001",
    resellerCustomerName: "",
    resellerCustomerPhone: "",
    resellerExtraMargin: 150
  });
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 45 });

  // Countdown timer for Flash Sale
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cart Management
  const addToCart = (product, size = "", color = "") => {
    const itemKey = `${product.id}-${size}-${color}`;
    const existing = cart.find((i) => i.itemKey === itemKey);
    if (existing) {
      setCart(
        cart.map((i) => (i.itemKey === itemKey ? { ...i, qty: i.qty + 1 } : i))
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          itemKey,
          selectedSize: size || product.sizes[0] || "Standard",
          selectedColor: color || product.colors[0] || "#000",
          qty: 1
        }
      ]);
    }
    toast.success(`Added ${product.name} to bag!`);
    setIsCartOpen(true);
  };

  const updateCartQty = (itemKey, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.itemKey === itemKey) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemKey) => {
    setCart(cart.filter((i) => i.itemKey !== itemKey));
    toast.info("Removed item from bag");
  };

  // Wishlist Management
  const toggleWishlist = (product) => {
    if (wishlist.some((p) => p.id === product.id)) {
      setWishlist(wishlist.filter((p) => p.id !== product.id));
      toast.info(`Removed from wishlist`);
    } else {
      setWishlist([...wishlist, product]);
      toast.success(`Saved to wishlist! ❤️`);
    }
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const resellerTotalMargin = resellerMode
    ? cart.reduce((acc, item) => acc + (item.resellerMargin || 200) * item.qty, 0)
    : 0;
  const finalOrderTotal = cartSubtotal + (resellerMode ? shippingDetails.resellerExtraMargin * cart.length : 0);

  const handlePlaceOrder = () => {
    const newOrd = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split("T")[0],
      items: [...cart],
      total: finalOrderTotal,
      status: "Order Confirmed",
      payment: "Cash on Delivery / UPI"
    };
    setOrders([newOrd, ...orders]);
    setCart([]);
    setCheckoutStep(4);
    toast.success("Order placed successfully!");
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const shareProductWhatsApp = (product) => {
    const margin = resellerMode ? product.resellerMargin : 0;
    const sharePrice = product.price + margin;
    const text = `🔥 Check out this stunning ${product.name} on Lumière & Bazar! Price: ₹${sharePrice}. DM to order!`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("Reseller share text copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredProducts = MOCK_PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#282C3F] font-sans selection:bg-[#FF3F6C] selection:text-white">
      {/* Top Banner Bar */}
      <div className="bg-[#282C3F] text-white text-xs py-2 px-4 flex justify-between items-center tracking-wide">
        <div className="flex items-center space-x-2">
          <span className="bg-[#FF3F6C] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Mega Offer</span>
          <span>Extra 15% OFF on First Order with Code: <strong className="text-[#FF905A]">LUMI15</strong></span>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <button 
            data-testid="toggle-reseller-banner-btn"
            onClick={() => setResellerMode(!resellerMode)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
              resellerMode ? "bg-[#7928CA] text-white shadow-md animate-pulse" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>{resellerMode ? "⚡ Reseller Mode ACTIVE" : "🚀 Enable Reseller & Earn"}</span>
          </button>
          <span className="text-gray-300">|</span>
          <span className="cursor-pointer hover:text-[#FF3F6C]">Track Order</span>
          <span className="cursor-pointer hover:text-[#FF3F6C]">Download App</span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAEAEC] px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("home")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF3F6C] to-[#FF905A] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#FF3F6C]/20">
              L
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-[#FF3F6C] to-[#282C3F] bg-clip-text text-transparent">
                LUMIÈRE & BAZAR
              </h1>
              <p className="text-[10px] text-[#535766] tracking-widest font-semibold uppercase">Myntra x Meesho Hub</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#535766]">
                <Search className="w-4 h-4" />
              </span>
              <input
                data-testid="search-input"
                type="text"
                placeholder="Search for clothes, shoes, makeup, bags & more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAFAFC] border border-[#EAEAEC] rounded-full pl-10 pr-4 py-2 text-sm text-[#282C3F] placeholder-[#535766]/70 focus:outline-none focus:ring-2 focus:ring-[#FF3F6C] transition shadow-inner"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-6">
            <button
              data-testid="nav-catalog-btn"
              onClick={() => setActiveTab("catalog")}
              className={`text-sm font-semibold transition hover:text-[#FF3F6C] ${activeTab === "catalog" ? "text-[#FF3F6C]" : "text-[#282C3F]"}`}
            >
              Shop Catalog
            </button>
            <button
              data-testid="nav-lookbooks-btn"
              onClick={() => setActiveTab("lookbooks")}
              className={`hidden sm:block text-sm font-semibold transition hover:text-[#FF3F6C] ${activeTab === "lookbooks" ? "text-[#FF3F6C]" : "text-[#282C3F]"}`}
            >
              Lookbooks
            </button>

            {/* Reseller Mode Toggle Button */}
            <button
              data-testid="reseller-mode-toggle"
              onClick={() => {
                setResellerMode(!resellerMode);
                toast.success(resellerMode ? "Reseller mode disabled" : "Reseller wholesale mode activated!");
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                resellerMode
                  ? "bg-purple-100 text-purple-700 border-purple-300 shadow-sm"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Reseller:</span>
              <span>{resellerMode ? "ON" : "OFF"}</span>
            </button>

            {/* Wishlist */}
            <button
              data-testid="nav-wishlist-btn"
              onClick={() => setActiveTab("wishlist")}
              className="relative p-2 text-[#282C3F] hover:text-[#FF3F6C] transition"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF3F6C] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              data-testid="cart-drawer-trigger"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center space-x-2 bg-[#FF3F6C] hover:bg-[#E02E57] text-white px-4 py-2 rounded-full font-bold text-sm shadow-md shadow-[#FF3F6C]/30 transition transform active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bag</span>
              {cart.reduce((a, b) => a + b.qty, 0) > 0 && (
                <span className="bg-white text-[#FF3F6C] text-xs px-1.5 py-0.2 rounded-full font-black">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Reseller Banner Notice if Active */}
      {resellerMode && (
        <div data-testid="reseller-active-alert" className="bg-purple-700 text-white text-xs py-2 px-4 flex justify-between items-center shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center space-x-3">
            <span className="bg-white/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">Reseller Hub</span>
            <span>✨ Share products with your margins on WhatsApp & earn guaranteed margins on every customer order!</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {/* HOME VIEW */}
        {activeTab === "home" && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-[#282C3F] text-white shadow-2xl">
              <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
                <img
                  src="https://images.pexels.com/photos/20194705/pexels-photo-20194705.jpeg?auto=compress&tinysrgb&dpr=2&h=650&w=940"
                  alt="Hero Fashion"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
              <div className="relative z-20 p-8 sm:p-12 lg:p-16 max-w-2xl space-y-6">
                <div className="inline-flex items-center space-x-2 bg-[#FF3F6C]/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Ultimate Fashion & Lifestyle Edit</span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none">
                  High Fashion. <br />
                  <span className="text-[#FF905A]">Wholesale Prices.</span>
                </h2>
                <p className="text-gray-200 text-base sm:text-lg">
                  Discover trending clothes, iconic sneakers, luxury makeup kits, and stylish accessories with Myntra-grade quality and Meesho-style direct wholesale savings.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    data-testid="hero-explore-catalog-btn"
                    onClick={() => setActiveTab("catalog")}
                    className="bg-[#FF3F6C] hover:bg-[#E02E57] text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-[#FF3F6C]/40 transition flex items-center space-x-2"
                  >
                    <span>Explore Catalog</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    data-testid="hero-view-lookbooks-btn"
                    onClick={() => setActiveTab("lookbooks")}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-bold px-8 py-3.5 rounded-full transition"
                  >
                    Trending Lookbooks
                  </button>
                </div>
              </div>
            </div>

            {/* Category Quick Selector */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-[#282C3F]">Shop by Category</h3>
                  <p className="text-sm text-[#535766]">Explore handpicked collections across apparel, footwear, beauty & more</p>
                </div>
                <button
                  data-testid="see-all-categories-btn"
                  onClick={() => setActiveTab("catalog")}
                  className="text-sm font-bold text-[#FF3F6C] hover:underline flex items-center"
                >
                  See All <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {MOCK_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    data-testid={`category-card-${cat.id}`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setActiveTab("catalog");
                    }}
                    className="group bg-white rounded-2xl p-5 border border-[#EAEAEC] hover:border-[#FF3F6C] hover:shadow-xl transition cursor-pointer flex flex-col items-center text-center space-y-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#FAFAFC] group-hover:bg-[#FF3F6C]/10 text-[#FF3F6C] flex items-center justify-center transition shadow-sm">
                      {cat.id === "all" && <Sparkles className="w-6 h-6" />}
                      {cat.id === "clothes" && <ShoppingBag className="w-6 h-6" />}
                      {cat.id === "shoes" && <Sparkles className="w-6 h-6" />}
                      {cat.id === "makeup" && <Sparkles className="w-6 h-6" />}
                      {cat.id === "accessories" && <Sparkles className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#282C3F] group-hover:text-[#FF3F6C] transition">{cat.name}</h4>
                      <p className="text-xs text-[#535766] mt-0.5">Explore Styles</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flash Sale Section */}
            <div className="bg-gradient-to-br from-[#FFF0F3] to-[#FFF8F0] rounded-3xl p-6 sm:p-8 border border-[#FF3F6C]/20 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF3F6C] text-white flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#282C3F]">FLASH SALE HAPPENING NOW</h3>
                    <p className="text-xs text-[#535766]">Grab top trending items at jaw-dropping wholesale discounts</p>
                  </div>
                </div>
                {/* Timer badge */}
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-[#EAEAEC]">
                  <span className="text-xs font-bold text-[#535766]">Ends in:</span>
                  <div className="flex space-x-1 font-mono font-black text-sm text-[#FF3F6C]">
                    <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
                    <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
                    <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>

              {/* Flash Sale Product Carousel / Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {MOCK_FLASH_SALE_ITEMS.map((product) => (
                  <div
                    key={product.id}
                    data-testid={`flash-product-${product.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-[#EAEAEC] hover:shadow-2xl transition duration-300 flex flex-col group relative"
                  >
                    <div className="relative h-64 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setQuickViewProduct(product)}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-[#FF3F6C] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                        {product.discountPercent}% OFF
                      </span>
                      <button
                        data-testid={`wishlist-flash-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#282C3F] hover:text-[#FF3F6C] transition shadow-sm"
                      >
                        <Heart className={`w-4 h-4 ${wishlist.some(p => p.id === product.id) ? "fill-[#FF3F6C] text-[#FF3F6C]" : ""}`} />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-[11px] font-bold text-[#535766] uppercase tracking-wider">{product.brand}</div>
                        <h4 
                          className="font-bold text-sm text-[#282C3F] line-clamp-1 cursor-pointer hover:text-[#FF3F6C]"
                          onClick={() => setQuickViewProduct(product)}
                        >
                          {product.name}
                        </h4>
                      </div>

                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-black text-[#282C3F]">₹{product.price}</span>
                        <span className="text-sm text-[#535766] line-through">₹{product.originalPrice}</span>
                      </div>

                      {resellerMode && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-700 flex justify-between items-center">
                          <span>Reseller Profit:</span>
                          <span className="font-bold text-purple-900">₹{product.resellerMargin}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          data-testid={`quick-add-${product.id}`}
                          onClick={() => addToCart(product)}
                          className="flex-1 bg-[#282C3F] hover:bg-[#FF3F6C] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm flex items-center justify-center space-x-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </button>
                        {resellerMode && (
                          <button
                            data-testid={`share-whatsapp-${product.id}`}
                            onClick={() => shareProductWhatsApp(product)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition shadow-sm"
                            title="Share on WhatsApp with Margin"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lookbooks Showcase */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-[#282C3F]">Curated Lookbooks & Trends</h3>
                  <p className="text-sm text-[#535766]">Shop complete curated styles inspired by top fashion influencers</p>
                </div>
                <button
                  data-testid="see-all-lookbooks-btn"
                  onClick={() => setActiveTab("lookbooks")}
                  className="text-sm font-bold text-[#FF3F6C] hover:underline flex items-center"
                >
                  View All <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MOCK_LOOKBOOKS.map((lb) => (
                  <div
                    key={lb.id}
                    data-testid={`lookbook-card-${lb.id}`}
                    className="relative rounded-3xl overflow-hidden group shadow-lg h-96 cursor-pointer"
                    onClick={() => setActiveTab("lookbooks")}
                  >
                    <img src={lb.image} alt={lb.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2">
                      <span className="bg-[#FF3F6C] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Shop The Look</span>
                      <h4 className="text-xl font-black">{lb.title}</h4>
                      <p className="text-xs text-gray-200 line-clamp-2">{lb.description}</p>
                      <button className="pt-2 text-xs font-bold text-[#FF905A] flex items-center space-x-1 group-hover:translate-x-1 transition">
                        <span>Explore Collection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-3xl p-6 border border-[#EAEAEC]">
              <div className="flex items-center space-x-4 p-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FF3F6C]/10 text-[#FF3F6C] flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#282C3F]">Free Delivery</h5>
                  <p className="text-xs text-[#535766]">On all orders above ₹499</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#282C3F]">100% Secure</h5>
                  <p className="text-xs text-[#535766]">COD & UPI payments</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#282C3F]">Easy Returns</h5>
                  <p className="text-xs text-[#535766]">7-day hassle-free returns</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#282C3F]">Reseller Margin</h5>
                  <p className="text-xs text-[#535766]">Guaranteed earnings</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CATALOG VIEW */}
        {activeTab === "catalog" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEC]">
              <div>
                <h2 className="text-2xl font-black text-[#282C3F]">Fashion & Beauty Catalog</h2>
                <p className="text-xs text-[#535766]">Showing {filteredProducts.length} items curated for you</p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {MOCK_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    data-testid={`filter-cat-${cat.id}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat.id
                        ? "bg-[#FF3F6C] text-white shadow-md shadow-[#FF3F6C]/30"
                        : "bg-[#FAFAFC] text-[#282C3F] border border-[#EAEAEC] hover:bg-gray-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#EAEAEC]">
                <p className="text-lg font-bold text-[#282C3F]">No products found matching your search.</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                  className="mt-4 bg-[#FF3F6C] text-white px-6 py-2 rounded-full text-sm font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    data-testid={`catalog-product-${product.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-[#EAEAEC] hover:shadow-2xl transition duration-300 flex flex-col group relative"
                  >
                    <div className="relative h-72 overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setQuickViewProduct(product)}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-[#FF3F6C] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                        {product.discountPercent}% OFF
                      </span>
                      <button
                        data-testid={`wishlist-catalog-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#282C3F] hover:text-[#FF3F6C] transition shadow-sm"
                      >
                        <Heart className={`w-4 h-4 ${wishlist.some(p => p.id === product.id) ? "fill-[#FF3F6C] text-[#FF3F6C]" : ""}`} />
                      </button>
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded flex items-center space-x-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{product.rating} ({product.reviewsCount})</span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-[11px] font-bold text-[#535766] uppercase tracking-wider">{product.brand}</div>
                        <h4 
                          className="font-bold text-sm text-[#282C3F] line-clamp-1 cursor-pointer hover:text-[#FF3F6C]"
                          onClick={() => setQuickViewProduct(product)}
                        >
                          {product.name}
                        </h4>
                      </div>

                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-black text-[#282C3F]">₹{product.price}</span>
                        <span className="text-sm text-[#535766] line-through">₹{product.originalPrice}</span>
                      </div>

                      {resellerMode && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs text-purple-700 flex justify-between items-center">
                          <span>Reseller Profit:</span>
                          <span className="font-bold text-purple-900">₹{product.resellerMargin}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          data-testid={`catalog-add-${product.id}`}
                          onClick={() => addToCart(product)}
                          className="flex-1 bg-[#282C3F] hover:bg-[#FF3F6C] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm flex items-center justify-center space-x-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </button>
                        {resellerMode && (
                          <button
                            data-testid={`catalog-share-${product.id}`}
                            onClick={() => shareProductWhatsApp(product)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition shadow-sm"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOOKBOOKS VIEW */}
        {activeTab === "lookbooks" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-[#282C3F] to-[#1a1d29] text-white rounded-3xl p-8 shadow-xl">
              <span className="bg-[#FF3F6C] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Instagram & Influencer Edits</span>
              <h2 className="text-3xl font-black mt-3">Curated Lookbooks & Trend Stories</h2>
              <p className="text-gray-300 text-sm mt-1 max-w-xl">
                Shop complete outfits curated by top fashion creators. Get the entire look or mix and match items with wholesale pricing.
              </p>
            </div>

            <div className="space-y-12">
              {MOCK_LOOKBOOKS.map((lb) => (
                <div key={lb.id} className="bg-white rounded-3xl border border-[#EAEAEC] overflow-hidden shadow-md grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="relative h-96 lg:h-auto">
                    <img src={lb.image} alt={lb.title} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#282C3F]">
                      Featured Collection
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-between space-y-6">
                    <div>
                      <h3 className="text-2xl font-black text-[#282C3F]">{lb.title}</h3>
                      <p className="text-sm text-[#535766] mt-2">{lb.description}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#535766]">Items in this Look:</h4>
                      <div className="space-y-3">
                        {lb.itemIds.map((id) => {
                          const item = MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];
                          return (
                            <div key={id} className="flex items-center justify-between bg-[#FAFAFC] p-3 rounded-2xl border border-[#EAEAEC]">
                              <div className="flex items-center space-x-3">
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                                <div>
                                  <h5 className="font-bold text-xs text-[#282C3F]">{item.name}</h5>
                                  <span className="text-xs font-black text-[#FF3F6C]">₹{item.price}</span>
                                </div>
                              </div>
                              <button
                                data-testid={`lookbook-add-${item.id}`}
                                onClick={() => addToCart(item)}
                                className="bg-[#282C3F] hover:bg-[#FF3F6C] text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                              >
                                + Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      data-testid={`add-entire-look-${lb.id}`}
                      onClick={() => {
                        lb.itemIds.forEach((id) => {
                          const item = MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];
                          addToCart(item);
                        });
                        toast.success(`Added all items from ${lb.title} to bag!`);
                      }}
                      className="w-full bg-[#FF3F6C] hover:bg-[#E02E57] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#FF3F6C]/30 transition"
                    >
                      Add Entire Look to Bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WISHLIST VIEW */}
        {activeTab === "wishlist" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#EAEAEC]">
              <h2 className="text-2xl font-black text-[#282C3F]">My Wishlist ({wishlist.length})</h2>
              <p className="text-xs text-[#535766]">Your saved fashion & beauty favorites</p>
            </div>

            {wishlist.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#EAEAEC] space-y-4">
                <Heart className="w-16 h-16 text-gray-300 mx-auto" />
                <h3 className="text-lg font-bold text-[#282C3F]">Your wishlist is empty</h3>
                <p className="text-xs text-[#535766]">Tap the heart icon on any product to save it for later.</p>
                <button
                  onClick={() => setActiveTab("catalog")}
                  className="bg-[#FF3F6C] text-white px-6 py-2.5 rounded-full text-xs font-bold"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-[#EAEAEC] flex flex-col">
                    <div className="relative h-64 bg-gray-100">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-[#FF3F6C]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-[11px] font-bold text-[#535766] uppercase">{product.brand}</div>
                        <h4 className="font-bold text-sm text-[#282C3F] line-clamp-1">{product.name}</h4>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-black text-[#282C3F]">₹{product.price}</span>
                        <span className="text-sm text-[#535766] line-through">₹{product.originalPrice}</span>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(product);
                          toggleWishlist(product);
                        }}
                        className="w-full bg-[#FF3F6C] text-white text-xs font-bold py-2.5 rounded-xl"
                      >
                        Move to Bag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS VIEW */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#EAEAEC]">
              <h2 className="text-2xl font-black text-[#282C3F]">My Orders & Reseller Tracking</h2>
              <p className="text-xs text-[#535766]">Track your ongoing and past deliveries</p>
            </div>

            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-3xl p-6 border border-[#EAEAEC] shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#EAEAEC] pb-4 gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#FF3F6C] bg-[#FF3F6C]/10 px-3 py-1 rounded-full">{ord.id}</span>
                      <span className="text-xs text-[#535766] ml-3">Placed on {ord.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-emerald-700">{ord.status}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-[#282C3F]">{it.name} (Qty: {it.qty})</span>
                        <span className="font-bold text-[#282C3F]">₹{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-[#EAEAEC]">
                    <div className="text-xs text-[#535766]">Payment: <strong className="text-[#282C3F]">{ord.payment}</strong></div>
                    <div className="text-base font-black text-[#282C3F]">Total: ₹{ord.total}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div data-testid="quick-view-modal" className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              data-testid="close-quick-view-btn"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#282C3F] hover:bg-[#FF3F6C] hover:text-white transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-80 md:h-full bg-gray-100">
                <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                <span className="absolute top-4 left-4 bg-[#FF3F6C] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {quickViewProduct.discountPercent}% OFF
                </span>
              </div>

              <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#535766] uppercase tracking-wider">{quickViewProduct.brand}</div>
                  <h3 className="text-xl font-black text-[#282C3F]">{quickViewProduct.name}</h3>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-2xl font-black text-[#282C3F]">₹{quickViewProduct.price}</span>
                    <span className="text-sm text-[#535766] line-through">₹{quickViewProduct.originalPrice}</span>
                  </div>
                  <p className="text-xs text-[#535766] leading-relaxed">{quickViewProduct.description}</p>
                </div>

                {/* Size Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#535766]">Select Size:</label>
                  <div className="flex flex-wrap gap-2">
                    {quickViewProduct.sizes.map((sz) => (
                      <button
                        key={sz}
                        data-testid={`size-option-${sz}`}
                        onClick={() => setSelectedSize(sz)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                          (selectedSize || quickViewProduct.sizes[0]) === sz
                            ? "bg-[#282C3F] text-white border-[#282C3F]"
                            : "bg-white text-[#282C3F] border-[#EAEAEC] hover:border-[#FF3F6C]"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {resellerMode && (
                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl flex justify-between items-center text-xs">
                    <span className="text-purple-800 font-semibold">Your Reseller Margin:</span>
                    <span className="text-purple-900 font-black text-sm">₹{quickViewProduct.resellerMargin}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    data-testid="modal-add-to-bag-btn"
                    onClick={() => {
                      addToCart(quickViewProduct, selectedSize || quickViewProduct.sizes[0]);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 bg-[#FF3F6C] hover:bg-[#E02E57] text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-[#FF3F6C]/30 transition flex items-center justify-center space-x-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>
                  {resellerMode && (
                    <button
                      data-testid="modal-share-whatsapp-btn"
                      onClick={() => shareProductWhatsApp(quickViewProduct)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl transition shadow-sm"
                      title="Share on WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART & CHECKOUT SLIDING DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div data-testid="cart-drawer" className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#EAEAEC] flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-[#FF3F6C]" />
                <h3 className="font-black text-lg text-[#282C3F]">Shopping Bag ({cart.reduce((a, b) => a + b.qty, 0)})</h3>
              </div>
              <button
                data-testid="close-cart-btn"
                onClick={() => {
                  setIsCartOpen(false);
                  setCheckoutStep(1);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#282C3F] hover:bg-[#FF3F6C] hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {checkoutStep === 4 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-[#282C3F]">Order Placed Successfully!</h3>
                  <p className="text-xs text-[#535766]">
                    Thank you for shopping with Lumière & Bazar. Your order is confirmed and being prepared for shipment.
                  </p>
                  <button
                    data-testid="view-orders-btn"
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep(1);
                      setActiveTab("orders");
                    }}
                    className="mt-4 bg-[#FF3F6C] text-white font-bold px-6 py-3 rounded-full text-xs shadow-md"
                  >
                    View My Orders
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto" />
                  <h3 className="text-lg font-bold text-[#282C3F]">Your bag is empty</h3>
                  <p className="text-xs text-[#535766]">Add clothes, shoes or makeup to start your order.</p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveTab("catalog");
                    }}
                    className="bg-[#FF3F6C] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Cart Items */}
                  {checkoutStep === 1 && (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.itemKey} className="flex space-x-4 bg-[#FAFAFC] p-3 rounded-2xl border border-[#EAEAEC]">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-xs text-[#282C3F] line-clamp-1">{item.name}</h4>
                              <p className="text-[11px] text-[#535766]">Size: {item.selectedSize}</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-black text-sm text-[#282C3F]">₹{item.price}</span>
                              <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg border border-[#EAEAEC]">
                                <button
                                  data-testid={`qty-minus-${item.itemKey}`}
                                  onClick={() => updateCartQty(item.itemKey, -1)}
                                  className="text-[#535766] hover:text-[#FF3F6C]"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold">{item.qty}</span>
                                <button
                                  data-testid={`qty-plus-${item.itemKey}`}
                                  onClick={() => updateCartQty(item.itemKey, 1)}
                                  className="text-[#535766] hover:text-[#FF3F6C]"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Reseller Banner in Cart if active */}
                      {resellerMode && (
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center space-x-2 text-purple-800 font-bold text-xs">
                            <TrendingUp className="w-4 h-4" />
                            <span>Reseller Wholesale Earnings</span>
                          </div>
                          <div className="flex justify-between text-xs text-purple-700">
                            <span>Total Wholesale Margin:</span>
                            <span className="font-bold text-purple-900">₹{resellerTotalMargin}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Shipping & Address */}
                  {checkoutStep === 2 && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-[#282C3F]">Shipping Address</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-[#535766]">Full Name</label>
                          <input
                            data-testid="shipping-name-input"
                            type="text"
                            value={shippingDetails.name}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                            className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF3F6C]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#535766]">Phone Number</label>
                          <input
                            data-testid="shipping-phone-input"
                            type="text"
                            value={shippingDetails.phone}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                            className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF3F6C]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#535766]">Street Address</label>
                          <input
                            data-testid="shipping-address-input"
                            type="text"
                            value={shippingDetails.address}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                            className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF3F6C]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-[#535766]">City</label>
                            <input
                              type="text"
                              value={shippingDetails.city}
                              onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                              className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF3F6C]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[#535766]">Pincode</label>
                            <input
                              type="text"
                              value={shippingDetails.pincode}
                              onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value })}
                              className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF3F6C]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Reseller Margin Setup (If Reseller Mode is ON) */}
                  {checkoutStep === 3 && resellerMode && (
                    <div className="space-y-4">
                      <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl space-y-3">
                        <h4 className="font-bold text-xs text-purple-900 uppercase">Reseller Customer Details</h4>
                        <p className="text-xs text-purple-700">Enter your end-customer details for direct blind shipping with your profit margin.</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-[#535766]">Customer Name</label>
                          <input
                            data-testid="reseller-customer-name"
                            type="text"
                            placeholder="e.g. Sneha Gupta"
                            value={shippingDetails.resellerCustomerName}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, resellerCustomerName: e.target.value })}
                            className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#535766]">Customer Phone</label>
                          <input
                            type="text"
                            placeholder="Customer phone for delivery SMS"
                            value={shippingDetails.resellerCustomerPhone}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, resellerCustomerPhone: e.target.value })}
                            className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#535766]">Your Extra Margin Per Item (₹)</label>
                          <input
                            type="number"
                            value={shippingDetails.resellerExtraMargin}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, resellerExtraMargin: Number(e.target.value) })}
                            className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                          <p className="text-[11px] text-purple-700 mt-1 font-semibold">Total Margin Earnings: ₹{resellerTotalMargin + shippingDetails.resellerExtraMargin * cart.length}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && checkoutStep !== 4 && (
              <div className="p-6 border-t border-[#EAEAEC] bg-[#FAFAFC] space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#535766]">
                    <span>Bag Subtotal</span>
                    <span>₹{cartSubtotal}</span>
                  </div>
                  {resellerMode && (
                    <div className="flex justify-between text-xs text-purple-700 font-bold">
                      <span>Reseller Earnings</span>
                      <span>+₹{resellerTotalMargin}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-[#535766]">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-[#282C3F] pt-2 border-t border-[#EAEAEC]">
                    <span>Total Amount</span>
                    <span>₹{finalOrderTotal}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {checkoutStep > 1 && (
                    <button
                      onClick={() => setCheckoutStep(checkoutStep - 1)}
                      className="bg-gray-200 hover:bg-gray-300 text-[#282C3F] font-bold px-4 py-3 rounded-2xl text-xs transition"
                    >
                      Back
                    </button>
                  )}
                  <button
                    data-testid="checkout-proceed-btn"
                    onClick={() => {
                      if (checkoutStep === 1) {
                        setCheckoutStep(2);
                      } else if (checkoutStep === 2 && resellerMode) {
                        setCheckoutStep(3);
                      } else {
                        handlePlaceOrder();
                      }
                    }}
                    className="flex-1 bg-[#FF3F6C] hover:bg-[#E02E57] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-[#FF3F6C]/30 transition flex items-center justify-center space-x-2"
                  >
                    <span>{checkoutStep === 1 ? "Proceed to Address" : checkoutStep === 2 && resellerMode ? "Reseller Details" : "Place Order (COD/UPI)"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#282C3F] text-white mt-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF3F6C] to-[#FF905A] flex items-center justify-center text-white font-bold text-lg">
                L
              </div>
              <h2 className="text-lg font-black tracking-tight">LUMIÈRE & BAZAR</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              The ultimate fashion destination combining Myntra-grade trendsetting clothing, shoes, makeup & accessories with Meesho-style wholesale reseller margins.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4 text-[#FF905A]">Popular Categories</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="hover:text-[#FF3F6C] cursor-pointer" onClick={() => { setSelectedCategory("clothes"); setActiveTab("catalog"); }}>Clothing & Hoodies</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer" onClick={() => { setSelectedCategory("shoes"); setActiveTab("catalog"); }}>Sneakers & Footwear</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer" onClick={() => { setSelectedCategory("makeup"); setActiveTab("catalog"); }}>Makeup & Glow Kits</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer" onClick={() => { setSelectedCategory("accessories"); setActiveTab("catalog"); }}>Bags & Accessories</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4 text-[#FF905A]">Reseller Partner Program</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="hover:text-[#FF3F6C] cursor-pointer" onClick={() => setResellerMode(true)}>Start Reselling Today</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer">WhatsApp Catalogs</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer">Margin Calculator</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer">Blind Shipping Policy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4 text-[#FF905A]">Customer Experience</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="hover:text-[#FF3F6C] cursor-pointer">Track Your Order</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer">7-Day Returns & Exchanges</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer">Cash on Delivery Available</li>
              <li className="hover:text-[#FF3F6C] cursor-pointer">Customer Support 24/7</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 border-t border-gray-800 text-center text-xs text-gray-500">
          © 2026 Lumière & Bazar (Myntra x Meesho Hybrid). Built with high-fashion aesthetics & wholesale direct pricing.
        </div>
      </footer>
    </div>
  );
}
