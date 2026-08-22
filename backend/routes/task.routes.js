import express from "express";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

import {
  getAllTasks,
  assignTask,
  getMyTasks,
  getMyTaskStats,
  getTaskById,
  updateTaskStatus,
  updateTaskNotes,
  getOrderTasks,
  reassignTask,
  getAdminTaskHistory,
  getEmployeeTaskHistory,
  getMyCustomerTasks,
} from "../controllers/task.controller.js";

const router = express.Router();

// ---- Admin — create/assign + list all tasks ----
router.get("/", protect, allowRoles("admin", "super_admin"), getAllTasks);
router.post("/", protect, allowRoles("admin", "super_admin"), assignTask);
router.get("/history", protect, allowRoles("admin", "super_admin"), getAdminTaskHistory);
router.get("/order/:orderId", protect, allowRoles("admin", "super_admin"), getOrderTasks);
router.patch("/:id/reassign", protect, allowRoles("admin", "super_admin"), reassignTask);

// ---- Employee — own tasks (auto-scoped inside the controller) ----
router.get("/my-tasks", protect, allowRoles("employee"), getMyTasks);
router.get("/my-tasks/stats", protect, allowRoles("employee"), getMyTaskStats);
router.get("/my-history", protect, allowRoles("employee"), getEmployeeTaskHistory);
router.get("/my-customer-tasks", protect, allowRoles("employee"), getMyCustomerTasks);
router.get("/:id", protect, allowRoles("employee"), getTaskById);
router.patch("/:id/status", protect, allowRoles("employee"), updateTaskStatus);
router.patch("/:id/notes", protect, allowRoles("employee"), updateTaskNotes);

export default router;
