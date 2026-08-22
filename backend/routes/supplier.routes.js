import express from "express";

import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplier.controller.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Create supplier
router.post("/", protect, createSupplier);

// Get all suppliers
router.get("/", protect, getSuppliers);

// Get supplier by ID
router.get("/:id", protect, getSupplierById);

// Update supplier
router.put("/:id", protect, updateSupplier);

// Delete supplier
router.delete("/:id", protect, deleteSupplier);

export default router;