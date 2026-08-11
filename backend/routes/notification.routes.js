import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationHistory,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Active notifications
router.get(
  "/",
  protect,
  getNotifications
);

// Unread count
router.get(
  "/count",
  protect,
  getUnreadNotificationCount
);

// Mark one as read
router.patch(
  "/:id/read",
  protect,
  markNotificationAsRead
);

// Mark all as read
router.patch(
  "/read-all",
  protect,
  markAllNotificationsAsRead
);

// Notification history
router.get(
  "/history",
  protect,
  getNotificationHistory
);

export default router;