import { Op } from "sequelize";

import Shop from "../models/Shop.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

// =====================================================
// SUPER ADMIN REPORT
// GET /api/superadmin/reports
// =====================================================

export const getSuperAdminReport = async (req, res) => {
  try {
    // =================================================
    // ONLY SUPER ADMIN
    // =================================================

    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can access reports.",
      });
    }

    // =================================================
    // GET ALL ACTIVE / NON-DELETED SHOPS
    // =================================================

    const shops = await Shop.findAll({
      where: {
        isDeleted: false,
      },

      attributes: [
        "id",
        "shopCode",
        "name",
        "ownerName",
        "email",
        "phone",
        "city",
        "state",
        "subscriptionPlan",
        "subscriptionAmount",
        "subscriptionStatus",
        "subscriptionStart",
        "subscriptionEnd",
        "isActive",
        "createdAt",
      ],

      order: [["createdAt", "DESC"]],
    });

    // =================================================
    // SHOP STATISTICS
    // =================================================

    const totalShops = shops.length;

    const activeShops = shops.filter(
      (shop) => shop.isActive === true && shop.subscriptionStatus === "Active",
    ).length;

    const expiredShops = shops.filter(
      (shop) => shop.subscriptionStatus === "Expired",
    ).length;

    const cancelledShops = shops.filter(
      (shop) => shop.subscriptionStatus === "Cancelled",
    ).length;

    // =================================================
    // GET SUBSCRIPTIONS
    // =================================================

    const subscriptions = await Subscription.findAll({
      include: [
        {
          model: Shop,
          as: "shop",

          attributes: ["id", "shopCode", "name", "ownerName"],

          required: true,

          where: {
            isDeleted: false,
          },
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    // =================================================
    // SUBSCRIPTION STATISTICS
    // =================================================

    const totalSubscriptions = subscriptions.length;

    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === "Active",
    ).length;

    const expiredSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === "Expired",
    ).length;

    const cancelledSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === "Cancelled",
    ).length;

    // =================================================
    // REVENUE
    // =================================================

    const paidSubscriptions = subscriptions.filter(
      (subscription) => subscription.paymentStatus === "Paid",
    );

    const totalRevenue = paidSubscriptions.reduce(
      (total, subscription) => total + Number(subscription.amount || 0),
      0,
    );

    const monthlyRevenue = paidSubscriptions
      .filter((subscription) => subscription.plan === "Monthly")
      .reduce(
        (total, subscription) => total + Number(subscription.amount || 0),
        0,
      );

    const yearlyRevenue = paidSubscriptions
      .filter((subscription) => subscription.plan === "Yearly")
      .reduce(
        (total, subscription) => total + Number(subscription.amount || 0),
        0,
      );

    // =================================================
    // PLAN STATISTICS
    // =================================================

    const monthlySubscriptions = subscriptions.filter(
      (subscription) => subscription.plan === "Monthly",
    ).length;

    const yearlySubscriptions = subscriptions.filter(
      (subscription) => subscription.plan === "Yearly",
    ).length;

    // =================================================
    // USER STATISTICS
    // =================================================

    const users = await User.findAll({
      where: {
        shopId: {
          [Op.ne]: null,
        },

        isActive: true,
      },

      attributes: ["id", "shopId", "role", "isActive"],
    });

    const totalUsers = users.length;

    const adminCount = users.filter((user) => user.role === "admin").length;

    const employeeCount = users.filter(
      (user) => user.role === "employee",
    ).length;

    const customerCount = users.filter(
      (user) => user.role === "customer",
    ).length;

    // =================================================
    // SUBSCRIPTIONS EXPIRING WITHIN 3 DAYS
    // =================================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);

    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const expiringSubscriptions = subscriptions.filter((subscription) => {
      if (subscription.status !== "Active") {
        return false;
      }

      const endDate = new Date(subscription.endDate);

      endDate.setHours(0, 0, 0, 0);

      return endDate >= today && endDate <= threeDaysLater;
    });

    // =================================================
    // RECENT SUBSCRIPTIONS
    // =================================================

    const recentSubscriptions = subscriptions.slice(0, 10);

    // =================================================
    // FINAL RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      data: {
        overview: {
          totalShops,
          activeShops,
          expiredShops,
          cancelledShops,

          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          cancelledSubscriptions,

          totalRevenue,
          monthlyRevenue,
          yearlyRevenue,

          totalUsers,
          adminCount,
          employeeCount,
          customerCount,
        },

        plans: {
          monthly: monthlySubscriptions,
          yearly: yearlySubscriptions,
        },

        expiringSubscriptions: {
          count: expiringSubscriptions.length,

          data: expiringSubscriptions,
        },

        recentSubscriptions,

        shops,
      },
    });
  } catch (error) {
    console.error("Super Admin Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate super admin report.",
      error: error.message,
    });
  }
};
