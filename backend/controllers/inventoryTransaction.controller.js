import { Op } from "sequelize";
import sequelize from "../config/database.js";

import InventoryItem from "../models/InventoryItem.js";
import InventoryTransaction from "../models/InventoryTransaction.js";
import Supplier from "../models/Supplier.js";

// =====================================================
// STOCK IN
// =====================================================
// Used when:
// - Purchase received from supplier
// - Additional stock received
// - Any other stock addition
// =====================================================

export const stockIn = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { inventoryItemId, supplierId, quantity, rate, reason, notes } =
      req.body;

    const shopId = req.user.shopId;
    const createdBy = req.user.id;

    // ---------------------------------------------
    // Validate
    // ---------------------------------------------

    if (!inventoryItemId || quantity === undefined || quantity === null) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Inventory item and quantity are required.",
      });
    }

    const addedQuantity = Number(quantity);

    if (!Number.isFinite(addedQuantity) || addedQuantity <= 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0.",
      });
    }

    // ---------------------------------------------
    // Find inventory item
    // IMPORTANT:
    // Your DB has status + isDeleted, NOT isActive
    // ---------------------------------------------

    const inventoryItem = await InventoryItem.findOne({
      where: {
        id: inventoryItemId,
        shopId,
        status: "Active",
        isDeleted: false,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!inventoryItem) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Inventory item not found or inactive.",
      });
    }

    // ---------------------------------------------
    // Check supplier if provided
    // ---------------------------------------------

    if (supplierId) {
      const supplier = await Supplier.findOne({
        where: {
          id: supplierId,
          shopId,
          status: "Active",
          isDeleted: false,
        },
        transaction,
      });

      if (!supplier) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: "Supplier not found or inactive.",
        });
      }
    }

    // ---------------------------------------------
    // Calculate stock
    // ---------------------------------------------

    const previousStock = Number(inventoryItem.currentStock || 0);

    const newStock = previousStock + addedQuantity;

    // ---------------------------------------------
    // Rate
    // ---------------------------------------------

    let purchaseRate = null;

    if (rate !== undefined && rate !== null && rate !== "") {
      purchaseRate = Number(rate);

      if (!Number.isFinite(purchaseRate) || purchaseRate < 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Invalid purchase rate.",
        });
      }
    }

    const totalAmount =
      purchaseRate !== null ? addedQuantity * purchaseRate : null;

    // ---------------------------------------------
    // Update inventory
    // ---------------------------------------------

    await inventoryItem.update(
      {
        currentStock: newStock,
      },
      {
        transaction,
      },
    );

    // ---------------------------------------------
    // Create transaction history
    // ---------------------------------------------

    const stockTransaction = await InventoryTransaction.create(
      {
        shopId,
        inventoryItemId: Number(inventoryItemId),
        supplierId: supplierId ? Number(supplierId) : null,

        type: "IN",

        quantity: addedQuantity,

        previousStock,
        newStock,

        rate: purchaseRate,
        totalAmount,

        reason: reason?.trim() || "Purchase",
        notes: notes?.trim() || null,

        createdBy,
      },
      {
        transaction,
      },
    );

    // ---------------------------------------------
    // Commit
    // ---------------------------------------------

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Stock added successfully.",
      data: {
        inventoryItem,
        transaction: stockTransaction,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Stock In Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add stock.",
      error: error.message,
    });
  }
};

// =====================================================
// STOCK OUT
// =====================================================
// Used when:
// - Items are consumed
// - Items are damaged
// - Items are lost
// - Items are used for laundry operations
// =====================================================

