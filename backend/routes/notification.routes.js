import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  // =====================================================
  // GENERAL NOTIFICATIONS
  // Low stock + Orders + Customer + Employee etc.
  // =====================================================
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markRead,

  // =====================================================
  // LOW-STOCK SPECIFIC NOTIFICATIONS
  // Existing Ankita functionality
  // =====================================================
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationHistory,
  resolveNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

// =====================================================
// ALL NOTIFICATION ROUTES REQUIRE LOGIN
// =====================================================

router.use(protect);

// =====================================================
// GENERAL NOTIFICATIONS
// =====================================================

// GET /api/notifications
// Get all notifications for logged-in user
// Admin: Low stock + orders
// Customer: Order updates
// Employee: Employee notifications
router.get("/", getMyNotifications);

// GET /api/notifications/unread-count
// Get total unread notification count
router.get("/unread-count", getUnreadCount);

// PATCH /api/notifications/read-all
// Mark all logged-in user's notifications as read
router.patch("/read-all", markAllRead);

// =====================================================
// LOW-STOCK SPECIFIC ROUTES
// IMPORTANT: Static routes must come before /:id routes
// =====================================================

// GET /api/notifications/low-stock
// Get active low-stock notifications only
router.get("/low-stock", getNotifications);

// GET /api/notifications/count
// Get unread low-stock notification count only
router.get("/count", getUnreadNotificationCount);

// GET /api/notifications/history
// Get complete low-stock notification history
router.get("/history", getNotificationHistory);

// PATCH /api/notifications/mark-all-read
// Mark all LOW_STOCK notifications as read
router.patch("/mark-all-read", markAllNotificationsAsRead);

// =====================================================
// SINGLE NOTIFICATION ROUTES
// Dynamic routes must come last
// =====================================================

// PATCH /api/notifications/:id/resolve
// Resolve a low-stock notification
// Only works when stock is above minimum
router.patch("/:id/resolve", resolveNotification);

// PATCH /api/notifications/:id/read
// Mark any notification as read
// Works for order, customer, employee, low-stock etc.
router.patch("/:id/read", markRead);

// PATCH /api/notifications/:id/mark-read
// Existing low-stock specific route
// Kept for backward compatibility
router.patch("/:id/mark-read", markNotificationAsRead);

// =====================================================
// EXPORT
// =====================================================

export default router;