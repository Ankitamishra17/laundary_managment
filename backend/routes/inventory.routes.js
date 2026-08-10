import express from "express";

import {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
} from "../controllers/inventory.controller.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// INVENTORY ITEMS
// ==========================================

// Get all inventory items
router.get("/", protect, getInventoryItems);

// Create inventory item
router.post("/", protect, createInventoryItem);

// Get low stock items
router.get("/low-stock", protect, getLowStockItems);
//Important 
// Keep Low stock before id Otherwise Express can interpret "low-stock" as an id.

// Get single item
router.get("/:id", protect, getInventoryItemById);

// Update item
router.put("/:id", protect, updateInventoryItem);

// Delete item
router.delete("/:id", protect, deleteInventoryItem);

export default router;