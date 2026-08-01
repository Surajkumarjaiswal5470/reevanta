import React, { useEffect, useState } from "react";
import {
  Sparkles, ShoppingBag, Heart, User as UserIcon, LogOut, Menu, X,
  Home, LayoutGrid, Gem, Package, Info, Phone, ChevronRight,
  Zap, Search, Share2, ArrowLeft
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { SearchBar } from "./SearchBar";
import { CategorySlider } from "./CategorySlider";

const NAV_TABS = [
  { id: "home", label: "Home", icon: Home, desc: "Back to homepage" },
  { id: "catalog", label: "Catalog", icon: LayoutGrid, desc: "Browse all products" },
  { id: "lookbooks", label: "Curated Sets", icon: Gem, desc: "Handpicked collections" },
  { id: "orders", label: "My Orders", icon: Package, desc: "Track your purchases" },
  { id: "about", label: "About Us", icon: Info, desc: "Our story & vision" },
  { id: "contact", label: "Contact Us", icon: Phone, desc: "Get in touch" },
];

const BOTTOM_TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "catalog", label: "Categories", icon: LayoutGrid },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "orders", label: "Orders", icon: Package },
  { id: "profile", label: "Profile", icon: UserIcon },
];

export function Navbar({ activeTab, setActiveTab, onOpenProduct, onCategorySelect }) {
  const { currentUser, setShowAuthModal, logout } = useAuth();
  const { cart, wishlist, setIsCartOpen, resellerMode, setResellerMode } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowMobileSearch(false);
  }, [activeTab]);

  const goTo = (tabId) => {
    if (tabId === "profile") {
      if (currentUser) {
        setActiveTab("orders");
      } else {
        setShowAuthModal(true);
      }
    } else {
      setActiveTab(tabId);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════ */}
      {/*  TOP HEADER BAR                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#FAF5EC]/95 backdrop-blur-md border-b border-[#E8DFC9]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Mobile Top Bar ── */}
          <div className="flex lg:hidden items-center justify-between h-14">

            {/* Left: Hamburger */}
            <button
              data-testid="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[#2D2118] hover:bg-[#E8DFC9]/40 transition active:scale-90 -ml-1"
              type="button"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Center: Brand Name */}
            <button
              onClick={() => goTo("home")}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5"
            >
              <span className="rivaanta-mark text-[17px] text-[#2D2118] tracking-[0.3em]">
                RIVAANTA
              </span>
            </button>

            {/* Right: Wishlist + Cart */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-[#2D2118] hover:bg-[#E8DFC9]/40 transition"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={() => goTo("wishlist")}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#2D2118] hover:bg-[#E8DFC9]/40 transition"
              >
                <Heart className="w-[18px] h-[18px]" />
                {wishlist.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#5C1E1E] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button
                data-testid="cart-icon-btn"
                onClick={() => setIsCartOpen(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#2D2118] hover:bg-[#E8DFC9]/40 transition"
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-0.5 right-0 w-4 h-4 bg-[#5C1E1E] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Desktop Top Bar ── */}
          <div className="hidden lg:flex items-center justify-between h-20 gap-4">

            {/* Left: Logo */}
            <div
              onClick={() => goTo("home")}
              className="cursor-pointer flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#5C1E1E] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="rivaanta-mark text-xl text-[#2D2118] block leading-none">
                  RIVAANTA
                </span>
                <span className="text-[10px] font-bold tracking-widest text-[#8B7355] uppercase block mt-0.5">
                  Luxury Ethnic Wear
                </span>
              </div>
            </div>

            {/* Center: Nav Links */}
            <nav className="flex items-center space-x-1">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => goTo(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === tab.id
                    ? "bg-[#2D2118] text-white shadow-sm"
                    : "text-gray-700 hover:text-[#5C1E1E] hover:bg-[#E8DFC9]/40"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right: Search + Icons */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-56">
                <SearchBar onSelectProduct={onOpenProduct} />
              </div>

              {/* Reseller Mode Toggle */}
              <button
                onClick={() => setResellerMode(!resellerMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border ${resellerMode
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#2D2118]"
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${resellerMode ? "bg-white animate-pulse" : "bg-emerald-500"}`} />
                <span>{resellerMode ? "Reseller" : "Reseller"}</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={() => goTo("wishlist")}
                className="relative p-2.5 rounded-2xl bg-white border border-[#E8DFC9] text-gray-700 hover:text-[#5C1E1E] transition shadow-sm"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#5C1E1E] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button
                data-testid="cart-icon-btn-desktop"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-2xl bg-[#2D2118] text-white hover:bg-[#5C1E1E] transition shadow-md flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="bg-[#5C1E1E] text-white text-[11px] font-black px-1.5 py-0.5 rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* User Auth */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goTo("orders")}
                    className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-[#E8DFC9] text-[#2D2118] text-xs font-bold shadow-sm"
                  >
                    <UserIcon className="w-4 h-4 text-[#8B7355]" />
                    <span className="line-clamp-1">{currentUser.name || "Account"}</span>
                  </button>
                  <button onClick={logout} title="Logout" className="p-2 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  data-testid="login-btn"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Category Bar attached to Header with 0 Gap ── */}
        {activeTab === "home" && (
          <div className="border-t border-[#E8DFC9]/60 bg-[#FAF5EC] py-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <CategorySlider onCategorySelect={onCategorySelect} onNavigate={setActiveTab} />
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  MOBILE BOTTOM TAB BAR                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E8DFC9] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-[60px] px-2 max-w-lg mx-auto">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              (tab.id === "profile" && (activeTab === "orders" || activeTab === "profile")) ||
              (tab.id !== "profile" && activeTab === tab.id);
            const badgeCount =
              tab.id === "wishlist" ? wishlist.length :
              tab.id === "orders" && cartItemsCount > 0 ? cartItemsCount : 0;

            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all duration-200 relative ${
                  isActive ? "text-[#5C1E1E]" : "text-[#8B7355]/70"
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-0.5 w-1 h-1 rounded-full bg-[#5C1E1E]" />
                )}
                <span className="relative">
                  <Icon
                    className={`w-[22px] h-[22px] transition-all duration-200 ${
                      isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                    }`}
                    fill={isActive && tab.id === "wishlist" ? "#5C1E1E" : "none"}
                  />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-[#5C1E1E] text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-sm">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] leading-none font-semibold transition-all duration-200 ${
                  isActive ? "font-bold text-[#5C1E1E]" : ""
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Safe area spacer for phones with home indicator */}
        <div className="h-[env(safe-area-inset-bottom,0px)] bg-white" />
      </nav>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  PREMIUM MOBILE DRAWER                             */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in Drawer */}
      <div
        id="mobile-menu-panel"
        data-testid="mobile-menu-panel"
        className={`fixed top-0 left-0 bottom-0 z-[70] w-[82vw] max-w-[340px] bg-gradient-to-b from-[#FAF5EC] via-white to-[#FAF5EC] shadow-2xl lg:hidden transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-gradient-to-br from-[#5C1E1E]/15 to-[#B8956A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-gradient-to-br from-[#B8956A]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative h-full flex flex-col overflow-y-auto scrollbar-none">

          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 pb-4 border-b border-[#E8DFC9]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5C1E1E] to-[#8B3A3A] flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="rivaanta-mark text-base text-[#2D2118] block leading-none">
                  RIVAANTA
                </span>
                <span className="text-[8px] font-bold tracking-[0.2em] text-[#B8956A] uppercase block mt-0.5">
                  Luxury Ethnic Wear
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 rounded-xl bg-[#E8DFC9]/40 flex items-center justify-center text-[#2D2118] hover:bg-[#E8DFC9] transition active:scale-90"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Card */}
          {currentUser ? (
            <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#2D2118] to-[#3D2E22] text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5 text-[#B8956A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{currentUser.name || "User"}</p>
                  <p className="text-[10px] text-white/50 truncate">{currentUser.email || currentUser.phone || ""}</p>
                </div>
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-300" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-4 mt-4">
              <button
                onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#5C1E1E] to-[#7A2E2E] text-white shadow-lg active:scale-[0.98] transition"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Sign In / Register</p>
                  <p className="text-[10px] text-white/50">Access orders, wishlist & more</p>
                </div>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4">
            <p className="px-4 mb-2 text-[9px] font-bold tracking-[0.2em] uppercase text-[#8B7355]/60">
              Browse
            </p>
            <div className="space-y-0.5">
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => goTo(tab.id)}
                    className={`w-full group flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#2D2118] to-[#3D2E22] text-white shadow-lg shadow-[#2D2118]/15"
                        : "text-[#2D2118] hover:bg-[#E8DFC9]/40 active:scale-[0.98]"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-[#E8DFC9]/40 text-[#8B7355] group-hover:bg-[#5C1E1E]/10 group-hover:text-[#5C1E1E]"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[13px] font-bold block ${isActive ? "text-white" : ""}`}>
                        {tab.label}
                      </span>
                      <span className={`text-[9px] block ${isActive ? "text-white/50" : "text-[#8B7355]/60"}`}>
                        {tab.desc}
                      </span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition ${
                      isActive ? "text-white/30" : "text-[#E8DFC9] group-hover:text-[#8B7355] group-hover:translate-x-0.5"
                    }`} />
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 space-y-3 border-t border-[#E8DFC9]/40 mt-auto">
            {/* Reseller toggle */}
            <button
              onClick={() => setResellerMode(!resellerMode)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition border ${
                resellerMode
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/15"
                  : "bg-white text-[#2D2118] border-[#E8DFC9] hover:border-emerald-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${resellerMode ? "text-white" : "text-emerald-500"}`} />
                <span>{resellerMode ? "Reseller Active" : "Reseller Mode"}</span>
              </span>
              <div className={`w-8 h-[18px] rounded-full p-0.5 transition-all duration-300 ${resellerMode ? "bg-white/30" : "bg-gray-200"}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 ${resellerMode ? "translate-x-3.5" : "translate-x-0"}`} />
              </div>
            </button>
            <p className="text-center text-[8px] text-[#8B7355]/40 font-medium tracking-wider">
              RIVAANTA © 2026 · Luxury Redefined
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  FULL-SCREEN MOBILE SEARCH OVERLAY                 */}
      {/* ═══════════════════════════════════════════════════ */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-[80] bg-[#FAF5EC] lg:hidden flex flex-col">
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8DFC9]">
            <button
              onClick={() => setShowMobileSearch(false)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[#2D2118] hover:bg-[#E8DFC9]/40 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <SearchBar
                onSelectProduct={(p) => {
                  onOpenProduct(p);
                  setShowMobileSearch(false);
                }}
              />
            </div>
          </div>
          {/* Trending / Quick Links */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B7355]/60 mb-3">
              Trending Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {["Sarees", "Kurtas", "Lehenga", "Lipstick", "Jewelry", "Sherwanis"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setShowMobileSearch(false);
                  }}
                  className="px-4 py-2 rounded-full bg-white border border-[#E8DFC9] text-xs font-bold text-[#2D2118] hover:bg-[#E8DFC9]/40 transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer so content doesn't hide behind bottom tab bar on mobile */}
      <div className="lg:hidden h-[60px]" />
    </>
  );
}