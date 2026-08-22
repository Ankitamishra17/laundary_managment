import { Op } from "sequelize";
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
  }
};
