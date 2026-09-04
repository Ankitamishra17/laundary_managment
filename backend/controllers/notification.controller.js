import { Op } from "sequelize";
import Notification from "../models/Notification.js";
import InventoryItem from "../models/InventoryItem.js";
import User from "../models/User.js";

// ============================================================
// TENANT ISOLATION CORE
// ============================================================
//
// IMPOSSIBLE_WHERE is returned whenever a request has no legitimate
// scope (unknown role, missing shopId/id, or super_admin hitting the
// general API). Sequelize will simply find zero rows for it — this
// is what makes "return nothing" and "return 404" safe defaults
// instead of accidentally matching every row.
// ============================================================

const IMPOSSIBLE_WHERE = { id: -1 };

// Customers must only ever be able to read/count/mark notifications
// that represent a delivered order. This is intentionally baked into
// scopeWhere() itself (rather than left to each handler to remember)
// so no future endpoint can forget to apply it.
const deliveredOrderFilter = () => ({
  type: "order",
  title: { [Op.like]: "%delivered%" },
});

// The single source of truth for "what can this authenticated user
// see". Never trusts shopId/userId from query, body, or params —
// only from the verified JWT payload (req.user).
const scopeWhere = (req) => {
  const user = req.user || {};
  const { role, id, shopId } = user;

  if (!role || !id) {
    return IMPOSSIBLE_WHERE;
  }

  if (role === "admin") {
    if (!shopId) return IMPOSSIBLE_WHERE;
    return {
      shopId,
      userId: id,
    };
  }

  if (role === "employee") {
    if (!shopId) return IMPOSSIBLE_WHERE;
    return {
      shopId,
      employeeId: id,
    };
  }

  if (role === "customer") {
    if (!shopId) return IMPOSSIBLE_WHERE;
    return {
      shopId,
      userId: id,
      ...deliveredOrderFilter(),
    };
  }

  // super_admin (and any unrecognized role) must never receive
  // normal shop-user notifications through this API.
  return IMPOSSIBLE_WHERE;
};

// Separate scope helper for LOW_STOCK — admin-only, always includes
// type: "LOW_STOCK" so it can never be confused with general scope.
const lowStockScopeWhere = (req) => {
  const user = req.user || {};
  const { role, id, shopId } = user;

  if (role !== "admin" || !shopId || !id) {
    return IMPOSSIBLE_WHERE;
  }

  return {
    shopId,
    userId: id,
    type: "LOW_STOCK",
  };
};

// ============================================================
// CREATE NOTIFICATION
// Supports:
// - Inventory / low-stock notifications
// - User notifications
// - Employee notifications
// - Task notifications
// - Order notifications
// - Subscription notifications (admin-facing)
// ============================================================

