import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X, Sparkles, Phone, Mail, User, ArrowRight, ShieldCheck,
  CheckCircle2, Loader2, Clock, RefreshCw
} from "lucide-react";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

// ─── Individual OTP Digit Input ──────────────────────────────────────────────
function OtpDigitBoxes({ value, onChange, onComplete, disabled }) {
  const inputRefs = useRef([]);
  const OTP_LENGTH = 6;

  useEffect(() => {
    // Auto-focus first empty box when component mounts
    const firstEmpty = value.length;
    if (firstEmpty < OTP_LENGTH && inputRefs.current[firstEmpty]) {
      inputRefs.current[firstEmpty].focus();
    }
  }, []);

  const handleKeyDown = (idx, e) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const digits = value.split("");
      if (digits[idx]) {
        digits[idx] = "";
        const newVal = digits.join("");
        onChange(newVal.replace(/\s/g, ""));
      } else if (idx > 0) {
        digits[idx - 1] = "";
        const newVal = digits.join("");
        onChange(newVal.replace(/\s/g, ""));
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleInput = (idx, e) => {
    if (disabled) return;
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;

    const digits = value.padEnd(OTP_LENGTH, " ").split("");
    digits[idx] = char;
    const newVal = digits.join("").trim();
    onChange(newVal);

    if (newVal.length === OTP_LENGTH) {
      onComplete?.(newVal);
    } else if (idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) {
      onChange(pasted);
      if (pasted.length === OTP_LENGTH) {
        onComplete?.(pasted);
      }
      const nextIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, idx) => {
        const digit = value[idx] || "";
        const isFilled = !!digit;
        const isActive = idx === value.length;
        return (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digit}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onInput={(e) => handleInput(idx, e)}
            className={`
              w-11 h-13 sm:w-12 sm:h-14 rounded-xl text-center text-xl font-black
              transition-all duration-200 outline-none
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${isFilled
                ? "bg-[#5C1E1E] text-white border-2 border-[#5C1E1E] scale-105 shadow-lg shadow-[#5C1E1E]/20"
                : isActive
                  ? "bg-white border-2 border-[#5C1E1E] ring-2 ring-[#5C1E1E]/20 shadow-md"
                  : "bg-[#FAF5EC] border-2 border-[#E8DFC9]"
              }
            `}
            style={{ caretColor: "transparent" }}
            aria-label={`Digit ${idx + 1}`}
          />
        );
      })}
    </div>
  );
}

// ─── Countdown Timer Hook ────────────────────────────────────────────────────
function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setIsActive(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, remaining]);

  const restart = useCallback(() => {
    setRemaining(seconds);
    setIsActive(true);
  }, [seconds]);

  return { remaining, canResend: !isActive && remaining === 0, restart };
}