export const stockOut = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { inventoryItemId, quantity, reason, notes } = req.body;

    const shopId = req.user.shopId;
    const createdBy = req.user.id;

    // ---------------------------------------------
    // Validate
    // ---------------------------------------------

    if (!inventoryItemId || quantity === undefined || quantity === null) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Inventory item and quantity are required.",
      });
    }

    const removedQuantity = Number(quantity);

    if (!Number.isFinite(removedQuantity) || removedQuantity <= 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0.",
      });
    }

    // ---------------------------------------------
    // Find inventory item
    // ---------------------------------------------

    const inventoryItem = await InventoryItem.findOne({
      where: {
        id: inventoryItemId,
        shopId,
        status: "Active",
        isDeleted: false,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!inventoryItem) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Inventory item not found or inactive.",
      });
    }

    // ---------------------------------------------
    // Check stock
    // ---------------------------------------------

    const previousStock = Number(inventoryItem.currentStock || 0);

    if (removedQuantity > previousStock) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available stock is ${previousStock}.`,
      });
    }

    const newStock = previousStock - removedQuantity;

    // ---------------------------------------------
    // Update inventory
    // ---------------------------------------------

    await inventoryItem.update(
      {
        currentStock: newStock,
      },
      {
        transaction,
      },
    );

    // ---------------------------------------------
    // Create transaction history
    // ---------------------------------------------

    const stockTransaction = await InventoryTransaction.create(
      {
        shopId,
        inventoryItemId: Number(inventoryItemId),

        supplierId: null,

        type: "OUT",

        quantity: removedQuantity,

        previousStock,
        newStock,

        rate: null,
        totalAmount: null,

        reason: reason?.trim() || "Laundry Usage",
        notes: notes?.trim() || null,

        createdBy,
      },
      {
        transaction,
      },
    );

    // ---------------------------------------------
    // Commit
    // ---------------------------------------------

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Stock removed successfully.",
      data: {
        inventoryItem,
        transaction: stockTransaction,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Stock Out Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove stock.",
      error: error.message,
    });
  }
};

// =====================================================
// STOCK ADJUSTMENT
// =====================================================
// Used when physical stock and system stock don't match.
// =====================================================

export const adjustStock = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { inventoryItemId, quantity, reason, notes } = req.body;

    const shopId = req.user.shopId;
    const createdBy = req.user.id;

    if (!inventoryItemId || quantity === undefined) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Inventory item and adjustment quantity are required.",
      });
    }

    const adjustment = Number(quantity);

    if (adjustment === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Adjustment quantity cannot be zero.",
      });
    }

    const inventoryItem = await InventoryItem.findOne({
      where: {
        id: inventoryItemId,
        shopId,
        isActive: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!inventoryItem) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    const previousStock = Number(inventoryItem.currentStock);

    const newStock = previousStock + adjustment;

    // Don't allow negative stock
    if (newStock < 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Adjustment cannot make stock negative.",
      });
    }

    await inventoryItem.update(
      {
        currentStock: newStock,
      },
      {
        transaction,
      },
    );

    const stockTransaction = await InventoryTransaction.create(
      {
        shopId,
        inventoryItemId,

        supplierId: null,

        type: "ADJUSTMENT",

        quantity: Math.abs(adjustment),

        previousStock,
        newStock,

        rate: null,
        totalAmount: null,

        reason: reason || "Physical Stock Adjustment",
        notes: notes || null,

        createdBy,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Stock adjusted successfully.",
      data: {
        inventoryItem,
        transaction: stockTransaction,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Stock Adjustment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to adjust stock.",
      error: error.message,
    });
  }
};

// =====================================================
// GET TRANSACTION HISTORY
// =====================================================

export const getInventoryTransactions = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    const { inventoryItemId, type, startDate, endDate } = req.query;

    const where = {
      shopId,
    };

    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [
          new Date(`${startDate} 00:00:00`),
          new Date(`${endDate} 23:59:59`),
        ],
      };
    }

    const transactions = await InventoryTransaction.findAll({
      where,
      include: [
        {
          model: InventoryItem,
          as: "inventoryItem",
          attributes: ["id", "name", "unit", "currentStock"],
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "name", "phone"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Get Inventory Transactions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory transactions.",
      error: error.message,
    });
  }
};

// =====================================================
// GET TRANSACTION BY ID
// =====================================================

export const getInventoryTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;

    const stockTransaction = await InventoryTransaction.findOne({
      where: {
        id,
        shopId,
      },
      include: [
        {
          model: InventoryItem,
          as: "inventoryItem",
          attributes: ["id", "name", "unit", "currentStock"],
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "name", "phone"],
          required: false,
        },
      ],
    });

    if (!stockTransaction) {
      return res.status(404).json({
        success: false,
        message: "Inventory transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: stockTransaction,
    });
  } catch (error) {
    console.error("Get Inventory Transaction Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory transaction.",
      error: error.message,
    });
  }
};

// ==========================================
// GET PURCHASE HISTORY
// ==========================================

export const getPurchaseHistory = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    const purchases = await InventoryTransaction.findAll({
      where: {
        shopId,
        type: "IN",
      },
      include: [
        {
          model: InventoryItem,
          as: "inventoryItem",
          attributes: ["id", "name", "unit", "currentStock"],
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "name", "phone"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    console.error("Get Purchase History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase history.",
      error: error.message,
    });
  }
};
