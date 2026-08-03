import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../services/api";
import { toast } from "sonner";

const AuthContext = createContext();
const AUTH_STORAGE_KEY = "rivaanta_user";
const AUTH_TIMESTAMP_KEY = "rivaanta_auth_ts";
const SESSION_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days (3 months)
const REVALIDATION_INTERVAL_MS = 5 * 60 * 1000; // 5 min

// ─── Safe localStorage Helpers ───────────────────────────────────────────────
function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    // Check if session has expired client-side
    const ts = parseInt(localStorage.getItem(AUTH_TIMESTAMP_KEY) || "0", 10);
    if (ts && Date.now() - ts > SESSION_MAX_AGE_MS) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeUser(user) {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_TIMESTAMP_KEY, String(Date.now()));
      if (user.token) {
        localStorage.setItem("reevanta_token", user.token);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      localStorage.removeItem("reevanta_token");
    }
  } catch {
    // Quota exceeded or incognito — silently ignore
  }
}

// ─── Auth Provider ───────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Hydrate instantly from localStorage — zero flash on refresh
  const [currentUser, setCurrentUserRaw] = useState(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const lastValidatedRef = useRef(0);
  const revalidationTimerRef = useRef(null);

  // Wrapper that keeps localStorage in sync
  const setCurrentUser = useCallback((user) => {
    setCurrentUserRaw(user);
    storeUser(user);
  }, []);

  // ─── Background Session Validation ─────────────────────────────────────
  const checkAuth = useCallback(async (opts = {}) => {
    const { silent = false, force = false } = opts;

    // Skip if recently validated (within 5 min) unless forced
    if (!force && lastValidatedRef.current && Date.now() - lastValidatedRef.current < REVALIDATION_INTERVAL_MS) {
      setAuthLoading(false);
      return;
    }

    try {
      const user = await apiFetch("/auth/me");
      setCurrentUser(user);
      lastValidatedRef.current = Date.now();
    } catch (e) {
      // Only clear on definitive 401 — network errors keep cached user
      if (e.status === 401) {
        setCurrentUser(null);
        if (!silent && currentUser) {
          toast.info("Session expired. Please log in again.");
        }
      }
    } finally {
      setAuthLoading(false);
    }
  }, [setCurrentUser, currentUser]);

  // Initial auth check on mount
  useEffect(() => {
    checkAuth({ force: true });
  }, [checkAuth]);

  // ─── Periodic Background Revalidation ──────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    revalidationTimerRef.current = setInterval(() => {
      checkAuth({ silent: true });
    }, REVALIDATION_INTERVAL_MS);

    return () => clearInterval(revalidationTimerRef.current);
  }, [currentUser, checkAuth]);

  // ─── Cross-Tab Session Sync ────────────────────────────────────────────
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === AUTH_STORAGE_KEY) {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue);
            setCurrentUserRaw(user);
          } catch { /* ignore parse errors */ }
        } else {
          // Logged out in another tab
          setCurrentUserRaw(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ─── Visibility-Based Revalidation ─────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && currentUser) {
        checkAuth({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentUser, checkAuth]);

  // ─── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Still clear local state even if backend fails
    }
    setCurrentUser(null);
    lastValidatedRef.current = 0;
    toast.success("Logged out successfully");
  }, [setCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authLoading,
        showAuthModal,
        setShowAuthModal,
        logout,
        checkAuth,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