// ─── Enterprise Auth Modal ───────────────────────────────────────────────────
export function AuthModal() {
  const { showAuthModal, setShowAuthModal, setCurrentUser } = useAuth();
  const [countryCode, setCountryCode] = useState("+977");
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [step, setStep] = useState(1); // 1=phone, 2=otp, 3=profile (new users)
  const [isExistingUser, setIsExistingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const phoneInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const countdown = useCountdown(60);

  // Auto-focus phone input on modal open
  useEffect(() => {
    if (showAuthModal && step === 1) {
      setTimeout(() => phoneInputRef.current?.focus(), 150);
    }
  }, [showAuthModal, step]);

  // Auto-focus name input on step 3
  useEffect(() => {
    if (step === 3) {
      setTimeout(() => nameInputRef.current?.focus(), 150);
    }
  }, [step]);

  const fullPhone = useMemo(
    () => `${countryCode}${authPhone.trim()}`,
    [countryCode, authPhone]
  );

  const maskedPhone = useMemo(() => {
    const p = authPhone.trim();
    if (p.length < 4) return p;
    return p.slice(0, 2) + "••••" + p.slice(-2);
  }, [authPhone]);

  const resetAll = useCallback(() => {
    setStep(1);
    setAuthOtp("");
    setAuthPhone("");
    setAuthName("");
    setAuthEmail("");
    setIsExistingUser(true);
    setOtpError("");
    setAttempts(0);
  }, []);

  if (!showAuthModal) return null;

  // ─── Step 1: Send OTP (Pure Backend) ────────────────────────────────────
  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    if (!authPhone || authPhone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setSendingOtp(true);
    setOtpError("");

    try {
      const res = await apiFetch("/auth/send-otp", {
        method: "POST",
        body: { phone: fullPhone },
      });

      setIsExistingUser(res.is_existing_user);
      setStep(2);
      countdown.restart();

      // In dev mode (no Twilio), show the OTP code for easy testing
      if (res.otp) {
        toast.success(`Verification code: ${res.otp}`, { icon: "📲", duration: 10000 });
      } else {
        toast.success("Verification code sent!", { icon: "📲" });
      }
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  // ─── Step 2: Verify OTP (Pure Backend) ─────────────────────────────────
  const handleVerifyOtp = async (otpCode) => {
    const code = otpCode || authOtp;
    if (!code || code.length < 4) {
      setOtpError("Please enter the full 6-digit code");
      return;
    }
    setVerifying(true);
    setOtpError("");

    try {
      const body = {
        phone: fullPhone,
        otp: code,
        name: authName.trim(),
        email: authEmail.trim(),
      };

      const user = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body,
      });

      // If new user, show profile step
      if (!isExistingUser && step === 2) {
        setStep(3);
        setVerifying(false);
        return;
      }

      // Complete login
      setCurrentUser(user);
      setShowAuthModal(false);
      resetAll();
      toast.success(`Welcome back, ${user.name}! ✨`, {
        icon: "🎉",
        duration: 3000,
      });
    } catch (err) {
      setAttempts((a) => a + 1);
      setOtpError(
        attempts >= 2
          ? "Too many failed attempts. Try resending the code."
          : err.message || "Invalid or expired OTP"
      );
    } finally {
      setVerifying(false);
    }
  };

  // ─── Step 3: Complete Profile (new users, Pure Backend) ────────────────
  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!authName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!authEmail.trim() || !authEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const body = {
        phone: fullPhone,
        otp: authOtp,
        name: authName.trim(),
        email: authEmail.trim(),
      };

      const user = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body,
      });

      setCurrentUser(user);
      setShowAuthModal(false);
      resetAll();
      toast.success(`Welcome to RIVAANTA, ${user.name}! ✨`, {
        icon: "🎉",
        duration: 3000,
      });
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step Indicator ────────────────────────────────────────────────────
  const totalSteps = isExistingUser ? 2 : 3;
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1.5 mb-1">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i + 1 <= step
              ? "bg-[#5C1E1E] w-6"
              : "bg-[#E8DFC9] w-3"
          }`}
        />
      ))}
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowAuthModal(false);
          resetAll();
        }
      }}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl relative border border-[#E8DFC9] max-h-[92vh] overflow-y-auto"
        style={{
          animation: "authSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Inline keyframe animation */}
        <style>{`
          @keyframes authSlideUp {
            from { opacity: 0; transform: translateY(40px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes authPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes authShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          @keyframes authCheckmark {
            from { transform: scale(0) rotate(-45deg); opacity: 0; }
            to { transform: scale(1) rotate(0); opacity: 1; }
          }
          .auth-loading-dots span {
            animation: authPulse 1.4s infinite;
          }
          .auth-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
          .auth-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        `}</style>

        {/* Drag handle on mobile */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden mt-3" />

        <div className="p-5 sm:p-8 space-y-5">
          {/* Close Button */}
          <button
            onClick={() => {
              setShowAuthModal(false);
              resetAll();
            }}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black transition-all hover:bg-gray-200 hover:scale-110 active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step Progress */}
          <StepIndicator />

          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#5C1E1E] to-[#8B3A3A] text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#5C1E1E]/30 transition-transform hover:scale-105">
              {verifying ? (
                <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
              ) : step === 2 ? (
                <ShieldCheck className="w-5 h-5 text-amber-300" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#2D2118]">
              {step === 1 && "Secure Phone Login"}
              {step === 2 && (isExistingUser ? "Verify Your Identity" : "Enter Verification Code")}
              {step === 3 && "Complete Your Profile"}
            </h2>
            <p className="text-xs text-[#8B7355]">
              {step === 1 && "Enterprise-grade passwordless authentication"}
              {step === 2 && `Enter the 6-digit code sent to ${countryCode} ${maskedPhone}`}
              {step === 3 && "One last step — tell us about yourself"}
            </p>
          </div>

          {/* ─── Step 1: Phone Input ──────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1.5">
                  Country & Mobile Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-2.5 text-xs font-extrabold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E] transition-colors"
                  >
                    <option value="+977">🇳🇵 +977</option>
                    <option value="+91">🇮🇳 +91</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="98XXXXXXXX"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-9 pr-4 py-3 text-sm font-black text-[#2D2118] focus:outline-none focus:border-[#5C1E1E] transition-colors"
                      autoComplete="tel"
                    />
                    {authPhone.length === 10 && (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ animation: "authCheckmark 0.3s ease-out" }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sendingOtp || authPhone.length < 10}
                className={`
                  w-full py-3.5 rounded-2xl text-xs font-bold shadow-lg transition-all
                  flex items-center justify-center gap-2 active:scale-[0.98]
                  ${authPhone.length >= 10
                    ? "bg-[#5C1E1E] hover:bg-[#4A1717] text-white shadow-[#5C1E1E]/30 cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  }
                `}
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="auth-loading-dots">
                      Sending<span>.</span><span>.</span><span>.</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span>Get Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex gap-2">
                <div className="flex-1 p-2.5 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="text-[9px] text-[#8B7355] font-semibold leading-tight">
                    256-bit encrypted
                  </span>
                </div>
                <div className="flex-1 p-2.5 bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="text-[9px] text-[#8B7355] font-semibold leading-tight">
                    Login in 30 seconds
                  </span>
                </div>
              </div>
            </form>
          )}

          {/* ─── Step 2: OTP Verification ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Phone Info Bar */}
              <div className="bg-[#FAF5EC] p-3 rounded-2xl border border-[#E8DFC9] flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[#2D2118]">
                    Code sent to <strong>{countryCode} {maskedPhone}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setAuthOtp("");
                    setOtpError("");
                  }}
                  className="text-[#5C1E1E] font-bold hover:underline text-[11px]"
                >
                  Change
                </button>
              </div>

              {/* OTP Digit Boxes */}
              <div>
                <label className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-3 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div style={otpError ? { animation: "authShake 0.4s ease-in-out" } : {}}>
                  <OtpDigitBoxes
                    value={authOtp}
                    onChange={(val) => {
                      setAuthOtp(val);
                      setOtpError("");
                    }}
                    onComplete={(code) => {
                      // Auto-submit on 6 digit completion for existing users
                      if (isExistingUser) {
                        handleVerifyOtp(code);
                      }
                    }}
                    disabled={verifying}
                  />
                </div>
                {otpError && (
                  <p className="text-xs text-red-500 text-center mt-2 font-semibold">
                    {otpError}
                  </p>
                )}
              </div>

              {/* Verify Button (for new users or if auto-submit didn't trigger) */}
              <button
                onClick={() => handleVerifyOtp()}
                disabled={verifying || authOtp.length < 6}
                className={`
                  w-full py-3.5 rounded-2xl text-xs font-bold shadow-lg transition-all
                  flex items-center justify-center gap-2 active:scale-[0.98]
                  ${authOtp.length >= 6
                    ? "bg-[#5C1E1E] hover:bg-[#4A1717] text-white shadow-[#5C1E1E]/30"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  }
                `}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying identity...</span>
                  </>
                ) : (
                  <span>{isExistingUser ? "Verify & Login" : "Verify & Continue"}</span>
                )}
              </button>

              {/* Resend with Countdown */}
              <div className="text-center">
                {countdown.canResend ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleSendOtp(e);
                      setAttempts(0);
                    }}
                    disabled={sendingOtp}
                    className="text-xs text-[#5C1E1E] hover:text-[#8B3A3A] font-bold flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${sendingOtp ? "animate-spin" : ""}`} />
                    <span>Resend Verification Code</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-[#8B7355] flex items-center gap-1 justify-center">
                    <Clock className="w-3 h-3" />
                    Resend in {countdown.remaining}s
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ─── Step 3: Profile Completion (New Users) ──────────────── */}
          {step === 3 && (
            <form onSubmit={handleCompleteProfile} className="space-y-3.5">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-2xl border border-amber-200 text-center">
                <span className="text-[11px] font-black text-amber-800 uppercase tracking-widest">
                  ✦ New Member — Welcome to RIVAANTA ✦
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E] transition-colors"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. priya@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E] transition-colors"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !authName.trim() || !authEmail.includes("@")}
                className={`
                  w-full py-3.5 rounded-2xl text-xs font-bold shadow-lg transition-all
                  flex items-center justify-center gap-2 active:scale-[0.98] mt-1
                  ${authName.trim() && authEmail.includes("@")
                    ? "bg-[#5C1E1E] hover:bg-[#4A1717] text-white shadow-[#5C1E1E]/30"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
