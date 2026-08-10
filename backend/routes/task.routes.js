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
} from "../controllers/task.controller.js";

const router = express.Router();

// ---- Admin — create/assign + list all tasks ----
router.get("/", protect, allowRoles("admin"), getAllTasks);
router.post("/", protect, allowRoles("admin"), assignTask);

// ---- Employee — own tasks (auto-scoped inside the controller) ----
router.get("/my-tasks", protect, getMyTasks);
router.get("/my-tasks/stats", protect, getMyTaskStats);
router.get("/:id", protect, getTaskById);
router.patch("/:id/status", protect, updateTaskStatus);
router.patch("/:id/notes", protect, updateTaskNotes);

export default router;
