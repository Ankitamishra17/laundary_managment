import api from "./axios";

const BASE_URL = "/super/subscription-notifications";

// =====================================================
// GET SUPER ADMIN SUBSCRIPTION NOTIFICATIONS
// =====================================================

export const getSuperAdminNotifications = async () => {
  const response = await api.get(BASE_URL);

  return response.data;
};

// =====================================================
// GET UNREAD NOTIFICATION COUNT
// =====================================================

export const getSuperAdminUnreadNotificationCount = async () => {
  const response = await api.get(`${BASE_URL}/unread-count`);

  return response.data;
};

// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

export const markSuperAdminNotificationRead = async (notificationId) => {
  const response = await api.patch(`${BASE_URL}/${notificationId}/read`);

  return response.data;
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

export const markAllSuperAdminNotificationsRead = async () => {
  const response = await api.patch(`${BASE_URL}/read-all`);

  return response.data;
};

// =====================================================
// RESOLVE NOTIFICATION
// =====================================================

export const resolveSuperAdminNotification = async (notificationId) => {
  const response = await api.patch(`${BASE_URL}/${notificationId}/resolve`);

  return response.data;
};
