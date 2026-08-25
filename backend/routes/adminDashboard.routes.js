import express from "express";

import { getAdminDashboard } from "../controllers/adminDashboard.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// =====================================================

router.get("/", protect, allowRoles("admin", "super_admin"), getAdminDashboard);

export default router;
