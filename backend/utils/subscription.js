import { Op } from "sequelize";
import Shop from "../models/Shop.js";
import Order from "../models/Order.js";

// ============================================================
// PLAN CATALOG
// Each plan defines hard limits + feature flags. Backend enforcement
// lives here so the frontend can never bypass a plan by hiding a button.
//   maxEmployees:      null = unlimited
//   maxMonthlyOrders:  null = unlimited
// ============================================================
export const PLANS = {
  Free: {
    maxEmployees: 2,
    maxMonthlyOrders: 30,
    features: {
      reports: false,
      notifications: true,
      customBranding: false,
      analytics: false,
    },
  },
  Basic: {
    maxEmployees: 5,
    maxMonthlyOrders: 100,
    features: {
      reports: true,
      notifications: true,
      customBranding: false,
      analytics: false,
    },
  },
  Pro: {
    maxEmployees: 15,
    maxMonthlyOrders: 500,
    features: {
      reports: true,
      notifications: true,
      customBranding: true,
      analytics: true,
    },
  },
  Premium: {
    maxEmployees: null, // unlimited
    maxMonthlyOrders: null, // unlimited
    features: {
      reports: true,
      notifications: true,
      customBranding: true,
      analytics: true,
    },
  },
};

export const DEFAULT_PLAN = "Basic";

// Does the shop currently have a payable subscription?
// (Active/Trial + end date in the future + shop not deactivated.)
export function subscriptionActive(shop) {
  if (!shop) return false;
  if (!shop.isActive) return false;
  if (!["Active", "Trial"].includes(shop.subscriptionStatus)) return false;

  if (shop.subscriptionEnd) {
    // DATEONLY columns parse as UTC midnight — include the end day itself.
    const endOfDay = new Date(`${shop.subscriptionEnd}T23:59:59`);
    if (endOfDay < new Date()) return false;
  }
  return true;
}

/**
 * Load a shop's plan + subscription health.
 * Returns: { planName, limits, features, allowed, message }
 */
export async function getShopPlan(shopId) {
  if (!shopId) {
    return {
      planName: null,
      limits: {},
      features: {},
      allowed: false,
      message: "Shop is not assigned to this user.",
    };
  }

  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    return {
      planName: null,
      limits: {},
      features: {},
      allowed: false,
      message: "Shop not found.",
    };
  }

  const allowed = subscriptionActive(shop);
  const planName = shop.planName || DEFAULT_PLAN;
  const plan = PLANS[planName] || PLANS[DEFAULT_PLAN];

  return {
    planName,
    limits: {
      maxEmployees: plan.maxEmployees,
      maxMonthlyOrders: plan.maxMonthlyOrders,
    },
    features: plan.features,
    allowed,
    message: allowed
      ? ""
      : `Your subscription is ${shop.subscriptionStatus === "Trial" ? "in trial" : "not active"}. Please contact the platform to renew it.`,
  };
}

/**
 * Check a plan feature flag. Returns { allowed, planName, message }.
 * When allowed=false the caller should reject the operation (403).
 */
export async function checkFeature(shopId, feature) {
  const plan = await getShopPlan(shopId);
  if (!plan.allowed) return plan;

  const enabled = !!plan.features?.[feature];
  return {
    allowed: enabled,
    planName: plan.planName,
    message: enabled
      ? ""
      : `Your ${plan.planName} plan does not include ${feature.replace(/([A-Z])/g, " $1").toLowerCase()}. Please upgrade.`,
  };
}

/**
 * Count how many orders this shop has placed in the current calendar month
 * (excluding cancelled orders). Used to enforce maxMonthlyOrders.
 */
export async function countShopOrdersThisMonth(shopId) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return Order.count({
    where: {
      shop_id: shopId,
      status: { [Op.ne]: "cancelled" },
      createdAt: { [Op.gte]: start, [Op.lt]: end },
    },
  });
}
