import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Package,
  ShoppingBag,
  PlusCircle,
  Trash2,
  RefreshCw,
  Truck,
  TrendingUp,
  Search,
  Edit,
  Zap,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Sliders,
  DollarSign,
  AlertCircle,
  Tag,
  Layers,
  ArrowUpRight
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

const emptyProduct = {
  name: "",
  category: "clothes",
  brand: "RIVAANTA",
  price: 1299,
  originalPrice: 2499,
  image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800",
  description: "Handcrafted premium quality ethnic apparel with intricate details and comfortable fit.",
  resellerMargin: 250,
  discountPercent: 48,
  sizes: "S, M, L, XL",
  tags: "ethnic, kurta, festive, cotton",
  inStock: true,
  isFlashSale: false
};

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("overview"); // overview, orders, products, vouchers, add, reseller
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // Secret Key Admin Auth State
  const [adminAuth, setAdminAuth] = useState({
    isLoggedIn: false,
    name: "spk",
    secretKey: ""
  });
  const [authError, setAuthError] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleSecretLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await axios.post(`${API}/auth/admin-secret-login`, {
        name: adminAuth.name.trim(),
        secretKey: adminAuth.secretKey.trim()
      }, { withCredentials: true });
      toast.success(res.data.message || "Admin Authenticated!");
      setAdminAuth((prev) => ({ ...prev, isLoggedIn: true }));
      loadData();
      loadVouchers();
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid Secret Key or Name (Name must be 'spk', Secret Key must be 'PHOENIX')";
      setAuthError(msg);
      toast.error(msg);
    }
  };

  // Filters & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productSearchQuery, setProductSearchQuery] = useState("");

  const [vouchers, setVouchers] = useState([]);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discountType: "fixed",
    discountValue: 500,
    minOrderValue: 1500,
    maxDiscount: 1000,
    autoApply: true,
    description: "Special Discount Coupon"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/products`)
      ]);
      setOrders(oRes.data || []);
      setProducts(pRes.data || []);
    } catch (e) {
      // Prompt secret login if unauthorized
    } finally {
      setLoading(false);
    }
  };

  const loadVouchers = async () => {
    try {
      const res = await axios.get(`${API}/admin/vouchers`);
      setVouchers(res.data || []);
    } catch {
      try {
        const res = await axios.get(`${API}/vouchers/active`);
        setVouchers(res.data || []);
      } catch {}
    }
  };

  useEffect(() => {
    if (adminAuth.isLoggedIn) {
      loadData();
      loadVouchers();
    }
  }, [adminAuth.isLoggedIn]);

  const handleAddVoucher = async (e) => {
    e.preventDefault();
    if (!newVoucher.code.strip()) {
      toast.error("Please enter a voucher code");
      return;
    }
    try {
      await axios.post(`${API}/admin/vouchers`, newVoucher);
      toast.success(`Voucher '${newVoucher.code.toUpperCase()}' created!`);
      setNewVoucher({
        code: "",
        discountType: "fixed",
        discountValue: 500,
        minOrderValue: 1500,
        maxDiscount: 1000,
        autoApply: true,
        description: "Special Discount Coupon"
      });
      loadVouchers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create voucher");
    }
  };

  const handleToggleVoucher = async (voucherId, currentActive) => {
    try {
      await axios.patch(`${API}/admin/vouchers/${voucherId}`, { isActive: !currentActive });
      toast.success("Voucher status updated");
      loadVouchers();
    } catch {
      toast.error("Failed to update voucher");
    }
  };

  const handleDeleteVoucher = async (voucherId) => {
    if (!window.confirm("Delete this voucher?")) return;
    try {
      await axios.delete(`${API}/admin/vouchers/${voucherId}`);
      toast.success("Voucher deleted");
      loadVouchers();
    } catch {
      toast.error("Failed to delete voucher");
    }
  };

  // Handle Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        price: Number(newProduct.price),
        originalPrice: Number(newProduct.originalPrice),
        resellerMargin: Number(newProduct.resellerMargin),
        discountPercent: Number(newProduct.discountPercent),
        sizes: newProduct.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: ["#2D2118", "#5C1E1E", "#B8956A"],
        rating: 4.8,
        reviewsCount: 12,
        inStock: Boolean(newProduct.inStock),
        isFlashSale: Boolean(newProduct.isFlashSale),
        tags: (newProduct.tags || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      };
      await axios.post(`${API}/products`, payload);
      toast.success(`Product "${newProduct.name}" created successfully!`);
      setNewProduct(emptyProduct);
      loadData();
      setActiveTab("products");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add product");
    }
  };

  // Handle Edit Product Save
  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const payload = {
        ...editingProduct,
        price: Number(editingProduct.price),
        originalPrice: Number(editingProduct.originalPrice),
        resellerMargin: Number(editingProduct.resellerMargin),
        discountPercent: Number(editingProduct.discountPercent),
        sizes: typeof editingProduct.sizes === "string" 
          ? editingProduct.sizes.split(",").map((s) => s.trim()).filter(Boolean) 
          : editingProduct.sizes,
        tags: typeof editingProduct.tags === "string" 
          ? editingProduct.tags.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) 
          : editingProduct.tags
      };
      await axios.patch(`${API}/products/${editingProduct.id}`, payload);
      toast.success("Product updated successfully!");
      setEditingProduct(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update product");
    }
  };

  // Quick Toggle Stock / Flash Sale
  const toggleProductField = async (productId, fieldName, currentValue) => {
    try {
      await axios.patch(`${API}/products/${productId}`, { [fieldName]: !currentValue });
      toast.success(`Updated product ${fieldName === "inStock" ? "stock" : "flash sale"} status!`);
      loadData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("Product deleted successfully");
      loadData();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to "${newStatus}"`);
      loadData();
    } catch {
      toast.error("Failed to update order status");
    }
  };

  // Update Return Request Status
  const handleUpdateReturnStatus = async (orderId, newReturnStatus) => {
    try {
      await axios.patch(`${API}/admin/orders/${orderId}/return-status`, { returnStatus: newReturnStatus });
      toast.success(`Return status updated to "${newReturnStatus}"`);
      loadData();
    } catch {
      try {
        await axios.patch(`${API}/orders/${orderId}/return-status`, { returnStatus: newReturnStatus });
        toast.success(`Return status updated to "${newReturnStatus}"`);
        loadData();
      } catch {
        toast.error("Failed to update return status");
      }
    }
  };

  // Compute Metrics
  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const activeOrdersCount = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length;
  const deliveredOrdersCount = orders.filter((o) => o.status === "Delivered").length;
  const outOfStockCount = products.filter((p) => p.inStock === false).length;
  const flashSaleCount = products.filter((p) => p.isFlashSale === true).length;
  
  // Calculate Reseller Margin Volume
  const resellerMarginTotal = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((acc, o) => {
      const itemsMargin = (o.items || []).reduce((m, item) => m + (item.resellerMargin || 200) * item.qty, 0);
      return acc + itemsMargin;
    }, 0);

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
    const q = orderSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (o.order_number || "").toLowerCase().includes(q) ||
      (o.userName || "").toLowerCase().includes(q) ||
      (o.userEmail || "").toLowerCase().includes(q) ||
      (o.id || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
    const q = productSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  if (!adminAuth.isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[#E8DFC9] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#5C1E1E] text-white rounded-2xl mx-auto flex items-center justify-center font-black text-xl shadow-lg">
              🔐
            </div>
            <h2 className="text-2xl font-black text-[#2D2118]">Admin Secret Key Gate</h2>
            <p className="text-xs text-gray-500">Enter Admin Name & Secret Key to access RIVAANTA Operations Control.</p>
          </div>

          <form onSubmit={handleSecretLogin} className="space-y-4 text-xs">
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold">
                {authError}
              </div>
            )}

            <div>
              <label className="font-extrabold uppercase text-[#8B7355] block mb-1">Admin Name</label>
              <input
                type="text"
                required
                value={adminAuth.name}
                onChange={(e) => setAdminAuth({ ...adminAuth, name: e.target.value })}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-bold text-[#2D2118]"
                placeholder="spk"
              />
            </div>

            <div>
              <label className="font-extrabold uppercase text-[#8B7355] block mb-1">Secret Key</label>
              <div className="relative flex items-center">
                <input
                  type={showSecretKey ? "text" : "password"}
                  required
                  value={adminAuth.secretKey}
                  onChange={(e) => setAdminAuth({ ...adminAuth, secretKey: e.target.value })}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 pr-10 font-bold text-[#2D2118]"
                  placeholder="Enter Secret Key"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 text-gray-500 hover:text-[#5C1E1E]"
                  title={showSecretKey ? "Hide Secret Key" : "Show Secret Key"}
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white font-bold py-3.5 rounded-xl shadow-lg transition"
            >
              Authenticate & Unlock Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-panel" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Admin Operations Control
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> System Live
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 text-[#FAF5EC]">
              RIVAANTA Store Manager
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage inventory, monitor order fulfillment, toggle flash deals & track wholesale reseller margin earnings.
            </p>
          </div>

          <button
            data-testid="admin-refresh-btn"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-black/40 transition active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Workspace</span>
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center space-x-2 mt-8 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "overview", label: "Overview & Analytics", icon: TrendingUp },
            { id: "orders", label: `Orders (${orders.length})`, icon: Truck },
            { id: "products", label: `Products (${products.length})`, icon: Package },
            { id: "vouchers", label: `Vouchers (${vouchers.length})`, icon: Tag },
            { id: "add", label: "Add Product", icon: PlusCircle },
            { id: "reseller", label: "Reseller Earnings", icon: DollarSign }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-testid={`admin-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? "bg-[#FAF5EC] text-[#2D2118] shadow-md font-black"
                    : "bg-white/10 text-gray-200 hover:bg-white/20 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#5C1E1E]" : "text-gray-300"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW & ANALYTICS TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-2 hover-lift">
              <div className="flex justify-between items-center text-[#8B7355]">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Sales Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#2D2118]">₹{totalRevenue.toLocaleString()}</div>
              <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> 100% COD & UPI fulfilled
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-2 hover-lift">
              <div className="flex justify-between items-center text-[#8B7355]">
                <span className="text-[10px] font-black uppercase tracking-wider">Active Fulfillment</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-700">{activeOrdersCount}</div>
              <div className="text-[10px] font-semibold text-[#8B7355]">
                {deliveredOrdersCount} orders delivered
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-2 hover-lift">
              <div className="flex justify-between items-center text-[#8B7355]">
                <span className="text-[10px] font-black uppercase tracking-wider">Active Catalog</span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#2D2118]">{products.length}</div>
              <div className="text-[10px] font-semibold text-purple-700">
                {flashSaleCount} in Flash Sale · {outOfStockCount} Out of Stock
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-2 hover-lift">
              <div className="flex justify-between items-center text-[#8B7355]">
                <span className="text-[10px] font-black uppercase tracking-wider">Reseller Margin Volume</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-blue-700">₹{resellerMarginTotal.toLocaleString()}</div>
              <div className="text-[10px] font-semibold text-[#8B7355]">
                Earnings payable to partner resellers
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Orders Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-base text-[#2D2118]">Recent Order Feed</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-bold text-[#5C1E1E] hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#8B7355]">No orders found.</div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-3.5 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9]"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-[#5C1E1E]">{o.order_number || o.id.slice(0, 8)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2D2118] text-white">
                            {o.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8B7355] mt-0.5">
                          {o.userName || "Customer"} · {o.items?.length || 0} items
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[#2D2118]">₹{o.total}</div>
                        <div className="text-[10px] text-[#8B7355]">{o.paymentMethod || "COD"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Admin Actions Panel */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-black text-base text-[#2D2118]">Quick Workspace Actions</h3>
                <p className="text-xs text-[#8B7355]">Shortcuts for catalog creation and inventory status updates.</p>

                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveTab("add")}
                    className="w-full bg-[#5C1E1E] text-white p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#4A1717] transition shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" /> Add New Catalog Product
                  </button>

                  <button
                    onClick={() => {
                      setOrderStatusFilter("Order Placed");
                      setActiveTab("orders");
                    }}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] text-[#2D2118] p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:border-[#5C1E1E] transition"
                  >
                    <Truck className="w-4 h-4 text-[#5C1E1E]" /> Filter Unfulfilled Orders
                  </button>

                  <button
                    onClick={() => {
                      setProductCategoryFilter("clothes");
                      setActiveTab("products");
                    }}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] text-[#2D2118] p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:border-[#5C1E1E] transition"
                  >
                    <Package className="w-4 h-4 text-[#5C1E1E]" /> Manage Clothes Catalog
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-700" /> Admin Hint
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Use the quick toggle switches in the <strong>Products</strong> tab to turn Flash Sale discounts on or off in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS MANAGEMENT TAB */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-[#E8DFC9] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            {/* Status Pills */}
            <div className="flex overflow-x-auto gap-1.5 pb-1 max-w-full scrollbar-none">
              <button
                onClick={() => setOrderStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderStatusFilter === "all"
                    ? "bg-[#5C1E1E] text-white"
                    : "bg-[#FAF5EC] text-[#2D2118] hover:bg-gray-100"
                }`}
              >
                All ({orders.length})
              </button>
              {STATUS_OPTIONS.map((st) => {
                const cnt = orders.filter((o) => o.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      orderStatusFilter === st
                        ? "bg-[#5C1E1E] text-white"
                        : "bg-[#FAF5EC] text-[#2D2118] hover:bg-gray-100"
                    }`}
                  >
                    {st} ({cnt})
                  </button>
                );
              })}
            </div>

            {/* Order Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8B7355]" />
              <input
                type="text"
                placeholder="Search order # or customer..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-3xl border border-[#E8DFC9] overflow-hidden shadow-sm">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Truck className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="font-bold text-[#2D2118]">No orders found matching the filter.</p>
                <p className="text-xs text-[#8B7355]">Try changing status filter or clearing your search term.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8DFC9]">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    data-testid={`admin-order-${o.id}`}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAF5EC]/50 transition"
                  >
                    {/* Order Information */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-[#5C1E1E]">
                          {o.order_number || o.id.slice(0, 8)}
                        </span>
                        <span className="text-xs font-bold text-[#2D2118] bg-[#FAF5EC] px-2.5 py-0.5 rounded-full border border-[#E8DFC9]">
                          {new Date(o.placed_at).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {o.paymentMethod || "COD"}
                        </span>
                      </div>

                      <div className="text-xs text-[#8B7355] space-y-0.5">
                        <div>
                          <strong>Customer:</strong> {o.userName || "Guest"} ({o.userEmail})
                        </div>
                        {o.address && (
                          <div>
                            <strong>Ship to:</strong> {o.address.fullName}, {o.address.line1}, {o.address.city} {o.address.pincode} (📞 {o.address.phone})
                          </div>
                        )}
                      </div>

                      {/* Items Preview */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(o.items || []).map((it, idx) => (
                          <span
                            key={idx}
                            className="bg-white border border-[#E8DFC9] rounded-lg px-2 py-1 text-[11px] font-bold text-[#2D2118] flex items-center gap-1.5"
                          >
                            {it.image && <img src={it.image} alt={it.name} className="w-4 h-4 rounded object-cover" />}
                            {it.name} (x{it.qty})
                          </span>
                        ))}
                      </div>

                      {/* Amazon / Meesho Style Return Details & Bank Payout Details */}
                      {o.return_info && (
                        <div className="mt-3 bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-bold text-purple-900 border-b border-purple-200 pb-1.5">
                            <span>🔄 RETURN REQUEST ({o.return_info.return_id})</span>
                            <span className="bg-purple-700 text-white text-[10px] px-2 py-0.5 rounded-full">{o.return_info.return_status}</span>
                          </div>
                          <div><strong>Reason:</strong> {o.return_info.reason}</div>
                          {o.return_info.reason_details && <div><strong>Notes:</strong> {o.return_info.reason_details}</div>}
                          
                          <div className="bg-white p-3 rounded-xl border border-purple-200 mt-2 space-y-1">
                            <div className="font-bold text-purple-950 text-[11px] uppercase">🏦 Customer Bank / Wallet Refund Info:</div>
                            {o.return_info.refund_method === "bank_account" && o.return_info.bank_details ? (
                              <>
                                <div>Bank: <strong>{o.return_info.bank_details.bankName}</strong></div>
                                <div>Account Holder: <strong>{o.return_info.bank_details.accountHolderName}</strong></div>
                                <div>Account Number: <strong className="font-mono text-[#5C1E1E]">{o.return_info.bank_details.accountNumber}</strong></div>
                                {o.return_info.bank_details.branchOrIfsc && <div>Branch/IFSC: {o.return_info.bank_details.branchOrIfsc}</div>}
                              </>
                            ) : o.return_info.refund_method === "digital_wallet" && o.return_info.wallet_details ? (
                              <>
                                <div>Wallet: <strong>{o.return_info.wallet_details.walletType}</strong></div>
                                <div>Number/ID: <strong className="font-mono text-[#5C1E1E]">{o.return_info.wallet_details.walletNumberOrId}</strong></div>
                              </>
                            ) : (
                              <div>Refund Method: <strong>Original Source / COD Cash Refund</strong></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Dropdown & Price Total */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#E8DFC9]">
                      <div className="text-left lg:text-right">
                        <div className="text-xs text-[#8B7355]">Total Amount</div>
                        <div className="text-xl font-black text-[#2D2118]">₹{o.total}</div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-black uppercase text-[#8B7355] block">Order Status:</label>
                          <select
                            data-testid={`admin-status-select-${o.id}`}
                            value={o.status || "Order Placed"}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="bg-[#FAF5EC] border border-[#5C1E1E]/30 rounded-xl px-3 py-1.5 text-xs font-bold text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        {o.return_info && (
                          <div>
                            <label className="text-[10px] font-black uppercase text-purple-800 block">Return Status:</label>
                            <select
                              value={o.return_info.return_status || "Return Requested"}
                              onChange={(e) => handleUpdateReturnStatus(o.id, e.target.value)}
                              className="bg-purple-100 border border-purple-400 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-950 focus:outline-none"
                            >
                              {["Return Requested", "Pickup Scheduled", "Item Inspected", "Refund Processed", "Return Rejected"].map((rst) => (
                                <option key={rst} value={rst}>
                                  {rst}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS CATALOG MANAGEMENT TAB */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-3xl border border-[#E8DFC9] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {["all", "clothes", "shoes", "makeup", "accessories"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                    productCategoryFilter === cat
                      ? "bg-[#5C1E1E] text-white"
                      : "bg-[#FAF5EC] text-[#2D2118] hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8B7355]" />
              <input
                type="text"
                placeholder="Search catalog products..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
              />
            </div>
          </div>

          {/* Product Grid / Table */}
          <div className="bg-white rounded-3xl border border-[#E8DFC9] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E8DFC9] font-black text-sm text-[#2D2118] flex justify-between items-center">
              <span>Catalog Items ({filteredProducts.length})</span>
              <span className="text-xs font-semibold text-[#8B7355]">Use toggles for instant customer updates</span>
            </div>

            <div className="divide-y divide-[#E8DFC9] max-h-[700px] overflow-y-auto">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  data-testid={`admin-product-${p.id}`}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FAF5EC]/50 transition"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <img src={p.image} alt={p.name} className="w-16 h-16 rounded-2xl object-cover bg-gray-100 border border-[#E8DFC9]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase text-[#8B7355]">{p.brand}</span>
                        <span className="text-[10px] font-bold uppercase bg-[#FAF5EC] px-2 py-0.5 rounded text-[#5C1E1E]">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-[#2D2118] truncate mt-0.5">{p.name}</h4>
                      <div className="flex items-center space-x-3 text-xs mt-1">
                        <span className="font-black text-[#5C1E1E]">₹{p.price}</span>
                        <span className="text-[#8B7355] line-through text-[11px]">₹{p.originalPrice}</span>
                        <span className="text-purple-700 font-bold text-[11px]">Margin: ₹{p.resellerMargin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock & Flash Sale Quick Toggles */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E8DFC9]">
                    <button
                      onClick={() => toggleProductField(p.id, "inStock", p.inStock)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        p.inStock !== false
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-red-100 text-red-800 border border-red-300"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{p.inStock !== false ? "In Stock" : "Out of Stock"}</span>
                    </button>

                    <button
                      onClick={() => toggleProductField(p.id, "isFlashSale", p.isFlashSale)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        p.isFlashSale
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>{p.isFlashSale ? "Flash Deal" : "Regular"}</span>
                    </button>

                    <button
                      onClick={() => setEditingProduct({ ...p, sizes: (p.sizes || []).join(", "), tags: (p.tags || []).join(", ") })}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-[#5C1E1E] hover:text-white transition text-[#2D2118]"
                      title="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      data-testid={`admin-delete-product-${p.id}`}
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT TAB WITH LIVE PREVIEW */}
      {activeTab === "add" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product Form */}
          <form onSubmit={handleAddProduct} className="lg:col-span-2 bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h3 className="font-black text-lg text-[#2D2118]">Add New Product to Catalog</h3>
              <p className="text-xs text-[#8B7355]">Fill product specs to list on RIVAANTA storefront.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#8B7355]">Product Name *</label>
                <input
                  data-testid="new-product-name"
                  type="text"
                  required
                  placeholder="e.g. Silk Anarkali Suit Set"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355]">Brand Name *</label>
                <input
                  data-testid="new-product-brand"
                  type="text"
                  required
                  placeholder="e.g. RIVAANTA Luxe"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355]">Category *</label>
                <select
                  data-testid="new-product-category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                >
                  <option value="clothes">Clothes</option>
                  <option value="shoes">Shoes & Sneakers</option>
                  <option value="makeup">Makeup & Cosmetics</option>
                  <option value="accessories">Bags & Accessories</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355]">Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355]">Selling Price (₹) *</label>
                <input
                  data-testid="new-product-price"
                  type="number"
                  required
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355]">Original Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={newProduct.originalPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355]">Reseller Profit Margin (₹)</label>
                <input
                  type="number"
                  value={newProduct.resellerMargin}
                  onChange={(e) => setNewProduct({ ...newProduct, resellerMargin: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355]">Discount Percent (%)</label>
                <input
                  type="number"
                  value={newProduct.discountPercent}
                  onChange={(e) => setNewProduct({ ...newProduct, discountPercent: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-[#8B7355]">Available Sizes (comma separated)</label>
                <input
                  type="text"
                  placeholder="S, M, L, XL"
                  value={newProduct.sizes}
                  onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-[#8B7355]">Search Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="ethnic, kurta, festive, cotton"
                  value={newProduct.tags}
                  onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-[#8B7355]">Product Description *</label>
                <textarea
                  required
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <label className="flex items-center space-x-2 text-xs font-bold text-[#2D2118] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.isFlashSale}
                    onChange={(e) => setNewProduct({ ...newProduct, isFlashSale: e.target.checked })}
                    className="accent-[#5C1E1E] w-4 h-4 rounded"
                  />
                  <span>Mark as Flash Sale Item</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-bold text-[#2D2118] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.inStock}
                    onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
                    className="accent-[#5C1E1E] w-4 h-4 rounded"
                  />
                  <span>In Stock</span>
                </label>
              </div>
            </div>

            <button
              data-testid="new-product-submit"
              type="submit"
              className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-[#5C1E1E]/30 transition"
            >
              Publish Product to Storefront
            </button>
          </form>

          {/* Right: Live Preview Card */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-[#8B7355] flex items-center gap-1">
              <Eye className="w-4 h-4 text-[#5C1E1E]" /> Storefront Live Card Preview
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-[#E8DFC9] shadow-xl p-4 space-y-3 relative">
              <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={newProduct.image || "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800"}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-[#5C1E1E] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                  {newProduct.discountPercent || 50}% OFF
                </span>
                {newProduct.isFlashSale && (
                  <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-white" /> FLASH SALE
                  </span>
                )}
              </div>

              <div>
                <div className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">
                  {newProduct.brand || "BRAND"} · {newProduct.category}
                </div>
                <h4 className="font-bold text-sm text-[#2D2118] line-clamp-1">
                  {newProduct.name || "Product Name Preview"}
                </h4>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-black text-[#2D2118]">₹{newProduct.price || 0}</span>
                <span className="text-xs text-[#8B7355] line-through">₹{newProduct.originalPrice || 0}</span>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-2 text-xs text-purple-700 flex justify-between items-center">
                <span>Reseller Wholesale Profit:</span>
                <span className="font-bold text-purple-900">₹{newProduct.resellerMargin || 0}</span>
              </div>

              <div className="w-full bg-[#2D2118] text-white text-xs font-bold py-2.5 rounded-xl text-center">
                Add to Bag
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESELLER EARNINGS TRACKER TAB */}
      {activeTab === "reseller" && (
        <div className="bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="font-black text-xl text-[#2D2118]">Reseller Partner Program Dashboard</h3>
            <p className="text-xs text-[#8B7355] mt-0.5">
              Track earnings, wholesale margins, and blind shipping volume across partner reseller orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-3xl space-y-2">
              <div className="text-[10px] font-black uppercase text-purple-800">Total Reseller Orders</div>
              <div className="text-3xl font-black text-purple-900">{orders.length}</div>
              <div className="text-xs text-purple-700">Orders placed with active margin distribution</div>
            </div>

            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2">
              <div className="text-[10px] font-black uppercase text-emerald-800">Accrued Profit Margins</div>
              <div className="text-3xl font-black text-emerald-900">₹{resellerMarginTotal.toLocaleString()}</div>
              <div className="text-xs text-emerald-700">Ready for automated partner payout</div>
            </div>

            <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl space-y-2">
              <div className="text-[10px] font-black uppercase text-amber-800">Avg Margin per Sale</div>
              <div className="text-3xl font-black text-amber-900">₹245</div>
              <div className="text-xs text-amber-700">Wholesale competitive margin guarantee</div>
            </div>
          </div>

          <div className="border-t border-[#E8DFC9] pt-4">
            <h4 className="font-black text-sm text-[#2D2118] mb-3">Top Performing Products for Resellers</h4>
            <div className="space-y-2">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9]">
                  <div className="flex items-center space-x-3">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <div className="font-bold text-xs text-[#2D2118]">{p.name}</div>
                      <div className="text-[10px] text-[#8B7355]">{p.brand} · Selling Price: ₹{p.price}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-purple-700">Profit Margin: ₹{p.resellerMargin}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">WhatsApp Ready</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VOUCHERS & COUPONS MANAGEMENT TAB */}
      {activeTab === "vouchers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Voucher Form */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-black text-lg text-[#2D2118] border-b border-[#E8DFC9] pb-3">
                <Tag className="w-5 h-5 text-[#5C1E1E]" />
                <span>Create Voucher / Coupon</span>
              </div>

              <form onSubmit={handleAddVoucher} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-[#8B7355] block mb-1">Voucher Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME500, KATHMANDU20"
                    value={newVoucher.code}
                    onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-black uppercase text-[#2D2118]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Discount Type</label>
                    <select
                      value={newVoucher.discountType}
                      onChange={(e) => setNewVoucher({ ...newVoucher, discountType: e.target.value })}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-bold text-[#2D2118]"
                    >
                      <option value="fixed">Fixed Amount (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newVoucher.discountValue}
                      onChange={(e) => setNewVoucher({ ...newVoucher, discountValue: Number(e.target.value) })}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-bold text-[#2D2118]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Min Order Value (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={newVoucher.minOrderValue}
                      onChange={(e) => setNewVoucher({ ...newVoucher, minOrderValue: Number(e.target.value) })}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-bold text-[#2D2118]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Max Cap Discount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={newVoucher.maxDiscount || ""}
                      onChange={(e) => setNewVoucher({ ...newVoucher, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-bold text-[#2D2118]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div>
                    <div className="font-bold text-amber-950 text-xs">Auto-Apply to Eligible Carts</div>
                    <div className="text-[10px] text-amber-800">Automatically applies coupon when cart meets minimum total.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newVoucher.autoApply}
                    onChange={(e) => setNewVoucher({ ...newVoucher, autoApply: e.target.checked })}
                    className="w-4 h-4 accent-[#5C1E1E]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#8B7355] block mb-1">Description / Banner Note</label>
                  <input
                    type="text"
                    placeholder="e.g. NPR 500 Off on orders above NPR 1,500"
                    value={newVoucher.description}
                    onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-semibold text-[#2D2118]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white font-bold py-3 rounded-xl shadow-md transition"
                >
                  Create & Activate Voucher
                </button>
              </form>
            </div>

            {/* Vouchers Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
                <h3 className="font-black text-lg text-[#2D2118]">Active Store Vouchers ({vouchers.length})</h3>
                <span className="text-xs text-gray-500 font-bold">Auto-Apply & Cart Coupons</span>
              </div>

              {vouchers.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#8B7355]">No active vouchers found.</div>
              ) : (
                <div className="space-y-3">
                  {vouchers.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl border border-[#E8DFC9] bg-[#FAF5EC]/50 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#5C1E1E] bg-white border border-[#E8DFC9] px-2.5 py-0.5 rounded-lg tracking-wider">
                            {v.code}
                          </span>
                          {v.autoApply && (
                            <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                              AUTO-APPLY
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"}`}>
                            {v.isActive ? "ACTIVE" : "DISABLED"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#2D2118]">
                          {v.discountType === "fixed" ? `Flat ₹${v.discountValue} Off` : `${v.discountValue}% Off`}
                          {v.minOrderValue > 0 && <span className="text-gray-500 font-normal"> · Min Order ₹{v.minOrderValue}</span>}
                        </div>
                        {v.description && <p className="text-[11px] text-gray-500">{v.description}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVoucher(v.id, v.isActive)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            v.isActive ? "bg-amber-100 text-amber-900 hover:bg-amber-200" : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                          }`}
                        >
                          {v.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(v.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
              <h3 className="text-lg font-black text-[#2D2118]">Edit Product Details</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-[#2D2118] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8B7355]">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8B7355]">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8B7355]">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8B7355]">Original Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.originalPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value })}
                    className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8B7355]">Reseller Margin (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.resellerMargin}
                    onChange={(e) => setEditingProduct({ ...editingProduct, resellerMargin: e.target.value })}
                    className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8B7355]">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="clothes">Clothes</option>
                    <option value="shoes">Shoes</option>
                    <option value="makeup">Makeup</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-[#8B7355]">Image URL</label>
                  <input
                    type="url"
                    required
                    value={editingProduct.image}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-[#8B7355]">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-[#2D2118] font-bold py-3 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#5C1E1E] hover:bg-[#4A1717] text-white font-bold py-3 rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
