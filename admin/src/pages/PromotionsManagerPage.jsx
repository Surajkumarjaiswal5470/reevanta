import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ImageUploader } from "../components/ImageUploader";
import {
  Sparkles, Layers, Zap, Clock, Image as ImageIcon, Plus, Trash2, Edit, Check, X,
  RefreshCw, ChevronUp, ChevronDown, Eye, Sliders, Globe, FileText, Gift, MessageSquare,
  Volume2, AlertCircle, ArrowUpRight, CheckCircle2, Megaphone, Calendar
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const emptySlide = {
  title: "",
  subtitle: "",
  category: "sarees",
  buttonText: "EXPLORE COLLECTION",
  buttonLink: "/catalog?category=sarees",
  image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
  badge: "NEW ARRIVAL",
  slide_order: 1,
  isActive: true
};

export function PromotionsManagerPage() {
  const [activeTab, setActiveTab] = useState("hero"); // "hero" | "announcement" | "countdown" | "campaigns" | "popups"

  // CMS Data
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hero Slide Form
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideForm, setSlideForm] = useState(emptySlide);

  // Form States
  const [announcementForm, setAnnouncementForm] = useState({ enabled: true, text: "", link: "/catalog", bgColor: "#5C1E1E", textColor: "#FAF5EC" });
  const [countdownForm, setCountdownForm] = useState({ enabled: true, title: "", subtitle: "", end_datetime: "2026-12-31T23:59:59Z", ctaText: "", ctaLink: "", bannerUrl: "" });
  const [popupForm, setPopupForm] = useState({ enabled: true, title: "", subtitle: "", imageUrl: "", discountCode: "", delaySeconds: 5, popupType: "NEWSLETTER" });

  const [submitting, setSubmitting] = useState(false);

  // ── Fetch CMS Data ──
  const fetchCmsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/cms/homepage`);
      const d = res.data || {};
      setCmsData(d);

      if (d.announcement_bar) setAnnouncementForm(d.announcement_bar);
      if (d.countdown_timer) setCountdownForm(d.countdown_timer);
      if (d.promo_popup) setPopupForm(d.promo_popup);
    } catch {
      toast.error("Failed to load promotion CMS settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCmsData();
  }, [fetchCmsData]);

  // Save Hero Slides
  const handleSaveSlides = async (slides) => {
    setSubmitting(true);
    try {
      await axios.put(`${API}/admin/cms/hero-slides`, slides);
      toast.success("Hero Slider Carousel updated! ✨");
      fetchCmsData();
    } catch {
      toast.error("Failed to update slides");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSlideForm = (e) => {
    e.preventDefault();
    const slides = [...(cmsData?.hero_slides || [])];
    if (editingSlide) {
      const idx = slides.findIndex(s => s.id === editingSlide.id);
      if (idx !== -1) slides[idx] = { ...slideForm, id: editingSlide.id };
    } else {
      slides.push({ ...slideForm, id: `slide-${Date.now()}`, slide_order: slides.length + 1 });
    }
    handleSaveSlides(slides);
    setShowSlideModal(false);
  };

  const handleMoveSlide = (index, direction) => {
    const slides = [...(cmsData?.hero_slides || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const temp = slides[index];
    slides[index] = slides[targetIdx];
    slides[targetIdx] = temp;
    slides.forEach((s, i) => s.slide_order = i + 1);
    handleSaveSlides(slides);
  };

  const handleDeleteSlide = (slideId) => {
    if (!window.confirm("Delete this hero slide?")) return;
    const slides = (cmsData?.hero_slides || []).filter(s => s.id !== slideId);
    handleSaveSlides(slides);
  };

  // Save Announcement Ticker
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API}/admin/cms/announcement`, announcementForm);
      toast.success("Top Announcement Bar updated! ✨");
      fetchCmsData();
    } catch {
      toast.error("Failed to update announcement bar");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Countdown Timer
  const handleSaveCountdown = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API}/admin/cms/countdown`, countdownForm);
      toast.success("Deals & Countdown Timer updated! ⚡");
      fetchCmsData();
    } catch {
      toast.error("Failed to update countdown timer");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Promotional Popup
  const handleSavePopup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API}/admin/cms/popup`, popupForm);
      toast.success("Storefront Promotional Popup updated! 🎁");
      fetchCmsData();
    } catch {
      toast.error("Failed to update popup settings");
    } finally {
      setSubmitting(false);
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
                Campaign Operations
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Live Storefront Content Engine
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Promotions & Campaign Management Suite
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage hero slider carousels, announcement bar tickers, deals countdown timers, seasonal campaigns, and modal promo popups.
            </p>
          </div>

          <button onClick={fetchCmsData} disabled={loading} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Suite Tabs */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {[
            { id: "hero", label: "Hero Carousel", icon: ImageIcon },
            { id: "announcement", label: "Announcement Bar", icon: Megaphone },
            { id: "countdown", label: "Deals Countdown", icon: Zap },
            { id: "popups", label: "Modal Popups", icon: Gift },
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
          {/* TAB 1: HERO SLIDER CAROUSEL */}
          {activeTab === "hero" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E8DFC9]">
                <div>
                  <h3 className="font-black text-sm text-[#2D2118]">Hero Slider Carousel Slides ({cmsData?.hero_slides?.length || 0})</h3>
                  <p className="text-xs text-[#8B7355]">Manage multi-slide homepage hero carousels.</p>
                </div>
                <button
                  onClick={() => { setEditingSlide(null); setSlideForm(emptySlide); setShowSlideModal(true); }}
                  className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" /> Add Carousel Slide
                </button>
              </div>

              <div className="space-y-3">
                {(cmsData?.hero_slides || []).map((slide, idx) => (
                  <div key={slide.id || idx} className="bg-white rounded-3xl border border-[#E8DFC9] p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={() => handleMoveSlide(idx, "up")} disabled={idx === 0} className="p-1 text-gray-400 hover:text-[#5C1E1E] disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                        <span className="text-[10px] font-black text-[#5C1E1E] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#E8DFC9]">#{idx + 1}</span>
                        <button onClick={() => handleMoveSlide(idx, "down")} disabled={idx === (cmsData?.hero_slides || []).length - 1} className="p-1 text-gray-400 hover:text-[#5C1E1E] disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                      </div>

                      <img src={slide.image} alt={slide.title} className="w-20 h-16 object-cover rounded-2xl border border-[#E8DFC9] shrink-0" />

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-[#2D2118]">{slide.title}</h4>
                          {slide.badge && <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{slide.badge}</span>}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{slide.subtitle}</p>
                        <span className="text-[10px] font-bold text-[#5C1E1E]">{slide.buttonText} → {slide.buttonLink}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => { setEditingSlide(slide); setSlideForm({ ...slide }); setShowSlideModal(true); }}
                        className="bg-[#FAF5EC] border border-[#E8DFC9] text-[#2D2118] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#5C1E1E]" /> Edit
                      </button>
                      <button onClick={() => handleDeleteSlide(slide.id)} className="p-1.5 bg-white border border-[#E8DFC9] hover:bg-red-50 text-red-600 rounded-xl transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENT BAR */}
          {activeTab === "announcement" && (
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] space-y-4">
              <h3 className="font-black text-base text-[#2D2118]">Top Header Announcement Bar Ticker</h3>

              {/* Live Preview */}
              <div className="p-3 rounded-2xl font-extrabold text-xs text-center shadow-inner flex items-center justify-between" style={{ backgroundColor: announcementForm.bgColor, color: announcementForm.textColor }}>
                <span>{announcementForm.text}</span>
                <span className="text-[10px] opacity-80 uppercase font-mono">LIVE PREVIEW</span>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementForm.enabled}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, enabled: e.target.checked })}
                    className="accent-[#5C1E1E] w-4 h-4"
                  />
                  <span>Enable Top Announcement Bar</span>
                </label>

                <div>
                  <label className="font-bold text-[#8B7355] block mb-1">Announcement Text</label>
                  <input
                    type="text"
                    required
                    value={announcementForm.text}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, text: e.target.value })}
                    className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Background Color</label>
                    <input
                      type="color"
                      value={announcementForm.bgColor}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, bgColor: e.target.value })}
                      className="w-full h-10 p-1 bg-white border rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Target Link URL</label>
                    <input
                      type="text"
                      value={announcementForm.link}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, link: e.target.value })}
                      className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="bg-[#5C1E1E] text-white py-3 px-6 rounded-xl font-bold">Save Announcement Ticker</button>
              </form>
            </div>
          )}

          {/* TAB 3: DEALS COUNTDOWN TIMER */}
          {activeTab === "countdown" && (
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] space-y-4">
              <h3 className="font-black text-base text-[#2D2118]">Deals of the Day & Live Countdown Timer</h3>

              <form onSubmit={handleSaveCountdown} className="space-y-4 text-xs">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={countdownForm.enabled}
                    onChange={(e) => setCountdownForm({ ...countdownForm, enabled: e.target.checked })}
                    className="accent-[#5C1E1E] w-4 h-4"
                  />
                  <span>Enable Countdown Sale Banner</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Campaign Title</label>
                    <input
                      type="text"
                      required
                      value={countdownForm.title}
                      onChange={(e) => setCountdownForm({ ...countdownForm, title: e.target.value })}
                      className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-bold text-[#5C1E1E]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Countdown End Datetime (ISO Target)</label>
                    <input
                      type="datetime-local"
                      required
                      value={countdownForm.end_datetime ? countdownForm.end_datetime.slice(0, 16) : ""}
                      onChange={(e) => setCountdownForm({ ...countdownForm, end_datetime: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                      className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="bg-[#5C1E1E] text-white py-3 px-6 rounded-xl font-bold">Save Countdown Settings</button>
              </form>
            </div>
          )}

          {/* TAB 4: MODAL POPUPS */}
          {activeTab === "popups" && (
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] space-y-4">
              <h3 className="font-black text-base text-[#2D2118]">Storefront Modal Promotional Popup</h3>

              <form onSubmit={handleSavePopup} className="space-y-4 text-xs">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popupForm.enabled}
                    onChange={(e) => setPopupForm({ ...popupForm, enabled: e.target.checked })}
                    className="accent-[#5C1E1E] w-4 h-4"
                  />
                  <span>Enable Storefront Promotional Modal Popup</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Popup Title</label>
                    <input
                      type="text"
                      required
                      value={popupForm.title}
                      onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                      className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Gift Discount Code</label>
                    <input
                      type="text"
                      value={popupForm.discountCode}
                      onChange={(e) => setPopupForm({ ...popupForm, discountCode: e.target.value.toUpperCase() })}
                      className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-mono font-bold text-[#5C1E1E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Delay Before Showing (Seconds)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={popupForm.delaySeconds}
                      onChange={(e) => setPopupForm({ ...popupForm, delaySeconds: parseInt(e.target.value) || 5 })}
                      className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-bold"
                    />
                  </div>
                  <ImageUploader label="Popup Image" value={popupForm.imageUrl} onChange={(url) => setPopupForm({ ...popupForm, imageUrl: url })} />
                </div>

                <button type="submit" disabled={submitting} className="bg-[#5C1E1E] text-white py-3 px-6 rounded-xl font-bold">Save Popup Configuration</button>
              </form>
            </div>
          )}
        </>
      )}

      {/* ─── ADD/EDIT HERO SLIDE MODAL ─── */}
      {showSlideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9] relative">
            <button onClick={() => setShowSlideModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">{editingSlide ? "Edit Carousel Slide" : "Add Carousel Slide"}</h3>

            <form onSubmit={handleSaveSlideForm} className="space-y-3 text-xs">
              <input type="text" required placeholder="Slide Title *" value={slideForm.title} onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <input type="text" placeholder="Subtitle" value={slideForm.subtitle} onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-semibold" />
              <input type="text" placeholder="Badge Tag (e.g. NEW ARRIVAL)" value={slideForm.badge} onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <ImageUploader label="Slide Image *" required={true} value={slideForm.image} onChange={(url) => setSlideForm({ ...slideForm, image: url })} />
              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Save Carousel Slide</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
