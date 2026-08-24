import { Op } from "sequelize";
import Notification from "../models/Notification.js";
import InventoryItem from "../models/InventoryItem.js";
import User from "../models/User.js";

// ============================================================
// CREATE GENERAL NOTIFICATION
// ============================================================

export const createNotification = async ({
  userId,
  employeeId,
  shopId,
  inventoryItemId,
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
      inventoryItemId: inventoryItemId || null,
      title,
      message,
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

// ============================================================
// NOTIFY SHOP ADMINS
// ============================================================

export const notifyShopAdmins = async (shopId, payload) => {
  try {
    if (!shopId) return;

    const admins = await User.findAll({
      where: {
        [Op.or]: [{ shopId, role: "admin" }, { role: "super_admin" }],
        isActive: true,
      },
      attributes: ["id"],
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          ...payload,
          shopId,
          userId: admin.id,
        }),
      ),
    );
  } catch (error) {
    console.error("Notify Shop Admins Error:", error.message);
  }
};

// ============================================================
// NOTIFY CUSTOMER
// ============================================================

export const notifyCustomer = async (customer, payload) => {
  if (!customer?.userId) return;

  await createNotification({
    ...payload,
    userId: customer.userId,
  });
};

// ============================================================
// ROLE-BASED NOTIFICATION SCOPE
// ============================================================

function scopeWhere(req) {
  const { role, id, shopId } = req.user;
  const where = {};

  if (role === "employee") {
    where.employeeId = id;
  } else if (role === "customer") {
    where.userId = id;
  } else if (role === "admin") {
    where.shopId = shopId;
  } else if (role === "super_admin") {
    if (shopId) {
      where.shopId = shopId;
    }
  }

  return where;
}

// ============================================================
// GET ALL GENERAL NOTIFICATIONS
// ============================================================

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: scopeWhere(req),
      order: [["createdAt", "DESC"]],
      limit: 60,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET UNREAD GENERAL NOTIFICATION COUNT
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
      data: { count },
    });
  } catch (error) {
    console.error("Unread Count Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// MARK ALL GENERAL NOTIFICATIONS AS READ
// ============================================================

export const markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: scopeWhere(req),
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// MARK ONE GENERAL NOTIFICATION AS READ
// ============================================================

export const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        ...scopeWhere(req),
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Mark Read Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
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

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
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

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
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
    const { id } = req.params;
    const { id: userId, shopId, role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access notifications.",
      });
    }

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

    await notification.update({ isRead: true });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
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
        message: "Only admin can access notifications.",
      });
    }

    await Notification.update(
      { isRead: true },
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
    const { id } = req.params;
    const { id: userId, shopId, role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can resolve notifications.",
      });
    }

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
          "Stock is still at or below minimum level. Notification cannot be resolved.",
        data: {
          currentStock,
          minimumStock,
        },
      });
    }

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
    console.error("Get Notification History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification history.",
      error: error.message,
    });
  }
};
