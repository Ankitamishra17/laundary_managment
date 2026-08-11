import api from "./axios";

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
};
