import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ImageUploader } from "../components/ImageUploader";
import {
  Package, Tag, Star, Sparkles, Layers, ShieldCheck, Search,
  RefreshCw, Plus, Trash2, Edit, Check, X, Eye, Sliders, Globe,
  FileText, ArrowUpRight, Camera, Video, Zap, CheckCircle2, ChevronRight
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

export function CatalogManagerPage() {
  const [activeTab, setActiveTab] = useState("products"); // "products" | "brands" | "collections" | "attributes"

  // Data
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("published"); // "all" | "published" | "draft" | "archived"
  const [badgeFilter, setBadgeFilter] = useState(""); // "" | "featured" | "trending" | "bestseller" | "new_arrival"

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "sarees",
    brand: "RIVAANTA Luxury",
    collection: "New Arrival",
    sku: "",
    price: 4999,
    originalPrice: 7999,
    discountPercent: 37,
    resellerMargin: 500,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    images: [],
    images_360: [],
    description: "",
    tags: [],
    status: "published",
    inStock: true,
    isFlashSale: false,
    isFeatured: true,
    isTrending: true,
    isBestSeller: false,
    isNewArrival: true,
    attributes: {
      material: "Silk",
      fit: "True to Size",
      gender: "Women",
      sizes: ["S", "M", "L", "XL"],
      colors: [{ name: "Royal Maroon", hex: "#5C1E1E" }]
    },
    variants: [
      { sku: "RV-SKU-SR-001-S", size: "S", color: "Royal Maroon", colorHex: "#5C1E1E", stock: 15 },
      { sku: "RV-SKU-SR-001-M", size: "M", color: "Royal Maroon", colorHex: "#5C1E1E", stock: 20 }
    ],
    seo: {
      metaTitle: "Royal Kanjivaram Silk Saree | RIVAANTA Luxury",
      metaDescription: "Handcrafted pure Kanjivaram silk saree with zari embroidery. Free express delivery in Kathmandu & worldwide.",
      metaKeywords: ["silk saree", "kanjivaram", "wedding saree", "rivaanta"],
      canonicalUrl: "https://therivaanta.com/product/royal-kanjivaram-silk-saree"
    }
  });

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: "", slug: "", logoUrl: "", description: "", featured: false });

  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionForm, setCollectionForm] = useState({ name: "", slug: "", season: "Summer", bannerUrl: "", description: "", featured: false });

  const [spinIndex, setSpinIndex] = useState(0); // 360 viewer frame slider index
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch All Catalog Data ──
  const fetchAllCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, bRes, cRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/admin/catalog/brands`),
        axios.get(`${API}/admin/catalog/collections`)
      ]);
      setProducts(pRes.data.items || pRes.data || []);
      setBrands(bRes.data || []);
      setCollections(cRes.data || []);
    } catch {
      toast.error("Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCatalog();
  }, [fetchAllCatalog]);

  // Quick Status Toggle
  const handleToggleProductStatus = async (productId, currentStatus) => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    try {
      await axios.patch(`${API}/admin/catalog/products/${productId}/status?status=${nextStatus}`);
      toast.success(`Product status updated to ${nextStatus.toUpperCase()}`);
      fetchAllCatalog();
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  // Save Brand
  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.name.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/admin/catalog/brands`, brandForm);
      toast.success(`Brand "${brandForm.name}" created! ✨`);
      setShowBrandModal(false);
      setBrandForm({ name: "", slug: "", logoUrl: "", description: "", featured: false });
      fetchAllCatalog();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save brand");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Collection
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    if (!collectionForm.name.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/admin/catalog/collections`, collectionForm);
      toast.success(`Collection "${collectionForm.name}" created! ✨`);
      setShowCollectionModal(false);
      setCollectionForm({ name: "", slug: "", season: "Summer", bannerUrl: "", description: "", featured: false });
      fetchAllCatalog();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save collection");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Product Form
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProduct) {
        await axios.put(`${API}/admin/products/${editingProduct.id || editingProduct._id}`, productForm);
        toast.success("Product & SKU variants updated! ✨");
      } else {
        await axios.post(`${API}/admin/products`, productForm);
        toast.success("New Catalog Product & Variants created! ✨");
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchAllCatalog();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (p.name || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || (p.status || "published") === statusFilter;
    let matchesBadge = true;
    if (badgeFilter === "featured") matchesBadge = p.isFeatured;
    if (badgeFilter === "trending") matchesBadge = p.isTrending;
    if (badgeFilter === "bestseller") matchesBadge = p.isBestSeller;
    if (badgeFilter === "new_arrival") matchesBadge = p.isNewArrival;

    return matchesSearch && matchesStatus && matchesBadge;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-white p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Catalog Operations
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {products.length} Products · {brands.length} Brands
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Enterprise Product Catalog & Attributes Control
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage luxury brands, seasonal collections, multi-SKU size/color variants, 360° image spinners, SEO optimization, and status badging.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
              className="flex items-center gap-1.5 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Product & SKUs
            </button>
            <button
              onClick={fetchAllCatalog}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {[
            { id: "products", label: `Products (${products.length})`, icon: Package },
            { id: "brands", label: `Brands (${brands.length})`, icon: Sparkles },
            { id: "collections", label: `Collections (${collections.length})`, icon: Layers },
            { id: "attributes", label: "Attributes & SKUs", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeTab === tab.id
                    ? "bg-[#FAF5EC] text-[#2D2118] font-black shadow-md"
                    : "bg-white/10 text-gray-200 hover:bg-white/20"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? "text-[#5C1E1E]" : "text-gray-300"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by title, brand, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8DFC9] pt-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: "published", label: "Published" },
                  { value: "draft", label: "Drafts" },
                  { value: "archived", label: "Archived" },
                  { value: "all", label: `All (${products.length})` },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      statusFilter === opt.value
                        ? "bg-[#5C1E1E] text-white shadow"
                        : "bg-[#FAF5EC] text-[#2D2118] border border-[#E8DFC9]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Badge Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { value: "", label: "All Badges" },
                  { value: "featured", label: "⭐ Featured" },
                  { value: "trending", label: "🔥 Trending" },
                  { value: "bestseller", label: "🏆 Best Seller" },
                  { value: "new_arrival", label: "✨ New Arrival" },
                ].map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBadgeFilter(b.value)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                      badgeFilter === b.value ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white border-[#E8DFC9] text-gray-600"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid Feed */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-2">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-bold text-[#2D2118]">No catalog products match filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const pid = p.id || p._id;
                const status = p.status || "published";
                const skuCount = p.variants?.length || 0;

                return (
                  <div key={pid} className="bg-white rounded-2xl p-4 border border-[#E8DFC9] shadow-sm hover:shadow transition space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex gap-3">
                        <img src={p.image} alt={p.name} className="w-20 h-24 object-cover rounded-xl border border-[#E8DFC9] shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-black uppercase text-[#5C1E1E] tracking-wider block">{p.brand || "RIVAANTA"}</span>
                          <h4 className="font-extrabold text-sm text-[#2D2118] truncate">{p.name}</h4>
                          <p className="text-[11px] text-gray-400 font-mono">SKU: {p.sku || `RV-${pid?.slice(-6)}`}</p>

                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="font-black text-sm text-[#2D2118]">₹{p.price}</span>
                            {p.originalPrice > p.price && (
                              <span className="text-xs text-gray-400 line-through">₹{p.originalPrice}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Badges Bar */}
                      <div className="flex flex-wrap gap-1.5 pt-3">
                        <button
                          onClick={() => handleToggleProductStatus(pid, status)}
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border transition ${
                            status === "published" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {status}
                        </button>
                        {p.isFeatured && <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full">⭐ Featured</span>}
                        {p.isTrending && <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[9px] font-bold px-2 py-0.5 rounded-full">🔥 Trending</span>}
                        {p.isNewArrival && <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full">✨ New</span>}
                        {skuCount > 0 && <span className="bg-gray-100 text-gray-700 text-[9px] font-bold px-2 py-0.5 rounded-full">{skuCount} SKUs</span>}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E8DFC9] flex justify-end gap-2">
                      <button
                        onClick={() => { setEditingProduct(p); setProductForm({ ...p }); setShowProductModal(true); }}
                        className="bg-[#FAF5EC] border border-[#E8DFC9] text-[#2D2118] text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-gray-100 transition"
                      >
                        Edit Details & SKUs
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BRANDS TAB */}
      {activeTab === "brands" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E8DFC9]">
            <h3 className="font-black text-sm text-[#2D2118]">Brand Profiles Directory ({brands.length})</h3>
            <button onClick={() => setShowBrandModal(true)} className="bg-[#5C1E1E] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Brand
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {brands.map((b) => (
              <div key={b.id || b.slug} className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-[#2D2118]">{b.name}</h4>
                  {b.featured && <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Featured</span>}
                </div>
                <p className="text-xs text-[#8B7355]">{b.description || "Luxury brand profile"}</p>
                <p className="text-[10px] text-gray-400 font-mono">slug: /{b.slug}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COLLECTIONS TAB */}
      {activeTab === "collections" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E8DFC9]">
            <h3 className="font-black text-sm text-[#2D2118]">Seasonal Collections ({collections.length})</h3>
            <button onClick={() => setShowCollectionModal(true)} className="bg-[#5C1E1E] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Collection
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {collections.map((c) => (
              <div key={c.id || c.slug} className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-[#2D2118]">{c.name}</h4>
                  <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-2 py-0.5 rounded-full">{c.season}</span>
                </div>
                <p className="text-xs text-[#8B7355]">{c.description || "Seasonal collection"}</p>
                <p className="text-[10px] text-gray-400 font-mono">slug: /{c.slug}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATTRIBUTES & SKUs TAB */}
      {activeTab === "attributes" && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] space-y-6">
          <h3 className="font-black text-base text-[#2D2118]">Global Attributes & Variant Specifications</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9] space-y-2">
              <h4 className="font-bold text-[#5C1E1E]">Materials / Fabrics</h4>
              <p className="text-gray-600">Pure Kanjivaram Silk, Organza, Velvet, Georgette, Chiffon, Cotton, Kundan Fine Gold.</p>
            </div>
            <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9] space-y-2">
              <h4 className="font-bold text-[#5C1E1E]">Fit Classifications</h4>
              <p className="text-gray-600">Runs Small, True to Size, Runs Large, Slim Fit, Regular Fit, Oversized.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD BRAND MODAL ─── */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9]">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-[#2D2118]">Add New Brand</h3>
              <button onClick={() => setShowBrandModal(false)} className="text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveBrand} className="space-y-3 text-xs">
              <input type="text" required placeholder="Brand Name *" value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <input type="text" placeholder="Description" value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-semibold" />
              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Save Brand</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD COLLECTION MODAL ─── */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9]">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-base text-[#2D2118]">Add New Collection</h3>
              <button onClick={() => setShowCollectionModal(false)} className="text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveCollection} className="space-y-3 text-xs">
              <input type="text" required placeholder="Collection Name *" value={collectionForm.name} onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <select value={collectionForm.season} onChange={(e) => setCollectionForm({ ...collectionForm, season: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold">
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
                <option value="Festive">Festive</option>
                <option value="New Arrival">New Arrival</option>
              </select>
              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Save Collection</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
