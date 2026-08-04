import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ImageUploader } from "../components/ImageUploader";
import {
  Layers, Plus, Trash2, Edit, Star, Check, X, Search,
  RefreshCw, Sparkles, FolderPlus, Tag, ChevronRight, Eye
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800",
  featured: true,
  subcategories: []
};

const emptySubcategory = {
  name: "",
  slug: "",
  description: "",
  imageUrl: ""
};

export function CategoriesPage({ onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // Null = create
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  const [subModalCategory, setSubModalCategory] = useState(null); // Category to add subcategory to
  const [subForm, setSubForm] = useState(emptySubcategory);

  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Categories ──
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/categories`);
      setCategories(res.data || []);
      if (onCategoryChange) onCategoryChange(res.data || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [onCategoryChange]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto generate slug from name
  const handleNameChange = (name, isSub = false) => {
    const slugified = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (isSub) {
      setSubForm((prev) => ({ ...prev, name, slug: slugified }));
    } else {
      setCategoryForm((prev) => ({ ...prev, name, slug: slugified }));
    }
  };

  // Open Create Category Modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
    setShowCategoryModal(true);
  };

  // Open Edit Category Modal
  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      featured: cat.featured ?? true,
      subcategories: cat.subcategories || []
    });
    setShowCategoryModal(true);
  };

  // Save Category (Create or Edit)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        // Update
        const res = await axios.put(`${API}/admin/categories/${editingCategory.id || editingCategory._id}`, categoryForm);
        toast.success(`Category "${res.data.name}" updated successfully! ✨`);
      } else {
        // Create
        const res = await axios.post(`${API}/admin/categories`, categoryForm);
        toast.success(`Category "${res.data.name}" created successfully! ✨`);
      }
      setShowCategoryModal(false);
      fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to save category";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      await axios.delete(`${API}/admin/categories/${catId}`);
      toast.success(`Category "${catName}" deleted`);
      fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  // Add Subcategory Submit
  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!subForm.name.trim() || !subModalCategory) {
      toast.error("Subcategory name is required");
      return;
    }

    setSubmitting(true);
    try {
      const catId = subModalCategory.id || subModalCategory._id;
      await axios.post(`${API}/admin/categories/${catId}/subcategories`, subForm);
      toast.success(`Subcategory "${subForm.name}" added under ${subModalCategory.name}! ✨`);
      setSubModalCategory(null);
      setSubForm(emptySubcategory);
      fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to add subcategory";
      toast.error(msg);
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
    const nameMatch = c.name?.toLowerCase().includes(q);
    const slugMatch = c.slug?.toLowerCase().includes(q);
    const subMatch = (c.subcategories || []).some((s) => s.name?.toLowerCase().includes(q));
    return nameMatch || slugMatch || subMatch;
  });

  const totalSubcategories = categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0);
  const featuredCount = categories.filter((c) => c.featured).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-white p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Catalog Management
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Real-time Sync
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Categories & Subcategories Control
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage luxury product categories, organize subcategory tags, set featured badges, and control catalog dropdown options.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={openCreateModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-black/40 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Total Categories</span>
            <span className="text-2xl font-black text-[#2D2118]">{categories.length}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Featured Categories</span>
            <span className="text-2xl font-black text-amber-700">{featuredCount}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E8DFC9] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider block">Total Subcategories</span>
            <span className="text-2xl font-black text-emerald-700">{totalSubcategories}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-sm flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories or subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
          />
        </div>
        <span className="text-xs font-bold text-[#8B7355] shrink-0">
          Showing {filteredCategories.length} categories
        </span>
      </div>

      {/* Category Cards Feed */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#8B7355] mt-3">Loading catalog categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E8DFC9] space-y-3 p-6">
          <Layers className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-[#2D2118]">No categories match your search</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try creating a new category using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => {
            const catId = cat.id || cat._id;
            const subCount = cat.subcategories?.length || 0;

            return (
              <div
                key={catId}
                className="bg-white rounded-3xl border border-[#E8DFC9] shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
              >
                {/* Header Cover Image */}
                <div className="h-40 relative bg-gray-100 overflow-hidden">
                  <img
                    src={cat.imageUrl || "https://images.unsplash.com/photo-1610030469983-98e550d6193c"}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    {cat.featured ? (
                      <span className="bg-amber-400 text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#2D2118]" /> Featured
                      </span>
                    ) : (
                      <span className="bg-white/80 text-gray-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                        Standard
                      </span>
                    )}

                    <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {subCount} subcategories
                    </span>
                  </div>

                  {/* Name Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-lg font-black">{cat.name}</h3>
                    <p className="text-[11px] text-amber-200 font-mono">slug: /{cat.slug}</p>
                  </div>
                </div>

                {/* Description & Subcategories List */}
                <div className="p-5 space-y-4 flex-1">
                  {cat.description && (
                    <p className="text-xs text-[#8B7355] leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  )}

                  {/* Subcategories Pills */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-[#2D2118] mb-2">
                      <span>Subcategories ({subCount})</span>
                      <button
                        onClick={() => { setSubModalCategory(cat); setSubForm(emptySubcategory); }}
                        className="text-[#5C1E1E] hover:underline flex items-center gap-1 font-bold text-[10px]"
                      >
                        <Plus className="w-3 h-3" /> Add Sub
                      </button>
                    </div>

                    {subCount === 0 ? (
                      <p className="text-[11px] text-gray-400 italic bg-[#FAF5EC] p-2.5 rounded-xl border border-dashed border-[#E8DFC9] text-center">
                        No subcategories added yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {cat.subcategories.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-[#FAF5EC] text-[#2D2118] border border-[#E8DFC9] text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 group/sub"
                          >
                            <span>{sub.name}</span>
                            <button
                              onClick={() => handleDeleteSubcategory(catId, sub.slug, sub.name)}
                              className="text-gray-400 hover:text-red-600 transition"
                              title="Delete subcategory"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-[#FAF5EC]/60 border-t border-[#E8DFC9] flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="flex-1 bg-white border border-[#E8DFC9] hover:bg-gray-50 text-[#2D2118] py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#5C1E1E]" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(catId, cat.name)}
                    className="p-2 bg-white border border-[#E8DFC9] hover:bg-red-50 text-red-600 rounded-xl transition shadow-sm"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE / EDIT CATEGORY MODAL ─── */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCategoryModal(false); }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E8DFC9] relative space-y-4 my-auto">
            
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#E8DFC9] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#5C1E1E] text-white flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#2D2118]">
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </h3>
                <p className="text-xs text-[#8B7355]">Configure category details for product catalog</p>
              </div>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#8B7355] block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarees, Ethnic Gowns"
                  value={categoryForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-bold text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355] block mb-1">URL Slug (Auto-generated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sarees"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase() })}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-bold text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355] block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Short summary of this luxury collection..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-medium text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <ImageUploader
                  label="Category Cover Photo *"
                  required={true}
                  value={categoryForm.imageUrl}
                  onChange={(url) => setCategoryForm({ ...categoryForm, imageUrl: url })}
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#FAF5EC] rounded-xl border border-[#E8DFC9]">
                <input
                  type="checkbox"
                  id="featured-cat"
                  checked={categoryForm.featured}
                  onChange={(e) => setCategoryForm({ ...categoryForm, featured: e.target.checked })}
                  className="accent-[#5C1E1E] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="featured-cat" className="text-xs font-bold text-[#2D2118] cursor-pointer flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>Feature on Storefront Homepage & Navigation</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Category...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingCategory ? "Save Category Changes" : "Create & Publish Category"}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD SUBCATEGORY MODAL ─── */}
      {subModalCategory && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setSubModalCategory(null); }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DFC9] relative space-y-4 my-auto">
            <button
              onClick={() => setSubModalCategory(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#E8DFC9] pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#5C1E1E] text-white flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#2D2118]">Add Subcategory</h3>
                <p className="text-[11px] text-[#8B7355]">Under parent category: <strong>{subModalCategory.name}</strong></p>
              </div>
            </div>

            <form onSubmit={handleAddSubcategory} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#8B7355] block mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Banarasi Silk, Velvet Dupattas"
                  value={subForm.name}
                  onChange={(e) => handleNameChange(e.target.value, true)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-bold text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="font-bold text-[#8B7355] block mb-1">Subcategory Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. banarasi-silk"
                  value={subForm.slug}
                  onChange={(e) => setSubForm({ ...subForm, slug: e.target.value.toLowerCase() })}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-bold text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <div>
                <label className="font-bold text-[#8B7355] block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pure handwoven Banarasi silk weaves"
                  value={subForm.description}
                  onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 font-semibold text-[#2D2118] focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3 rounded-2xl font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? "Adding..." : `Add Subcategory to ${subModalCategory.name}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
