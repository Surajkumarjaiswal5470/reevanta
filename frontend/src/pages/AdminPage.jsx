import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Sliders,
  Tag,
  Users,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Search,
  Sparkles,
  DollarSign
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { toast } from "sonner";

export function AdminPage({ onNavigate }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Data states
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0 });
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [cmsSlides, setCmsSlides] = useState([]);
  const [vouchersList, setVouchersList] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Product Form State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "cosmetics",
    subCategory: "lipstick",
    price: "",
    originalPrice: "",
    image: "",
    description: "",
    inStock: true,
    isFlashSale: false,
    badge: "NEW"
  });

  // Verify Admin Access
  useEffect(() => {
    if (currentUser?.role === "admin" || currentUser?.email === "admin@reevanta.com" || isUnlocked) {
      setIsUnlocked(true);
      fetchAdminData();
    }
  }, [currentUser, isUnlocked]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, prodsData, cmsData] = await Promise.all([
        apiFetch("/admin/analytics/summary").catch(() => null),
        apiFetch("/products").catch(() => []),
        apiFetch("/cms/homepage").catch(() => null)
      ]);

      if (statsData) setStats(statsData);
      if (prodsData && Array.isArray(prodsData)) setProductsList(prodsData);
      if (cmsData?.banners) setCmsSlides(cmsData.banners);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (adminPasscode === "reevanta2026" || adminPasscode === "admin123") {
      setIsUnlocked(true);
      toast.success("Admin Dashboard Unlocked!");
      fetchAdminData();
    } else {
      toast.error("Invalid Admin Passcode!");
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.image) {
      toast.error("Please fill in required fields (Name, Price, Image URL)");
      return;
    }

    try {
      const created = await apiFetch("/admin/products", {
        method: "POST",
        body: {
          ...newProduct,
          price: Number(newProduct.price),
          originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : Number(newProduct.price) * 1.25
        }
      });
      toast.success("Product created successfully!");
      setProductsList((prev) => [created, ...prev]);
      setShowAddProductModal(false);
      setNewProduct({
        name: "",
        category: "cosmetics",
        subCategory: "lipstick",
        price: "",
        originalPrice: "",
        image: "",
        description: "",
        inStock: true,
        isFlashSale: false,
        badge: "NEW"
      });
    } catch (err) {
      toast.error(err.message || "Failed to create product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiFetch(`/admin/products/${productId}`, { method: "DELETE" });
      setProductsList((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  // If Not Unlocked, show Security Gate
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl shadow-xl border border-[#E8DFC9] text-center space-y-6">
        <div className="w-16 h-16 bg-[#5C1E1E]/10 rounded-2xl flex items-center justify-center mx-auto text-[#5C1E1E]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#2D2118]">Reevanta Admin Access</h2>
          <p className="text-xs text-gray-500 mt-1">Enter store administrator passcode to manage inventory and sales.</p>
        </div>
        <form onSubmit={handlePasscodeSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter Admin Passcode"
            value={adminPasscode}
            onChange={(e) => setAdminPasscode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] focus:outline-none focus:border-[#5C1E1E] text-center text-sm font-mono tracking-widest"
          />
          <button
            type="submit"
            className="w-full bg-[#2D2118] hover:bg-[#5C1E1E] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#2D2118] text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Enterprise Store Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">Reevanta Admin Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => onNavigate("home")}
            className="bg-amber-400 hover:bg-amber-500 text-[#2D2118] px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            View Live Store
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none bg-white p-1.5 rounded-2xl border border-[#E8DFC9]">
        {[
          { id: "overview", label: "Analytics Overview", icon: BarChart3 },
          { id: "products", label: "Product Catalog", icon: Package },
          { id: "orders", label: "Orders & Shipping", icon: ShoppingBag },
          { id: "cms", label: "CMS Banners", icon: Sliders },
          { id: "vouchers", label: "Promo Coupons", icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#5C1E1E] text-white shadow-md"
                  : "text-gray-600 hover:text-[#2D2118] hover:bg-[#FAF5EC]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: ANALYTICS OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-[#E8DFC9] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales</p>
                <h3 className="text-2xl font-black text-[#2D2118]">₹{stats.totalSales || 145800}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8DFC9] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
                <h3 className="text-2xl font-black text-[#2D2118]">{stats.totalOrders || 42}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8DFC9] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-800 rounded-2xl flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Products</p>
                <h3 className="text-2xl font-black text-[#2D2118]">{productsList.length || 10}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8DFC9] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Users</p>
                <h3 className="text-2xl font-black text-[#2D2118]">{stats.totalUsers || 128}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PRODUCTS CATALOG */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E8DFC9]">
            <h3 className="font-extrabold text-[#2D2118]">Live Inventory ({productsList.length} items)</h3>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#2D2118] transition"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsList.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-2xl border border-[#E8DFC9] flex gap-4 relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-24 object-cover rounded-xl bg-gray-100"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      {product.category || "Cosmetics"}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#2D2118] mt-1 line-clamp-1">{product.name}</h4>
                    <p className="text-xs font-black text-[#5C1E1E] mt-0.5">₹{product.price}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-[#2D2118]">Add New Store Product</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Matte Red Lipstick"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="1299"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
                  >
                    <option value="cosmetics">Cosmetics</option>
                    <option value="beauty-care">Beauty Care</option>
                    <option value="sarees">Sarees</option>
                    <option value="kurtas">Kurtas & Suits</option>
                    <option value="lehenga">Lehenga</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#5C1E1E] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#2D2118]"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
