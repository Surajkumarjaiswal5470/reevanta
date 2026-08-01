import React, { useState } from "react";
import { Plus, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function AddProductPage({ onSaveProduct, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "cosmetics",
    subCategory: "lipstick",
    brand: "RIVAANTA",
    price: "",
    originalPrice: "",
    resellerMargin: "200",
    image: "",
    description: "",
    sizes: "S, M, L, XL",
    tags: "cosmetics, lipstick, beauty",
    inStock: true,
    isFlashSale: false,
    badge: "NEW"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.image) {
      toast.error("Please fill in all required fields (Name, Price, Image URL)");
      return;
    }
    onSaveProduct(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm">
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-2xl bg-[#FAF5EC] flex items-center justify-center text-[#2D2118] hover:bg-[#5C1E1E] hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-[#2D2118]">Add New Product Item</h2>
          <p className="text-xs text-gray-500">Fill in product specifications, pricing, and live image URL.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-gray-700 block mb-1">Product Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Royal Matte Red Lipstick"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-extrabold text-gray-700 block mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
            >
              <option value="cosmetics">Cosmetics</option>
              <option value="beauty-care">Beauty Care</option>
              <option value="sarees">Sarees</option>
              <option value="kurtas">Kurtas & Suits</option>
              <option value="lehenga">Lehenga</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-gray-700 block mb-1">Brand Name</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="font-extrabold text-gray-700 block mb-1">Selling Price (₹) *</label>
            <input
              type="number"
              required
              placeholder="1299"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
            />
          </div>

          <div>
            <label className="font-extrabold text-gray-700 block mb-1">Original Price (₹)</label>
            <input
              type="number"
              placeholder="2499"
              value={formData.originalPrice}
              onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
            />
          </div>

          <div>
            <label className="font-extrabold text-gray-700 block mb-1">Reseller Margin (₹)</label>
            <input
              type="number"
              placeholder="200"
              value={formData.resellerMargin}
              onChange={(e) => setFormData({ ...formData, resellerMargin: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
            />
          </div>
        </div>

        <div>
          <label className="font-extrabold text-gray-700 block mb-1">Image URL *</label>
          <input
            type="url"
            required
            placeholder="https://images.unsplash.com/photo-..."
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
          />
          {formData.image && (
            <div className="mt-2 flex items-center gap-3 bg-[#FAF5EC] p-2 rounded-2xl border border-[#E8DFC9]">
              <img src={formData.image} alt="Preview" className="w-12 h-12 object-cover rounded-xl" />
              <span className="text-[10px] text-gray-500 font-bold">Live Image Preview Verified</span>
            </div>
          )}
        </div>

        <div>
          <label className="font-extrabold text-gray-700 block mb-1">Description</label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#5C1E1E]"
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
            <input
              type="checkbox"
              checked={formData.inStock}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
              className="w-4 h-4 rounded text-[#5C1E1E]"
            />
            <span>In Stock</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
            <input
              type="checkbox"
              checked={formData.isFlashSale}
              onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })}
              className="w-4 h-4 rounded text-[#5C1E1E]"
            />
            <span>Flash Sale ⚡</span>
          </label>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#5C1E1E] text-white py-3 rounded-xl font-bold hover:bg-[#2D2118] shadow-md transition active:scale-95"
          >
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
}
