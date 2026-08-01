import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, CheckCircle2, Loader2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : (process.env.NODE_ENV === 'production' ? 'https://reevanta-backend-pg3v.onrender.com/api' : 'http://localhost:8001/api'));

export function ImageUploader({ value, onChange, label = "Photo", required = false }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to upload photo to ImageKit");
      }

      onChange(data.url);
      toast.success("Photo uploaded to ImageKit CDN successfully! ✨", { icon: "📸" });
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message || "Photo upload failed. Check backend connection.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.clipboardData?.files?.[0] || e.dataTransfer?.files?.[0]) {
      const file = e.clipboardData?.files?.[0] || e.dataTransfer?.files?.[0];
      handleFileChange(file);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-bold text-[#8B7355] block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />

      {/* Upload Zone / Preview Container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 text-center ${
          dragActive
            ? "border-[#5C1E1E] bg-[#FAF5EC]"
            : value
            ? "border-emerald-300 bg-emerald-50/20"
            : "border-[#E8DFC9] bg-[#FAF5EC]/60 hover:border-[#5C1E1E]"
        }`}
      >
        {value ? (
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E8DFC9] shrink-0 bg-white shadow-sm">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 text-left space-y-1 overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Uploaded to ImageKit CDN</span>
              </div>
              <p className="text-[10px] text-gray-500 truncate font-mono bg-white px-2 py-1 rounded border border-gray-200">
                {value}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-[11px] font-bold text-[#5C1E1E] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Change Photo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-3 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#5C1E1E]/10 flex items-center justify-center text-[#5C1E1E]">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#5C1E1E]" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-[#2D2118]">
                {uploading ? "Uploading to ImageKit CDN..." : "Click or Drag & Drop photo to upload"}
              </p>
              <p className="text-[10px] text-gray-400">Supports JPG, PNG, WebP (Auto Optimized)</p>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 px-4 py-2 bg-[#5C1E1E] hover:bg-[#4A1717] text-white rounded-xl text-xs font-bold shadow-md shadow-[#5C1E1E]/20 transition flex items-center gap-1.5 active:scale-95"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Select Photo File</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Manual URL Fallback Input */}
      <div className="pt-1">
        <details className="text-[11px] text-gray-500 cursor-pointer">
          <summary className="font-semibold text-[#8B7355] hover:text-[#5C1E1E] transition">
            Or paste image URL manually
          </summary>
          <input
            type="url"
            placeholder="https://ik.imagekit.io/..."
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-1.5 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl px-3 py-2 text-xs text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
          />
        </details>
      </div>
    </div>
  );
}
