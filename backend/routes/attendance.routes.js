import express from "express";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

import {
  checkIn,
  checkOut,
  getMyToday,
  getMyAttendance,
  getDailyAttendance,
  getAttendanceReport,
  markAttendance,
} from "../controllers/attendance.controller.js";

const router = express.Router();

// ---- Employee — own attendance (auto-scoped in the controller) ----
router.post("/check-in", protect, allowRoles("employee"), checkIn);
router.post("/check-out", protect, allowRoles("employee"), checkOut);
router.get("/my/today", protect, allowRoles("employee"), getMyToday);
router.get("/my", protect, allowRoles("employee"), getMyAttendance);

// ---- Admin — overview, reports and manual marking ----
router.get("/daily", protect, allowRoles("admin"), getDailyAttendance);
router.get("/reports", protect, allowRoles("admin"), getAttendanceReport);
router.post("/mark", protect, allowRoles("admin"), markAttendance);

export default router;
