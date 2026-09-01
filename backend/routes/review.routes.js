import express from "express";
import {
  submitReview,
  getMyReviews,
  deleteMyReview,
  getShopReviews,
  replyToReview,
  getReviewStats,
} from "../controllers/review.controller.js";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Customer
router.post("/", protect, allowRoles("customer"), submitReview);
router.get("/mine", protect, allowRoles("customer"), getMyReviews);
router.delete("/:id", protect, allowRoles("customer"), deleteMyReview);

// Admin
router.get("/", protect, allowRoles("admin", "super_admin"), getShopReviews);
router.get("/stats", protect, allowRoles("admin", "super_admin"), getReviewStats);
router.post("/:id/reply", protect, allowRoles("admin", "super_admin"), replyToReview);

export default router;
