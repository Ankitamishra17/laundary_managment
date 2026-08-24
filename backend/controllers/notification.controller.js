import { Op } from "sequelize";
<<<<<<< HEAD
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ============================================================
// Helpers (used by other controllers to fire notifications)
// ============================================================

// Create a single notification row. Never throws — a failed notification
// must not take down the business logic that triggered it.
export const createNotification = async ({
  userId,
  employeeId,
  shopId,
  title,
  message,
  type = "system",
  link,
  taskId,
  orderId,
}) => {
  try {
    return await Notification.create({
      userId: userId || null,
      employeeId: employeeId || null,
      shopId: shopId || null,
      title,
      message: message || null,
      type,
      link: link || null,
      taskId: taskId || null,
      orderId: orderId || null,
    });
  } catch (error) {
    console.error("Create Notification Error:", error.message);
    return null;
  }
};

// Notify every active shop admin (role admin/super_admin) of a shop.
export const notifyShopAdmins = async (shopId, payload) => {
  try {
    if (!shopId) return;
    const admins = await User.findAll({
      where: {
        [Op.or]: [
          { shopId, role: "admin" },
          { role: "super_admin" },
        ],
        isActive: true,
      },
      attributes: ["id"],
    });
    await Promise.all(
      admins.map((admin) =>
        createNotification({ ...payload, shopId, userId: admin.id }),
      ),
    );
  } catch (error) {
    console.error("Notify Shop Admins Error:", error.message);
  }
};

// Notify a customer (users table account) — pass the customer record which
// carries userId.
export const notifyCustomer = async (customer, payload) => {
  if (!customer?.userId) return;
  await createNotification({ ...payload, userId: customer.userId });
};

// ============================================================
// Reading notifications (role-scoped)
// ============================================================

function scopeWhere(req) {
  const role = req.user.role;
  const where = {};

  if (role === "employee") {
    where.employeeId = req.user.id;
  } else if (role === "customer") {
    where.userId = req.user.id;
  } else {
    // admin / super_admin
    where.shopId = req.user.shopId || null;
    if (role === "super_admin" && !req.user.shopId) {
      // Platform-wide super admin sees everything
      delete where.shopId;
    }
  }

  return where;
}

// GET /api/notifications
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: scopeWhere(req),
      order: [["createdAt", "DESC"]],
      limit: 60,
    });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { ...scopeWhere(req), isRead: false },
    });
    return res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error("Unread Count Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: scopeWhere(req) },
    );
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, ...scopeWhere(req) },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error("Mark Read Error:", error);
    return res.status(500).json({ success: false, message: error.message });
=======

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
>>>>>>> ankita
  }
};
