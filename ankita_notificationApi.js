import api from "./axios";

// =====================================================
// RESPONSE NORMALIZER
// Supports both:
// 1. [ ...notifications ]
// 2. { data: [ ...notifications ] }
// =====================================================

const extractNotifications = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
};

const extractCount = (responseData) => {
  if (typeof responseData === "number") {
    return responseData;
  }

  return Number(
    responseData?.count ??
      responseData?.data?.count ??
      0,
  );
};

// =====================================================
// ALL GENERAL NOTIFICATIONS
// Includes:
// - Low stock
// - New orders
// - Order cancelled
// - Order status updates
// - Tasks
// - Payments
// - Future notification types
// =====================================================

export const getNotifications = async () => {
  const response = await api.get("/notifications");

  return extractNotifications(response.data);
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get(
    "/notifications/unread-count",
  );

  return extractCount(response.data);
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(
    `/notifications/${id}/read`,
  );

  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch(
    "/notifications/read-all",
  );

  return response.data;
};

// =====================================================
// OBJECT API
// =====================================================

export const notificationApi = {
  getNotifications,
  getUnreadCount: getUnreadNotificationCount,
  markAllRead: markAllNotificationsAsRead,

  markRead: async (id) => {
    const response = await api.patch(
      `/notifications/${id}/read`,
    );

    return response.data;
  },
};