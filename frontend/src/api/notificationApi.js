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
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
// LOW-STOCK NOTIFICATIONS
// =====================================================

export const getLowStockNotifications = async () => {
  const response = await api.get("/notifications/low-stock");
  return response.data;
};

export const getLowStockNotificationCount = async () => {
  const response = await api.get("/notifications/count");
  return response.data;
};

export const getNotificationHistory = async () => {
  const response = await api.get("/notifications/history");
  return response.data;
};

// NOTE: this hits the low-stock-specific PATCH /:id/mark-read route
// (backed by markLowStockNotificationAsRead in the controller) — it
// was defined on the backend but had no matching export here, so a
// low-stock item could only ever be marked read via the general
// markNotificationAsRead() above.
export const markLowStockNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/mark-read`);
  return response.data;
};

export const markAllLowStockNotificationsAsRead = async () => {
  const response = await api.patch("/notifications/mark-all-read");
  return response.data;
};

// =====================================================
// NOTIFICATION API OBJECT
<<<<<<< Updated upstream


=======
>>>>>>> Stashed changes
// =====================================================

export const notificationApi = {
  getNotifications,
  getUnreadCount: getUnreadNotificationCount,
  markAllRead: markAllNotificationsAsRead,


  getLowStockNotifications,
  getLowStockNotificationCount,
  getNotificationHistory,
  markLowStockRead: markLowStockNotificationAsRead,
  markAllLowStockNotificationsAsRead,

  markRead: async (id) => {
    const response = await api.patch(
      `/notifications/${id}/read`,
    );

    return response.data;
  },

<<<<<<< Updated upstream
=======
  getLowStockNotifications,
  getLowStockNotificationCount,
  getNotificationHistory,
  markLowStockRead: markLowStockNotificationAsRead,
  markAllLowStockNotificationsAsRead,
>>>>>>> Stashed changes
};