export const createNotification = async ({
  userId = null,
  employeeId = null,
  shopId = null,
  inventoryItemId = null,
  taskId = null,
  orderId = null,
  subscriptionId = null,
  daysRemaining = null,
  notificationDate = null,
  emailSent = false,
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
      subscriptionId,
      daysRemaining,
      notificationDate,
      emailSent,
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
// Only ever targets admins belonging to the given shopId — the
// query itself is the isolation, so an admin from another shop can
// never receive one of these.
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
// If payload.shopId is supplied and disagrees with the customer's
// own shopId, the notification is refused outright — this prevents
// a caller from accidentally (or maliciously) cross-wiring a
// customer notification into another shop's tenant.
// ============================================================

export const notifyCustomer = async (customer, payload) => {
  try {
    if (!customer?.userId) {
      return null;
    }

    const customerShopId = customer.shopId ?? null;

    if (
      payload.shopId != null &&
      customerShopId != null &&
      Number(payload.shopId) !== Number(customerShopId)
    ) {
      console.error(
        "Notify Customer Error: shop mismatch — notification blocked.",
      );
      return null;
    }

    const resolvedShopId = customerShopId ?? payload.shopId ?? null;

    return await createNotification({
      ...payload,
      userId: customer.userId,
      shopId: resolvedShopId,
    });
  } catch (error) {
    console.error("Notify Customer Error:", error.message);
    return null;
  }
};

// ============================================================
// NOTIFY EMPLOYEE
// Same cross-tenant guard as notifyCustomer, applied to employees.
// ============================================================

export const notifyEmployee = async (employee, payload) => {
  try {
    if (!employee?.id) {
      return null;
    }

    const employeeShopId = employee.shop_id ?? employee.shopId ?? null;

    if (
      payload.shopId != null &&
      employeeShopId != null &&
      Number(payload.shopId) !== Number(employeeShopId)
    ) {
      console.error(
        "Notify Employee Error: shop mismatch — notification blocked.",
      );
      return null;
    }

    const resolvedShopId = employeeShopId ?? payload.shopId ?? null;

    return await createNotification({
      ...payload,
      employeeId: employee.id,
      shopId: resolvedShopId,
    });
  } catch (error) {
    console.error("Notify Employee Error:", error.message);
    return null;
  }
};

// ============================================================
// GENERAL NOTIFICATIONS — shared implementations
//
// These power BOTH the original names (getMyNotifications,
// getUnreadCount, markRead, markAllRead) and the newer explicit
// names (getNotifications, getUnreadNotificationCount,
// markNotificationAsRead, markAllNotificationsAsRead). Both sets
// are exported further down, pointing at the exact same function —
// one implementation, zero drift risk between the two names.
// ============================================================

async function handleGetScopedNotifications(req, res) {
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

      order: [
        ["isRead", "ASC"],
        ["createdAt", "DESC"],
      ],
      limit: 60,
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
}

async function handleGetUnreadCount(req, res) {
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
}

async function handleMarkOneRead(req, res) {
  try {
    const notificationId = Number(req.params.id);

    if (!notificationId || Number.isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid notification ID is required.",
      });
    }

    // Deliberately NOT findByPk() — the tenant scope must be part of
    // the WHERE clause itself, so a notification belonging to
    // another shop/user simply does not match and returns 404.
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
}

async function handleMarkAllRead(req, res) {
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
}

// ---- Original general-API names (preserved) ----
export const getMyNotifications = handleGetScopedNotifications;
export const getUnreadCount = handleGetUnreadCount;
export const markRead = handleMarkOneRead;
export const markAllRead = handleMarkAllRead;

// ---- Explicit general-API names (previously collided with the
//      LOW_STOCK functions of the same name — now unambiguous) ----
export const getNotifications = handleGetScopedNotifications;
export const getUnreadNotificationCount = handleGetUnreadCount;
export const markNotificationAsRead = handleMarkOneRead;
export const markAllNotificationsAsRead = handleMarkAllRead;

// ============================================================
// LOW-STOCK NOTIFICATIONS (ADMIN ONLY)
// Renamed from the old getNotifications / getUnreadNotificationCount
// / markNotificationAsRead / markAllNotificationsAsRead, which
// previously collided with the general-API names above.
// ============================================================

export const getLowStockNotifications = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user || {};

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

export const getLowStockUnreadNotificationCount = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user || {};

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

export const markLowStockNotificationAsRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    const { id: userId, shopId, role } = req.user || {};

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access low-stock notifications.",
      });
    }

    if (!notificationId || Number.isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid notification ID is required.",
      });
    }

    if (!shopId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Admin or shop is not properly assigned.",
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

export const markAllLowStockNotificationsAsRead = async (req, res) => {
  try {
    const { id: userId, shopId, role } = req.user || {};

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can access low-stock notifications.",
      });
    }

    if (!shopId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Admin or shop is not properly assigned.",
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
// Verifies: shopId ownership, userId ownership, type === LOW_STOCK,
// currently unresolved, AND that the referenced InventoryItem also
// belongs to this admin's shop before allowing resolution.
// ============================================================

export const resolveNotification = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    const { id: userId, shopId, role } = req.user || {};

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can resolve low-stock notifications.",
      });
    }

    if (!notificationId || Number.isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid notification ID is required.",
      });
    }

    if (!shopId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Admin or shop is not properly assigned.",
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
    const { id: userId, shopId, role } = req.user || {};

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
