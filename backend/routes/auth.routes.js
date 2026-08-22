import express from "express";
import {
  register,
  login,
  createPassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/auth.controller.js";
import protect from "../middleware/authMiddleware.js";
const router = express.Router();

// Customer sign-up (public)
router.post("/register", register);

// Login
router.post("/login", login);

// First Login - Create New Password
router.post("/create-password", protect, createPassword);

// Forgot Password — OTP via email
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

export default router;
