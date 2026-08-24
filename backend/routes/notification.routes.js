import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  // Ankita's notification functions
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationHistory,

  // Amisha's notification functions
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

// =====================================================
// All notification routes require login
// =====================================================
router.use(protect);

// =====================================================
// COMMON / NEW NOTIFICATION ROUTES
// =====================================================

// Get notifications for the logged-in user
router.get("/", getMyNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read
router.patch("/read-all", markAllRead);

// Mark one notification as read
router.patch("/:id/read", markRead);

// =====================================================
// ANKITA'S EXISTING NOTIFICATION ROUTES
// =====================================================

// Get unread notification count
router.get("/count", getUnreadNotificationCount);

// Notification history
router.get("/history", getNotificationHistory);

// ⚠️ If these functions have different logic, keep them
// on separate routes to avoid duplicate route conflicts.

router.patch("/:id/mark-read", markNotificationAsRead);

router.patch("/mark-all-read", markAllNotificationsAsRead);

// =====================================================
// EXPORT
// =====================================================

export default router;
