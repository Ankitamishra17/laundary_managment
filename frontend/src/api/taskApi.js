import api from "./axios";

// All paths are relative to the shared baseURL (/api).
export const taskApi = {
  // Admin
  getAllTasks: (params) => api.get("/tasks", { params }).then((r) => r.data.data),
  assignTask: (payload) => api.post("/tasks", payload).then((r) => r.data.data),
  getOrderTasks: (orderId) => api.get(`/tasks/order/${orderId}`).then((r) => r.data.data),
  reassignTask: (taskId, employee_id) => api.patch(`/tasks/${taskId}/reassign`, { employee_id }).then((r) => r.data.data),
  getAdminTaskHistory: (params) => api.get("/tasks/history", { params }).then((r) => r.data.data),

  // Employee
  getMyTasks: (params) => api.get("/tasks/my-tasks", { params }).then((r) => r.data.data),
  getMyTaskStats: (params) => api.get("/tasks/my-tasks/stats", { params }).then((r) => r.data.data),
  getMyTaskHistory: (params) => api.get("/tasks/my-history", { params }).then((r) => r.data.data),
  getTaskById: (id) => api.get(`/tasks/${id}`).then((r) => r.data.data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }).then((r) => r.data.data),
  updateNotes: (id, notes) => api.patch(`/tasks/${id}/notes`, { notes }).then((r) => r.data.data),
  getMyCustomerTasks: () => api.get("/tasks/my-customer-tasks").then((r) => r.data.data),
};