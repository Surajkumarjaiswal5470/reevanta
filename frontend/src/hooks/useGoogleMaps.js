import { useEffect, useState } from "react";

const GMAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const CALLBACK_NAME = "__gmapsLoadedCB__";

let loadingPromise = null;

function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve(window.google);
  }
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve, reject) => {
    if (!GMAPS_KEY) {
      reject(new Error("Google Maps API key missing"));
      return;
    }
    window[CALLBACK_NAME] = () => resolve(window.google);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places&callback=${CALLBACK_NAME}&v=weekly`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return loadingPromise;
}

export function useGoogleMaps() {
  const [ready, setReady] = useState(!!(window.google && window.google.maps && window.google.maps.places));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return { ready, error, google: window.google };
}

// Reverse geocode lat/lng → structured address
export async function reverseGeocode(lat, lng) {
  await loadGoogleMaps();
  const geocoder = new window.google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        resolve(parseGeocodeResult(results[0]));
      } else {
        reject(new Error("Failed to reverse geocode: " + status));
      }
    });
  });
}

export function parseGeocodeResult(result) {
  const comps = result.address_components || [];
  const getComp = (types) => {
    const found = comps.find((c) => types.every((t) => c.types.includes(t)));
    return found ? found.long_name : "";
  };
  const streetNumber = comps.find((c) => c.types.includes("street_number"))?.long_name || "";
  const route = comps.find((c) => c.types.includes("route"))?.long_name || "";
  const sublocality = comps.find((c) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"))?.long_name || "";
  const line1 = [streetNumber, route].filter(Boolean).join(" ") || sublocality || result.formatted_address.split(",")[0];
  const line2 = sublocality && route ? sublocality : "";
  const city =
    comps.find((c) => c.types.includes("locality"))?.long_name ||
    comps.find((c) => c.types.includes("administrative_area_level_2"))?.long_name ||
    "";
  const state = comps.find((c) => c.types.includes("administrative_area_level_1"))?.long_name || "";
  const pincode = comps.find((c) => c.types.includes("postal_code"))?.long_name || "";
  const country = comps.find((c) => c.types.includes("country"))?.long_name || "India";
  return {
    line1,
    line2,
    city,
    state,
    pincode,
    country,
    formatted: result.formatted_address,
    lat: result.geometry?.location?.lat?.() || null,
    lng: result.geometry?.location?.lng?.() || null,
  };
}
