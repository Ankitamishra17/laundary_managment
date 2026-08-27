import express from "express";

import {
  getMyProfile,
  getShopCustomers,
  getCustomerById,
} from "../controllers/customer.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Customer own profile
router.get("/me", protect, allowRoles("customer"), getMyProfile);

// Admin / employee / super admin customer list
router.get(
  "/",
  protect,
  allowRoles("admin", "super_admin", "employee"),
  getShopCustomers,
);

// Get single customer
router.get(
  "/:id",
  protect,
  allowRoles("admin", "super_admin", "employee"),
  getCustomerById,
);

export default router;
