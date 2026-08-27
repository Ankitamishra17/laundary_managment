import { Op } from "sequelize";
import Notification from "../models/Notification.js";
import InventoryItem from "../models/InventoryItem.js";
import User from "../models/User.js";

// ============================================================
// CREATE NOTIFICATION
// Supports:
// - Inventory / low-stock notifications
// - User notifications
// - Employee notifications
// - Task notifications
// - Order notifications
// ============================================================

export const createNotification = async ({
  userId = null,
  employeeId = null,
  shopId = null,
  inventoryItemId = null,
  taskId = null,
  orderId = null,
  title,
  message,
  type = "system",
  link = null,
}) => {
  try {
    if (!title || !message) {
      console.error(
        "Create Notification Error: title and message are required.",
      );
      return null;
    }

    return await Notification.create({
      userId,
      employeeId,
      shopId,
      inventoryItemId,
      taskId,
      orderId,
      title,
      message,
      type,
      link,
      isRead: false,
      isResolved: false,
      resolvedAt: null,
    });
  } catch (error) {
    console.error("Create Notification Error:", error.message);
    return null;
  }
};

// ============================================================
// NOTIFY SHOP ADMINS
// ============================================================

export const notifyShopAdmins = async (shopId, payload) => {
  try {
    if (!shopId) {
      console.error("Notify Shop Admins Error: shopId is required.");
      return [];
    }

    const admins = await User.findAll({
      where: {
        shopId,
        role: "admin",
        isActive: true,
      },
      attributes: ["id"],
    });

    if (admins.length === 0) {
      return [];
    }

    const notifications = await Promise.all(
      admins.map((admin) =>
        createNotification({
          ...payload,
          shopId,
          userId: admin.id,
        }),
      ),
    );

    return notifications.filter(Boolean);
  } catch (error) {
    console.error("Notify Shop Admins Error:", error.message);
    return [];
  }
};

// ============================================================
// NOTIFY CUSTOMER
// ============================================================

export const notifyCustomer = async (customer, payload) => {
  try {
    if (!customer?.userId) {
      return null;
    }

    return await createNotification({
      ...payload,
      userId: customer.userId,
      shopId: customer.shopId || payload.shopId || null,
    });
  } catch (error) {
    console.error("Notify Customer Error:", error.message);
    return null;
  }
};

// ============================================================
// NOTIFY EMPLOYEE
// ============================================================

export const notifyEmployee = async (employee, payload) => {
  try {
    if (!employee?.id) {
      return null;
    }

    return await createNotification({
      ...payload,
      employeeId: employee.id,
      shopId: employee.shopId || payload.shopId || null,
    });
  } catch (error) {
    console.error("Notify Employee Error:", error.message);
    return null;
  }
};

// ============================================================
// GET NOTIFICATION SCOPE
// ============================================================

const scopeWhere = (req) => {
  const { role, id, shopId } = req.user;

  // Default: impossible condition
  const where = {
    id: -1,
  };

  if (role === "admin") {
    if (!shopId || !id) return where;

    return {
      shopId,
      userId: id,
    };
  }

  if (role === "customer") {
    if (!id) return where;

    return {
      userId: id,
    };
  }

  if (role === "employee") {
    if (!id) return where;

    return {
      employeeId: id,
    };
  }

  if (role === "super_admin") {
    return {
      id: -1,
    };
  }

  return where;
};

// ============================================================
// GET MY ALL NOTIFICATIONS
// ============================================================

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: scopeWhere(req),

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
      limit: 60,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get My Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// ============================================================
// GET UNREAD NOTIFICATION COUNT
// ============================================================

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        ...scopeWhere(req),
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error("Get Unread Notification Count Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread notification count.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

export const markRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Valid notification ID is required.",
      });
    }

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        ...scopeWhere(req),
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

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

// ============================================================
// MARK ALL MY NOTIFICATIONS AS READ
// ============================================================

export const markAllRead = async (req, res) => {
  try {
    const [updatedCount] = await Notification.update(
      {
        isRead: true,
      },
      {
        where: {
          ...scopeWhere(req),
          isRead: false,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      data: {
        updatedCount,
      },
    });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
      error: error.message,
    });
  }
};

// ============================================================
// GET ACTIVE LOW-STOCK NOTIFICATIONS
// ============================================================

export const getNotifications = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user;

    if (role !== "admin") {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    if (!shopId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Admin or shop is not properly assigned.",
      });
    }

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
          required: false,
        },
      ],

      order: [
        ["isRead", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Get Low Stock Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch low-stock notifications.",
      error: error.message,
    });
  }
};

// ============================================================
// GET UNREAD LOW-STOCK COUNT
// ============================================================

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user;

    if (role !== "admin") {
      return res.status(200).json({
        success: true,
        count: 0,
      });
    }

    if (!shopId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Admin or shop is not properly assigned.",
      });
    }

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
    console.error("Get Low Stock Unread Count Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification count.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK ONE LOW-STOCK NOTIFICATION AS READ
// ============================================================

export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    const { id: userId, shopId, role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access low-stock notifications.",
      });
    }

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        shopId,
        userId,
        type: "LOW_STOCK",
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Low-stock notification not found.",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    console.error("Mark Low Stock Notification Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK ALL LOW-STOCK NOTIFICATIONS AS READ
// ============================================================

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access low-stock notifications.",
      });
    }

    const [updatedCount] = await Notification.update(
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
      message: "All low-stock notifications marked as read.",
      data: {
        updatedCount,
      },
    });
  } catch (error) {
    console.error("Mark All Low Stock Notifications Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read.",
      error: error.message,
    });
  }
};

// ============================================================
// RESOLVE LOW-STOCK NOTIFICATION
// ============================================================

export const resolveNotification = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    const { id: userId, shopId, role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can resolve low-stock notifications.",
      });
    }

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        shopId,
        userId,
        type: "LOW_STOCK",
        isResolved: false,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Active low-stock notification not found.",
      });
    }

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

    const currentStock = Number(inventoryItem.currentStock || 0);
    const minimumStock = Number(inventoryItem.minStock || 0);

    if (currentStock <= minimumStock) {
      return res.status(400).json({
        success: false,
        message:
          "Stock is still at or below the minimum level. Add stock before resolving this alert.",
        data: {
          currentStock,
          minimumStock,
        },
      });
    }

    notification.isResolved = true;
    notification.resolvedAt = new Date();
    notification.isRead = true;

    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Low-stock notification resolved successfully.",
      data: notification,
    });
  } catch (error) {
    console.error("Resolve Low Stock Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve notification.",
      error: error.message,
    });
  }
};

// ============================================================
// LOW-STOCK NOTIFICATION HISTORY
// ============================================================

export const getNotificationHistory = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user;

    if (role !== "admin") {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

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
    console.error("Get Low Stock Notification History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification history.",
      error: error.message,
    });
  }
};