import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { Toaster, toast } from "sonner";
import { apiFetch } from "./services/api";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { Navbar } from "./components/Navbar";
import { ProductCard } from "./components/ProductCard";
import { QuickViewModal } from "./components/QuickViewModal";
import { AuthModal } from "./components/AuthModal";
import { CartDrawer } from "./components/CartDrawer";
import { Footer } from "./components/Footer";
import { MOCK_PRODUCTS, MOCK_LOOKBOOKS } from "./mock";

// ---------------------------------------------------------------------------
// Code-split routes. Only the shell (Navbar, CartDrawer, AuthModal, Footer)
// and the landing page ship in the main bundle; everything else is loaded
// on demand. This meaningfully cuts first-load JS on production builds.
// ---------------------------------------------------------------------------
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const CatalogPage = lazy(() =>
  import("./pages/CatalogPage").then((m) => ({ default: m.CatalogPage }))
);
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then((m) => ({ default: m.OrdersPage }))
);
const ShippingPage = lazy(() =>
  import("./pages/ShippingPage").then((m) => ({ default: m.ShippingPage }))
);
const ReturnsPage = lazy(() =>
  import("./pages/ReturnsPage").then((m) => ({ default: m.ReturnsPage }))
);
const ResellerPage = lazy(() =>
  import("./pages/ResellerPage").then((m) => ({ default: m.ResellerPage }))
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import("./pages/ContactPage").then((m) => ({ default: m.ContactPage }))
);

// ---------------------------------------------------------------------------
// Route <-> legacy "activeTab" mapping.
// Keeps Navbar's existing `activeTab` / `setActiveTab` contract working
// while giving the app real, shareable, back-button-safe URLs.
// ---------------------------------------------------------------------------
const TAB_TO_PATH = {
  home: "/",
  catalog: "/catalog",
  lookbooks: "/lookbooks",
  wishlist: "/wishlist",
  orders: "/orders",
  shipping: "/shipping",
  returns: "/returns",
  "reseller-faq": "/reseller-faq",
  about: "/about",
  contact: "/contact",
  admin: "/admin",
};
const PATH_TO_TAB = Object.fromEntries(
  Object.entries(TAB_TO_PATH).map(([tab, path]) => [path, tab])
);

// SEO: per-route title/description. Keeps this file dependency-free
// (no react-helmet) while still giving every route a distinct <title>.
const ROUTE_META = {
  home: { title: "Home", description: "Discover curated ethnic apparel and luxury beauty." },
  catalog: { title: "Catalog", description: "Browse our full collection of ethnic apparel." },
  lookbooks: { title: "Lookbooks", description: "Complete ensembles curated by celebrity stylists." },
  wishlist: { title: "Wishlist", description: "Your saved favorites." },
  orders: { title: "My Orders", description: "Track and review your orders." },
  shipping: { title: "Shipping Info", description: "Shipping rates and delivery timelines." },
  returns: { title: "Returns & Exchanges", description: "Our returns and exchange policy." },
  "reseller-faq": { title: "Reseller FAQ", description: "Information for resellers and bulk buyers." },
  about: { title: "About Us", description: "Learn about our story and mission." },
  contact: { title: "Contact Us", description: "Get in touch with our support team." },
  admin: { title: "Store Management", description: "Admin dashboard." },
};
const SITE_NAME = "Your Store";

function useDocumentMeta(tab) {
  useEffect(() => {
    const meta = ROUTE_META[tab] ?? ROUTE_META.home;
    document.title = `${meta.title} · ${SITE_NAME}`;

    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", meta.description);
  }, [tab]);
}

