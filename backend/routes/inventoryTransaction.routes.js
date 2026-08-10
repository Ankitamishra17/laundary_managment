import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  stockIn,
  stockOut,
  adjustStock,
  getInventoryTransactions,
  getInventoryTransactionById,
  getPurchaseHistory,
} from "../controllers/inventoryTransaction.controller.js";

const router = express.Router();

// Stock In
router.post("/stock-in", protect, stockIn);

// Stock Out
router.post("/stock-out", protect, stockOut);

// Adjust Stock
router.post("/adjust", protect, adjustStock);

// All transactions
router.get("/", protect, getInventoryTransactions);

// Purchase History
// IMPORTANT: keep this BEFORE /:id
router.get("/purchases", protect, getPurchaseHistory);

// Single transaction
router.get("/:id", protect, getInventoryTransactionById);

export default router;
