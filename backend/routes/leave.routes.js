import express from "express";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

import {
  applyLeave,
  getMyLeaves,
  getShopLeaves,
  reviewLeave,
  getLeaveStats,
} from "../controllers/leave.controller.js";

const router = express.Router();

// ---- Employee ----
router.post("/", protect, allowRoles("employee"), applyLeave);
router.get("/mine", protect, allowRoles("employee"), getMyLeaves);

// ---- Admin ----
router.get("/", protect, allowRoles("admin", "super_admin"), getShopLeaves);
router.get("/stats", protect, allowRoles("admin", "super_admin"), getLeaveStats);
router.patch("/:id", protect, allowRoles("admin", "super_admin"), reviewLeave);

export default router;
