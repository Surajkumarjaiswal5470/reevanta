import React, { useEffect, useRef, useState } from "react";
import { searchPlacesMapTiler, reverseGeocodeMapTiler, getMapTilerStaticMapUrl } from "../hooks/useMapTiler";
import { MapPin, Locate, Loader2, Search, Plus, Check, Trash2, Navigation, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../services/api";

export const AddressAutocomplete = ({ value, onChange, onSelect, placeholder = "Search location in Nepal (Kathmandu, Pokhara...)" }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchPlacesMapTiler(value);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const handlePick = (item) => {
    onChange(item.formatted || item.line1);
    setShowDropdown(false);
    if (onSelect) onSelect(item);
  };

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8B7355]">
        {searching ? <Loader2 className="w-4 h-4 animate-spin text-[#5C1E1E]" /> : <Search className="w-4 h-4" />}
      </span>
      <input
        data-testid="address-autocomplete-input"
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E] shadow-inner"
      />

      {/* MapTiler Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#E8DFC9] rounded-2xl shadow-xl overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePick(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-[#FAF5EC] transition flex items-start gap-2.5"
            >
              <MapPin className="w-4 h-4 text-[#5C1E1E] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#2D2118]">{item.line1}</p>
                <p className="text-[10px] text-gray-500 line-clamp-1">{item.formatted}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const UseCurrentLocationButton = ({ onLocated }) => {
  const [loading, setLoading] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const parsed = await reverseGeocodeMapTiler(latitude, longitude);
          onLocated({
            ...parsed,
            lat: latitude,
            lng: longitude
          });
        } catch (e) {
          toast.error("Failed to detect address: " + e.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        toast.error("Location access denied: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <button
      data-testid="use-current-location-btn"
      type="button"
      onClick={handleDetectLocation}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#5C1E1E] to-[#B8956A] hover:opacity-95 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-[#5C1E1E]/30 transition disabled:opacity-70"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
      <span>{loading ? "Detecting location via MapTiler..." : "Use my current location"}</span>
    </button>
  );
};

export const LocationMapPreview = ({ lat, lng, height = 160 }) => {
  if (lat == null || lng == null) return null;
  const staticMapUrl = getMapTilerStaticMapUrl(lat, lng, 600, height, 15);

  return (
    <div
      data-testid="location-map-preview"
      className="w-full rounded-xl border border-[#E8DFC9] overflow-hidden shadow-inner relative bg-[#FAF5EC]"
      style={{ height }}
    >
      <img
        src={staticMapUrl}
        alt="MapTiler Location Preview"
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-[#2D2118]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur flex items-center gap-1">
        <Navigation className="w-3 h-3 text-amber-300" />
        <span>MapTiler Verified Location</span>
      </div>
    </div>
  );
};

export const AddressForm = ({ address, onChange }) => {
  const set = (k, v) => onChange({ ...address, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-bold text-[#8B7355]">Full Name</label>
        <input
          data-testid="addr-fullname-input"
          type="text"
          value={address.fullName || ""}
          onChange={(e) => set("fullName", e.target.value)}
          className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#8B7355]">Phone</label>
        <input
          data-testid="addr-phone-input"
          type="text"
          value={address.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
          className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-bold text-[#8B7355]">Address Line</label>
        <input
          data-testid="addr-line1-input"
          type="text"
          value={address.line1 || ""}
          onChange={(e) => set("line1", e.target.value)}
          className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-bold text-[#8B7355]">Apartment / Landmark (optional)</label>
        <input
          data-testid="addr-line2-input"
          type="text"
          value={address.line2 || ""}
          onChange={(e) => set("line2", e.target.value)}
          className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#8B7355]">City</label>
        <input
          data-testid="addr-city-input"
          type="text"
          value={address.city || ""}
          onChange={(e) => set("city", e.target.value)}
          className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#8B7355]">State</label>
        <input
          data-testid="addr-state-input"
          type="text"
          value={address.state || ""}
          onChange={(e) => set("state", e.target.value)}
          className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#8B7355]">Pincode</label>
        <input
          data-testid="addr-pincode-input"
          type="text"
          value={address.pincode || ""}
          onChange={(e) => set("pincode", e.target.value)}
          className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#8B7355]">Label</label>
        <select
          data-testid="addr-label-select"
          value={address.label || "Home"}
          onChange={(e) => set("label", e.target.value)}
          className="w-full mt-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E]"
        >
          <option>Home</option>
          <option>Work</option>
          <option>Other</option>
        </select>
      </div>
    </div>
  );
};

export const AddressPicker = (props) => {
  const {
    addresses,
    selectedAddressId,
    onSelectAddress,
    onRefreshAddresses,
    showAddressForm,
    setShowAddressForm,
    initialAddress,
    onSave,
    onCancel
  } = props;

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState(
    initialAddress || { label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "Kathmandu", state: "Bagmati", pincode: "44600", country: "Nepal", lat: null, lng: null, isDefault: false }
  );
  const [searchTerm, setSearchTerm] = useState("");

  const handleAutoFill = (parsed) => {
    setAddress((prev) => ({
      ...prev,
      line1: parsed.line1 || prev.line1,
      line2: parsed.line2 || prev.line2,
      city: parsed.city || prev.city,
      state: parsed.state || prev.state,
      pincode: parsed.pincode || prev.pincode,
      country: parsed.country || "Nepal",
      lat: parsed.lat,
      lng: parsed.lng,
    }));
    setSearchTerm(parsed.formatted || parsed.line1 || "");
  };

  const canSave = address.fullName && address.phone && address.line1 && address.city && address.pincode;

  const handleSaveAddress = async () => {
    const missing = [];
    if (!address.fullName?.trim()) missing.push("Full Name");
    if (!address.phone?.trim()) missing.push("Phone");
    if (!address.line1?.trim()) missing.push("Address Line");
    if (!address.city?.trim()) missing.push("City");
    if (!address.pincode?.trim()) missing.push("Pincode");

    if (missing.length > 0) {
      toast.error(`Please fill missing fields: ${missing.join(", ")}`, { icon: "⚠️" });
      return;
    }

    if (onSave) {
      onSave(address);
      return;
    }
    try {
      setSaving(true);
      const res = await apiFetch("/addresses", {
        method: "POST",
        body: JSON.stringify(address),
      });
      toast.success("Address saved successfully");
      setIsAddingNew(false);
      if (setShowAddressForm) setShowAddressForm(false);
      if (onRefreshAddresses) onRefreshAddresses();
      if (onSelectAddress && res?.id) onSelectAddress(res);
    } catch (e) {
      toast.error(e.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addrId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await apiFetch(`/addresses/${addrId}`, { method: "DELETE" });
      toast.success("Address deleted");
      if (onRefreshAddresses) onRefreshAddresses();
    } catch (err) {
      toast.error(err.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (addrId, e) => {
    e.stopPropagation();
    try {
      await apiFetch(`/addresses/${addrId}/default`, { method: "PATCH" });
      toast.success("Set as default address");
      if (onRefreshAddresses) onRefreshAddresses();
    } catch (err) {
      toast.error(err.message || "Failed to set default address");
    }
  };

  // IF LIST MODE (passed addresses array)
  if (Array.isArray(addresses)) {
    const isShowingForm = showAddressForm || isAddingNew;

    if (isShowingForm) {
      return (
        <div className="space-y-4 bg-white border border-[#E8DFC9] p-4 rounded-2xl">
          <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2">
            <h4 className="text-xs font-bold text-[#2D2118] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#5C1E1E]" /> Add New Shipping Address
            </h4>
            <button
              onClick={() => {
                setIsAddingNew(false);
                if (setShowAddressForm) setShowAddressForm(false);
              }}
              className="text-xs font-bold text-gray-500 hover:text-[#5C1E1E]"
            >
              Cancel
            </button>
          </div>

          <div className="p-3 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#2D2118] flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-[#5C1E1E]" /> Search Location via Google Maps
            </div>
            <AddressAutocomplete value={searchTerm} onChange={setSearchTerm} onSelect={handleAutoFill} />
            <UseCurrentLocationButton onLocated={handleAutoFill} />
            {address.lat != null && <LocationMapPreview lat={address.lat} lng={address.lng} height={120} />}
          </div>

          <AddressForm address={address} onChange={setAddress} />

          <label className="flex items-center gap-2 text-xs font-semibold text-[#2D2118] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={!!address.isDefault}
              onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })}
              className="w-4 h-4 accent-[#5C1E1E]"
            />
            <span>Set as default delivery address</span>
          </label>

          <button
            data-testid="addr-save-btn"
            type="button"
            disabled={saving}
            onClick={handleSaveAddress}
            className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save & Use Address</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="text-center py-6 bg-[#FAF5EC] border border-dashed border-[#E8DFC9] rounded-2xl space-y-2">
            <MapPin className="w-8 h-8 text-[#8B7355] mx-auto opacity-50" />
            <p className="text-xs font-bold text-[#2D2118]">No saved addresses found</p>
            <p className="text-[11px] text-gray-500">Add a new delivery address to complete your order.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress && onSelectAddress(addr)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#FAF5EC] border-[#5C1E1E] ring-1 ring-[#5C1E1E] shadow-sm"
                      : "bg-[#FAF5EC]/40 border-[#E8DFC9] hover:border-[#8B7355]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={isSelected}
                        onChange={() => onSelectAddress && onSelectAddress(addr)}
                        className="accent-[#5C1E1E] w-4 h-4"
                      />
                      <span className="text-xs font-black text-[#2D2118]">{addr.fullName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8DFC9]/60 text-[#2D2118]">
                        {addr.label || "Home"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!addr.isDefault && (
                        <button
                          onClick={(e) => handleSetDefault(addr.id, e)}
                          className="text-[10px] font-bold text-amber-700 hover:underline"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(addr.id, e)}
                        className="text-gray-400 hover:text-red-600 transition"
                        title="Delete Address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-1.5 pl-6 text-xs text-gray-600 space-y-0.5">
                    <p className="font-semibold text-[#2D2118]">{addr.line1} {addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p>{addr.city}, {addr.state || ""} {addr.pincode}</p>
                    <p className="text-[11px] font-bold text-[#8B7355]">📞 {addr.phone}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setIsAddingNew(true);
            if (setShowAddressForm) setShowAddressForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-dashed border-[#5C1E1E]/50 text-[#5C1E1E] hover:bg-[#FAF5EC] rounded-2xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Delivery Address</span>
        </button>
      </div>
    );
  }

  // Standalone Single Address Form View
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-br from-[#F5EBDC] to-[#FAF5EC] border border-[#5C1E1E]/20 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2D2118]">
          <MapPin className="w-4 h-4 text-[#5C1E1E]" />
          <span>Find your address with Google</span>
        </div>
        <AddressAutocomplete
          value={searchTerm}
          onChange={setSearchTerm}
          onSelect={handleAutoFill}
        />
        <UseCurrentLocationButton onLocated={handleAutoFill} />
        {address.lat != null && (
          <LocationMapPreview lat={address.lat} lng={address.lng} height={140} />
        )}
      </div>

      <AddressForm address={address} onChange={setAddress} />

      <label className="flex items-center gap-2 text-xs font-semibold text-[#2D2118] cursor-pointer">
        <input
          data-testid="addr-default-checkbox"
          type="checkbox"
          checked={!!address.isDefault}
          onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })}
          className="w-4 h-4 accent-[#5C1E1E]"
        />
        <span>Set as default shipping address</span>
      </label>

      <div className="flex gap-3">
        {onCancel && (
          <button
            data-testid="addr-cancel-btn"
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#2D2118] font-bold py-3 rounded-xl text-sm transition"
          >
            Cancel
          </button>
        )}
        <button
          data-testid="addr-save-btn"
          type="button"
          disabled={saving}
          onClick={handleSaveAddress}
          className="flex-1 bg-[#5C1E1E] hover:bg-[#4A1717] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-[#5C1E1E]/30 transition"
        >
          {saving ? "Saving..." : "Save Address"}
        </button>
      </div>
    </div>
  );
};
