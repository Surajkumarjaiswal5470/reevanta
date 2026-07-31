import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Package, ShoppingBag, PlusCircle, Trash2, RefreshCw, Users, Truck } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_OPTIONS = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

const emptyProduct = {
  name: "",
  category: "clothes",
  brand: "",
  price: 999,
  originalPrice: 1999,
  image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800",
  description: "",
  resellerMargin: 200,
  discountPercent: 50,
  sizes: "S, M, L, XL",
  tags: "",
};

export const AdminPanel = () => {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.all([axios.get(`${API}/orders`), axios.get(`${API}/products`)]);
      setOrders(oRes.data || []);
      setProducts(pRes.data || []);
    } catch (e) {
      toast.error("Failed to load admin data. Please ensure you are logged in as admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        colors: ["#282C3F", "#FF3F6C"],
        rating: 4.8,
        reviewsCount: 15,
        inStock: true,
        tags: (newProduct.tags || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      };
      await axios.post(`${API}/products`, payload);
      toast.success("Product added successfully");
      setNewProduct(emptyProduct);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add product");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("Product deleted");
      load();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status });
      toast.success(`Status updated to ${status}`);
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const totalRevenue = orders.filter((o) => o.status !== "Cancelled").reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrders = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length;

  return (
    <div data-testid="admin-panel" className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-[#EAEAEC]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-[#282C3F]">Admin Dashboard</h2>
            <p className="text-xs text-[#535766]">Manage products, orders and reseller partners</p>
          </div>
          <button
            data-testid="admin-refresh-btn"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-[#282C3F] text-white px-4 py-2 rounded-full text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="p-4 bg-gradient-to-br from-[#FFF0F3] to-white border border-[#FF3F6C]/20 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#535766]">Total Orders</div>
            <div className="text-2xl font-black text-[#282C3F] mt-1">{orders.length}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#535766]">Active Orders</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{activeOrders}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#535766]">Revenue</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#535766]">Products</div>
            <div className="text-2xl font-black text-purple-700 mt-1">{products.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "orders", label: "Orders", icon: Truck },
          { id: "products", label: "Products", icon: Package },
          { id: "add", label: "Add Product", icon: PlusCircle },
        ].map((t) => {
          const Ico = t.icon;
          return (
            <button
              key={t.id}
              data-testid={`admin-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
                tab === t.id ? "bg-[#FF3F6C] text-white shadow-md" : "bg-white text-[#282C3F] border border-[#EAEAEC] hover:bg-gray-50"
              }`}
            >
              <Ico className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "orders" && (
        <div className="bg-white rounded-3xl border border-[#EAEAEC] overflow-hidden">
          <div className="p-4 border-b border-[#EAEAEC] font-bold text-sm text-[#282C3F]">All Orders</div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#535766]">No orders yet.</div>
          ) : (
            <div className="divide-y divide-[#EAEAEC]">
              {orders.map((o) => (
                <div key={o.id} data-testid={`admin-order-${o.id}`} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-[#FF3F6C]">{o.order_number || o.id.slice(0, 8)}</div>
                    <div className="text-[11px] text-[#535766]">
                      {o.userName || "Guest"} · {o.userEmail} · {new Date(o.placed_at).toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-[#282C3F] mt-1">
                      ₹{o.total} · {o.items?.length || 0} items · {o.paymentMethod || "COD"}
                    </div>
                  </div>
                  <select
                    data-testid={`admin-status-select-${o.id}`}
                    value={o.status || "Order Placed"}
                    onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                    className="bg-[#FAFAFC] border border-[#EAEAEC] rounded-lg px-3 py-2 text-xs font-bold"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="bg-white rounded-3xl border border-[#EAEAEC] overflow-hidden">
          <div className="p-4 border-b border-[#EAEAEC] font-bold text-sm text-[#282C3F]">Product Catalog ({products.length})</div>
          <div className="divide-y divide-[#EAEAEC] max-h-[600px] overflow-y-auto">
            {products.map((p) => (
              <div key={p.id} data-testid={`admin-product-${p.id}`} className="p-3 flex items-center gap-3">
                <img src={p.image} alt={p.name} className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#282C3F] line-clamp-1">{p.name}</div>
                  <div className="text-[10px] text-[#535766] uppercase tracking-wider">
                    {p.brand} · {p.category} · ₹{p.price}
                  </div>
                </div>
                <button
                  data-testid={`admin-delete-product-${p.id}`}
                  onClick={() => handleDeleteProduct(p.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "add" && (
        <form onSubmit={handleAddProduct} className="bg-white rounded-3xl border border-[#EAEAEC] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#535766]">Name</label>
              <input
                data-testid="new-product-name"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#535766]">Brand</label>
              <input
                data-testid="new-product-brand"
                required
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#535766]">Category</label>
              <select
                data-testid="new-product-category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="clothes">Clothes</option>
                <option value="shoes">Shoes</option>
                <option value="makeup">Makeup</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#535766]">Image URL</label>
              <input
                required
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#535766]">Price (₹)</label>
              <input
                data-testid="new-product-price"
                type="number"
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#535766]">Original Price (₹)</label>
              <input
                type="number"
                required
                value={newProduct.originalPrice}
                onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#535766]">Discount %</label>
              <input
                type="number"
                value={newProduct.discountPercent}
                onChange={(e) => setNewProduct({ ...newProduct, discountPercent: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#535766]">Reseller Margin (₹)</label>
              <input
                type="number"
                value={newProduct.resellerMargin}
                onChange={(e) => setNewProduct({ ...newProduct, resellerMargin: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-[#535766]">Sizes (comma separated)</label>
              <input
                value={newProduct.sizes}
                onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-[#535766]">Search Tags (comma separated)</label>
              <input
                value={newProduct.tags}
                onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                placeholder="e.g. hoodie, winter, unisex"
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-[#535766]">Description</label>
              <textarea
                required
                rows={3}
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full mt-1 bg-[#FAFAFC] border border-[#EAEAEC] rounded-xl p-2.5 text-xs font-semibold"
              />
            </div>
          </div>
          <button
            data-testid="new-product-submit"
            type="submit"
            className="w-full bg-[#FF3F6C] hover:bg-[#E02E57] text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-[#FF3F6C]/30"
          >
            Add Product to Catalog
          </button>
        </form>
      )}
    </div>
  );
};
