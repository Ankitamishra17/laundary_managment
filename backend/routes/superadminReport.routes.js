import express from "express";

import {
  getSuperAdminReport,
} from "../controllers/superadminReport.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// SUPER ADMIN REPORT
// GET /api/superadmin/reports
// =====================================================

router.get(
  "/",
  protect,
  allowRoles("super_admin"),
  getSuperAdminReport
);

export default router;