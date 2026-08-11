import { Op } from "sequelize";

import Notification from "../models/Notification.js";
import InventoryItem from "../models/InventoryItem.js";

// =====================================================
// GET ACTIVE LOW-STOCK NOTIFICATIONS
// =====================================================
// Only ADMIN can see low-stock notifications.
// Only unresolved notifications are returned.
// =====================================================

export const getNotifications = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user;

    // ---------------------------------------------
    // ADMIN ONLY
    // ---------------------------------------------

    if (role !== "admin") {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // ---------------------------------------------
    // SHOP CHECK
    // ---------------------------------------------

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
      });
    }

    // ---------------------------------------------
    // GET ACTIVE LOW-STOCK NOTIFICATIONS
    // ---------------------------------------------

    const notifications = await Notification.findAll({
      where: {
        shopId,
        userId,
        type: "LOW_STOCK",
        isResolved: false,
      },

      include: [
        {
          model: InventoryItem,
          as: "inventoryItem",
          attributes: [
            "id",
            "name",
            "category",
            "unit",
            "currentStock",
            "minStock",
            "status",
          ],
          required: true,
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// =====================================================
// GET UNREAD LOW-STOCK NOTIFICATION COUNT
// =====================================================
// Used for the notification badge in Topbar.
// =====================================================

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user;

    // ---------------------------------------------
    // ADMIN ONLY
    // ---------------------------------------------

    if (role !== "admin") {
      return res.status(200).json({
        success: true,
        count: 0,
      });
    }

    // ---------------------------------------------
    // SHOP CHECK
    // ---------------------------------------------

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
      });
    }

    // ---------------------------------------------
    // COUNT UNREAD LOW-STOCK NOTIFICATIONS
    // ---------------------------------------------

    const count = await Notification.count({
      where: {
        shopId,
        userId,
        type: "LOW_STOCK",
        isRead: false,
        isResolved: false,
      },
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get Unread Notification Count Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification count.",
      error: error.message,
    });
  }
};

// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, shopId, role } = req.user;

    // ---------------------------------------------
    // ADMIN ONLY
    // ---------------------------------------------

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access notifications.",
      });
    }

    // ---------------------------------------------
    // SHOP CHECK
    // ---------------------------------------------

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
      });
    }

    // ---------------------------------------------
    // FIND NOTIFICATION
    // ---------------------------------------------

    const notification = await Notification.findOne({
      where: {
        id,
        shopId,
        userId,
        type: "LOW_STOCK",
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    // ---------------------------------------------
    // MARK AS READ
    // ---------------------------------------------

    await notification.update({
      isRead: true,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
      error: error.message,
    });
  }
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user;

    // ---------------------------------------------
    // ADMIN ONLY
    // ---------------------------------------------

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access notifications.",
      });
    }

    // ---------------------------------------------
    // SHOP CHECK
    // ---------------------------------------------

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
      });
    }

    // ---------------------------------------------
    // UPDATE
    // ---------------------------------------------

    await Notification.update(
      {
        isRead: true,
      },
      {
        where: {
          shopId,
          userId,
          type: "LOW_STOCK",
          isRead: false,
          isResolved: false,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read.",
      error: error.message,
    });
  }
};

// =====================================================
// RESOLVE ONE LOW-STOCK NOTIFICATION
// =====================================================
// This should be called when the inventory item
// is restocked above its minimum stock.
// =====================================================

export const resolveNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const { id: userId, shopId, role } = req.user;

    // ---------------------------------------------
    // ADMIN ONLY
    // ---------------------------------------------

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can resolve notifications.",
      });
    }

    // ---------------------------------------------
    // SHOP CHECK
    // ---------------------------------------------

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
      });
    }

    // ---------------------------------------------
    // FIND NOTIFICATION
    // ---------------------------------------------

    const notification = await Notification.findOne({
      where: {
        id,
        shopId,
        userId,
        type: "LOW_STOCK",
        isResolved: false,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Active notification not found.",
      });
    }

    // ---------------------------------------------
    // GET INVENTORY ITEM
    // ---------------------------------------------

    const inventoryItem = await InventoryItem.findOne({
      where: {
        id: notification.inventoryItemId,
        shopId,
      },
    });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    // ---------------------------------------------
    // CHECK WHETHER STOCK IS NORMAL
    // ---------------------------------------------

    const currentStock = Number(inventoryItem.currentStock || 0);

    const minimumStock = Number(inventoryItem.minStock || 0);

    if (currentStock <= minimumStock) {
      return res.status(400).json({
        success: false,
        message:
          "Stock is still at or below minimum level. Notification cannot be resolved.",
        data: {
          currentStock,
          minimumStock,
        },
      });
    }

    // ---------------------------------------------
    // RESOLVE
    // ---------------------------------------------

    await notification.update({
      isResolved: true,
      resolvedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Low-stock notification resolved.",
      data: notification,
    });
  } catch (error) {
    console.error("Resolve Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve notification.",
      error: error.message,
    });
  }
};

// =====================================================
// GET NOTIFICATION HISTORY
// =====================================================
// Returns active + resolved low-stock notifications.
// =====================================================

export const getNotificationHistory = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user;

    // ---------------------------------------------
    // ADMIN ONLY
    // ---------------------------------------------

    if (role !== "admin") {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // ---------------------------------------------
    // SHOP CHECK
    // ---------------------------------------------

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
      });
    }

    // ---------------------------------------------
    // GET HISTORY
    // ---------------------------------------------

    const notifications = await Notification.findAll({
      where: {
        shopId,
        userId,
        type: "LOW_STOCK",
      },

      include: [
        {
          model: InventoryItem,
          as: "inventoryItem",
          attributes: [
            "id",
            "name",
            "category",
            "unit",
            "currentStock",
            "minStock",
            "status",
          ],
          required: false,
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Get Notification History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification history.",
      error: error.message,
    });
  }
};
