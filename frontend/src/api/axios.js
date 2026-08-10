import axios from "axios";
import { setupSessionInterceptor } from "./session";

const api = axios.create({
  // Backend mounts everything under /api — auth, shops, subscriptions, services
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log the user out and redirect to /login when the token expires
setupSessionInterceptor(api);

// Attach JWT Token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;