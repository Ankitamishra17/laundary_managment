import express from "express";
import {
  submitComplaint,
  getMyComplaints,
  customerReply,
  getShopComplaints,
  updateComplaintStatus,
  assignComplaint,
  adminReply,
  getComplaintStats,
} from "../controllers/complaint.controller.js";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Customer
router.post("/", protect, allowRoles("customer"), submitComplaint);
router.get("/mine", protect, allowRoles("customer"), getMyComplaints);
router.post("/:id/reply", protect, allowRoles("customer"), customerReply);

// Admin
router.get("/", protect, allowRoles("admin", "super_admin"), getShopComplaints);
router.get("/stats", protect, allowRoles("admin", "super_admin"), getComplaintStats);
router.patch("/:id/status", protect, allowRoles("admin", "super_admin"), updateComplaintStatus);
router.patch("/:id/assign", protect, allowRoles("admin", "super_admin"), assignComplaint);
router.post("/:id/reply", protect, allowRoles("admin", "super_admin"), adminReply);

export default router;
