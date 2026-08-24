import express from "express";

import {
  getSubscriptionNotifications,
  getSubscriptionUnreadCount,
  markSubscriptionNotificationRead,
  markAllSubscriptionNotificationsRead,
  resolveSubscriptionNotification,
} from "../controllers/subscriptionNotification.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// Get Super Admin subscription notifications
router.get(
  "/",
  authMiddleware,
  getSubscriptionNotifications
);


// Get unread count
router.get(
  "/unread-count",
  authMiddleware,
  getSubscriptionUnreadCount
);


// Mark one as read
router.patch(
  "/:id/read",
  authMiddleware,
  markSubscriptionNotificationRead
);


// Mark all as read
router.patch(
  "/read-all",
  authMiddleware,
  markAllSubscriptionNotificationsRead
);


// Resolve notification
router.patch(
  "/:id/resolve",
  authMiddleware,
  resolveSubscriptionNotification
);


export default router;