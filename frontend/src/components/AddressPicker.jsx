import React, { useEffect, useRef, useState } from "react";
import { useGoogleMaps, reverseGeocode, parseGeocodeResult } from "../hooks/useGoogleMaps";
import { MapPin, Locate, Loader2, Search } from "lucide-react";

export const AddressAutocomplete = ({ value, onChange, onSelect, placeholder = "Search your street, apartment, area..." }) => {
  const { ready, error } = useGoogleMaps();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["address_components", "formatted_address", "geometry"],
      types: ["geocode"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place || !place.geometry) return;
      const parsed = parseGeocodeResult(place);
      onSelect && onSelect(parsed);
    });
    autocompleteRef.current = ac;
  }, [ready, onSelect]);

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8B7355]">
        <Search className="w-4 h-4" />
      </span>
      <input
        data-testid="address-autocomplete-input"
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ready ? placeholder : "Loading places..."}
        disabled={!ready && !error}
        className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl pl-10 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5C1E1E] shadow-inner"
      />
      {error && <p className="text-xs text-red-500 mt-1">Places API unavailable. Enter address manually below.</p>}
    </div>
  );
};

export const UseCurrentLocationButton = ({ onLocated }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const parsed = await reverseGeocode(latitude, longitude);
          parsed.lat = latitude;
          parsed.lng = longitude;
          onLocated(parsed);
        } catch (e) {
          alert("Failed to detect address: " + e.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        alert("Location access denied: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <button
      data-testid="use-current-location-btn"
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#5C1E1E] to-[#B8956A] hover:opacity-95 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-[#5C1E1E]/30 transition disabled:opacity-70"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
      <span>{loading ? "Detecting your location..." : "Use my current location"}</span>
    </button>
  );
};

export const LocationMapPreview = ({ lat, lng, height = 160 }) => {
  const { ready } = useGoogleMaps();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!ready || !mapRef.current || lat == null || lng == null) return;
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 15,
        disableDefaultUI: true,
        clickableIcons: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
    } else {
      mapInstance.current.setCenter({ lat, lng });
    }
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.current,
    });
  }, [ready, lat, lng]);

  if (lat == null || lng == null) return null;
  return (
    <div
      data-testid="location-map-preview"
      ref={mapRef}
      className="w-full rounded-xl border border-[#E8DFC9] overflow-hidden shadow-inner"
      style={{ height }}
    />
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

export const AddressPicker = ({ initialAddress, onSave, onCancel }) => {
  const [address, setAddress] = useState(
    initialAddress || { label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India", lat: null, lng: null, isDefault: false }
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
      country: parsed.country || "India",
      lat: parsed.lat,
      lng: parsed.lng,
    }));
    setSearchTerm(parsed.formatted || parsed.line1 || "");
  };

  const canSave = address.fullName && address.phone && address.line1 && address.city && address.pincode;

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
          disabled={!canSave}
          onClick={() => onSave(address)}
          className="flex-1 bg-[#5C1E1E] hover:bg-[#4A1717] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-[#5C1E1E]/30 transition"
        >
          Save Address
        </button>
      </div>
    </div>
  );
};
