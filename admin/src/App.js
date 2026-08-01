import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { LogOut, ShieldCheck, KeyRound, UserCheck, Eye, EyeOff } from "lucide-react";
import { AdminPanel } from "./components/AdminPanel";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminName, setAdminName] = useState("spk");
  const [secretKey, setSecretKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/auth/me`)
      .then((res) => {
        if (res.data && res.data.role === "admin") {
          setCurrentUser(res.data);
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      })
      .catch(() => {
        setCurrentUser(null);
        setAuthLoading(false);
      });
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
        secretKey: secretKey.trim()
      });
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
      setCurrentUser(null);
      toast.info("Logged out from Admin Portal");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5EC] text-[#2D2118] font-sans">
      <Toaster position="top-right" richColors />

      {/* Header Banner */}
      <header className="bg-[#2D2118] text-[#F5EBDC] border-b border-[#B8956A]/30 px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5C1E1E] to-[#B8956A] flex items-center justify-center text-white font-bold text-xl shadow">
              R
            </div>
            <div>
              <h1 className="text-lg font-normal tracking-[0.35em] text-white rivaanta-mark">
                RIVAANTA
              </h1>
              <p className="text-[10px] text-[#B8956A] tracking-wider font-bold uppercase">
                Admin Operations Portal · Port 3001
              </p>
            </div>
          </div>

          {currentUser && currentUser.role === "admin" && (
            <div className="flex items-center space-x-4">
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
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
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
                Enter Admin Name (<strong className="text-[#5C1E1E]">spk</strong>) and Secret Key (<strong className="text-[#5C1E1E]">PHOENIX</strong>) to unlock Port 3001 workspace.
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