// ---------------------------------------------------------------------------
// Error boundary. Class component is required here — there is no hooks
// equivalent for catching render-time errors in descendants.
// ---------------------------------------------------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Wire this up to your error-tracking service (Sentry, etc.) in production.
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4 p-8"
        >
          <div className="text-3xl" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-black text-[#2D2118]">Something went wrong</h2>
          <p className="text-xs text-gray-500 max-w-sm">
            We hit an unexpected error rendering this page. You can try again, or head back home.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              Try again
            </button>
            <a
              href="/"
              className="border border-[#E8DFC9] text-[#2D2118] px-4 py-2 rounded-xl text-xs font-bold"
            >
              Go home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Route-level loading fallback (used by Suspense while a lazy page loads).
function PageLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-[40vh] flex flex-col items-center justify-center gap-3 py-16"
    >
      <div className="h-8 w-8 rounded-full border-2 border-[#E8DFC9] border-t-[#5C1E1E] animate-spin" />
      <span className="text-xs text-gray-500">Loading…</span>
    </div>
  );
}

// Product-fetch state machine used by the data-loading hook below.
function ProductLoadError({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="bg-white border border-[#E8DFC9] rounded-2xl p-4 mb-6 flex items-center justify-between gap-4"
    >
      <p className="text-xs text-[#5C1E1E]">
        Couldn't load the latest products ({message}). Showing cached items instead.
      </p>
      <button
        onClick={onRetry}
        className="shrink-0 text-xs font-bold underline text-[#2D2118]"
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Loads /products with abort-on-unmount, retry, and a visible error state
 * instead of silently swallowing failures (the original `.catch(() => {})`).
 */
function useProducts() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    apiFetch("/products", { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (Array.isArray(data) && data.length > 0) setProducts(data);
        setStatus("success");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(err?.message || "network error");
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { products, status, error, retry };
}

// ---------------------------------------------------------------------------
// Admin gate. Client-side role check is UX-only — the real authorization
// must be enforced by the API on every admin endpoint. This just avoids
// flashing privileged UI and no longer echoes a valid admin email.
// ---------------------------------------------------------------------------
function RequireAdmin({ children }) {
  const { currentUser } = useAuth();

  if (currentUser === undefined) {
    // Auth state still resolving (e.g. session check in flight).
    return <PageLoadingSkeleton />;
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-[#E8DFC9] space-y-4 max-w-md mx-auto my-12 p-8">
        <div className="text-3xl" aria-hidden="true">🔒</div>
        <h2 className="text-xl font-black text-[#2D2118]">Admin Privileges Required</h2>
        <p className="text-xs text-gray-500">
          Sign in with an administrator account to access store management.
        </p>
      </div>
    );
  }

  return children;
}

function WishlistPage({ onNavigate }) {
  const { wishlist } = useCart();

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-[#FAF5EC] border border-[#E8DFC9] p-6 rounded-3xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#2D2118]">My Saved Wishlist</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Your favorite ethnic apparel and luxury beauty picks.
          </p>
        </div>
        <span className="bg-[#5C1E1E] text-white text-xs font-bold px-3 py-1 rounded-full">
          {wishlist.length} Items
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] space-y-3">
          <div className="text-3xl" aria-hidden="true">❤️</div>
          <h3 className="font-bold text-[#2D2118]">Your wishlist is empty</h3>
          <p className="text-xs text-gray-500">
            Explore our catalog and click the heart icon to save products.
          </p>
          <button
            onClick={() => onNavigate("catalog")}
            className="bg-[#2D2118] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((prod) => (
            <ProductCard key={prod.id} product={prod} onQuickView={() => { }} />
          ))}
        </div>
      )}
    </div>
  );
}

