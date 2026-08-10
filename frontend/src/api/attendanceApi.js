import axios from "axios";
import { setupSessionInterceptor } from "./session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api/attendance`,
});

setupSessionInterceptor(api);

// attach the JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const attendanceApi = {
  // Employee
  checkIn: () => api.post("/check-in").then((r) => r.data),
  checkOut: () => api.post("/check-out").then((r) => r.data),
  getMyToday: () => api.get("/my/today").then((r) => r.data),
  getMyAttendance: (params) => api.get("/my", { params }).then((r) => r.data),

  // Admin
  getDaily: (params) => api.get("/daily", { params }).then((r) => r.data),
  getReport: (params) => api.get("/reports", { params }).then((r) => r.data),
  markAttendance: (payload) => api.post("/mark", payload).then((r) => r.data),
};
