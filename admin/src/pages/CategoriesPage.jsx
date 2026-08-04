import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ImageUploader } from "../components/ImageUploader";
import {
  Layers, Plus, Trash2, Edit, Star, Check, X, Search,
  RefreshCw, Sparkles, FolderPlus, Tag, ChevronUp, ChevronDown,
  Globe, Image as ImageIcon, Sliders, FileText, CheckCircle2, Crown, Shirt, Gem, Palette
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const ICON_OPTIONS = [
  { name: "Sparkles", icon: Sparkles },
  { name: "Crown", icon: Crown },
  { name: "Shirt", icon: Shirt },
  { name: "Gem", icon: Gem },
  { name: "Palette", icon: Palette },
  { name: "Tag", icon: Tag },
  { name: "Layers", icon: Layers },
];

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800",
  bannerUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600",
  iconName: "Sparkles",
  iconUrl: "",
  featured: true,
  sort_order: 1,
  collections: [],
  subcategories: [],
  seo: {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    canonicalUrl: ""
  }
};

const emptySubcategory = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  bannerUrl: "",
  iconUrl: "",
  display_order: 0
};

export function CategoriesPage({ onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [collectionsList, setCollectionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [modalTab, setModalTab] = useState("basic"); // "basic" | "collections" | "seo"
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  const [subModalCategory, setSubModalCategory] = useState(null);
  const [subForm, setSubForm] = useState(emptySubcategory);

  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Categories & Collections ──
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, colRes] = await Promise.all([
        axios.get(`${API}/admin/categories`),
        axios.get(`${API}/admin/catalog/collections`).catch(() => ({ data: [] }))
      ]);
      const fetchedCats = catRes.data || [];
      // Sort by sort_order ascending
      fetchedCats.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setCategories(fetchedCats);
      setCollectionsList(colRes.data || []);
      if (onCategoryChange) onCategoryChange(fetchedCats);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [onCategoryChange]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Slug generation
  const handleNameChange = (name, isSub = false) => {
    const slugified = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (isSub) {
      setSubForm((prev) => ({ ...prev, name, slug: slugified }));
    } else {
      setCategoryForm((prev) => ({ ...prev, name, slug: slugified }));
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryForm({ ...emptyCategory, sort_order: categories.length + 1 });
    setModalTab("basic");
    setShowCategoryModal(true);
  };

  // Open Edit Modal
  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      bannerUrl: cat.bannerUrl || "",
      iconName: cat.iconName || "Sparkles",
      iconUrl: cat.iconUrl || "",
      featured: cat.featured ?? true,
      sort_order: cat.sort_order ?? 1,
      collections: cat.collections || [],
      subcategories: cat.subcategories || [],
      seo: {
        metaTitle: cat.seo?.metaTitle || "",
        metaDescription: cat.seo?.metaDescription || "",
        metaKeywords: cat.seo?.metaKeywords || [],
        canonicalUrl: cat.seo?.canonicalUrl || ""
      }
    });
    setModalTab("basic");
    setShowCategoryModal(true);
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        const catId = editingCategory.id || editingCategory._id;
        const res = await axios.put(`${API}/admin/categories/${catId}`, categoryForm);
        toast.success(`Category "${res.data.name}" updated! ✨`);
      } else {
        const res = await axios.post(`${API}/admin/categories`, categoryForm);
        toast.success(`Category "${res.data.name}" created! ✨`);
      }
      setShowCategoryModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  // Reorder Category Up/Down
  const handleMoveCategory = async (index, direction) => {
    const newCats = [...categories];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newCats.length) return;

    // Swap elements
    const temp = newCats[index];
    newCats[index] = newCats[targetIdx];
    newCats[targetIdx] = temp;

    // Assign new sort_orders
    const reorderItems = newCats.map((c, i) => ({
      id: c.id || c._id,
      sort_order: i + 1
    }));

    setCategories(newCats);

    try {
      await axios.put(`${API}/admin/categories/reorder`, reorderItems);
      toast.success("Sort order saved!");
    } catch {
      fetchCategories(); // revert on fail
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    try {
      await axios.delete(`${API}/admin/categories/${catId}`);
      toast.success(`Category "${catName}" deleted`);
      fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  // Add Subcategory
  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!subForm.name.trim() || !subModalCategory) return;
    setSubmitting(true);
    try {
      const catId = subModalCategory.id || subModalCategory._id;
      await axios.post(`${API}/admin/categories/${catId}/subcategories`, subForm);
      toast.success(`Subcategory "${subForm.name}" added! ✨`);
      setSubModalCategory(null);
      setSubForm(emptySubcategory);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add subcategory");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Subcategory
  const handleDeleteSubcategory = async (catId, subSlug, subName) => {
    if (!window.confirm(`Delete subcategory "${subName}"?`)) return;
    try {
      await axios.delete(`${API}/admin/categories/${catId}/subcategories/${subSlug}`);
      toast.success(`Subcategory "${subName}" removed`);
      fetchCategories();
    } catch {
      toast.error("Failed to delete subcategory");
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      (c.subcategories || []).some((s) => s.name?.toLowerCase().includes(q))
    );
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
                Category Architecture
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Custom Sort Order Enabled
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Advanced Category Management & SEO
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage categories, subcategories, hero banners, custom icons, collection mappings, SEO tags, and custom display sort order.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={openCreateModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-black/40 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories, subcategories, or collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
          />
        </div>
        <span className="text-xs font-bold text-[#8B7355] shrink-0">
          Showing {filteredCategories.length} categories
        </span>
      </div>

      {/* Categories Feed Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] p-6 space-y-2">
          <Layers className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="font-bold text-[#2D2118]">No categories found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((cat, idx) => {
            const catId = cat.id || cat._id;
            const subCount = cat.subcategories?.length || 0;
            const IconComponent = ICON_OPTIONS.find(i => i.name === cat.iconName)?.icon || Sparkles;

            return (
              <div
                key={catId}
                className="bg-white rounded-3xl border border-[#E8DFC9] shadow-sm hover:shadow transition overflow-hidden p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  
                  {/* Left: Icon, Cover, Name, Sort Order */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleMoveCategory(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-[#5C1E1E] disabled:opacity-20"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black text-[#5C1E1E] bg-[#FAF5EC] px-2 py-0.5 rounded-md border border-[#E8DFC9]">
                        #{cat.sort_order ?? idx + 1}
                      </span>
                      <button
                        onClick={() => handleMoveCategory(idx, "down")}
                        disabled={idx === filteredCategories.length - 1}
                        className="p-1 text-gray-400 hover:text-[#5C1E1E] disabled:opacity-20"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-[#E8DFC9] overflow-hidden shrink-0 relative">
                      <img src={cat.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c"} alt={cat.name} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 bg-[#5C1E1E] text-white p-1 rounded-lg">
                        <IconComponent className="w-3 h-3" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-[#2D2118]">{cat.name}</h3>
                        {cat.featured && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-300">
                            ⭐ Featured
                          </span>
                        )}
                        {cat.seo?.metaTitle && (
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            SEO Configured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8B7355] mt-0.5">{cat.description || "Luxury category collection"}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">slug: /{cat.slug}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="px-3.5 py-2 bg-[#FAF5EC] border border-[#E8DFC9] hover:bg-gray-100 text-[#2D2118] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#5C1E1E]" /> Edit Category & SEO
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(catId, cat.name)}
                      className="p-2 bg-white border border-[#E8DFC9] hover:bg-red-50 text-red-600 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories & Mapped Collections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#E8DFC9] text-xs">
                  {/* Subcategories */}
                  <div className="bg-[#FAF5EC]/60 p-3 rounded-2xl border border-[#E8DFC9] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold uppercase text-[10px] text-[#2D2118] tracking-wider">Subcategories ({subCount})</span>
                      <button onClick={() => { setSubModalCategory(cat); setSubForm(emptySubcategory); }} className="text-[#5C1E1E] font-bold text-[10px] hover:underline flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Add Sub
                      </button>
                    </div>
                    {subCount === 0 ? (
                      <p className="text-gray-400 italic text-[11px]">No subcategories defined</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subcategories.map((sub, sIdx) => (
                          <span key={sIdx} className="bg-white border border-[#E8DFC9] text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                            <span>{sub.name}</span>
                            <button onClick={() => handleDeleteSubcategory(catId, sub.slug, sub.name)} className="text-gray-400 hover:text-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Collections Mapping */}
                  <div className="bg-[#FAF5EC]/60 p-3 rounded-2xl border border-[#E8DFC9] space-y-2">
                    <span className="font-extrabold uppercase text-[10px] text-[#2D2118] tracking-wider block">Mapped Collections</span>
                    {(!cat.collections || cat.collections.length === 0) ? (
                      <p className="text-gray-400 italic text-[11px]">Not mapped to seasonal collections</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {cat.collections.map((colSlug, cIdx) => (
                          <span key={cIdx} className="bg-purple-100 border border-purple-300 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                            {colSlug}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ENHANCED CATEGORY & SEO MODAL ─── */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCategoryModal(false); }}
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8DFC9] relative space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#E8DFC9] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5C1E1E] text-white flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#2D2118]">{editingCategory ? "Edit Category Details" : "Add New Category"}</h3>
                <p className="text-xs text-[#8B7355]">Banners, Icons, Collections, and Category SEO</p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E8DFC9] gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab("basic")}
                className={`pb-2 border-b-2 transition ${modalTab === "basic" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}
              >
                1. Basic Info & Banners
              </button>
              <button
                type="button"
                onClick={() => setModalTab("collections")}
                className={`pb-2 border-b-2 transition ${modalTab === "collections" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}
              >
                2. Collections Mapping
              </button>
              <button
                type="button"
                onClick={() => setModalTab("seo")}
                className={`pb-2 border-b-2 transition ${modalTab === "seo" ? "border-[#5C1E1E] text-[#5C1E1E]" : "border-transparent text-gray-500"}`}
              >
                3. Category SEO Engine
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              {/* TAB 1: BASIC INFO & BANNERS */}
              {modalTab === "basic" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Category Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarees"
                        value={categoryForm.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-bold text-[#2D2118]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">URL Slug</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. sarees"
                        value={categoryForm.slug}
                        onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase() })}
                        className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-bold text-[#2D2118]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Category summary for storefront header..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-medium text-[#2D2118]"
                    />
                  </div>

                  {/* Icon Selector */}
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Category Navigation Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map((opt) => {
                        const IconComponent = opt.icon;
                        const isSelected = categoryForm.iconName === opt.name;
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => setCategoryForm({ ...categoryForm, iconName: opt.name })}
                            className={`p-2.5 rounded-xl border flex items-center gap-1.5 font-bold transition ${
                              isSelected ? "bg-[#5C1E1E] text-white border-[#5C1E1E]" : "bg-[#FAF5EC] text-[#2D2118] border-[#E8DFC9]"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span>{opt.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ImageUploader label="Category Thumbnail Image *" required={true} value={categoryForm.imageUrl} onChange={(url) => setCategoryForm({ ...categoryForm, imageUrl: url })} />
                    <ImageUploader label="Hero Banner Image (Landing Page)" required={false} value={categoryForm.bannerUrl} onChange={(url) => setCategoryForm({ ...categoryForm, bannerUrl: url })} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#8B7355] block mb-1">Display Sort Order Number</label>
                      <input
                        type="number"
                        min="1"
                        value={categoryForm.sort_order}
                        onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 1 })}
                        className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 font-bold text-[#2D2118]"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 font-bold text-[#2D2118] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoryForm.featured}
                          onChange={(e) => setCategoryForm({ ...categoryForm, featured: e.target.checked })}
                          className="accent-[#5C1E1E] w-4 h-4"
                        />
                        <span>Feature on Storefront Navigation</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COLLECTIONS MAPPING */}
              {modalTab === "collections" && (
                <div className="space-y-3">
                  <p className="text-gray-600">Select which active seasonal collections this Category belongs to:</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto p-2 bg-[#FAF5EC] rounded-2xl border border-[#E8DFC9]">
                    {collectionsList.map((col) => {
                      const colSlug = col.slug || col.name.toLowerCase().replace(/ /g, "-");
                      const isMapped = categoryForm.collections?.includes(colSlug);
                      return (
                        <label key={colSlug} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#E8DFC9] cursor-pointer">
                          <span className="font-bold text-[#2D2118]">{col.name} ({col.season})</span>
                          <input
                            type="checkbox"
                            checked={isMapped}
                            onChange={(e) => {
                              const newCols = e.target.checked
                                ? [...(categoryForm.collections || []), colSlug]
                                : (categoryForm.collections || []).filter(c => c !== colSlug);
                              setCategoryForm({ ...categoryForm, collections: newCols });
                            }}
                            className="accent-[#5C1E1E] w-4 h-4"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: CATEGORY SEO ENGINE */}
              {modalTab === "seo" && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">SEO Meta Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Handcrafted Luxury Silk Sarees | RIVAANTA"
                      value={categoryForm.seo?.metaTitle || ""}
                      onChange={(e) => setCategoryForm({ ...categoryForm, seo: { ...categoryForm.seo, metaTitle: e.target.value } })}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-semibold text-[#2D2118]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">SEO Meta Description</label>
                    <textarea
                      rows={3}
                      placeholder="Meta description summary for Google search snippet..."
                      value={categoryForm.seo?.metaDescription || ""}
                      onChange={(e) => setCategoryForm({ ...categoryForm, seo: { ...categoryForm.seo, metaDescription: e.target.value } })}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-medium text-[#2D2118]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl font-bold shadow-lg transition"
              >
                {submitting ? "Saving Category..." : "Save Category & Publish Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD SUBCATEGORY MODAL ─── */}
      {subModalCategory && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSubModalCategory(null); }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DFC9] relative space-y-4">
            <button onClick={() => setSubModalCategory(null)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">Add Subcategory under {subModalCategory.name}</h3>

            <form onSubmit={handleAddSubcategory} className="space-y-3 text-xs">
              <input type="text" required placeholder="Subcategory Name *" value={subForm.name} onChange={(e) => handleNameChange(e.target.value, true)} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <input type="text" placeholder="Description" value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-semibold" />
              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Add Subcategory</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
