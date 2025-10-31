// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Initialize user on app load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        if (parsedUser.token) {
          const decoded = jwtDecode(parsedUser.token);

          // 🔒 Check token expiry
          if (decoded.exp * 1000 < Date.now()) {
            console.warn("⏰ Token expired. Logging out...");
            localStorage.removeItem("user");
            setUser(null);
          } else {
            parsedUser._id = decoded.id;
            setUser(parsedUser);
          }
        } else {
          localStorage.removeItem("user");
          setUser(null);
        }
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Decode + store on login
  const login = (userData) => {
    try {
      if (userData.token) {
        const decoded = jwtDecode(userData.token);

        // Check expiry at login time too
        if (decoded.exp * 1000 < Date.now()) {
          console.warn("Login token already expired");
          return logout();
        }

        userData._id = decoded.id;
      }

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Failed to decode login token", error);
      logout();
    }
  };

  // ✅ Logout completely
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // ⏰ Optional — auto logout check every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.token) {
            const decoded = jwtDecode(parsedUser.token);
            if (decoded.exp * 1000 < Date.now()) {
              console.warn("Auto-logout: token expired");
              logout();
            }
          }
        } catch {
          logout();
        }
      }
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  if (loading) return <div>Loading...</div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
