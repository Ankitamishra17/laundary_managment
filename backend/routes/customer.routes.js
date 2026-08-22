import express from "express";
import {
  getMyProfile,
  getShopCustomers,
} from "../controllers/customer.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// ---- Customer (own profile) ----
router.get("/me", protect, allowRoles("customer"), getMyProfile);

// ---- Admin / employee (list customers of the shop) ----
router.get("/", protect, allowRoles("admin", "super_admin", "employee"), getShopCustomers);

export default router;
