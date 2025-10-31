// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ✅ Interceptor to attach latest token dynamically
API.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const token = parsedUser?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Invalid user object in localStorage", e);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Optional — Global unauthorized handler (401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("🔒 Token expired or unauthorized. Logging out...");
      localStorage.removeItem("user");
      window.location.href = "/login"; // auto redirect to login
    }
    return Promise.reject(error);
  }
);

export default API;
