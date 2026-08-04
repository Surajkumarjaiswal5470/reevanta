import React, { useState, useCallback, useMemo, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ImageUploader } from "../components/ImageUploader";
import { MultiImageUploader } from "../components/MultiImageUploader";
import { getCategoryFields, getDefaultReturnPolicy, getCategoryGroup } from "../utils/categoryFieldConfig";
import {
  Package, Tag, Sparkles, Eye, Zap, DollarSign, Truck, RotateCcw,
  PlusCircle, CheckCircle2, Boxes, ShieldCheck, Layers, ChevronDown, ChevronUp,
  Info, X, RefreshCw, Hash, Weight, Ruler, AlertCircle
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

// ─── Utility: Generate Random SKU ───
function generateRandomSKU(category) {
  const cat = (category || "GEN").slice(0, 3).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RV-${cat}-${rand}`;
}

// ─── Form Section Accordion Component ───
function FormSection({ title, icon: Icon, iconColor = "text-[#5C1E1E]", children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-[#E8DFC9] shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#FAF5EC]/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl bg-[#FAF5EC] flex items-center justify-center ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-black text-[#2D2118]">{title}</span>
          {badge && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#5C1E1E] text-white">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#8B7355]" /> : <ChevronDown className="w-4 h-4 text-[#8B7355]" />}
      </button>
      {open && <div className="px-4 pb-5 space-y-4 border-t border-[#E8DFC9]">{children}</div>}
    </div>
  );
}

// ─── Reusable Field Components ───
function FieldLabel({ label, required, unit }) {
  return (
    <label className="text-xs font-bold text-[#8B7355] flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
      {unit && <span className="text-[10px] font-semibold text-[#B8956A]">({unit})</span>}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, required, unit, type = "text", ...rest }) {
  return (
    <div>
      <FieldLabel label={label} required={required} unit={unit} />
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E] transition"
        {...rest}
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options, placeholder, required }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E] transition"
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function MultiSelectInput({ label, value = [], onChange, options, required }) {
  const toggle = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
              value.includes(opt)
                ? "bg-[#5C1E1E] text-white border-[#5C1E1E] shadow-sm"
                : "bg-[#FAF5EC] text-[#2D2118] border-[#E8DFC9] hover:border-[#5C1E1E]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleInput({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between p-2.5 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl cursor-pointer hover:border-[#5C1E1E] transition">
      <span className="text-xs font-bold text-[#2D2118]">{label}</span>
      <div className="relative">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-9 h-5 bg-gray-300 peer-checked:bg-[#5C1E1E] rounded-full transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow" />
      </div>
    </label>
  );
}

function TagsInput({ label, value = [], onChange, placeholder }) {
  const [inputVal, setInputVal] = useState("");
  const addTag = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputVal("");
    }
  };
  const removeTag = (idx) => onChange(value.filter((_, i) => i !== idx));
  return (
    <div>
      <FieldLabel label={label} />
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {value.map((tag, idx) => (
          <span key={`${tag}-${idx}`} className="flex items-center gap-1 bg-[#5C1E1E] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            {tag}
            <button type="button" onClick={() => removeTag(idx)} className="hover:text-red-300 transition">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
        <button type="button" onClick={addTag} className="px-3 py-2 bg-[#5C1E1E] text-white rounded-xl text-xs font-bold hover:bg-[#4A1717] transition active:scale-95">
          Add
        </button>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <FieldLabel label={label} />
      <div className="flex gap-2 items-center mt-1">
        <input
          type="color"
          value={value || "#B8956A"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-xl border border-[#E8DFC9] cursor-pointer"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
      </div>
    </div>
  );
}

function TextareaInput({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <textarea
        rows={3}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E] transition resize-none"
      />
    </div>
  );
}

// ─── Dynamic Category Field Renderer ───
function DynamicCategoryField({ field, value, onChange }) {
  switch (field.type) {
    case "text":
      return <TextInput label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} required={field.required} unit={field.unit} />;
    case "number":
      return <TextInput label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} required={field.required} unit={field.unit} type="number" min={0} step="any" />;
    case "select":
      return <SelectInput label={field.label} value={value} onChange={onChange} options={field.options} placeholder={field.placeholder} required={field.required} />;
    case "multiselect":
      return <MultiSelectInput label={field.label} value={value || []} onChange={onChange} options={field.options} required={field.required} />;
    case "toggle":
      return <ToggleInput label={field.label} value={value} onChange={onChange} />;
    case "tags":
      return <TagsInput label={field.label} value={value || []} onChange={onChange} placeholder={field.placeholder} />;
    case "color":
      return <ColorInput label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} />;
    case "textarea":
      return <TextareaInput label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} required={field.required} />;
    default:
      return <TextInput label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} />;
  }
}


// ════════════════════════════════════════════════════
//  MAIN: AddProductPage Component
// ════════════════════════════════════════════════════

export function AddProductPage({ dynamicCategories = [], loadData, setActiveTab }) {
  // ─── Form State ───
  const [form, setForm] = useState({
    name: "",
    brand: "RIVAANTA",
    category: dynamicCategories[0]?.slug || "sarees",
    sku: "",
    image: "",
    images: [],
    price: "",
    originalPrice: "",
    discountPercent: "",
    resellerMargin: 200,
    stock: 0,
    description: "",
    tags: [],
    inStock: true,
    isFlashSale: false,
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
    isNewArrival: true,
    categorySpecs: {},
    logistics: {
      weight_value: 0,
      weight_unit: "gm",
      length_cm: 0,
      width_cm: 0,
      height_cm: 0,
      packaging_type: "box",
      is_fragile: false,
      hs_code: "",
    },
    returnPolicy: {
      is_returnable: true,
      return_window_days: 15,
      exchange_only: false,
      conditions: "Unused with original tags intact. No washing, alteration, or damage.",
      non_returnable_reason: null,
    },
    deliveryInfo: {
      estimated_days_min: 3,
      estimated_days_max: 7,
      express_eligible: true,
      cod_eligible: true,
      free_shipping_eligible: true,
    },
  });

  const [submitting, setSubmitting] = useState(false);

  // ─── Derived ───
  const categoryFields = useMemo(() => getCategoryFields(form.category), [form.category]);
  const categoryGroup = useMemo(() => getCategoryGroup(form.category), [form.category]);

  // ─── Auto-calculate discount when prices change ───
  useEffect(() => {
    if (form.price && form.originalPrice && Number(form.originalPrice) > 0) {
      const disc = Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100);
      if (disc >= 0 && disc <= 100 && disc !== form.discountPercent) {
        setForm((prev) => ({ ...prev, discountPercent: disc }));
      }
    }
  }, [form.price, form.originalPrice]);

  // ─── Auto-update return policy when category changes ───
  useEffect(() => {
    const defaultReturn = getDefaultReturnPolicy(form.category);
    setForm((prev) => ({ ...prev, returnPolicy: defaultReturn, categorySpecs: {} }));
  }, [form.category]);

  // ─── Helpers ───
  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateSpec = (key, value) => setForm((prev) => ({ ...prev, categorySpecs: { ...prev.categorySpecs, [key]: value } }));
  const updateLogistics = (key, value) => setForm((prev) => ({ ...prev, logistics: { ...prev.logistics, [key]: value } }));
  const updateReturn = (key, value) => setForm((prev) => ({ ...prev, returnPolicy: { ...prev.returnPolicy, [key]: value } }));
  const updateDelivery = (key, value) => setForm((prev) => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, [key]: value } }));

  const autoSKU = () => updateField("sku", generateRandomSKU(form.category));

  // ─── Submit Handler ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.image) { toast.error("Primary product photo is required"); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error("Selling price must be greater than 0"); return; }
    if (!form.originalPrice || Number(form.originalPrice) <= 0) { toast.error("Original / MRP price is required"); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        discountPercent: Number(form.discountPercent) || 0,
        resellerMargin: Number(form.resellerMargin) || 0,
        stock: Number(form.stock) || 0,
        sizes: form.categorySpecs?.sizes_available || form.categorySpecs?.shoe_sizes || [],
        colors: form.categorySpecs?.colors_available || [],
        tags: Array.isArray(form.tags) ? form.tags : (form.tags || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
        rating: 0.0,
        reviewsCount: 0,
      };

      await axios.post(`${API}/products`, payload);
      toast.success(`Product "${form.name}" published to storefront! 🎉`);
      if (loadData) loadData();
      if (setActiveTab) setActiveTab("products");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* ═══════ LEFT: Form Sections (2 cols) ═══════ */}
      <div className="xl:col-span-2 space-y-4">

        {/* ── SECTION 1: Basic Info ── */}
        <FormSection title="Basic Product Information" icon={Package} defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            <TextInput label="Product Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g., Silk Anarkali Suit Set" required />
            <TextInput label="Brand" value={form.brand} onChange={(v) => updateField("brand", v)} placeholder="e.g., RIVAANTA Luxe" required />

            <div>
              <FieldLabel label="Category" required />
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E] transition"
              >
                {dynamicCategories.length > 0 ? (
                  dynamicCategories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug || c.name.toLowerCase()}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="sarees">Sarees</option>
                    <option value="lehengas">Lehengas</option>
                    <option value="kurtas">Kurtas</option>
                    <option value="clothes">Clothes</option>
                    <option value="jewelry">Jewelry</option>
                    <option value="cosmetics">Cosmetics</option>
                    <option value="makeup">Makeup & Cosmetics</option>
                    <option value="shampoo">Shampoo</option>
                    <option value="skincare">Skin Care</option>
                    <option value="perfume">Perfume & Fragrances</option>
                    <option value="shoes">Shoes & Sneakers</option>
                    <option value="bags">Bags & Accessories</option>
                  </>
                )}
              </select>

              {/* Category group badge */}
              {categoryGroup && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5C1E1E]/10 text-[#5C1E1E]">
                    {categoryFields?.icon} {categoryFields?.groupLabel}
                  </span>
                </div>
              )}
            </div>

            <div>
              <FieldLabel label="SKU (Stock Keeping Unit)" />
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-2.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                />
                <button type="button" onClick={autoSKU} className="px-3 py-2 bg-[#5C1E1E] text-white rounded-xl text-[11px] font-bold hover:bg-[#4A1717] transition active:scale-95 flex items-center gap-1" title="Auto-generate SKU">
                  <Hash className="w-3.5 h-3.5" /> Auto
                </button>
              </div>
            </div>
          </div>
        </FormSection>

        {/* ── SECTION 2: Media Gallery ── */}
        <FormSection title="Product Media Gallery" icon={Sparkles} badge={`${1 + form.images.length} photo(s)`}>
          <div className="pt-3 space-y-4">
            <div>
              <div className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider mb-1.5 flex items-center gap-1">
                <span className="w-5 h-5 rounded-md bg-[#5C1E1E] text-white flex items-center justify-center text-[9px] font-bold">1</span>
                PRIMARY HERO PHOTO
              </div>
              <ImageUploader
                label=""
                required={true}
                value={form.image}
                onChange={(url) => updateField("image", url)}
              />
            </div>

            <div>
              <div className="text-[10px] font-black uppercase text-[#8B7355] tracking-wider mb-1.5 flex items-center gap-1">
                <span className="w-5 h-5 rounded-md bg-[#B8956A] text-white flex items-center justify-center text-[9px] font-bold">2</span>
                GALLERY PHOTOS (Up to 8)
              </div>
              <MultiImageUploader
                label=""
                images={form.images}
                onChange={(imgs) => updateField("images", imgs)}
                maxImages={8}
              />
            </div>
          </div>
        </FormSection>

        {/* ── SECTION 3: Pricing & Inventory ── */}
        <FormSection title="Pricing & Inventory" icon={DollarSign} iconColor="text-emerald-600">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3">
            <TextInput label="Selling Price" value={form.price} onChange={(v) => updateField("price", v)} placeholder="e.g., 1299" required type="number" unit="₹" />
            <TextInput label="MRP / Original Price" value={form.originalPrice} onChange={(v) => updateField("originalPrice", v)} placeholder="e.g., 2499" required type="number" unit="₹" />
            <TextInput label="Discount" value={form.discountPercent} onChange={(v) => updateField("discountPercent", v)} placeholder="Auto" type="number" unit="%" />
            <TextInput label="Reseller Margin" value={form.resellerMargin} onChange={(v) => updateField("resellerMargin", v)} placeholder="e.g., 250" type="number" unit="₹" />
            <TextInput label="Stock Quantity" value={form.stock} onChange={(v) => updateField("stock", v)} placeholder="e.g., 50" type="number" min={0} />

            <div className="flex flex-col gap-2">
              <ToggleInput label="In Stock" value={form.inStock} onChange={(v) => updateField("inStock", v)} />
              <ToggleInput label="Flash Sale" value={form.isFlashSale} onChange={(v) => updateField("isFlashSale", v)} />
            </div>
          </div>

          {/* Badging toggles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
            <ToggleInput label="Featured" value={form.isFeatured} onChange={(v) => updateField("isFeatured", v)} />
            <ToggleInput label="Trending" value={form.isTrending} onChange={(v) => updateField("isTrending", v)} />
            <ToggleInput label="Best Seller" value={form.isBestSeller} onChange={(v) => updateField("isBestSeller", v)} />
            <ToggleInput label="New Arrival" value={form.isNewArrival} onChange={(v) => updateField("isNewArrival", v)} />
          </div>
        </FormSection>

        {/* ── SECTION 4: Category-Specific Specs (DYNAMIC) ── */}
        {categoryFields && (
          <FormSection
            title={categoryFields.groupLabel}
            icon={Layers}
            iconColor="text-purple-600"
            badge={categoryFields.icon}
            defaultOpen={true}
          >
            <div className="pt-3">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 mb-4">
                <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  These fields are specific to <strong>{categoryFields.groupLabel}</strong>. They help customers make better purchase decisions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryFields.fields.map((field) => (
                  <div key={field.key} className={field.type === "textarea" || field.type === "tags" || field.type === "multiselect" ? "md:col-span-2" : ""}>
                    <DynamicCategoryField
                      field={field}
                      value={form.categorySpecs[field.key]}
                      onChange={(val) => updateSpec(field.key, val)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </FormSection>
        )}

        {/* ── SECTION 5: Description & Tags ── */}
        <FormSection title="Description & Search Tags" icon={Tag} iconColor="text-amber-600">
          <div className="pt-3 space-y-4">
            <TextareaInput
              label="Product Description"
              value={form.description}
              onChange={(v) => updateField("description", v)}
              placeholder="Write a compelling product description that highlights features, benefits, and unique selling points..."
              required
            />
            <TagsInput
              label="Search Tags"
              value={form.tags}
              onChange={(v) => updateField("tags", v)}
              placeholder="Type a tag and press Enter (e.g., ethnic, festive, cotton)"
            />
          </div>
        </FormSection>

        {/* ── SECTION 6: Logistics & Shipping ── */}
        <FormSection title="Logistics & Shipping" icon={Truck} iconColor="text-blue-600" defaultOpen={false}>
          <div className="pt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel label="Product Weight" required />
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={form.logistics.weight_value || ""}
                    onChange={(e) => updateLogistics("weight_value", Number(e.target.value) || 0)}
                    placeholder="e.g., 250"
                    min={0}
                    step="any"
                    className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-2.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                  />
                  <select
                    value={form.logistics.weight_unit}
                    onChange={(e) => updateLogistics("weight_unit", e.target.value)}
                    className="w-16 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-1 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
                  >
                    <option value="gm">gm</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <TextInput label="Length" value={form.logistics.length_cm || ""} onChange={(v) => updateLogistics("length_cm", v)} placeholder="cm" type="number" unit="cm" />
              <TextInput label="Width" value={form.logistics.width_cm || ""} onChange={(v) => updateLogistics("width_cm", v)} placeholder="cm" type="number" unit="cm" />
              <TextInput label="Height" value={form.logistics.height_cm || ""} onChange={(v) => updateLogistics("height_cm", v)} placeholder="cm" type="number" unit="cm" />

              <SelectInput
                label="Packaging Type"
                value={form.logistics.packaging_type}
                onChange={(v) => updateLogistics("packaging_type", v)}
                options={["Box", "Envelope", "Poly Bag", "Bubble Wrap", "Gift Box"]}
                placeholder="Select..."
              />

              <TextInput label="HS Code" value={form.logistics.hs_code} onChange={(v) => updateLogistics("hs_code", v)} placeholder="For customs/international" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-3">
              <ToggleInput label="Fragile Item" value={form.logistics.is_fragile} onChange={(v) => updateLogistics("is_fragile", v)} />
            </div>

            {/* Delivery Info */}
            <div className="mt-4 pt-4 border-t border-[#E8DFC9]">
              <div className="text-xs font-black text-[#2D2118] mb-3 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" /> Delivery Configuration
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <TextInput label="Min Delivery Days" value={form.deliveryInfo.estimated_days_min} onChange={(v) => updateDelivery("estimated_days_min", v)} type="number" min={1} />
                <TextInput label="Max Delivery Days" value={form.deliveryInfo.estimated_days_max} onChange={(v) => updateDelivery("estimated_days_max", v)} type="number" min={1} />
                <div className="flex flex-col gap-2">
                  <ToggleInput label="Express Eligible" value={form.deliveryInfo.express_eligible} onChange={(v) => updateDelivery("express_eligible", v)} />
                  <ToggleInput label="COD Available" value={form.deliveryInfo.cod_eligible} onChange={(v) => updateDelivery("cod_eligible", v)} />
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        {/* ── SECTION 7: Return & Exchange Policy ── */}
        <FormSection title="Return & Exchange Policy" icon={RotateCcw} iconColor="text-orange-600" defaultOpen={false}>
          <div className="pt-3 space-y-4">
            {/* Non-returnable warning */}
            {!form.returnPolicy.is_returnable && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Non-Returnable Category</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">{form.returnPolicy.non_returnable_reason || "This product category is marked as non-returnable due to hygiene and safety policies."}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleInput label="Returnable" value={form.returnPolicy.is_returnable} onChange={(v) => updateReturn("is_returnable", v)} />
              <ToggleInput label="Exchange Only (No Refund)" value={form.returnPolicy.exchange_only} onChange={(v) => updateReturn("exchange_only", v)} />

              {form.returnPolicy.is_returnable && (
                <SelectInput
                  label="Return Window"
                  value={String(form.returnPolicy.return_window_days)}
                  onChange={(v) => updateReturn("return_window_days", Number(v))}
                  options={["7", "10", "15", "30"]}
                  placeholder="Select days"
                />
              )}
            </div>

            <TextareaInput
              label="Return Conditions"
              value={form.returnPolicy.conditions}
              onChange={(v) => updateReturn("conditions", v)}
              placeholder="e.g., Unused with original tags and packaging intact. No alteration."
            />
          </div>
        </FormSection>

        {/* ── Submit Button ── */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-[#5C1E1E] to-[#4A1717] hover:from-[#4A1717] hover:to-[#3A1010] text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#5C1E1E]/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Publishing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Publish Product to Storefront
            </>
          )}
        </button>
      </div>

      {/* ═══════ RIGHT: Live Preview Sidebar ═══════ */}
      <div className="space-y-4">
        <div className="sticky top-4 space-y-4">

          {/* Preview Header */}
          <div className="text-xs font-black uppercase tracking-wider text-[#8B7355] flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#5C1E1E]" /> Storefront Live Preview
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-[#E8DFC9] shadow-xl p-4 space-y-3 relative">
            <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={form.image || "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800"}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {form.discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-[#5C1E1E] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                  {form.discountPercent}% OFF
                </span>
              )}
              {form.isFlashSale && (
                <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-white" /> FLASH
                </span>
              )}
              {form.isNewArrival && (
                <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  NEW
                </span>
              )}
            </div>

            <div>
              <div className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">
                {form.brand || "BRAND"} · {form.category}
              </div>
              <h4 className="font-bold text-sm text-[#2D2118] line-clamp-2">
                {form.name || "Product Name Preview"}
              </h4>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-black text-[#2D2118]">₹{form.price || 0}</span>
              {form.originalPrice && (
                <span className="text-xs text-[#8B7355] line-through">₹{form.originalPrice}</span>
              )}
            </div>

            {/* Gallery Preview */}
            {form.images.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {form.images.slice(0, 4).map((img, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-[#E8DFC9] shrink-0">
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {form.images.length > 4 && (
                  <div className="w-12 h-12 rounded-lg bg-[#FAF5EC] border border-[#E8DFC9] flex items-center justify-center text-[10px] font-bold text-[#5C1E1E] shrink-0">
                    +{form.images.length - 4}
                  </div>
                )}
              </div>
            )}

            {/* Reseller Margin Preview */}
            {form.resellerMargin > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-2 text-xs text-purple-700 flex justify-between items-center">
                <span>Reseller Profit:</span>
                <span className="font-bold text-purple-900">₹{form.resellerMargin}</span>
              </div>
            )}

            {/* SKU badge */}
            {form.sku && (
              <div className="text-[10px] text-[#8B7355] font-mono bg-[#FAF5EC] px-2 py-1 rounded border border-[#E8DFC9] truncate">
                SKU: {form.sku}
              </div>
            )}

            <div className="w-full bg-[#2D2118] text-white text-xs font-bold py-2.5 rounded-xl text-center">
              Add to Bag
            </div>
          </div>

          {/* Product Summary Stats */}
          <div className="bg-white rounded-2xl border border-[#E8DFC9] p-4 space-y-3">
            <h4 className="text-xs font-black text-[#2D2118]">Product Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8B7355]">Category Group</span>
                <span className="font-bold text-[#2D2118]">{categoryFields?.icon || "📦"} {categoryGroup || "General"}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8B7355]">Gallery Photos</span>
                <span className="font-bold text-[#2D2118]">{1 + form.images.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8B7355]">Specs Filled</span>
                <span className="font-bold text-[#2D2118]">
                  {Object.keys(form.categorySpecs).filter(k => {
                    const v = form.categorySpecs[k];
                    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
                  }).length}
                  {categoryFields ? ` / ${categoryFields.fields.length}` : ""}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8B7355]">Returnable</span>
                <span className={`font-bold ${form.returnPolicy.is_returnable ? "text-emerald-600" : "text-red-600"}`}>
                  {form.returnPolicy.is_returnable ? `Yes (${form.returnPolicy.return_window_days} days)` : "No"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8B7355]">COD Eligible</span>
                <span className={`font-bold ${form.deliveryInfo.cod_eligible ? "text-emerald-600" : "text-red-600"}`}>
                  {form.deliveryInfo.cod_eligible ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#8B7355]">Stock</span>
                <span className="font-bold text-[#2D2118]">{form.stock || 0} units</span>
              </div>
            </div>
          </div>

          {/* Delivery Badge */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-800 space-y-1.5">
            <div className="font-bold flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery Estimate</div>
            <p className="text-[11px]">
              {form.deliveryInfo.estimated_days_min}-{form.deliveryInfo.estimated_days_max} business days
              {form.deliveryInfo.express_eligible && " · Express available"}
            </p>
          </div>

        </div>
      </div>
    </form>
  );
}
