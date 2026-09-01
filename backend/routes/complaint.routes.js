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
  getMyAssignedComplaints,
  resolveComplaint,
  employeeReplyToComplaint,
} from "../controllers/complaint.controller.js";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";
import uploadComplaint from "../middleware/uploadComplaint.js";

const router = express.Router();

// Customer
router.post("/", protect, allowRoles("customer"), (req, res, next) => {
  uploadComplaint.single("image")(req, res, (err) => {
    if (err) {
      const message = err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller."
        : err.message || "Upload failed. Please try again.";
      return res.status(400).json({ success: false, message });
    }
    next();
  });
}, submitComplaint);
router.get("/mine", protect, allowRoles("customer"), getMyComplaints);
router.post("/:id/reply", protect, allowRoles("customer"), customerReply);

// Employee
router.get("/my-assigned", protect, allowRoles("employee"), getMyAssignedComplaints);
router.patch("/:id/resolve", protect, allowRoles("employee"), resolveComplaint);
router.post("/:id/employee-reply", protect, allowRoles("employee"), employeeReplyToComplaint);

// Admin
router.get("/", protect, allowRoles("admin", "super_admin"), getShopComplaints);
router.get("/stats", protect, allowRoles("admin", "super_admin"), getComplaintStats);
router.patch("/:id/status", protect, allowRoles("admin", "super_admin"), updateComplaintStatus);
router.patch("/:id/assign", protect, allowRoles("admin", "super_admin"), assignComplaint);
router.post("/:id/admin-reply", protect, allowRoles("admin", "super_admin"), adminReply);

export default router;
