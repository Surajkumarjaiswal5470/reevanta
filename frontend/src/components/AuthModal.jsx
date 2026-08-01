import React, { useState } from "react";
import { X, Sparkles, Phone, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, setCurrentUser } = useAuth();
  const [countryCode, setCountryCode] = useState("+977"); // Nepal default (+977 / +91)
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authName, setAuthName] = useState("");
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
      toast.error("Please enter the OTP code");
      return;
    }
    if (!isExistingUser && (!authName || !authName.trim())) {
      toast.error("Please enter your full name for first-time registration");
      return;
    }
    setLoading(true);
    const fullPhone = `${countryCode}${authPhone.trim()}`;
    try {
      const user = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: { phone: fullPhone, otp: authOtp, name: authName }
      });
      setCurrentUser(user);
      setShowAuthModal(false);
      setOtpSent(false);
      setAuthOtp("");
      setAuthPhone("");
      setAuthName("");
      toast.success(`Welcome to RIVAANTA, ${user.name}! ✨`);
    } catch (err) {
      toast.error(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-[#E8DFC9] space-y-6">
        <button
          onClick={() => {
            setShowAuthModal(false);
            setOtpSent(false);
          }}
          className="absolute top-4 right-4 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black transition hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#5C1E1E] text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#5C1E1E]/30">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-2xl font-black text-[#2D2118]">
            {otpSent ? (isExistingUser ? "Enter Verification OTP" : "Welcome! Create Profile") : "Instant Phone Login"}
          </h2>
          <p className="text-xs text-[#8B7355]">
            {otpSent
              ? (isExistingUser ? "We sent a 6-digit code to your phone." : "Verify OTP and set your name for instant access.")
              : "Passwordless 1-click authentication via Twilio SMS"}
          </p>
        </div>

        {/* Phone OTP Step 1: Request OTP */}
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#2D2118] uppercase tracking-wider block mb-1">
                Select Country & Enter Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-3 text-xs font-bold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                >
                  <option value="+977">🇳🇵 +977 (Nepal)</option>
                  <option value="+91">🇮🇳 +91 (India)</option>
                </select>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="98XXXXXXXX"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-4 py-3 text-sm font-bold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                />
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

            <div className="p-3.5 bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl text-[11px] text-[#8B7355] space-y-1">
              <div className="font-bold text-[#2D2118] flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Secure Twilio Verification
              </div>
              <p className="text-[10px] text-[#8B7355]">
                OTP will be delivered via Twilio SMS. <em>(Dev mode test OTP: <strong>123456</strong>)</em>
              </p>
            </div>
          </form>
        ) : (
          /* Phone OTP Step 2: Verify Code & Name for First Time */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
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
              <label className="text-xs font-bold text-[#2D2118] uppercase tracking-wider block mb-1">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="1 2 3 4 5 6"
                value={authOtp}
                onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#FAF5EC] border border-[#5C1E1E] rounded-2xl px-4 py-3 text-center tracking-widest text-xl font-black text-[#2D2118] focus:outline-none"
              />
            </div>

            {/* Prompt Name for First Time Users */}
            {(!isExistingUser || !authName) && (
              <div className="space-y-1 animate-in fade-in duration-300">
                <label className="text-xs font-bold text-[#5C1E1E] uppercase tracking-wider block">
                  First Time Registration — Full Name *
                </label>
                <input
                  type="text"
                  required={!isExistingUser}
                  placeholder="e.g. Priya Sharma"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-[#5C1E1E]/30 transition active:scale-95"
            >
              {loading ? "Verifying..." : "Verify & Complete Login"}
            </button>

            <div className="text-center">
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