function LookbooksPage({ onNavigate }) {
  return (
    <div className="space-y-8 pb-16">
      <div className="bg-[#2D2118] text-white p-8 rounded-3xl space-y-2">
        <h1 className="text-3xl font-black text-[#FAF5EC]">Curated Designer Lookbooks</h1>
        <p className="text-xs text-gray-300">
          Complete ethnic ensembles curated by celebrity stylists.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_LOOKBOOKS.map((lb) => (
          <div
            key={lb.id}
            className="bg-white rounded-3xl overflow-hidden border border-[#E8DFC9] shadow-sm"
          >
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src={lb.image}
                alt={lb.title}
                loading="lazy"
                decoding="async"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 space-y-2">
              <h3 className="font-bold text-lg text-[#2D2118]">{lb.title}</h3>
              <p className="text-xs text-gray-600">{lb.description}</p>
              <button
                onClick={() => onNavigate("catalog")}
                className="mt-4 w-full bg-[#5C1E1E] text-white py-2.5 rounded-xl text-xs font-bold"
              >
                Shop Lookbook Items
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotFoundPage({ onNavigate }) {
  return (
    <div className="text-center py-24 space-y-4" role="alert">
      <h1 className="text-2xl font-black text-[#2D2118]">Page not found</h1>
      <p className="text-xs text-gray-500">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => onNavigate("home")}
        className="bg-[#2D2118] text-white px-4 py-2 rounded-xl text-xs font-bold"
      >
        Back home
      </button>
    </div>
  );
}

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const activeTab = PATH_TO_TAB[location.pathname] ?? "home";
  const selectedCategory = searchParams.get("category") ?? "all";

  const { products: productsList, status, error, retry } = useProducts();

  useDocumentMeta(activeTab);

  // Preserved for components (Navbar, Footer) that call setActiveTab("x")
  // directly — now translates to real navigation.
  const setActiveTab = useCallback(
    (tab) => {
      const path = TAB_TO_PATH[tab] ?? "/";
      navigate(path);
    },
    [navigate]
  );

  const setSelectedCategory = useCallback(
    (catId) => {
      setSearchParams(catId && catId !== "all" ? { category: catId } : {});
    },
    [setSearchParams]
  );

  const openQuickView = useCallback((prod) => setQuickViewProduct(prod), []);
  const closeQuickView = useCallback(() => setQuickViewProduct(null), []);

  const handleCategorySelectAndBrowse = useCallback(
    (catId) => {
      setSelectedCategory(catId);
      navigate("/catalog");
    },
    [setSelectedCategory, navigate]
  );

  return (
    <div className="min-h-screen bg-[#FAF5EC] text-[#2D2118] font-sans antialiased flex flex-col">
      {/* Skip link: first focusable element, visually hidden until focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-[#2D2118] focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-xs focus:font-bold"
      >
        Skip to main content
      </a>

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProduct={openQuickView}
        onCategorySelect={handleCategorySelectAndBrowse}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8 outline-none"
      >
        {status === "error" && <ProductLoadError message={error} onRetry={retry} />}

        <ErrorBoundary key={location.pathname} onReset={retry}>
          <Suspense fallback={<PageLoadingSkeleton />}>
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    products={productsList}
                    onCategorySelect={handleCategorySelectAndBrowse}
                    onQuickView={openQuickView}
                    onNavigate={setActiveTab}
                  />
                }
              />
              <Route
                path="/catalog"
                element={
                  <CatalogPage
                    products={productsList}
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                    onQuickView={openQuickView}
                  />
                }
              />
              <Route path="/wishlist" element={<WishlistPage onNavigate={setActiveTab} />} />
              <Route path="/orders" element={currentUser ? <OrdersPage /> : <Navigate to="/" replace />} />
              <Route path="/shipping" element={<ShippingPage onNavigate={setActiveTab} />} />
              <Route path="/returns" element={<ReturnsPage onNavigate={setActiveTab} />} />
              <Route path="/reseller-faq" element={<ResellerPage onNavigate={setActiveTab} />} />
              <Route path="/about" element={<AboutPage onNavigate={setActiveTab} />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />
              {/* Legacy bookmarks / typos fall back gracefully instead of 404ing hard */}
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage onNavigate={setActiveTab} />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>

        {activeTab !== "home" && activeTab !== "admin" && <Footer onNavigate={setActiveTab} />}
      </main>

      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={closeQuickView} />
      )}

      <AuthModal />
      <CartDrawer onOrderPlaced={() => setActiveTab("orders")} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" richColors />
          <ErrorBoundary>
            <MainLayout />
          </ErrorBoundary>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}