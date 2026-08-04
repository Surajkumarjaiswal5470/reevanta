import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ImageUploader } from "../components/ImageUploader";
import {
  FileText, BookOpen, HelpCircle, Briefcase, Camera, Layout, Plus, Trash2, Edit,
  Check, X, RefreshCw, Eye, Globe, Search, Sparkles, Layers, ShieldCheck
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

const POLICY_PAGES = [
  { slug: "about-us", title: "About Us — Royal Heritage Story" },
  { slug: "contact-us", title: "Contact Us & Atelier Studios" },
  { slug: "privacy-policy", title: "Privacy Policy & Data Security" },
  { slug: "terms-and-conditions", title: "Terms & Conditions of Service" },
  { slug: "return-policy", title: "Return & Refund Policy" },
  { slug: "shipping-policy", title: "Shipping & Delivery Policy" },
];

export function ContentCMSPage() {
  const [activeTab, setActiveTab] = useState("pages"); // "pages" | "blogs" | "faqs" | "careers" | "lookbook"

  // Data States
  const [pages, setPages] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [careers, setCareers] = useState([]);
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Page Editor
  const [selectedPageSlug, setSelectedPageSlug] = useState("about-us");
  const [pageForm, setPageForm] = useState({
    slug: "about-us",
    title: "",
    content: "",
    seo: { metaTitle: "", metaDescription: "", keywords: "" },
    is_published: true
  });

  // Blog Form Modal
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    author: "Reevanta Heritage Editorial",
    category: "Bridal Fashion",
    featuredImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    summary: "",
    content: "",
    tags: ["Bridal", "Silk Saree"],
    isPublished: true
  });

  // FAQ Form Modal
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqForm, setFaqForm] = useState({ category: "Orders & Shipping", question: "", answer: "", sort_order: 1 });

  // Career Form Modal
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [careerForm, setCareerForm] = useState({ title: "", department: "Design & Atelier", location: "Kathmandu Studio", type: "Full-Time", description: "", applyLink: "mailto:careers@therivaanta.com", is_active: true });

  const [submitting, setSubmitting] = useState(false);

  // ── Fetch All CMS Data ──
  const fetchAllCmsData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, bRes, fRes, cRes, lRes] = await Promise.all([
        axios.get(`${API}/admin/cms/pages`),
        axios.get(`${API}/admin/cms/blogs`),
        axios.get(`${API}/admin/cms/faqs`),
        axios.get(`${API}/admin/cms/careers`),
        axios.get(`${API}/admin/cms/lookbook`)
      ]);
      const pageList = pRes.data || [];
      setPages(pageList);
      setBlogs(bRes.data || []);
      setFaqs(fRes.data || []);
      setCareers(cRes.data || []);
      setLookbooks(lRes.data || []);

      const curPage = pageList.find(p => p.slug === selectedPageSlug) || pageList[0];
      if (curPage) {
        setPageForm({
          slug: curPage.slug,
          title: curPage.title || "",
          content: curPage.content || "",
          seo: curPage.seo || { metaTitle: "", metaDescription: "", keywords: "" },
          is_published: curPage.is_published ?? true
        });
      }
    } catch {
      toast.error("Failed to load CMS pages content");
    } finally {
      setLoading(false);
    }
  }, [selectedPageSlug]);

  useEffect(() => {
    fetchAllCmsData();
  }, [fetchAllCmsData]);

  // Select Page to Edit
  const handleSelectPage = (slug) => {
    setSelectedPageSlug(slug);
    const found = pages.find(p => p.slug === slug);
    if (found) {
      setPageForm({
        slug: found.slug,
        title: found.title || "",
        content: found.content || "",
        seo: found.seo || { metaTitle: "", metaDescription: "", keywords: "" },
        is_published: found.is_published ?? true
      });
    } else {
      setPageForm({
        slug: slug,
        title: POLICY_PAGES.find(p => p.slug === slug)?.title || slug,
        content: "",
        seo: { metaTitle: "", metaDescription: "", keywords: "" },
        is_published: true
      });
    }
  };

  // Save Page Content & SEO
  const handleSavePage = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API}/admin/cms/pages/${selectedPageSlug}`, pageForm);
      toast.success(`Page '${pageForm.title}' saved & published! ✨`);
      fetchAllCmsData();
    } catch {
      toast.error("Failed to save page content");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Blog Post
  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!blogForm.title.trim()) return;
    setSubmitting(true);
    try {
      const slugClean = blogForm.slug || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await axios.post(`${API}/admin/cms/blogs`, { ...blogForm, slug: slugClean });
      toast.success(`Blog article '${blogForm.title}' published! 📝`);
      setShowBlogModal(false);
      fetchAllCmsData();
    } catch {
      toast.error("Failed to publish blog article");
    } finally {
      setSubmitting(false);
    }
  };

  // Save FAQ Item
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!faqForm.question.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/admin/cms/faqs`, faqForm);
      toast.success("FAQ item added! ❓");
      setShowFaqModal(false);
      fetchAllCmsData();
    } catch {
      toast.error("Failed to save FAQ item");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Career Job
  const handleSaveCareer = async (e) => {
    e.preventDefault();
    if (!careerForm.title.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/admin/cms/careers`, careerForm);
      toast.success("Job posting published! 💼");
      setShowCareerModal(false);
      fetchAllCmsData();
    } catch {
      toast.error("Failed to save job posting");
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
                Content Management System
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Live Storefront Content Engine
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-[#FAF5EC]">
              Content Management & Dynamic Pages Engine
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-lg">
              Manage About Us, Contact Us, Privacy Policy, Terms & Conditions, Return Policy, Shipping Policy, Blog Articles, FAQs, Careers, and Lookbooks.
            </p>
          </div>

          <button onClick={fetchAllCmsData} disabled={loading} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-none">
          {[
            { id: "pages", label: "Pages & Legal Policies", icon: FileText },
            { id: "blogs", label: `Blog Publisher (${blogs.length})`, icon: BookOpen },
            { id: "faqs", label: `FAQs Center (${faqs.length})`, icon: HelpCircle },
            { id: "careers", label: `Careers (${careers.length})`, icon: Briefcase },
            { id: "lookbook", label: "Editorial Lookbook", icon: Camera },
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
          {/* TAB 1: PAGES & LEGAL POLICIES */}
          {activeTab === "pages" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Pages Sidebar List */}
              <div className="bg-white rounded-3xl p-5 border border-[#E8DFC9] shadow-sm space-y-2">
                <h3 className="font-extrabold text-xs text-[#8B7355] uppercase tracking-wider mb-2">Storefront Pages</h3>
                {POLICY_PAGES.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => handleSelectPage(p.slug)}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition ${
                      selectedPageSlug === p.slug
                        ? "bg-[#5C1E1E] text-white shadow-md font-black"
                        : "bg-[#FAF5EC] text-[#2D2118] hover:bg-gray-100"
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              {/* Page Content Editor */}
              <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
                  <h3 className="font-black text-base text-[#2D2118]">{pageForm.title}</h3>
                  <span className="text-xs font-mono font-bold text-gray-400">/pages/{selectedPageSlug}</span>
                </div>

                <form onSubmit={handleSavePage} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Page Headline Title *</label>
                    <input
                      type="text"
                      required
                      value={pageForm.title}
                      onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                      className="w-full bg-[#FAF5EC] border p-3 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#8B7355] block mb-1">Page Body Content (Markdown / HTML supported) *</label>
                    <textarea
                      rows={12}
                      required
                      value={pageForm.content}
                      onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                      className="w-full bg-[#FAF5EC] border p-3.5 rounded-2xl font-mono text-xs text-gray-800 leading-relaxed"
                    />
                  </div>

                  {/* SEO Engine */}
                  <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-3">
                    <h4 className="font-bold text-[#5C1E1E]">SEO & Search Engine Metadata</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-600 block mb-1">Meta Title</label>
                        <input
                          type="text"
                          value={pageForm.seo?.metaTitle || ""}
                          onChange={(e) => setPageForm({ ...pageForm, seo: { ...pageForm.seo, metaTitle: e.target.value } })}
                          className="w-full bg-white border p-2 rounded-xl font-medium"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-600 block mb-1">Keywords</label>
                        <input
                          type="text"
                          value={pageForm.seo?.keywords || ""}
                          onChange={(e) => setPageForm({ ...pageForm, seo: { ...pageForm.seo, keywords: e.target.value } })}
                          className="w-full bg-white border p-2 rounded-xl font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} className="bg-[#5C1E1E] text-white py-3.5 px-8 rounded-2xl font-bold shadow-lg">
                    Save Page Content & Publish
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: BLOG PUBLISHER */}
          {activeTab === "blogs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E8DFC9]">
                <h3 className="font-black text-sm text-[#2D2118]">Blog Articles ({blogs.length})</h3>
                <button onClick={() => setShowBlogModal(true)} className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Publish New Article
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blogs.map((b, i) => (
                  <div key={i} className="bg-white rounded-3xl p-5 border border-[#E8DFC9] shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <img src={b.featuredImage} alt={b.title} className="w-full h-36 object-cover rounded-2xl border border-[#E8DFC9] mb-3" />
                      <span className="bg-purple-100 text-purple-800 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">{b.category}</span>
                      <h4 className="font-black text-base text-[#2D2118] mt-1">{b.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{b.summary || b.content}</p>
                    </div>

                    <div className="pt-3 border-t border-[#E8DFC9] flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">By {b.author}</span>
                      <span className="text-emerald-700 font-bold">Published</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FAQS CENTER */}
          {activeTab === "faqs" && (
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
                <h3 className="font-black text-base text-[#2D2118]">Categorized FAQs ({faqs.length})</h3>
                <button onClick={() => setShowFaqModal(true)} className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add FAQ Item
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {faqs.map((f, i) => (
                  <div key={i} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-sm text-[#5C1E1E]">{f.question}</span>
                      <span className="bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{f.category}</span>
                    </div>
                    <p className="text-gray-600 font-medium">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CAREERS */}
          {activeTab === "careers" && (
            <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
                <h3 className="font-black text-base text-[#2D2118]">Careers & Open Positions ({careers.length})</h3>
                <button onClick={() => setShowCareerModal(true)} className="bg-[#5C1E1E] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Job Listing
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {careers.map((j, i) => (
                  <div key={i} className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DFC9] flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-sm text-[#2D2118]">{j.title}</h4>
                      <p className="text-gray-500">{j.department} · {j.location} · {j.type}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">Active Opening</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LOOKBOOK */}
          {activeTab === "lookbook" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lookbooks.map((l, i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-[#E8DFC9] shadow-sm space-y-3">
                  <img src={l.bannerUrl} alt={l.title} className="w-full h-44 object-cover rounded-2xl border border-[#E8DFC9]" />
                  <span className="bg-[#B8956A] text-[#2D2118] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">{l.season}</span>
                  <h4 className="font-black text-base text-[#2D2118]">{l.title}</h4>
                  <p className="text-xs text-gray-600">{l.description}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── ADD BLOG MODAL ─── */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9] relative">
            <button onClick={() => setShowBlogModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">Publish New Blog Article</h3>

            <form onSubmit={handleSaveBlog} className="space-y-3 text-xs">
              <input type="text" required placeholder="Article Title *" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <input type="text" placeholder="Category (e.g. Bridal Fashion)" value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <ImageUploader label="Featured Header Image" value={blogForm.featuredImage} onChange={(url) => setBlogForm({ ...blogForm, featuredImage: url })} />
              <textarea rows={4} required placeholder="Article Content..." value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-medium" />
              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Publish Article</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD FAQ MODAL ─── */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E8DFC9] relative">
            <button onClick={() => setShowFaqModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="font-black text-base text-[#2D2118]">Add FAQ Item</h3>

            <form onSubmit={handleSaveFaq} className="space-y-3 text-xs">
              <select value={faqForm.category} onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold">
                <option value="Orders & Shipping">Orders & Shipping</option>
                <option value="Returns & Refunds">Returns & Refunds</option>
                <option value="Custom Tailoring">Custom Tailoring</option>
              </select>
              <input type="text" required placeholder="Question *" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-bold" />
              <textarea rows={3} required placeholder="Answer *" value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} className="w-full bg-[#FAF5EC] border p-2.5 rounded-xl font-medium" />
              <button type="submit" disabled={submitting} className="w-full bg-[#5C1E1E] text-white py-3 rounded-xl font-bold">Save FAQ Item</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
