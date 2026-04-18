import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Cache token in module variable; only re-read on storage events
let cachedToken = localStorage.getItem("token");
window.addEventListener("storage", (e) => {
  if (e.key === "token") cachedToken = e.newValue;
});

API.interceptors.request.use(
  (config) => {
    const token = cachedToken || localStorage.getItem("token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname + window.location.search;
      if (path !== "/login") sessionStorage.setItem("redirectAfterLogin", path);
      cachedToken = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
