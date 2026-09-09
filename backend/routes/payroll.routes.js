import express from "express";

import {
  createPayroll,
  getPayrolls,
  getPayrollById,
  getEmployeePayrolls,
  getMyPayrolls,
  getMyPayrollById,
  markPayrollPaid,
  updatePayroll,
  cancelPayroll,
} from "../controllers/payroll.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// ALL PAYROLLS
// GET /api/payroll
// =====================================================

router.get("/", protect, allowRoles("admin", "super_admin"), getPayrolls);

// =====================================================
// GET MY PAYROLLS (Employee)
// GET /api/payroll/my
// =====================================================
router.get("/my", protect, allowRoles("employee"), getMyPayrolls);

// =====================================================
// GET MY PAYROLL BY ID (Employee)
// GET /api/payroll/my/:id
// =====================================================
router.get("/my/:id", protect, allowRoles("employee"), getMyPayrollById);

// =====================================================
// CREATE PAYROLL
// POST /api/payroll
// =====================================================

router.post("/", protect, allowRoles("admin", "super_admin"), createPayroll);

// =====================================================
// GET EMPLOYEE PAYROLLS
// GET /api/payroll/employee/:employeeId
//
// IMPORTANT: This must come before /:id
// =====================================================

router.get(
  "/employee/:employeeId",
  protect,
  allowRoles("admin", "super_admin"),
  getEmployeePayrolls,
);

// =====================================================
// CANCEL PAYROLL
// PATCH /api/payroll/:id/cancel
//
// This must come before /:id
// =====================================================

router.patch(
  "/:id/cancel",
  protect,
  allowRoles("admin", "super_admin"),
  cancelPayroll,
);

// =====================================================
// MARK PAYROLL AS PAID
// PATCH /api/payroll/:id/mark-paid
// =====================================================
router.patch(
  "/:id/mark-paid",
  protect,
  allowRoles("admin", "super_admin"),
  markPayrollPaid
);

// =====================================================
// UPDATE PAYROLL
// PUT /api/payroll/:id
// =====================================================

router.put("/:id", protect, allowRoles("admin", "super_admin"), updatePayroll);

// =====================================================
// GET SINGLE PAYROLL
// GET /api/payroll/:id
//
// Keep this last because :id can match other routes
// =====================================================

router.get("/:id", protect, allowRoles("admin", "super_admin"), getPayrollById);

export default router;
