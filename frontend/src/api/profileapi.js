import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/profile`,
});

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
};