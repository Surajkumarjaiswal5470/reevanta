import { useState, useCallback } from "react";

const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_API_KEY || "faXW0xQ8N51xCR4N9aOA";
const GEOCLEAN_BASE = "https://api.maptiler.com/geocoding";

export function parseMapTilerFeature(feature) {
  if (!feature) return null;
  const context = feature.context || [];
  
  const getContextValue = (kind) => {
    const item = context.find((c) => c.kind === kind || c.id?.startsWith(kind));
    return item ? item.text : "";
  };

  const line1 = feature.text || feature.place_name?.split(",")[0] || "";
  const line2 = getContextValue("neighborhood") || getContextValue("sublocality") || "";
  const city = getContextValue("municipality") || getContextValue("place") || getContextValue("district") || "Kathmandu";
  const state = getContextValue("region") || getContextValue("province") || "Bagmati";
  const pincode = getContextValue("postal_code") || "44600";
  const country = getContextValue("country") || "Nepal";

  const [lng, lat] = feature.center || (feature.geometry?.coordinates) || [85.324, 27.7172];

  return {
    line1,
    line2,
    city,
    state,
    pincode,
    country,
    formatted: feature.place_name || `${line1}, ${city}, ${country}`,
    lat,
    lng
  };
}

// 1. Search Places with MapTiler + OpenStreetMap Nominatim Fallback
export async function searchPlacesMapTiler(query) {
  if (!query || query.trim().length < 2) return [];

  // Try MapTiler First
  try {
    const url = `${GEOCLEAN_BASE}/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=5`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const results = (data.features || []).map((feat) => parseMapTilerFeature(feat));
      if (results.length > 0) return results;
    }
  } catch (err) {
    console.warn("MapTiler search failed, falling back to OpenStreetMap Nominatim...");
  }

  // Fallback to OpenStreetMap Nominatim API
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Reevanta-Luxury-Wear/1.0' } });
    if (res.ok) {
      const items = await res.json();
      return items.map((item) => {
        const addr = item.address || {};
        const line1 = addr.road || addr.suburb || addr.neighbourhood || item.display_name.split(",")[0];
        const city = addr.city || addr.town || addr.municipality || addr.county || "Kathmandu";
        const state = addr.state || "Bagmati";
        const pincode = addr.postcode || "44600";
        const country = addr.country || "Nepal";
        return {
          line1,
          line2: addr.suburb || addr.neighbourhood || "",
          city,
          state,
          pincode,
          country,
          formatted: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      });
    }
  } catch (err) {
    console.error("OpenStreetMap search error:", err);
  }

  return [];
}

// 2. Reverse Geocode Coordinates (lat, lng) with OpenStreetMap Fallback
export async function reverseGeocodeMapTiler(rawLat, rawLng) {
  const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat);
  const lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng);

  if (isNaN(lat) || isNaN(lng)) {
    return {
      line1: "Kathmandu Central",
      line2: "Kathmandu",
      city: "Kathmandu",
      state: "Bagmati",
      pincode: "44600",
      country: "Nepal",
      formatted: "Kathmandu Central, Bagmati, Nepal",
      lat: 27.7172,
      lng: 85.324
    };
  }

  // Try MapTiler First
  try {
    const url = `${GEOCLEAN_BASE}/${lng},${lat}.json?key=${MAPTILER_KEY}&limit=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const feat = data.features?.[0];
      if (feat) return parseMapTilerFeature(feat);
    }
  } catch (err) {
    console.warn("MapTiler reverse geocode failed, falling back to OpenStreetMap Nominatim...");
  }

  // Fallback to OpenStreetMap Nominatim Reverse API
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Reevanta-Luxury-Wear/1.0' } });
    if (res.ok) {
      const item = await res.json();
      const addr = item.address || {};
      const line1 = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || "Current Location";
      const city = addr.city || addr.town || addr.municipality || addr.county || "Kathmandu";
      const state = addr.state || "Bagmati";
      const pincode = addr.postcode || "44600";
      const country = addr.country || "Nepal";

      return {
        line1,
        line2: addr.suburb || addr.neighbourhood || "",
        city,
        state,
        pincode,
        country,
        formatted: item.display_name || `${line1}, ${city}, ${country}`,
        lat,
        lng
      };
    }
  } catch (err) {
    console.error("OpenStreetMap reverse geocode error:", err);
  }

  // Final Clean Fallback (Human Readable, No raw lat/lng text!)
  return {
    line1: "Kathmandu Area",
    line2: "Bagmati Province",
    city: "Kathmandu",
    state: "Bagmati",
    pincode: "44600",
    country: "Nepal",
    formatted: "Kathmandu, Bagmati Province, Nepal",
    lat,
    lng
  };
}

export function getMapTilerStaticMapUrl(lat, lng, width = 600, height = 200, zoom = 14) {
  if (lat == null || lng == null) return null;
  return `https://api.maptiler.com/maps/streets-v2/static/${lng},${lat},${zoom}/${width}x${height}.png?key=${MAPTILER_KEY}&path=fill:none|color:red|weight:5&markers=${lng},${lat},red`;
}
