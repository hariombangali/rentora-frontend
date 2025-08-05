import React, { createContext, useContext, useState, useEffect } from "react";

// Authentication context create karo
const AuthContext = createContext();

// Custom hook for easy access
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component jo pure app ko wrap karega
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // App load hone par localStorage se user info fetch karenge (agar pehle saved ho)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  // Login function: user object set karo aur localStorage me store karo
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Logout function: user clear karo aur localStorage se hatao
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = {
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
