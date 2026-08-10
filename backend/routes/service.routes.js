import express from "express";
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  toggleStatus,
} from "../controllers/service.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =====================================================
   Create Service
   POST /api/services
===================================================== */
router.post("/", protect, allowRoles("admin", "super_admin"), createService);

/* =====================================================
   Get All Services
   GET /api/services
===================================================== */
router.get("/", protect, allowRoles("admin", "super_admin"), getServices);

/* =====================================================
   Get Service By Id
   GET /api/services/:id
===================================================== */
router.get("/:id", protect, allowRoles("admin", "super_admin"), getServiceById);

/* =====================================================
   Update Service
   PUT /api/services/:id
===================================================== */
router.put("/:id", protect, allowRoles("admin", "super_admin"), updateService);

/* =====================================================
   Soft Delete Service
   DELETE /api/services/:id
===================================================== */
router.delete(
  "/:id",
  protect,
  allowRoles("admin", "super_admin"),
  deleteService,
);

/* =====================================================
   Toggle Active / Inactive
   PATCH /api/services/:id/status
===================================================== */
router.patch(
  "/:id/status",
  protect,
  allowRoles("admin", "super_admin"),
  toggleStatus,
);

export default router;
