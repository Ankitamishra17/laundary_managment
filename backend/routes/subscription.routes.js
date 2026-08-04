import express from "express";
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  getShopSubscriptions,
  renewSubscription,
  cancelSubscription,
} from "../controllers/subscription.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create Subscription
router.post("/", protect, allowRoles("super_admin"), createSubscription);

// Get All Subscriptions
router.get("/", protect, allowRoles("super_admin"), getSubscriptions);

// Get Subscription By ID
router.get("/:id", protect, allowRoles("super_admin"), getSubscriptionById);

// Get Subscription History of a Shop
router.get(
  "/shop/:shopId",
  protect,
  allowRoles("super_admin"),
  getShopSubscriptions,
);

// Renew Subscription
router.put("/:id/renew", protect, allowRoles("super_admin"), renewSubscription);

// Cancel Subscription
router.put(
  "/:id/cancel",
  protect,
  allowRoles("super_admin"),
  cancelSubscription,
);

export default router;
