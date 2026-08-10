import express from "express";
import {
  login,
  createPassword,
  forgotPassword,
} from "../controllers/auth.controller.js";
import protect from "../middleware/authMiddleware.js";
const router = express.Router();

// Login
router.post("/login", login);

// First Login - Create New Password
router.post("/create-password", protect, createPassword);

// Forgot Password
router.post("/forgot-password", forgotPassword);

export default router;
