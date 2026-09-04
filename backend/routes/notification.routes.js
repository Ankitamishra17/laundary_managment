import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  // General notifications
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markRead,

  // Low-stock notifications
  getLowStockNotifications,
  getLowStockUnreadNotificationCount,
  markLowStockNotificationAsRead,
  markAllLowStockNotificationsAsRead,
  getNotificationHistory,
  resolveNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

// All notification routes require login
router.use(protect);

// =====================================================
// GENERAL NOTIFICATIONS
// =====================================================

// GET /api/notifications
// Get notifications for logged-in user
router.get("/", getMyNotifications);

// GET /api/notifications/unread-count
// Get total unread notifications
router.get("/unread-count", getUnreadCount);

// PATCH /api/notifications/read-all
// Mark all notifications as read
router.patch("/read-all", markAllRead);

// =====================================================
// LOW-STOCK SPECIFIC NOTIFICATIONS
// =====================================================

// GET /api/notifications/low-stock
// Get active low-stock notifications
router.get("/low-stock", getLowStockNotifications);

// GET /api/notifications/count
// Get unread low-stock notification count
router.get("/count", getLowStockUnreadNotificationCount);

// GET /api/notifications/history
// Get low-stock notification history
router.get("/history", getNotificationHistory);

// PATCH /api/notifications/mark-all-read
// Mark all low-stock notifications as read
router.patch("/mark-all-read", markAllLowStockNotificationsAsRead);

// =====================================================
// SINGLE NOTIFICATION ROUTES
// =====================================================

// PATCH /api/notifications/:id/resolve
// Resolve a low-stock notification
router.patch("/:id/resolve", resolveNotification);

// PATCH /api/notifications/:id/read
// Mark any (general) notification as read
router.patch("/:id/read", markRead);

// PATCH /api/notifications/:id/mark-read
// Mark a low-stock notification as read specifically
router.patch("/:id/mark-read", markLowStockNotificationAsRead);

// =====================================================
// EXPORT
// =====================================================

export default router;