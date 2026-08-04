import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { LogOut, ShieldCheck, KeyRound, UserCheck, Eye, EyeOff } from "lucide-react";
import { AdminPanel } from "./components/AdminPanel";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

// Pre-attach stored authorization header if available
const savedAdminToken = typeof localStorage !== "undefined" ? localStorage.getItem("reevanta_admin_token") : null;
if (savedAdminToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${savedAdminToken}`;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("reevanta_admin_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [adminName, setAdminName] = useState("spk");
  const [secretKey, setSecretKey] = useState("");
  const [gatewayKey, setGatewayKey] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("gateway") || params.get("key") || "vault-spk-9981";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("reevanta_admin_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    axios
      .get(`${API}/auth/me`)
      .then((res) => {
        if (res.data && res.data.role === "admin") {
          setCurrentUser(res.data);
          localStorage.setItem("reevanta_admin_user", JSON.stringify(res.data));
        } else {
          // Check cached session
          const cached = localStorage.getItem("reevanta_admin_user");
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed && parsed.role === "admin") {
                setCurrentUser(parsed);
              } else {
                setCurrentUser(null);
              }
            } catch {
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        }
        setAuthLoading(false);
      })
      .catch(() => {
        // Fallback to local stored session if endpoint check fails temporarily
        const cached = localStorage.getItem("reevanta_admin_user");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.role === "admin") {
              setCurrentUser(parsed);
            } else {
              setCurrentUser(null);
            }
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      });

    // ── Client-Side Heartbeat Pinger (Keeps Render Free Tier 100% Awake) ──
    const pingHeartbeat = () => {
      axios.get(`${API}/health/liveness`).catch(() => {});
    };
    pingHeartbeat();
    const heartbeatInterval = setInterval(pingHeartbeat, 120000); // Ping every 2 minutes

    return () => clearInterval(heartbeatInterval);
  }, []);

  const handleSecretLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (!adminName.trim() || !secretKey.trim()) {
      toast.error("Please enter Admin Name and Secret Key");
      return;
    }
    setLoggingIn(true);
    try {
      const res = await axios.post(`${API}/auth/admin-secret-login`, {
        name: adminName.trim(),
        secretKey: secretKey.trim(),
        gatewayKey: gatewayKey.trim()
      });

      if (res.data.token) {
        localStorage.setItem("reevanta_admin_token", res.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      }
      localStorage.setItem("reevanta_admin_user", JSON.stringify(res.data));
      setCurrentUser(res.data);
      toast.success(`Welcome spk! Admin workspace unlocked successfully.`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid Secret Key or Name (Name must be 'spk', Secret Key must be 'PHOENIX')";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("reevanta_admin_token");
      localStorage.removeItem("reevanta_admin_user");
      delete axios.defaults.headers.common["Authorization"];
      setCurrentUser(null);
      toast.info("Logged out from Admin Portal");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5EC] text-[#2D2118] font-sans">
      <Toaster position="top-right" richColors />

      {/* Header Banner */}
      <header className="bg-[#2D2118] text-[#F5EBDC] border-b border-[#B8956A]/30 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#5C1E1E] to-[#B8956A] flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow shrink-0">
              R
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-normal tracking-[0.3em] sm:tracking-[0.35em] text-white rivaanta-mark">
                RIVAANTA
              </h1>
              <p className="text-[9px] sm:text-[10px] text-[#B8956A] tracking-wider font-bold uppercase">
                Admin Operations Portal
              </p>
            </div>
          </div>

          {currentUser && currentUser.role === "admin" && (
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-xs text-gray-300">
                Logged in as <strong className="text-[#B8956A]">{currentUser.name || "spk"}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-xs font-bold text-red-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {authLoading ? (
          <div className="text-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-[#5C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#8B7355] font-bold">Authenticating Admin Session...</p>
          </div>
        ) : !currentUser || currentUser.role !== "admin" ? (
          /* Secret Key Login Screen */
          <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-[#E8DFC9] shadow-2xl space-y-6 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#5C1E1E] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#5C1E1E]/30">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-[#2D2118]">Admin Secret Key Portal</h2>
              <p className="text-xs text-[#8B7355]">
                Enter Admin Name (<strong className="text-[#5C1E1E]">spk</strong>) and Secret Key (<strong className="text-[#5C1E1E]">PHOENIX</strong>) to unlock your admin control center.
              </p>
            </div>

            <form onSubmit={handleSecretLogin} className="space-y-4 text-xs">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold text-center">
                  {authError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block mb-1">
                  Admin Name
                </label>
                <div className="flex items-center bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#5C1E1E]">
                  <span className="px-3 text-xs font-bold text-[#8B7355] bg-[#E8DFC9]/40 py-3 border-r border-[#E8DFC9]">
                    <UserCheck className="w-4 h-4 text-[#5C1E1E]" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="spk"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-transparent p-3 text-xs font-bold text-[#2D2118] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block mb-1">
                  Secret Gateway Access Key
                </label>
                <div className="flex items-center bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#5C1E1E]">
                  <span className="px-3 text-xs font-bold text-[#8B7355] bg-[#E8DFC9]/40 py-3 border-r border-[#E8DFC9]">
                    <ShieldCheck className="w-4 h-4 text-[#5C1E1E]" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. vault-spk-9981"
                    value={gatewayKey}
                    onChange={(e) => setGatewayKey(e.target.value)}
                    className="w-full bg-transparent p-3 text-xs font-bold font-mono text-[#2D2118] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block mb-1">
                  Secret Key
                </label>
                <div className="flex items-center bg-[#FAF5EC] border border-[#E8DFC9] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#5C1E1E]">
                  <span className="px-3 text-xs font-bold text-[#8B7355] bg-[#E8DFC9]/40 py-3 border-r border-[#E8DFC9]">
                    <KeyRound className="w-4 h-4 text-[#5C1E1E]" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter Secret Key"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full bg-transparent p-3 text-xs font-bold text-[#2D2118] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 text-gray-500 hover:text-[#5C1E1E] focus:outline-none"
                    title={showPassword ? "Hide Secret Key" : "Show Secret Key"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-[#5C1E1E] hover:bg-[#4A1717] text-white font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-[#5C1E1E]/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{loggingIn ? "Verifying Secret Key..." : "Authenticate & Unlock Admin Workspace"}</span>
              </button>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-0.5 text-center">
                <strong>🔑 Admin Secret Key Credentials:</strong>
                <div>Name: <code className="font-bold text-[#5C1E1E]">spk</code></div>
                <div>Secret Key: <code className="font-bold text-[#5C1E1E]">PHOENIX</code></div>
              </div>
            </form>
          </div>
        ) : (
          /* Render Admin Dashboard */
          <AdminPanel />
        )}
      </main>
    </div>
  );
}
