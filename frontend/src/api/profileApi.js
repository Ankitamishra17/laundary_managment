import axios from "axios";
import { setupSessionInterceptor } from "./session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api/profile`,
});

setupSessionInterceptor(api);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const profileApi = {
  getMyProfile: () => api.get("/").then((r) => r.data.data),
  updateMyProfile: (payload) => api.put("/", payload).then((r) => r.data.data),
  changePassword: (payload) => api.patch("/password", payload).then((r) => r.data),
  updateAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api
      .patch("/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data.data);
  },

  // Verification (OTP)
  sendEmailOtp: () => api.post("/send-email-otp").then((r) => r.data),
  verifyEmailOtp: (otp) => api.post("/verify-email-otp", { otp }).then((r) => r.data),
  sendPhoneOtp: () => api.post("/send-phone-otp").then((r) => r.data),
  verifyPhoneOtp: (otp) => api.post("/verify-phone-otp", { otp }).then((r) => r.data),
};