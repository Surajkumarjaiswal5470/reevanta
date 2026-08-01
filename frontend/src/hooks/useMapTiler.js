import { useState, useCallback } from "react";

const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_API_KEY || "84QN8CrIPHAnqkdL1Fus";
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
    formatted: feature.place_name || feature.text,
    lat,
    lng
  };
}

export async function searchPlacesMapTiler(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `${GEOCLEAN_BASE}/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=5`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((feat) => parseMapTilerFeature(feat));
  } catch (err) {
    console.error("MapTiler geocoding error:", err);
    return [];
  }
}

export async function reverseGeocodeMapTiler(lat, lng) {
  try {
    const url = `${GEOCLEAN_BASE}/${lng},${lat}.json?key=${MAPTILER_KEY}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("MapTiler reverse geocode failed");
    const data = await res.json();
    const feat = data.features?.[0];
    if (!feat) throw new Error("No location details found");
    return parseMapTilerFeature(feat);
  } catch (err) {
    console.error("MapTiler reverse geocode error:", err);
    return {
      line1: "Detected Location",
      line2: "",
      city: "Kathmandu",
      state: "Bagmati",
      pincode: "44600",
      country: "Nepal",
      formatted: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      lat,
      lng
    };
  }
}

export function getMapTilerStaticMapUrl(lat, lng, width = 600, height = 200, zoom = 14) {
  if (lat == null || lng == null) return null;
  return `https://api.maptiler.com/maps/streets-v2/static/${lng},${lat},${zoom}/${width}x${height}.png?key=${MAPTILER_KEY}&path=fill:none|color:red|weight:5&markers=${lng},${lat},red`;
}
