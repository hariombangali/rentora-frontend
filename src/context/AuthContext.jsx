import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

function clearStoredAuth() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}

function normalizeUser(nextUser, prevUser = null) {
  if (!nextUser) return null;

  const merged = { ...(prevUser || {}), ...nextUser };
  if (!merged.token && prevUser?.token) merged.token = prevUser.token;
  if (!merged.token) return merged;

  const decoded = jwtDecode(merged.token);
  if (decoded.exp * 1000 < Date.now()) return null;
  return { ...merged, _id: decoded.id };
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((nextUser) => {
    setUserState((prevUser) => {
      try {
        const resolved = typeof nextUser === "function" ? nextUser(prevUser) : nextUser;
        const normalized = normalizeUser(resolved, prevUser);

        if (!normalized) {
          clearStoredAuth();
          return null;
        }

        localStorage.setItem("user", JSON.stringify(normalized));
        return normalized;
      } catch (error) {
        console.error("Failed to persist user", error);
        clearStoredAuth();
        return null;
      }
    });
  }, []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);
      const normalized = normalizeUser(parsedUser);
      if (!normalized) {
        clearStoredAuth();
        return;
      }

      setUserState(normalized);
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      clearStoredAuth();
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    (userData) => {
      try {
        setUser(userData);
      } catch (error) {
        console.error("Failed to decode login token", error);
        clearStoredAuth();
        setUserState(null);
      }
    },
    [setUser]
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setUserState(null);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.token) return;

        const decoded = jwtDecode(parsedUser.token);
        if (decoded.exp * 1000 < Date.now()) logout();
      } catch {
        logout();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [logout]);

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  if (loading) return <div>Loading...</div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
