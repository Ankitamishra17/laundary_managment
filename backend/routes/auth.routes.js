import express from "express";

import {
  register,
  login,
  shopLogin,
  createPassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/auth.controller.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================================
// CUSTOMER SELF SIGN-UP
// ============================================================
//
// Public
//
// Frontend URL:
// /:slug/signup
//
// Example:
// /amisha-laundry/signup
//
// Body:
// {
//   name,
//   email,
//   phone,
//   password,
//   slug,
//   address,
//   city
// }
//
// The controller resolves shopId from slug.
// ============================================================

router.post("/register", register);

// ============================================================
// SUPER ADMIN / GLOBAL LOGIN
// ============================================================
//
// Public
//
// Frontend URL:
// /login
//
// Body:
// {
//   email,
//   password
// }
//
// Used for:
// - super_admin
// ============================================================

router.post("/login", login);

// ============================================================
// SHOP-SCOPED LOGIN
// ============================================================
//
// Public
//
// Frontend URL:
// /:slug/login
//
// Example:
// /amisha-laundry/login
//
// Body:
// {
//   email,
//   password,
//   slug
// }
//
// Used for:
// - admin
// - customer
// - employee
//
// Login is restricted to the shop identified by slug.
// ============================================================

router.post("/shop/:slug/login", shopLogin);

// ============================================================
// FIRST LOGIN - CREATE PASSWORD
// ============================================================
//
// Protected
//
// Used for:
// - super_admin
// - admin
// - customer
//
// Employee uses profile password-change endpoint.
// ============================================================

router.post("/create-password", protect, createPassword);

// ============================================================
// FORGOT PASSWORD
// ============================================================
//
// Public
//
// Body:
// {
//   email
// }
// ============================================================

router.post("/forgot-password", forgotPassword);

// ============================================================
// VERIFY RESET OTP
// ============================================================
//
// Public
//
// Body:
// {
//   email,
//   otp
// }
// ============================================================

router.post("/verify-reset-otp", verifyResetOtp);

// ============================================================
// RESET PASSWORD
// ============================================================
//
// Public
//
// Body:
// {
//   token,
//   newPassword,
//   confirmPassword
// }
// ============================================================

router.post("/reset-password", resetPassword);

export default router;
