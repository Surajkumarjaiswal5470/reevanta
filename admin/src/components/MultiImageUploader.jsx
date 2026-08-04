import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, Image as ImageIcon, Loader2, X, GripVertical, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : (process.env.NODE_ENV === 'production' ? 'https://reevanta-backend-pg3v.onrender.com/api' : 'http://localhost:8001/api'));

const MAX_IMAGES = 8;

export function MultiImageUploader({ images = [], onChange, label = "Product Gallery", maxImages = MAX_IMAGES }) {
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragStartIndex, setDragStartIndex] = useState(null);
  const fileInputRef = useRef(null);

  const uploadSingleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return null;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed");
      return data.url;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }, []);

  const handleFilesSelected = useCallback(async (files) => {
    const fileList = Array.from(files);
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} gallery photos allowed.`);
      return;
    }
    const toUpload = fileList.slice(0, remaining);
    if (toUpload.length < fileList.length) {
      toast.info(`Only ${remaining} more photo(s) can be added. Skipping extras.`);
    }

    setUploading(true);
    setUploadingCount(toUpload.length);

    const results = await Promise.all(toUpload.map(f => uploadSingleFile(f)));
    const successfulUrls = results.filter(Boolean);

    if (successfulUrls.length > 0) {
      onChange([...images, ...successfulUrls]);
      toast.success(`${successfulUrls.length} photo(s) uploaded to gallery! 📸`);
    }
    if (successfulUrls.length < toUpload.length) {
      toast.error(`${toUpload.length - successfulUrls.length} photo(s) failed to upload.`);
    }

    setUploading(false);
    setUploadingCount(0);
  }, [images, maxImages, onChange, uploadSingleFile]);

  const handleRemove = useCallback((index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  }, [images, onChange]);

  // ── Drag & drop zone handlers ──
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files?.length) handleFilesSelected(files);
  };

  // ── Reorder via drag on thumbnails ──
  const handleThumbDragStart = (index) => setDragStartIndex(index);
  const handleThumbDragOver = (e, index) => { e.preventDefault(); setDragOverIndex(index); };
  const handleThumbDragEnd = () => {
    if (dragStartIndex !== null && dragOverIndex !== null && dragStartIndex !== dragOverIndex) {
      const reordered = [...images];
      const [moved] = reordered.splice(dragStartIndex, 1);
      reordered.splice(dragOverIndex, 0, moved);
      onChange(reordered);
    }
    setDragStartIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#8B7355]">{label}</label>
          <span className="text-[10px] font-semibold text-[#8B7355]">
            {images.length} / {maxImages} photos
          </span>
        </div>
      )}

      {/* Thumbnail Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => handleThumbDragStart(idx)}
              onDragOver={(e) => handleThumbDragOver(e, idx)}
              onDragEnd={handleThumbDragEnd}
              className={`relative group rounded-xl overflow-hidden border-2 aspect-square cursor-grab active:cursor-grabbing transition-all duration-150 ${
                dragOverIndex === idx ? "border-[#5C1E1E] scale-105 shadow-lg" : "border-[#E8DFC9] hover:border-[#B8956A]"
              }`}
            >
              <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 transition transform hover:scale-110"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Position badge */}
              <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <GripVertical className="w-2.5 h-2.5" />
                {idx + 1}
              </div>

              {/* CDN indicator */}
              <div className="absolute bottom-1 right-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 drop-shadow" />
              </div>
            </div>
          ))}

          {/* Add More Button (in grid) */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-[#E8DFC9] hover:border-[#5C1E1E] bg-[#FAF5EC]/60 flex flex-col items-center justify-center gap-1 transition-all hover:bg-[#FAF5EC] active:scale-95"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#5C1E1E]" />
              ) : (
                <Plus className="w-5 h-5 text-[#8B7355]" />
              )}
              <span className="text-[9px] font-bold text-[#8B7355]">Add More</span>
            </button>
          )}
        </div>
      )}

      {/* Drop Zone (shown when no images or as additional upload area) */}
      {images.length === 0 && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
            dragActive
              ? "border-[#5C1E1E] bg-[#FAF5EC] scale-[1.01]"
              : "border-[#E8DFC9] bg-[#FAF5EC]/60 hover:border-[#5C1E1E]"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#5C1E1E]/10 flex items-center justify-center text-[#5C1E1E]">
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#2D2118]">
                {uploading ? `Uploading ${uploadingCount} photo(s)...` : "Drop photos here or click to browse"}
              </p>
              <p className="text-[10px] text-[#8B7355]">
                Upload up to {maxImages} photos · JPG, PNG, WebP · Drag to reorder
              </p>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 px-5 py-2 bg-[#5C1E1E] hover:bg-[#4A1717] text-white rounded-xl text-xs font-bold shadow-md shadow-[#5C1E1E]/20 transition flex items-center gap-1.5 active:scale-95"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Select Photos</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hidden Multi-File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
