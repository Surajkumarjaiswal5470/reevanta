import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "../services/api";
import { toast } from "sonner";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const user = await apiFetch("/auth/me");
      setCurrentUser(user);
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      setCurrentUser(null);
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
