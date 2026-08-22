import api from "./axios";

export const notificationApi = {
  getNotifications: () => api.get("/notifications").then((r) => r.data.data),
  getUnreadCount: () => api.get("/notifications/unread-count").then((r) => r.data.data?.count ?? 0),
  markAllRead: () => api.patch("/notifications/read-all").then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
};
