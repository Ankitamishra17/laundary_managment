import api from "./axios";

<<<<<<< HEAD
export const notificationApi = {
  getNotifications: () => api.get("/notifications").then((r) => r.data.data),
  getUnreadCount: () => api.get("/notifications/unread-count").then((r) => r.data.data?.count ?? 0),
  markAllRead: () => api.patch("/notifications/read-all").then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
=======
export const getNotifications = async () => {
  const response = await api.get("/notifications");

  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get("/notifications/count");

  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);

  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put("/notifications/read-all");

  return response.data;
};

export const getNotificationHistory = async () => {
  const response = await api.get("/notifications/history");

  return response.data;
>>>>>>> ankita
};
