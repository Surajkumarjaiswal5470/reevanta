import React, { useState, useEffect, useCallback } from "react";
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
  User as UserIcon,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  LogOut,
  LogIn,
  LayoutDashboard,
  Package,
  PlusCircle,
  Trash2,
  RefreshCw,
  MapPin,
  Home as HomeIcon,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_LOOKBOOKS } from "./mock";
import { SearchBar } from "./components/SearchBar";
import { AddressPicker } from "./components/AddressPicker";
import { OrderTimeline } from "./components/OrderTimeline";
import { AdminPanel } from "./components/AdminPanel";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
axios.defaults.withCredentials = true;

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // login or register
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  const [activeTab, setActiveTab] = useState("home"); // home, catalog, lookbooks, wishlist, orders, admin
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [resellerMode, setResellerMode] = useState(false);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [productsList, setProductsList] = useState(MOCK_PRODUCTS);
  const [orders, setOrders] = useState([]);

  // Address management
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Admin New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "clothes",
    brand: "",
    price: 999,
    originalPrice: 1999,
    image: "https://images.pexels.com/photos/1066171/pexels-photo-1066171.jpeg?auto=compress&tinysrgb&w=800",
    description: "",
    resellerMargin: 200,
    discountPercent: 50,
    sizes: "S, M, L, XL"
  });
  const [checkoutStep, setCheckoutStep] = useState(1);
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

  // Check auth on mount
  useEffect(() => {
    axios.get(`${API}/auth/me`)
      .then((res) => {
        setCurrentUser(res.data);
        setAuthLoading(false);
      })
      .catch(() => {
        setCurrentUser(null);
        setAuthLoading(false);
      });
  }, []);

  // Fetch backend products
  useEffect(() => {
    axios.get(`${API}/products`)
      .then((res) => {
        if (res.data && res.data.length > 0) setProductsList(res.data);
      })
      .catch(() => {});
  }, []);

  // Load user-specific data (addresses + orders) whenever user logs in
  const loadUserData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [addrRes, ordRes] = await Promise.all([
        axios.get(`${API}/addresses`),
        axios.get(`${API}/orders/mine`)
      ]);
      setAddresses(addrRes.data || []);
      setOrders(ordRes.data || []);
      const def = (addrRes.data || []).find((a) => a.isDefault) || (addrRes.data || [])[0];
      if (def) setSelectedAddressId(def.id);
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) loadUserData();
    else {
      setAddresses([]);
      setOrders([]);
    }
  }, [currentUser, loadUserData]);

  const fetchAdminData = () => {
    axios.get(`${API}/products`).then((res) => res.data && setProductsList(res.data)).catch(() => {});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/auth/login`, { email: authEmail, password: authPassword });
      setCurrentUser(res.data);
      setShowAuthModal(false);
      toast.success(`Welcome back, ${res.data.name}!`);
      setAuthEmail("");
      setAuthPassword("");
      if (res.data.role === "admin") {
        fetchAdminData();
      }
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/auth/register`, { email: authEmail, password: authPassword, name: authName });
      setCurrentUser(res.data);
      setShowAuthModal(false);
      toast.success(`Account created successfully! Welcome, ${res.data.name}`);
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      setCurrentUser(null);
      setActiveTab("home");
      toast.success("Logged out successfully");
    } catch (e) {
      setCurrentUser(null);
    }
  };

  // Add Product (Admin)
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        price: Number(newProduct.price),
        originalPrice: Number(newProduct.originalPrice),
        resellerMargin: Number(newProduct.resellerMargin),
        discountPercent: Number(newProduct.discountPercent),
        sizes: newProduct.sizes.split(",").map(s => s.trim()),
        colors: ["#282C3F", "#FF3F6C"],
        rating: 4.8,
        reviewsCount: 15,
        inStock: true
      };
      await axios.post(`${API}/products`, payload);
      toast.success("Product added successfully!");
      fetchAdminData();
      setNewProduct({
        name: "",
        category: "clothes",
        brand: "",
        price: 999,
        originalPrice: 1999,
        image: "https://images.pexels.com/photos/1066171/pexels-photo-1066171.jpeg?auto=compress&tinysrgb&w=800",
        description: "",
        resellerMargin: 200,
        discountPercent: 50,
        sizes: "S, M, L, XL"
      });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const handleDeleteProduct = async (prodId) => {
    try {
      await axios.delete(`${API}/products/${prodId}`);
      toast.success("Product deleted successfully");
      fetchAdminData();
    } catch (e) {
      toast.error("Failed to delete product");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchAdminData();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

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

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      toast.error("Please sign in to place an order");
      setAuthMode("login");
      setShowAuthModal(true);
      return;
    }
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (!addr) {
      toast.error("Please select or add a delivery address");
      return;
    }
    setPlacingOrder(true);
    try {
      const payload = {
        items: cart.map((c) => ({
          productId: c.id,
          name: c.name,
          price: c.price,
          qty: c.qty,
          image: c.image,
          selectedSize: c.selectedSize,
          selectedColor: c.selectedColor
        })),
        subtotal: cartSubtotal,
        shipping: 0,
        total: finalOrderTotal,
        address: addr,
        paymentMethod: "COD"
      };
      const res = await axios.post(`${API}/orders`, payload);
      setOrders((prev) => [res.data, ...prev]);
      setCart([]);
      setCheckoutStep(4);
      toast.success(`Order ${res.data.order_number} placed successfully!`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Address CRUD
  const saveAddress = async (addr) => {
    try {
      const res = await axios.post(`${API}/addresses`, addr);
      setAddresses((prev) => {
        const next = res.data.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev.slice();
        return [res.data, ...next];
      });
      setSelectedAddressId(res.data.id);
      setShowAddressForm(false);
      setEditingAddress(null);
      toast.success("Address saved!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to save address");
    }
  };

  const deleteAddress = async (id) => {
    try {
      await axios.delete(`${API}/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAddressId === id) setSelectedAddressId(null);
      toast.info("Address removed");
    } catch {
      toast.error("Failed to remove address");
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await axios.patch(`${API}/addresses/${id}/default`);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      setSelectedAddressId(id);
    } catch {
      toast.error("Failed to update default");
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    try {
      await axios.post(`${API}/orders/${orderId}/cancel`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "Cancelled" } : o)));
      toast.success("Order cancelled");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to cancel");
    }
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

  const filteredProducts = productsList.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const flashSaleItems = productsList.filter((p) => p.isFlashSale).slice(0, 4);

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
          <span className="cursor-pointer hover:text-[#FF3F6C]" onClick={() => setActiveTab("orders")}>Track Order</span>
          
          {/* Auth section in top bar */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <span className="text-[#FF905A] font-bold">Hi, {currentUser.name}</span>
              <button
                data-testid="logout-btn"
                onClick={handleLogout}
                className="hover:text-[#FF3F6C] flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              data-testid="open-auth-modal-btn"
              onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
              className="hover:text-[#FF3F6C] font-bold text-[#FF905A] flex items-center space-x-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAEAEC] px-3 sm:px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0 flex-shrink-0" onClick={() => setActiveTab("home")}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#FF3F6C] to-[#FF905A] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#FF3F6C]/20 flex-shrink-0">
              L
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-black tracking-tight bg-gradient-to-r from-[#FF3F6C] to-[#282C3F] bg-clip-text text-transparent whitespace-nowrap">
                LUMIÈRE & BAZAR
              </h1>
              <p className="text-[10px] text-[#535766] tracking-widest font-semibold uppercase">Myntra x Meesho Hub</p>
            </div>
            <span className="sm:hidden text-sm font-black bg-gradient-to-r from-[#FF3F6C] to-[#282C3F] bg-clip-text text-transparent whitespace-nowrap">LUMIÈRE</span>
          </div>

          {/* Search Bar (desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={(q) => {
                setSearchQuery(q);
                setActiveTab("catalog");
              }}
              onSelectProduct={(p) => {
                setQuickViewProduct(p);
              }}
            />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-5 flex-shrink-0">
            <button
              data-testid="nav-catalog-btn"
              onClick={() => setActiveTab("catalog")}
              className={`hidden sm:block text-sm font-semibold transition hover:text-[#FF3F6C] ${activeTab === "catalog" ? "text-[#FF3F6C]" : "text-[#282C3F]"}`}
            >
              Shop
            </button>
            <button
              data-testid="nav-orders-btn"
              onClick={() => {
                if (!currentUser) { setAuthMode("login"); setShowAuthModal(true); return; }
                setActiveTab("orders");
              }}
              className={`text-xs sm:text-sm font-semibold transition hover:text-[#FF3F6C] ${activeTab === "orders" ? "text-[#FF3F6C]" : "text-[#282C3F]"}`}
            >
              Orders
            </button>
            {currentUser?.role === "admin" && (
              <button
                data-testid="nav-admin-btn"
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1 text-xs sm:text-sm font-bold transition hover:text-[#FF3F6C] ${activeTab === "admin" ? "text-[#FF3F6C]" : "text-purple-700"}`}
              >
                <LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Mobile Login/Logout */}
            {!currentUser && (
              <button
                data-testid="mobile-login-btn"
                onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                className="md:hidden text-xs font-bold text-[#FF3F6C] flex items-center gap-1"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
            {currentUser && (
              <button
                data-testid="mobile-logout-btn"
                onClick={handleLogout}
                className="md:hidden text-xs font-bold text-[#282C3F]"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Reseller Mode Toggle Button */}
            <button
              data-testid="reseller-mode-toggle"
              onClick={() => {
                setResellerMode(!resellerMode);
                toast.success(resellerMode ? "Reseller mode disabled" : "Reseller wholesale mode activated!");
              }}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
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
              className="relative p-1.5 sm:p-2 text-[#282C3F] hover:text-[#FF3F6C] transition"
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
              className="relative flex items-center space-x-1.5 bg-[#FF3F6C] hover:bg-[#E02E57] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-md shadow-[#FF3F6C]/30 transition transform active:scale-95"
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

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 py-3 bg-white border-b border-[#EAEAEC]">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={(q) => { setSearchQuery(q); setActiveTab("catalog"); }}
          onSelectProduct={(p) => setQuickViewProduct(p)}
        />
      </div>

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
                {flashSaleItems.map((product) => (
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
            <div className="bg-white p-6 rounded-3xl border border-[#EAEAEC] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-2xl font-black text-[#282C3F]">My Orders</h2>
                <p className="text-xs text-[#535766]">Track your ongoing and past deliveries</p>
              </div>
              <button
                data-testid="orders-refresh-btn"
                onClick={loadUserData}
                className="flex items-center gap-1.5 bg-[#282C3F] text-white text-xs font-bold px-4 py-2 rounded-full"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {!currentUser ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#EAEAEC] space-y-4">
                <UserIcon className="w-14 h-14 text-gray-300 mx-auto" />
                <h3 className="text-lg font-bold text-[#282C3F]">Sign in to see your orders</h3>
                <button
                  onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                  className="bg-[#FF3F6C] text-white px-6 py-2.5 rounded-full text-xs font-bold"
                >
                  Sign in / Register
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#EAEAEC] space-y-4">
                <Package className="w-14 h-14 text-gray-300 mx-auto" />
                <h3 className="text-lg font-bold text-[#282C3F]">No orders yet</h3>
                <p className="text-xs text-[#535766]">Add items to your bag and place your first order.</p>
                <button
                  onClick={() => setActiveTab("catalog")}
                  className="bg-[#FF3F6C] text-white px-6 py-2.5 rounded-full text-xs font-bold"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} data-testid={`order-card-${ord.id}`} className="bg-white rounded-3xl p-6 border border-[#EAEAEC] shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#EAEAEC] pb-4 gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#FF3F6C] bg-[#FF3F6C]/10 px-3 py-1 rounded-full">
                          {ord.order_number || ord.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-[#535766] ml-3">
                          Placed {ord.placed_at ? new Date(ord.placed_at).toLocaleString() : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${ord.status === "Delivered" ? "bg-emerald-500" : ord.status === "Cancelled" ? "bg-red-500" : "bg-amber-500 animate-pulse"}`}></span>
                          <span className="text-xs font-bold text-[#282C3F]">{ord.status}</span>
                        </div>
                        {!["Shipped", "Out for Delivery", "Delivered", "Cancelled"].includes(ord.status) && (
                          <button
                            data-testid={`cancel-order-${ord.id}`}
                            onClick={() => cancelOrder(ord.id)}
                            className="text-[10px] font-bold text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    <OrderTimeline status={ord.status} timeline={ord.timeline} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#535766]">Items</div>
                        {(ord.items || []).map((it, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs">
                            {it.image && <img src={it.image} alt={it.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[#282C3F] line-clamp-1">{it.name}</div>
                              <div className="text-[10px] text-[#535766]">Qty {it.qty} · {it.selectedSize || ""}</div>
                            </div>
                            <div className="font-bold text-[#282C3F]">₹{it.price * it.qty}</div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#535766]">Delivery to</div>
                        {ord.address ? (
                          <div className="bg-[#FAFAFC] rounded-2xl p-3 border border-[#EAEAEC] leading-relaxed">
                            <div className="font-bold text-[#282C3F]">{ord.address.fullName}</div>
                            <div className="text-[#535766]">
                              {ord.address.line1}{ord.address.line2 ? `, ${ord.address.line2}` : ""}, {ord.address.city}, {ord.address.state} {ord.address.pincode}
                            </div>
                            <div className="text-[#535766]">📞 {ord.address.phone}</div>
                          </div>
                        ) : (
                          <div className="text-[#535766]">Address on file</div>
                        )}
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[#535766]">Payment</span>
                          <strong className="text-[#282C3F]">{ord.paymentMethod || "COD"}</strong>
                        </div>
                        <div className="flex justify-between items-center text-base font-black text-[#282C3F] pt-2 border-t border-[#EAEAEC]">
                          <span>Total</span>
                          <span>₹{ord.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN VIEW */}
        {activeTab === "admin" && currentUser?.role === "admin" && (
          <AdminPanel />
        )}
      </main>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div data-testid="auth-modal" className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 space-y-6">
            <button
              data-testid="close-auth-modal-btn"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#282C3F] hover:bg-[#FF3F6C] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FF3F6C] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#FF3F6C]/30 font-bold text-xl">
                L
              </div>
              <h3 className="text-2xl font-black text-[#282C3F]">
                {authMode === "login" ? "Welcome Back" : "Create Account"}
              </h3>
              <p className="text-xs text-[#535766]">
                {authMode === "login" ? "Sign in to manage orders & wishlist" : "Join Lumière & Bazar for exclusive wholesale pricing"}
              </p>
            </div>

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="text-xs font-bold text-[#535766]">Full Name</label>
                  <input
                    data-testid="auth-name-input"
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF3F6C]"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-[#535766]">Email Address</label>
                <input
                  data-testid="auth-email-input"
                  type="email"
                  required
                  placeholder="e.g. admin@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF3F6C]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#535766]">Password</label>
                <input
                  data-testid="auth-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF3F6C]"
                />
              </div>

              <button
                data-testid="auth-submit-btn"
                type="submit"
                className="w-full bg-[#FF3F6C] hover:bg-[#E02E57] text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-[#FF3F6C]/30 transition"
              >
                {authMode === "login" ? "Sign In" : "Register Now"}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-[#EAEAEC]">
              {authMode === "login" ? (
                <p className="text-xs text-[#535766]">
                  Don't have an account?{" "}
                  <button
                    data-testid="switch-to-register-btn"
                    onClick={() => setAuthMode("register")}
                    className="text-[#FF3F6C] font-bold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p className="text-xs text-[#535766]">
                  Already have an account?{" "}
                  <button
                    data-testid="switch-to-login-btn"
                    onClick={() => setAuthMode("login")}
                    className="text-[#FF3F6C] font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
                      {!currentUser ? (
                        <div className="text-center py-12 space-y-4">
                          <MapPin className="w-12 h-12 text-[#FF3F6C] mx-auto" />
                          <h4 className="font-bold text-base text-[#282C3F]">Sign in to continue</h4>
                          <p className="text-xs text-[#535766]">Login to save delivery addresses & place orders.</p>
                          <button
                            data-testid="signin-to-checkout-btn"
                            onClick={() => { setIsCartOpen(false); setAuthMode("login"); setShowAuthModal(true); }}
                            className="bg-[#FF3F6C] text-white px-6 py-2.5 rounded-full text-xs font-bold"
                          >
                            Sign in / Register
                          </button>
                        </div>
                      ) : showAddressForm ? (
                        <div>
                          <h4 className="font-bold text-sm text-[#282C3F] mb-3">
                            {editingAddress ? "Edit Address" : "Add New Address"}
                          </h4>
                          <AddressPicker
                            initialAddress={editingAddress}
                            onSave={saveAddress}
                            onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-[#282C3F]">Select Delivery Address</h4>
                            <button
                              data-testid="add-new-address-btn"
                              onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
                              className="text-xs font-bold text-[#FF3F6C] flex items-center gap-1 hover:underline"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add New Address
                            </button>
                          </div>
                          {addresses.length === 0 ? (
                            <div className="text-center py-8 bg-[#FAFAFC] rounded-2xl border border-dashed border-[#EAEAEC]">
                              <MapPin className="w-10 h-10 text-gray-300 mx-auto" />
                              <p className="text-xs text-[#535766] mt-2">No addresses yet.</p>
                              <button
                                onClick={() => setShowAddressForm(true)}
                                className="mt-3 bg-[#FF3F6C] text-white px-5 py-2 rounded-full text-xs font-bold"
                              >
                                Add your first address
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {addresses.map((a) => (
                                <label
                                  key={a.id}
                                  data-testid={`address-option-${a.id}`}
                                  className={`block p-3 rounded-2xl border-2 cursor-pointer transition ${
                                    selectedAddressId === a.id
                                      ? "border-[#FF3F6C] bg-[#FFF0F3]"
                                      : "border-[#EAEAEC] bg-white hover:border-[#FF3F6C]/50"
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="radio"
                                      name="selectedAddr"
                                      checked={selectedAddressId === a.id}
                                      onChange={() => setSelectedAddressId(a.id)}
                                      className="mt-1 accent-[#FF3F6C]"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-black text-[#282C3F]">{a.fullName}</span>
                                        <span className="text-[10px] font-bold uppercase bg-[#282C3F] text-white px-1.5 py-0.5 rounded">
                                          {a.label}
                                        </span>
                                        {a.isDefault && (
                                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                            Default
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-[#535766] mt-1 leading-relaxed">
                                        {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                                      </div>
                                      <div className="text-[11px] text-[#535766]">📞 {a.phone}</div>
                                      <div className="flex gap-3 mt-2">
                                        {!a.isDefault && (
                                          <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setDefaultAddress(a.id); }}
                                            className="text-[10px] font-bold text-[#FF3F6C] hover:underline"
                                          >
                                            Set default
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); deleteAddress(a.id); }}
                                          className="text-[10px] font-bold text-red-500 hover:underline"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
                    disabled={placingOrder || (checkoutStep === 2 && !showAddressForm && currentUser && !selectedAddressId)}
                    onClick={() => {
                      if (checkoutStep === 1) {
                        setCheckoutStep(2);
                      } else if (checkoutStep === 2) {
                        if (!currentUser) {
                          setIsCartOpen(false);
                          setAuthMode("login");
                          setShowAuthModal(true);
                          return;
                        }
                        if (showAddressForm) {
                          toast.info("Finish saving the address first, or cancel to pick a saved one.");
                          return;
                        }
                        if (!selectedAddressId) {
                          toast.error("Please select or add a delivery address");
                          return;
                        }
                        if (resellerMode) setCheckoutStep(3);
                        else handlePlaceOrder();
                      } else {
                        handlePlaceOrder();
                      }
                    }}
                    className="flex-1 bg-[#FF3F6C] hover:bg-[#E02E57] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-[#FF3F6C]/30 transition flex items-center justify-center space-x-2"
                  >
                    <span>
                      {placingOrder
                        ? "Placing order..."
                        : checkoutStep === 1
                        ? "Proceed to Address"
                        : checkoutStep === 2 && resellerMode
                        ? "Reseller Details"
                        : "Place Order (Cash on Delivery)"}
                    </span>
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
