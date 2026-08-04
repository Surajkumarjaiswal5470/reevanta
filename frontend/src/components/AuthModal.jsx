import React, { useState, useRef, useEffect, useCallback, useMemo, useId } from "react";
import {
  X, Sparkles, Phone, Mail, User, ArrowRight, ShieldCheck,
  CheckCircle2, Loader2, Clock, RefreshCw
} from "lucide-react";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const OTP_LENGTH = 6;
const IS_DEV = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

// ─── Individual OTP Digit Input ──────────────────────────────────────────────
function OtpDigitBoxes({ value, onChange, onComplete, disabled }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first empty box when component mounts
    const firstEmpty = value.length;
    if (firstEmpty < OTP_LENGTH && inputRefs.current[firstEmpty]) {
      inputRefs.current[firstEmpty].focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (idx, e) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const digits = value.split("");
      if (digits[idx] && digits[idx].trim()) {
        digits[idx] = "";
        onChange(digits.join("").replace(/\s+$/, ""));
      } else if (idx > 0) {
        digits[idx - 1] = "";
        onChange(digits.join("").replace(/\s+$/, ""));
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
    const newVal = digits.join("").replace(/\s+$/, "");
    onChange(newVal);

    if (newVal.length === OTP_LENGTH && !newVal.includes(" ")) {
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
        // A padding placeholder is a literal space — never treat it as a filled digit.
        const rawChar = value[idx];
        const digit = rawChar && rawChar.trim() ? rawChar : "";
        const isFilled = !!digit;
        const isActive = !disabled && idx === value.replace(/\s+$/, "").length;
        return (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={idx === 0 ? "one-time-code" : "off"}
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
            aria-label={`Digit ${idx + 1} of ${OTP_LENGTH}`}
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
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const countdown = useCountdown(60);
  const isMountedRef = useRef(true);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-focus phone input on modal open
  useEffect(() => {
    if (showAuthModal && step === 1) {
      const t = setTimeout(() => phoneInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [showAuthModal, step]);

  // Auto-focus name input on step 3
  useEffect(() => {
    if (step === 3) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Lock body scroll while the modal is open
  useEffect(() => {
    if (!showAuthModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showAuthModal]);

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

  const closeModal = useCallback(() => {
    setShowAuthModal(false);
    resetAll();
  }, [setShowAuthModal, resetAll]);

  // Close on Escape
  useEffect(() => {
    if (!showAuthModal) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAuthModal, closeModal]);

  // Remember what had focus before opening, and restore it once the modal
  // closes, so keyboard/screen-reader users land back where they started.
  useEffect(() => {
    if (showAuthModal) {
      previousFocusRef.current = document.activeElement;
    } else if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [showAuthModal]);

  // Trap Tab/Shift+Tab focus inside the modal while it's open, so keyboard
  // users can't tab out onto the page behind the overlay.
  useEffect(() => {
    if (!showAuthModal) return;
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const getFocusable = () =>
      Array.from(
        modalEl.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    modalEl.addEventListener("keydown", onKeyDown);
    return () => modalEl.removeEventListener("keydown", onKeyDown);
  }, [showAuthModal, step]);

  if (!showAuthModal) return null;

  // ─── Step 1: Send OTP (Pure Backend) ────────────────────────────────────
  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    const digitsOnly = authPhone.trim();
    if (!digitsOnly || digitsOnly.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (sendingOtp) return;
    setSendingOtp(true);
    setOtpError("");

    try {
      const res = await apiFetch("/auth/send-otp", {
        method: "POST",
        body: { phone: fullPhone },
      });

      if (!isMountedRef.current) return;

      setIsExistingUser(!!res.is_existing_user);
      setAuthOtp("");
      setStep(2);
      countdown.restart();

      // Dev-only convenience: never surface the raw OTP outside of development.
      if (IS_DEV && res.otp) {
        toast.success(`Verification code: ${res.otp}`, { icon: "📲", duration: 10000 });
      } else {
        toast.success("Verification code sent!", { icon: "📲" });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      toast.error(err.message || "Failed to send OTP. Please try again.");
    } finally {
      if (isMountedRef.current) setSendingOtp(false);
    }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────────────────────
  // Existing users: verify + log in immediately (single backend call).
  // New users: only validate the code is complete here — the *actual*
  // backend verification happens once, in handleCompleteProfile, together
  // with the profile data. Calling verify-otp twice against a single-use
  // code would fail the second time.
  const handleVerifyOtp = async (otpCode) => {
    const code = otpCode || authOtp;
    if (!code || code.length !== OTP_LENGTH) {
      setOtpError(`Please enter the full ${OTP_LENGTH}-digit code`);
      return;
    }
    setOtpError("");

    if (!isExistingUser) {
      // Nothing to verify against the backend yet — just move to profile step.
      setStep(3);
      return;
    }

    if (verifying) return;
    setVerifying(true);
    try {
      const user = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: {
          phone: fullPhone,
          otp: code,
          name: authName.trim(),
          email: authEmail.trim().toLowerCase(),
        },
      });

      if (!isMountedRef.current) return;

      setCurrentUser(user);
      setShowAuthModal(false);
      resetAll();
      toast.success(`Welcome back, ${user.name}! ✨`, {
        icon: "🎉",
        duration: 3000,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      setAttempts((a) => a + 1);
      setOtpError(
        attempts >= 2
          ? "Too many failed attempts. Try resending the code."
          : err.message || "Invalid or expired OTP"
      );
    } finally {
      if (isMountedRef.current) setVerifying(false);
    }
  };

  // ─── Step 3: Complete Profile (new users — single verify-otp call) ─────
  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    const trimmedName = authName.trim();
    const trimmedEmail = authEmail.trim().toLowerCase();

    if (!trimmedName) {
      toast.error("Please enter your full name");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const user = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: {
          phone: fullPhone,
          otp: authOtp,
          name: trimmedName,
          email: trimmedEmail,
        },
      });

      if (!isMountedRef.current) return;

      setCurrentUser(user);
      setShowAuthModal(false);
      resetAll();
      toast.success(`Welcome to RIVAANTA, ${user.name}! ✨`, {
        icon: "🎉",
        duration: 3000,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      toast.error(err.message || "Registration failed. Please check your code and try again.");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleResend = (e) => {
    setAuthOtp("");
    setOtpError("");
    setAttempts(0);
    handleSendOtp(e);
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
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
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
            type="button"
            onClick={closeModal}
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
            <h2 id={titleId} className="text-xl sm:text-2xl font-black text-[#2D2118]">
              {step === 1 && "Secure Phone Login"}
              {step === 2 && (isExistingUser ? "Verify Your Identity" : "Enter Verification Code")}
              {step === 3 && "Complete Your Profile"}
            </h2>
            <p id={descId} className="text-xs text-[#8B7355]">
              {step === 1 && "Enterprise-grade passwordless authentication"}
              {step === 2 && `Enter the ${OTP_LENGTH}-digit code sent to ${countryCode} ${maskedPhone}`}
              {step === 3 && "One last step — tell us about yourself"}
            </p>
          </div>

          {/* ─── Step 1: Phone Input ──────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="auth-phone" className="text-[11px] font-extrabold text-[#2D2118] uppercase tracking-wider block mb-1.5">
                  Country & Mobile Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Country code"
                    className="bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl px-2.5 text-xs font-extrabold text-[#2D2118] focus:outline-none focus:border-[#5C1E1E] transition-colors"
                  >
                    <option value="+977">🇳🇵 +977</option>
                    <option value="+91">🇮🇳 +91</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-phone"
                      ref={phoneInputRef}
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="98XXXXXXXX"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full bg-[#FAF5EC] border border-[#E8DFC9] rounded-2xl pl-9 pr-4 py-3 text-sm font-black text-[#2D2118] focus:outline-none focus:border-[#5C1E1E] transition-colors"
                      autoComplete="tel-national"
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
                  Enter {OTP_LENGTH}-Digit Verification Code
                </label>
                <div style={otpError ? { animation: "authShake 0.4s ease-in-out" } : {}}>
                  <OtpDigitBoxes
                    value={authOtp}
                    onChange={(val) => {
                      setAuthOtp(val);
                      setOtpError("");
                    }}
                    onComplete={(code) => {
                      // Auto-submit on completion for existing users only;
                      // new users still need to fill in their profile.
                      if (isExistingUser) {
                        handleVerifyOtp(code);
                      }
                    }}
                    disabled={verifying}
                  />
                </div>
                {otpError && (
                  <p role="alert" className="text-xs text-red-500 text-center mt-2 font-semibold">
                    {otpError}
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={verifying || authOtp.replace(/\s/g, "").length < OTP_LENGTH}
                className={`
                  w-full py-3.5 rounded-2xl text-xs font-bold shadow-lg transition-all
                  flex items-center justify-center gap-2 active:scale-[0.98]
                  ${authOtp.replace(/\s/g, "").length >= OTP_LENGTH
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
                  <span>{isExistingUser ? "Verify & Login" : "Continue"}</span>
                )}
              </button>

              {/* Resend with Countdown */}
              <div className="text-center">
                {countdown.canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
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
                <label htmlFor="auth-name" className="text-[11px] font-bold text-gray-700 block mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-name"
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
                <label htmlFor="auth-email" className="text-[11px] font-bold text-gray-700 block mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email"
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