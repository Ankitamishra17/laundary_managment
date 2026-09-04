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
    // SUPER ADMIN AUTHORIZATION
    // =================================================

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can access reports.",
      });
    }

    // =================================================
    // GET ALL NON-DELETED SHOPS
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

    const activeShops = shops.filter((shop) => {
      return (
        shop.isActive === true &&
        String(shop.subscriptionStatus || "").toLowerCase() === "active"
      );
    }).length;

    const expiredShops = shops.filter((shop) => {
      return String(shop.subscriptionStatus || "").toLowerCase() === "expired";
    }).length;

    const cancelledShops = shops.filter((shop) => {
      return (
        String(shop.subscriptionStatus || "").toLowerCase() === "cancelled"
      );
    }).length;

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
    // NORMALIZE SUBSCRIPTIONS
    // =================================================

    const subscriptionData = subscriptions.map((subscription) => {
      const item =
        typeof subscription.toJSON === "function"
          ? subscription.toJSON()
          : subscription;

      return item;
    });

    // =================================================
    // SUBSCRIPTION STATISTICS
    // =================================================

    const totalSubscriptions = subscriptionData.length;

    const activeSubscriptions = subscriptionData.filter((subscription) => {
      return String(subscription.status || "").toLowerCase() === "active";
    }).length;

    const expiredSubscriptions = subscriptionData.filter((subscription) => {
      return String(subscription.status || "").toLowerCase() === "expired";
    }).length;

    const cancelledSubscriptions = subscriptionData.filter((subscription) => {
      return String(subscription.status || "").toLowerCase() === "cancelled";
    }).length;

    // =================================================
    // PAID SUBSCRIPTIONS
    // =================================================

    const paidSubscriptions = subscriptionData.filter((subscription) => {
      return String(subscription.paymentStatus || "").toLowerCase() === "paid";
    });

    // =================================================
    // TOTAL REVENUE
    //
    // All successful/paid subscription payments.
    // =================================================

    const totalRevenue = paidSubscriptions.reduce((total, subscription) => {
      return total + Number(subscription.amount || 0);
    }, 0);

    // =================================================
    // CURRENT MONTH START
    // =================================================

    const now = new Date();

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    // =================================================
    // REVENUE MTD
    //
    // MTD = Month To Date
    //
    // IMPORTANT:
    // This uses createdAt as the payment/subscription
    // creation date because that is the date field
    // available in the controller you provided.
    // =================================================

    const revenueMTD = paidSubscriptions
      .filter((subscription) => {
        const paymentDate = new Date(subscription.createdAt);

        if (Number.isNaN(paymentDate.getTime())) {
          return false;
        }

        return paymentDate >= monthStart && paymentDate <= now;
      })
      .reduce((total, subscription) => {
        return total + Number(subscription.amount || 0);
      }, 0);

    // =================================================
    // MONTHLY PLAN REVENUE
    //
    // Revenue from subscriptions whose plan is Monthly.
    // This is NOT MTD.
    // =================================================

    const monthlyPlanRevenue = paidSubscriptions
      .filter((subscription) => {
        return String(subscription.plan || "").toLowerCase() === "monthly";
      })
      .reduce((total, subscription) => {
        return total + Number(subscription.amount || 0);
      }, 0);

    // =================================================
    // YEARLY PLAN REVENUE
    // =================================================

    const yearlyPlanRevenue = paidSubscriptions
      .filter((subscription) => {
        return String(subscription.plan || "").toLowerCase() === "yearly";
      })
      .reduce((total, subscription) => {
        return total + Number(subscription.amount || 0);
      }, 0);

    // =================================================
    // PLAN STATISTICS
    // =================================================

    const monthlySubscriptions = subscriptionData.filter((subscription) => {
      return String(subscription.plan || "").toLowerCase() === "monthly";
    }).length;

    const yearlySubscriptions = subscriptionData.filter((subscription) => {
      return String(subscription.plan || "").toLowerCase() === "yearly";
    }).length;

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

    const adminCount = users.filter((user) => {
      return String(user.role || "").toLowerCase() === "admin";
    }).length;

    const employeeCount = users.filter((user) => {
      return String(user.role || "").toLowerCase() === "employee";
    }).length;

    const customerCount = users.filter((user) => {
      return String(user.role || "").toLowerCase() === "customer";
    }).length;

    // =================================================
    // SUBSCRIPTIONS EXPIRING WITHIN 3 DAYS
    // =================================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);

    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const expiringSubscriptions = subscriptionData.filter((subscription) => {
      // Only active subscriptions
      if (String(subscription.status || "").toLowerCase() !== "active") {
        return false;
      }

      // Support endDate
      // and subscriptionEnd if your model uses that name.
      const rawEndDate = subscription.endDate || subscription.subscriptionEnd;

      if (!rawEndDate) {
        return false;
      }

      const endDate = new Date(rawEndDate);

      if (Number.isNaN(endDate.getTime())) {
        return false;
      }

      endDate.setHours(0, 0, 0, 0);

      return endDate >= today && endDate <= threeDaysLater;
    });

    // =================================================
    // RECENT SUBSCRIPTIONS
    // =================================================

    const recentSubscriptions = subscriptionData.slice(0, 10);

    // =================================================
    // REVENUE BY MONTH
    //
    // Useful for Super Admin revenue chart.
    // Returns current year's paid revenue grouped
    // month-wise.
    // =================================================

    const currentYear = now.getFullYear();

    const revenueByMonth = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      monthName: new Date(currentYear, index, 1).toLocaleString("en-IN", {
        month: "short",
      }),
      revenue: 0,
    }));

    paidSubscriptions.forEach((subscription) => {
      const paymentDate = new Date(subscription.createdAt);

      if (
        Number.isNaN(paymentDate.getTime()) ||
        paymentDate.getFullYear() !== currentYear
      ) {
        return;
      }

      const monthIndex = paymentDate.getMonth();

      revenueByMonth[monthIndex].revenue += Number(subscription.amount || 0);
    });

    // =================================================
    // PAYMENT SUMMARY
    // =================================================

    const paidSubscriptionCount = paidSubscriptions.length;

    const unpaidSubscriptionCount = subscriptionData.filter((subscription) => {
      return String(subscription.paymentStatus || "").toLowerCase() !== "paid";
    }).length;

    // =================================================
    // FINAL RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message: "Super admin report generated successfully.",

      data: {
        // =================================================
        // OVERVIEW
        // =================================================

        overview: {
          totalShops,

          activeShops,

          expiredShops,

          cancelledShops,

          totalSubscriptions,

          activeSubscriptions,

          expiredSubscriptions,

          cancelledSubscriptions,

          // Total revenue from all paid subscriptions
          totalRevenue,

          // Revenue received during current month
          revenueMTD,

          // Kept for compatibility with existing frontend
          monthlyRevenue: revenueMTD,

          // Revenue from Monthly plans
          monthlyPlanRevenue,

          // Revenue from Yearly plans
          yearlyRevenue: yearlyPlanRevenue,

          // Total active users
          totalUsers,

          adminCount,

          employeeCount,

          customerCount,
        },

        // =================================================
        // REVENUE
        // =================================================

        revenue: {
          total: totalRevenue,

          mtd: revenueMTD,

          monthlyPlan: monthlyPlanRevenue,

          yearlyPlan: yearlyPlanRevenue,

          paidSubscriptionCount,

          unpaidSubscriptionCount,

          byMonth: revenueByMonth,
        },

        // =================================================
        // PLANS
        // =================================================

        plans: {
          monthly: monthlySubscriptions,

          yearly: yearlySubscriptions,

          total: monthlySubscriptions + yearlySubscriptions,
        },

        // =================================================
        // EXPIRING SUBSCRIPTIONS
        // =================================================

        expiringSubscriptions: {
          count: expiringSubscriptions.length,

          data: expiringSubscriptions,
        },

        // =================================================
        // RECENT SUBSCRIPTIONS
        // =================================================

        recentSubscriptions,

        // =================================================
        // SHOPS
        // =================================================

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
