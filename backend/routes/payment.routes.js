import express from "express";

import {
  createPayment,
  createSupplierPayment,
  createEmployeePayment,
  getPayments,
  getPaymentById,
  getAllCustomerPayments,
  getCustomerPayments,
  getSupplierPayments,
  getEmployeePayments,
  getSubscriptionPayments,
  getPaymentDashboard,
  updatePayment,
  cancelPayment,
  getPaymentReport,
  refundPayment,
} from "../controllers/payment.controller.js";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// PAYMENT DASHBOARD
// GET /api/payments/dashboard
// =====================================================

router.get(
  "/dashboard",
  protect,
  allowRoles("admin", "super_admin"),
  getPaymentDashboard,
);

// =====================================================
// PAYMENT SUMMARY
// GET /api/payments/summary
// =====================================================

router.get(
  "/summary",
  protect,
  allowRoles("admin", "super_admin"),
  getPaymentDashboard,
);

// =====================================================
// PAYMENT REPORT
// GET /api/payments/report
// =====================================================

router.get(
  "/report",
  protect,
  allowRoles("admin", "super_admin"),
  getPaymentReport,
);
// =====================================================
// CREATE EMPLOYEE SALARY PAYMENT
// POST /api/payments/employee
// =====================================================

router.post(
  "/employee",
  protect,
  allowRoles("admin", "super_admin"),
  createEmployeePayment,
);

// =====================================================
// CUSTOMER PAYMENTS
// GET /api/payments/customer/:customerId
// =====================================================
// =====================================================
// ALL CUSTOMER PAYMENTS
// GET /api/payments/customers
// =====================================================

router.get(
  "/customers",
  protect,
  allowRoles("admin", "super_admin"),
  getAllCustomerPayments,
);
router.get(
  "/customer/:customerId",
  protect,
  allowRoles("admin", "super_admin"),
  getCustomerPayments,
);

// =====================================================
// SUPPLIER PAYMENTS
// GET /api/payments/supplier/:supplierId
// =====================================================

router.get(
  "/supplier/:supplierId",
  protect,
  allowRoles("admin", "super_admin"),
  getSupplierPayments,
);

// =====================================================
// EMPLOYEE PAYMENTS
// GET /api/payments/employee/:employeeId
// =====================================================

router.get(
  "/employee/:employeeId",
  protect,
  allowRoles("admin", "super_admin"),
  getEmployeePayments,
);

// =====================================================
// SUBSCRIPTION PAYMENTS
// GET /api/payments/subscriptions
// =====================================================

router.get(
  "/subscriptions",
  protect,
  allowRoles("admin", "super_admin"),
  getSubscriptionPayments,
);

// =====================================================
// CREATE SUPPLIER PAYMENT
// POST /api/payments/supplier
//
// Use this for remaining purchase payment.
// Example: Purchase ₹1000, paid ₹400 initially,
// then later pay remaining ₹600.
// =====================================================

router.post(
  "/supplier",
  protect,
  allowRoles("admin", "super_admin"),
  createSupplierPayment,
);

// =====================================================
// ALL PAYMENTS
// GET /api/payments
// =====================================================

router.get("/", protect, allowRoles("admin", "super_admin"), getPayments);

// =====================================================
// CREATE GENERAL PAYMENT
// POST /api/payments
// =====================================================

router.post("/", protect, allowRoles("admin", "super_admin"), createPayment);

// =====================================================
// CANCEL PAYMENT
// PATCH /api/payments/:id/cancel
// =====================================================

router.patch(
  "/:id/cancel",
  protect,
  allowRoles("admin", "super_admin"),
  cancelPayment,
);

// =====================================================
// UPDATE PAYMENT
// PUT /api/payments/:id
// =====================================================

router.put("/:id", protect, allowRoles("admin", "super_admin"), updatePayment);

// =====================================================
// GET PAYMENT BY ID
// GET /api/payments/:id
// IMPORTANT: Keep this at the bottom
// =====================================================

router.get("/:id", protect, allowRoles("admin", "super_admin"), getPaymentById);

router.post(
  "/:id/refund",
  protect,
  allowRoles("admin", "super_admin"),
  refundPayment,
);
export default router;
