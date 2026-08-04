import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/tasks`,
});

// attach the JWT on every request — no need to pass it manually each call
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const taskApi = {
  getMyTasks: (params) => api.get("/my-tasks", { params }).then((r) => r.data.data),
  getMyTaskStats: (params) => api.get("/my-tasks/stats", { params }).then((r) => r.data.data),
  getTaskById: (id) => api.get(`/${id}`).then((r) => r.data.data),
  updateStatus: (id, status) => api.patch(`/${id}/status`, { status }).then((r) => r.data.data),
  updateNotes: (id, notes) => api.patch(`/${id}/notes`, { notes }).then((r) => r.data.data),
};