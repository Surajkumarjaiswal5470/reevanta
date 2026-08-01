import React, { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Optimizes image URLs by appending compression and responsive sizing params.
 */
export function getOptimizedImageUrl(url, width = 800) {
  if (!url || typeof url !== "string") return "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=75";

  // Unsplash CDN Optimization
  if (url.includes("images.unsplash.com")) {
    const hasParams = url.includes("?");
    const cleanUrl = hasParams ? url.split("?")[0] : url;
    return `${cleanUrl}?auto=format,compress&fit=crop&w=${width}&q=75`;
  }

  // Cloudinary Optimization
  if (url.includes("res.cloudinary.com")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
  }

  return url;
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  width = 800,
  height,
  priority = false, // True for LCP images (Hero Banner, Main Product)
  aspectRatio = "aspect-square",
  style = {},
  onClick
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = getOptimizedImageUrl(src, width);

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${aspectRatio} ${className}`}
      style={style}
      onClick={onClick}
    >
      {/* Skeleton Loading Shimmer */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse z-10" />
      )}

      {/* Fallback state */}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF5EC] text-gray-400 p-2 text-center">
          <ImageOff className="w-6 h-6 mb-1 text-gray-300" />
          <span className="text-[10px] font-semibold text-gray-400">Image unavailable</span>
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt || "Product image"}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchpriority={priority ? "high" : "low"}
          width={width}
          height={height}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        />
      )}
    </div>
  );
}
