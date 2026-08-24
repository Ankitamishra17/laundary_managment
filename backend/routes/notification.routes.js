import express from "express";


import protect from "../middleware/authMiddleware.js";

import {
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markRead,


import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationHistory,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Any logged-in account (customer, employee, admin, super admin) can read
// their own notifications — the controller scopes by role.
router.use(protect);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

export default router;

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

