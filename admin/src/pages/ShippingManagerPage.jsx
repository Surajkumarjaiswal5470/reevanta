import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Truck, Globe, DollarSign, ShieldCheck, Plus, Trash2, Edit, Check, X,
  RefreshCw, MapPin, Clock, CreditCard, ExternalLink, Zap, Layers, Sparkles, AlertCircle
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const emptyZone = {
  name: "",
  code: "",
  regions: ["Kathmandu", "Lalitpur", "Bhaktapur"],
  free_shipping_threshold: 1499,
  cod_available: true,
  is_active: true,
  sort_order: 1,
  methods: [
    {
      method_id: "exp-01",
      name: "Same-Day Express Delivery",
      delivery_time_text: "Same Day (Within 12 Hours)",
      base_charge: 100,
      courier_partner: "Nepal Express",
      weight_charge_per_kg: 0,
      cod_fee: 0,
      is_active: true
    }
  ]
};

export function ShippingManagerPage() {
  const [activeTab, setActiveTab] = useState("zones"); // "zones" | "methods" | "couriers" | "cod"
  const [zones, setZones] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState(emptyZone);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Zones & Couriers ──
  const fetchShippingData = useCallback(async () => {
    setLoading(true);
    try {
      const [zRes, cRes] = await Promise.all([
        axios.get(`${API}/admin/shipping/zones`),
        axios.get(`${API}/admin/shipping/couriers`).catch(() => ({ data: [] }))
      ]);
      setZones(zRes.data || []);
      setCouriers(cRes.data || []);
    } catch {
      toast.error("Failed to load shipping & logistics configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShippingData();
  }, [fetchShippingData]);

  // Open Create Zone Modal
  const openCreateZoneModal = () => {
    setEditingZone(null);
    setZoneForm(emptyZone);
    setShowZoneModal(true);
  };

  // Open Edit Zone Modal
  const openEditZoneModal = (zone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name || "",
      code: zone.code || "",
      regions: zone.regions || [],
      free_shipping_threshold: zone.free_shipping_threshold ?? 1499,
      cod_available: zone.cod_available ?? true,
      is_active: zone.is_active ?? true,
      sort_order: zone.sort_order || 1,
      methods: zone.methods || []
    });
    setShowZoneModal(true);
  };

  // Save Zone Form
  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!zoneForm.name.trim()) {
      toast.error("Zone name is required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingZone) {
        const zId = editingZone.id || editingZone._id;
        await axios.put(`${API}/admin/shipping/zones/${zId}`, zoneForm);
        toast.success(`Shipping zone '${zoneForm.name}' updated! 🚚`);
      } else {
        await axios.post(`${API}/admin/shipping/zones`, zoneForm);
        toast.success(`New Shipping zone '${zoneForm.name}' created! 🚚`);
      }
      setShowZoneModal(false);
      fetchShippingData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save shipping zone");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Zone
  const handleDeleteZone = async (zId, name) => {
    if (!window.confirm(`Delete shipping zone "${name}"?`)) return;
    try {
      await axios.delete(`${API}/admin/shipping/zones/${zId}`);
      toast.success(`Shipping zone "${name}" deleted`);
      fetchShippingData();
    } catch {
      toast.error("Failed to delete shipping zone");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#3A2C21] to-[#1F1810] text-[#FAF5EC] p-5 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#B8956A] text-[#2D2118] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                Logistics & Delivery Suite
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {zones.length} Shipping Zones Configured
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Shipping & Logistics Management
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage shipping zones, delivery methods, base & weight rates, courier partners, free shipping rules, and Cash-On-Delivery (COD) settings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateZoneModal}
              className="flex items-center gap-1.5 bg-[#5C1E1E] hover:bg-[#4A1717] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Shipping Zone
            </button>
            <button onClick={fetchShippingData} disabled={loading} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {[
            { id: "zones", label: `Shipping Zones (${zones.length})`, icon: Globe },
            { id: "methods", label: "Methods & Rates", icon: Truck },
            { id: "couriers", label: `Courier Partners (${couriers.length})`, icon: MapPin },
            { id: "cod", label: "Free Shipping & COD Rules", icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeTab === t.id
                    ? "bg-[#FAF5EC] text-[#2D2118] font-black shadow-md"
                    : "bg-white/10 text-gray-200 hover:bg-white/20"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeTab === t.id ? "text-[#5C1E1E]" : "text-gray-300"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* TAB 1: SHIPPING ZONES */}
          {activeTab === "zones" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map((zone) => {
                const zId = zone.id || zone._id;
                return (
                  <div key={zId} className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DFC9] shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#5C1E1E] bg-[#FAF5EC] px-2.5 py-0.5 rounded-lg border border-[#E8DFC9]">
                            {zone.code}
                          </span>
                          <h3 className="font-black text-base text-[#2D2118]">{zone.name}</h3>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${zone.cod_available ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-gray-100 text-gray-600 border-gray-300"}`}>
                          {zone.cod_available ? "COD Enabled" : "Prepaid Only"}
                        </span>
                      </div>

                      <div className="pt-3 space-y-2 text-xs">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold text-[#8B7355] block w-full mb-1">Regions Covered:</span>
                          {(zone.regions || []).map((r, i) => (
                            <span key={i} className="bg-[#FAF5EC] text-[#2D2118] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#E8DFC9]">
                              {r}
                            </span>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-2 text-[#2D2118]">
                          <span className="font-bold">Free Shipping Threshold:</span>
                          <span className="font-black text-[#5C1E1E]">Free on orders ≥ ₹{zone.free_shipping_threshold}</span>
                        </div>

                        <div className="flex justify-between items-center text-[#2D2118]">
                          <span className="font-bold">Active Methods:</span>
                          <span className="font-bold text-purple-700">{(zone.methods || []).length} delivery options</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E8DFC9] flex justify-end gap-2">
                      <button onClick={() => openEditZoneModal(zone)} className="bg-[#FAF5EC] border border-[#E8DFC9] text-[#2D2118] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1">
                        <Edit className="w-3.5 h-3.5 text-[#5C1E1E]" /> Edit Zone
                      </button>
                      <button onClick={() => handleDeleteZone(zId, zone.name)} className="p-1.5 bg-white border border-[#E8DFC9] hover:bg-red-50 text-red-600 rounded-xl transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: METHODS & RATES */}
          {activeTab === "methods" && (
            <div className="space-y-4">
              {zones.map((zone) => (
                <div key={zone.code} className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-3">
                  <h3 className="font-black text-base text-[#2D2118] border-b border-[#E8DFC9] pb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#5C1E1E]" /> {zone.name} Methods & Delivery Rates
                  </h3>

                  <div className="space-y-2 text-xs">
                    {(zone.methods || []).map((m, idx) => (
                      <div key={idx} className="bg-[#FAF5EC] p-3.5 rounded-2xl border border-[#E8DFC9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#2D2118]">{m.name}</span>
                            <span className="bg-purple-100 text-purple-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{m.courier_partner}</span>
                          </div>
                          <span className="text-gray-500 text-[11px] block mt-0.5">ETA: {m.delivery_time_text}</span>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-[#5C1E1E] text-sm block">₹{m.base_charge} Base Fee</span>
                          {m.weight_charge_per_kg > 0 && <span className="text-[10px] text-gray-500 font-bold">+ ₹{m.weight_charge_per_kg}/kg weight fee</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: COURIER PARTNERS */}
          {activeTab === "couriers" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {couriers.map((c, i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-[#E8DFC9] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-base text-[#2D2118]">{c.name}</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Partner Connected</span>
                  </div>

                  <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] space-y-1 text-xs">
                    <span className="text-[10px] font-black uppercase text-[#8B7355]">Tracking URL Pattern</span>
                    <p className="font-mono text-[11px] text-gray-700 break-all">{c.tracking_url_template}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: FREE SHIPPING & COD RULES */}
          {activeTab === "cod" && (
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] space-y-4 text-xs">
              <h3 className="font-black text-base text-[#2D2118]">Global Free Shipping & Cash-On-Delivery Policies</h3>
              <p className="text-gray-600">
                Free shipping thresholds automatically trigger across checkout when customer cart total reaches zone limit. COD availability is dynamically restricted per delivery region.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#8B7355]">Kathmandu Valley Rule</span>
                  <p className="font-black text-[#5C1E1E] text-sm">Free Express Shipping & COD Enabled &gt; ₹1,499</p>
                </div>
                <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#8B7355]">Nepal National Outer Rule</span>
                  <p className="font-black text-[#5C1E1E] text-sm">Free Standard Delivery & COD Enabled &gt; ₹2,999</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── ADD/EDIT ZONE MODAL ─── */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9] relative">
            <button onClick={() => setShowZoneModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">{editingZone ? "Edit Shipping Zone" : "Create New Shipping Zone"}</h3>

            <form onSubmit={handleSaveZone} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#8B7355] block mb-1">Zone Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathmandu Valley Zone"
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                    className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#8B7355] block mb-1">Zone Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KTM_VALLEY"
                    value={zoneForm.code}
                    onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-mono font-bold text-[#5C1E1E]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#8B7355] block mb-1">Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  value={zoneForm.free_shipping_threshold}
                  onChange={(e) => setZoneForm({ ...zoneForm, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold"
                />
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={zoneForm.cod_available}
                  onChange={(e) => setZoneForm({ ...zoneForm, cod_available: e.target.checked })}
                  className="accent-[#5C1E1E] w-4 h-4"
                />
                <span>Enable Cash-On-Delivery (COD) for this Zone</span>
              </label>

              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3.5 rounded-2xl font-bold shadow-lg transition">
                {submitting ? "Saving Zone..." : "Save Shipping Zone"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
