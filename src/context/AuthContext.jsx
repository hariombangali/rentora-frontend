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

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // 🔑 Decode token se id le aao
        if (parsedUser.token) {
          const decoded = jwtDecode(parsedUser.token);
          parsedUser._id = decoded.id; // backend me tum `id` sign kar rahe ho
        }

        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    // token decode karo jab login hota hai
    if (userData.token) {
      const decoded = jwtDecode(userData.token);
      userData._id = decoded.id;
    }

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
