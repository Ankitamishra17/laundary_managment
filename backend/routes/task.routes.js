import express from "express";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

import {
  // Admin / Super Admin
  getAllTasks,
  assignTask,
  getOrderTasks,
  reassignTask,
  getAdminTaskHistory,

  // Employee
  getMyTasks,
  getMyTaskStats,
  getTaskById,
  updateTaskStatus,
  updateTaskNotes,
  getEmployeeTaskHistory,
  getMyCustomerTasks,
} from "../controllers/task.controller.js";

const router = express.Router();

/* ============================================================
   ADMIN / SUPER ADMIN — TASK MANAGEMENT
============================================================ */

/*
 * GET ALL TASKS
 *
 * admin:
 *   only own shop
 *
 * super_admin:
 *   all shops
 */
router.get("/", protect, allowRoles("admin", "super_admin"), getAllTasks);

/*
 * ASSIGN / CREATE TASKS
 *
 * New body:
 *
 * {
 *   order_id: 101,
 *   assignments: [
 *     {
 *       employee_id: 5,
 *       task_types: ["pickup", "delivery"]
 *     },
 *     {
 *       employee_id: 7,
 *       task_types: ["wash", "dry"]
 *     },
 *     {
 *       employee_id: 8,
 *       task_types: ["iron", "pack"]
 *     }
 *   ],
 *   scheduled_time: "2026-09-03T10:00:00",
 *   priority: "normal",
 *   notes: "Handle carefully"
 * }
 */
router.post("/", protect, allowRoles("admin", "super_admin"), assignTask);

/*
 * ADMIN TASK HISTORY
 */
router.get(
  "/history",
  protect,
  allowRoles("admin", "super_admin"),
  getAdminTaskHistory,
);

/*
 * GET ALL TASKS OF ONE ORDER
 */
router.get(
  "/order/:orderId",
  protect,
  allowRoles("admin", "super_admin"),
  getOrderTasks,
);

/*
 * REASSIGN TASK
 *
 * PATCH /api/tasks/:id/reassign
 *
 * {
 *   "employee_id": 8
 * }
 */
router.patch(
  "/:id/reassign",
  protect,
  allowRoles("admin", "super_admin"),
  reassignTask,
);

/* ============================================================
   EMPLOYEE — OWN TASKS
============================================================ */

/*
 * GET LOGGED-IN EMPLOYEE TASKS
 */
router.get("/my-tasks", protect, allowRoles("employee"), getMyTasks);

/*
 * GET LOGGED-IN EMPLOYEE TASK STATS
 */
router.get("/my-tasks/stats", protect, allowRoles("employee"), getMyTaskStats);

/*
 * EMPLOYEE TASK HISTORY
 */
router.get(
  "/my-history",
  protect,
  allowRoles("employee"),
  getEmployeeTaskHistory,
);

/*
 * EMPLOYEE CUSTOMER TASKS
 */
router.get(
  "/my-customer-tasks",
  protect,
  allowRoles("employee"),
  getMyCustomerTasks,
);

/* ============================================================
   EMPLOYEE — SINGLE TASK
============================================================ */

/*
 * GET ONE TASK
 */
router.get("/:id", protect, allowRoles("employee"), getTaskById);

/*
 * UPDATE TASK STATUS
 *
 * PATCH /api/tasks/:id/status
 *
 * {
 *   "status": "in_progress"
 * }
 *
 * OR
 *
 * {
 *   "status": "completed"
 * }
 */
router.patch("/:id/status", protect, allowRoles("employee"), updateTaskStatus);

/*
 * UPDATE TASK NOTES
 */
router.patch("/:id/notes", protect, allowRoles("employee"), updateTaskNotes);

export default router;
