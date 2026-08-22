import { Op } from "sequelize";
import Notification from "../models/Notification.js";

// =====================================================
// GET SUPER ADMIN SUBSCRIPTION NOTIFICATIONS
// =====================================================

export const getSubscriptionNotifications = async (req, res) => {
  try {
    // -----------------------------------------------
    // Only Super Admin
    // -----------------------------------------------

    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only.",
      });
    }

    const notifications = await Notification.findAll({
      where: {
        userId: null,

        type: {
          [Op.in]: ["SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRES_TODAY"],
        },

        // IMPORTANT:
        // Resolved/expired notifications won't appear
        isResolved: false,
      },

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get Subscription Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load subscription notifications.",
      error: error.message,
    });
  }
};

// =====================================================
// GET UNREAD SUBSCRIPTION NOTIFICATION COUNT
// =====================================================

export const getSubscriptionUnreadCount = async (req, res) => {
  try {
    // -----------------------------------------------
    // Only Super Admin
    // -----------------------------------------------

    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only.",
      });
    }

    const count = await Notification.count({
      where: {
        userId: null,

        isRead: false,

        isResolved: false,

        type: {
          [Op.in]: ["SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRES_TODAY"],
        },
      },
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Subscription Unread Count Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get unread notification count.",
      error: error.message,
    });
  }
};

// =====================================================
// MARK ONE SUBSCRIPTION NOTIFICATION AS READ
// =====================================================

export const markSubscriptionNotificationRead = async (req, res) => {
  try {
    // -----------------------------------------------
    // Only Super Admin
    // -----------------------------------------------

    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only.",
      });
    }

    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,

        userId: null,

        type: {
          [Op.in]: ["SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRES_TODAY"],
        },
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Subscription notification not found.",
      });
    }

    await notification.update({
      isRead: true,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    console.error("Mark Subscription Notification Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
      error: error.message,
    });
  }
};

// =====================================================
// MARK ALL SUBSCRIPTION NOTIFICATIONS AS READ
// =====================================================

export const markAllSubscriptionNotificationsRead = async (req, res) => {
  try {
    // -----------------------------------------------
    // Only Super Admin
    // -----------------------------------------------

    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only.",
      });
    }

    await Notification.update(
      {
        isRead: true,
      },
      {
        where: {
          userId: null,

          isRead: false,

          isResolved: false,

          type: {
            [Op.in]: ["SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRES_TODAY"],
          },
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All subscription notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark All Subscription Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark subscription notifications as read.",
      error: error.message,
    });
  }
};

// =====================================================
// RESOLVE ONE SUBSCRIPTION NOTIFICATION
// =====================================================

export const resolveSubscriptionNotification = async (req, res) => {
  try {
    // -----------------------------------------------
    // Only Super Admin
    // -----------------------------------------------

    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only.",
      });
    }

    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,

        userId: null,

        type: {
          [Op.in]: ["SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRES_TODAY"],
        },
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Subscription notification not found.",
      });
    }

    await notification.update({
      isRead: true,
      isResolved: true,
      resolvedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Subscription notification resolved.",
      data: notification,
    });
  } catch (error) {
    console.error("Resolve Subscription Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve subscription notification.",
      error: error.message,
    });
  }
};
