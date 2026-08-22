import Subscription from "../models/Subscription.js";
import Shop from "../models/Shop.js";

/**
 * ===========================================
 * Create Subscription
 * POST /api/subscriptions
 * ===========================================
 */
export const createSubscription = async (req, res) => {
  try {
    const { shopId, plan, amount, paymentMethod, transactionId, remarks } =
      req.body;

    // Validation
    if (!shopId || !plan || !amount) {
      return res.status(400).json({
        success: false,
        message: "Shop, Plan and Amount are required.",
      });
    }

    // Check Shop
    const shop = await Shop.findByPk(shopId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // Subscription Dates
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (plan === "Monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === "Yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan.",
      });
    }

    // Create Subscription
    const subscription = await Subscription.create({
      shopId,
      plan,
      amount,
      startDate,
      endDate,
      status: "Active",
      paymentStatus: "Paid",
      paymentMethod,
      transactionId,
      remarks,
    });

    // Update Current Shop Subscription
    await shop.update({
      subscriptionPlan: plan,
      subscriptionAmount: amount,
      subscriptionStart: startDate,
      subscriptionEnd: endDate,
      subscriptionStatus: "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Subscription created successfully.",
      data: subscription,
    });
  } catch (error) {
    console.error("Create Subscription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * ===========================================
 * Get All Subscriptions
 * GET /api/subscriptions
 * ===========================================
 */

export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      include: [
        {
          model: Shop,
          as: "shop",
          required: true,
          where: {
            isDeleted: false,
          },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions",
      error: error.message,
    });
  }
};

/**
 * ===========================================
 * Get Subscription By ID
 * GET /api/subscriptions/:id
 * ===========================================
 */

export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id, {
      include: [
        {
          model: Shop,
          as: "shop",
          required: true,
          where: {
            isDeleted: false,
          },
        },
      ],
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Get Subscription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * ===========================================
 * Get Shop Subscription History
 * GET /api/subscriptions/shop/:shopId
 * ===========================================
 */

export const getShopSubscriptions = async (req, res) => {
  try {
    const { shopId } = req.params;

    const subscriptions = await Subscription.findAll({
      where: { shopId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      total: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * ===========================================
 * Renew Subscription
 * PUT /api/subscriptions/:id/renew
 * ===========================================
 */

export const renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, amount, paymentMethod, transactionId, remarks } = req.body;

    // Find previous subscription
    const oldSubscription = await Subscription.findByPk(id);

    if (!oldSubscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found.",
      });
    }

    // Find shop
    const shop = await Shop.findByPk(oldSubscription.shopId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // New subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (plan === "Monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === "Yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan.",
      });
    }

    // Create new subscription history
    const newSubscription = await Subscription.create({
      shopId: shop.id,
      plan,
      amount,
      startDate,
      endDate,
      status: "Active",
      paymentStatus: "Paid",
      paymentMethod,
      transactionId,
      remarks,
    });

    // Update current shop subscription
    await shop.update({
      subscriptionPlan: plan,
      subscriptionAmount: amount,
      subscriptionStart: startDate,
      subscriptionEnd: endDate,
      subscriptionStatus: "Active",
    });

    return res.status(200).json({
      success: true,
      message: "Subscription renewed successfully.",
      data: newSubscription,
    });
  } catch (error) {
    console.error("Renew Subscription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * ===========================================
 * Cancel Subscription
 * PUT /api/subscriptions/:id/cancel
 * ===========================================
 */

export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found.",
      });
    }

    // Cancel subscription
    await subscription.update({
      status: "Cancelled",
    });

    // Update shop status
    await Shop.update(
      {
        subscriptionStatus: "Cancelled",
      },
      {
        where: {
          id: subscription.shopId,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully.",
      data: subscription,
    });
  } catch (error) {
    console.error("Cancel Subscription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
