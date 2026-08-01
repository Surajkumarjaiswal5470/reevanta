import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../services/api";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      toast.error("Please fill in your name and message.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/support/contact", {
        method: "POST",
        body: formData
      });
      setSubmitted(true);
      toast.success("Message sent successfully! Our Kathmandu desk will contact you shortly.");
    } catch (err) {
      toast.error(err.message || "Failed to submit message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      
      {/* Header Hero */}
      <div className="bg-gradient-to-r from-[#2D2118] via-[#5C1E1E] to-[#2D2118] text-white p-8 sm:p-12 rounded-3xl space-y-4 shadow-xl border border-[#B8956A]/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">Kathmandu Headquarters</span>
            <h1 className="text-3xl font-black text-[#FAF5EC]">Get in Touch with RIVAANTA</h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-200 max-w-3xl leading-relaxed">
          Have a question about an order, custom bridal sizing, or becoming a reseller? Our dedicated team in <strong>Kathmandu, Nepal</strong> is here to assist you 6 days a week.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Info Cards */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#2D2118]">Head Office & Store Location</h3>
            <p className="text-xs text-gray-700 font-medium">Kathmandu, Nepal</p>
            <p className="text-xs text-gray-500">Durbar Marg Luxury Hub, Kathmandu 44600</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#2D2118]">Phone & WhatsApp Hotline</h3>
            <a href="tel:+9779715102007" className="text-sm font-black text-[#5C1E1E] hover:underline block">
              +977 9715102007
            </a>
            <p className="text-xs text-gray-500">Call / WhatsApp for instant support</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#2D2118]">Customer Care Email</h3>
            <a href="mailto:support@reevanta.com" className="text-xs font-bold text-[#2D2118] hover:underline block">
              support@reevanta.com
            </a>
            <p className="text-xs text-gray-500">24/7 Email assistance</p>
          </div>

          <div className="bg-[#FAF5EC] p-6 rounded-3xl border border-[#E8DFC9] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#2D2118]">
              <Clock className="w-4 h-4 text-[#8B7355]" /> Operating Hours
            </div>
            <p className="text-gray-600">Sunday – Friday: 10:00 AM – 7:00 PM NPT</p>
            <p className="text-gray-600">Saturday: Closed (Email support available)</p>
          </div>

        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E8DFC9] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#2D2118]">Send Us a Message</h2>
            <p className="text-xs text-gray-500">Fill in your query and our team will get back to you within 2 hours.</p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-3 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-900">Message Received!</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Thank you for contacting RIVAANTA. A customer service representative from our Kathmandu office will reach out to <strong>{formData.email || formData.phone || "you"}</strong> shortly.
              </p>
              <button
                onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" }); }}
                className="mt-4 bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#2D2118] block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anjali Shrestha"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2D2118] block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="anjali@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#2D2118] block mb-1">Phone Number (Nepal/Intl)</label>
                  <input
                    type="tel"
                    placeholder="+977 98XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2D2118] block mb-1">Inquiry Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Tracking & Status">Order Tracking & Status</option>
                    <option value="Returns & Exchange">Returns & Exchange</option>
                    <option value="Reseller & Wholesale Application">Reseller & Wholesale Application</option>
                    <option value="Bridal Custom Fitting">Bridal Custom Fitting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D2118] block mb-1">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can our Kathmandu team help you today?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Sending..." : "Submit Message to Kathmandu Desk"}</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
