import React, { useState } from "react";
import { X, Sparkles, Phone, Mail, User, ArrowRight, ShieldCheck } from "lucide-react";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, setCurrentUser } = useAuth();
  const [countryCode, setCountryCode] = useState("+977"); // Nepal default (+977 / +91)
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!authPhone || authPhone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    const fullPhone = `${countryCode}${authPhone.trim()}`;
    try {
      const res = await apiFetch("/auth/send-otp", {
        method: "POST",
        body: { phone: fullPhone }
      });
      setOtpSent(true);
      setIsExistingUser(res.is_existing_user);
      toast.success(res.message || `OTP sent to ${fullPhone}`);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!authOtp || authOtp.trim().length < 4) {
      toast.error("Please enter the OTP verification code");
      return;
    }
    if (!isExistingUser) {
      if (!authName || !authName.trim()) {
        toast.error("Please enter your full name");
        return;
      }
      if (!authEmail || !authEmail.trim() || !authEmail.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
    }
    setLoading(true);
    const fullPhone = `${countryCode}${authPhone.trim()}`;
    try {
      const user = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: {
          phone: fullPhone,
          otp: authOtp,
          name: authName.trim(),
          email: authEmail.trim()
        }
      });
      setCurrentUser(user);
      setShowAuthModal(false);
      setOtpSent(false);
      setAuthOtp("");
      setAuthPhone("");
      setAuthName("");
      setAuthEmail("");
      toast.success(`Welcome to RIVAANTA, ${user.name}! ✨`);
    } catch (err) {
      toast.error(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl relative border border-[#E8DFC9] space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Drag handle pill on mobile */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden mb-1" />

        <button
          onClick={() => {
            setShowAuthModal(false);
            setOtpSent(false);
          }}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black transition hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 bg-[#5C1E1E] text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#5C1E1E]/30">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2D2118]">
            {otpSent ? (isExistingUser ? "Enter Verification OTP" : "Welcome! Create Profile") : "Instant Phone Login"}
          </h2>
          <p className="text-xs text-[#8B7355]">
            {otpSent
              ? (isExistingUser ? "Enter the 6-digit code sent to your phone." : "Fill details below to complete 1-click registration.")
              : "Passwordless authentication via Twilio SMS"}
          </p>
        </div>

        {/* Step 1: Request OTP */}
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1.5">
                Country & Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-2.5 text-xs font-extrabold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                >
                  <option value="+977">🇳🇵 +977</option>
                  <option value="+91">🇮🇳 +91</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98XXXXXXXX"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-9 pr-4 py-3 text-sm font-black text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Sending OTP..." : "Get Verification Code"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="p-3 bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl text-[11px] text-[#8B7355] space-y-0.5">
              <div className="font-bold text-[#2D2118] flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Twilio Verified Network
              </div>
              <p className="text-[10px] text-[#8B7355]">
                Instant SMS delivery. <em>(Dev mode test code: <strong>123456</strong>)</em>
              </p>
            </div>
          </form>
        ) : (
          /* Step 2: Verify Code + Ask Name & Email for First Time Users */
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] flex justify-between items-center text-xs">
              <span className="text-[#2D2118]">OTP sent to <strong>{countryCode} {authPhone}</strong></span>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-[#5C1E1E] font-bold hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="1 2 3 4 5 6"
                value={authOtp}
                onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#FAF5EC] border border-[#5C1E1E] rounded-2xl px-4 py-2.5 text-center tracking-widest text-xl font-black text-[#2D2118] focus:outline-none"
              />
            </div>

            {/* First-Time User Registration: Name & Email */}
            {(!isExistingUser || !authName) && (
              <div className="space-y-3 pt-1 border-t border-[#E8DFC9]/60">
                <span className="text-[10px] font-black text-[#5C1E1E] uppercase tracking-widest block">
                  New Member Setup — Required Info
                </span>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 transition active:scale-95 mt-2"
            >
              {loading ? "Verifying..." : "Verify & Complete Registration"}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-xs text-[#8B7355] hover:text-[#5C1E1E] font-bold"
              >
                Resend OTP Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

