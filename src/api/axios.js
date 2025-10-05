import axios from "axios";

const apiHost = import.meta.env.VITE_API_HOST || "https://cnelibrary.onrender.com";

const api = axios.create({
  baseURL: apiHost,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false, // set to true if backend uses cookies for auth
});

// 🔹 Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      ["jwtToken"].forEach((key) =>
        localStorage.removeItem(key)
      );
      window.location.href = "/";
    } else if (error.response?.status === 500) {
      console.error("Server error:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
