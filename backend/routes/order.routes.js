import express from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getShopOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
} from "../controllers/order.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// NOTE: static/collection paths must be registered before the
// /:id param routes so they aren't swallowed by them.

// ---- Customer (own orders) ----
router.post("/", protect, allowRoles("customer"), createOrder);
router.get("/mine", protect, allowRoles("customer"), getMyOrders);

// ---- Admin (shop orders) ----
router.get("/", protect, allowRoles("admin", "super_admin"), getShopOrders);
router.get("/stats", protect, allowRoles("admin", "super_admin"), getOrderStats);

// ---- Param routes ----
router.get("/:id", protect, allowRoles("customer"), getMyOrderById);
router.patch("/:id/cancel", protect, allowRoles("customer"), cancelMyOrder);
router.patch("/:id/status", protect, allowRoles("admin", "super_admin"), updateOrderStatus);
router.patch("/:id/payment", protect, allowRoles("admin", "super_admin"), updatePaymentStatus);

export default router;
