import express from "express";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import {
  getMyAssignedOrders,
  getMyOrderById,
  updateOrderStatus,
  markPickupDone,
  markDeliveryDone,
  generateReceipt,
  getMyProfile,
} from "../controllers/employee.controller.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("employee"));

router.get("/my-orders", getMyAssignedOrders);
router.get("/my-orders/:id", getMyOrderById);
router.patch("/my-orders/:id/status", updateOrderStatus);
router.patch("/my-orders/:id/pickup", markPickupDone);
router.patch("/my-orders/:id/delivery", markDeliveryDone);
router.get("/my-orders/:id/receipt", generateReceipt);
router.get("/profile/me", getMyProfile);

export default router;
 