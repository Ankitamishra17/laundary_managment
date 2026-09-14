import InventoryItem from "../models/InventoryItem.js";
import InventoryTransaction from "../models/InventoryTransaction.js";
import TaskInventoryUsage from "../models/TaskInventoryUsage.js";

/**
 * Consume inventory materials for an employee task.
 *
 * IMPORTANT:
 * This function expects an existing Sequelize transaction.
 *
 * It should be called while completing the task so:
 *
 * task completion
 * +
 * inventory deduction
 * +
 * usage history
 *
 * can be committed/rolled back together.
 */
export const consumeTaskInventory = async ({
  shopId,
  taskId,
  orderId = null,
  employeeId,
  materials = [],
  transaction,
}) => {
  if (!shopId) {
    throw new Error("Shop ID is required.");
  }

  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  if (!employeeId) {
    throw new Error("Employee ID is required.");
  }

  if (!transaction) {
    throw new Error(
      "Database transaction is required for task inventory usage.",
    );
  }

  if (!Array.isArray(materials)) {
    throw new Error("Materials must be an array.");
  }

  // No materials used is valid.
  if (materials.length === 0) {
    return [];
  }

  const usageRecords = [];

  for (const material of materials) {
    const inventoryItemId = Number(material.inventoryItemId);
    const quantity = Number(material.quantity);

    // ------------------------------------------
    // Validate material
    // ------------------------------------------

    if (!inventoryItemId) {
      throw new Error("Inventory item ID is required.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(
        `Invalid quantity for inventory item ${inventoryItemId}.`,
      );
    }

    // ------------------------------------------
    // Lock inventory row
    // ------------------------------------------

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
      throw new Error(
        `Inventory item ${inventoryItemId} not found or inactive.`,
      );
    }

    // ------------------------------------------
    // Current stock
    // ------------------------------------------

    const previousStock = Number(inventoryItem.currentStock || 0);

    // ------------------------------------------
    // Prevent negative stock
    // ------------------------------------------

    if (quantity > previousStock) {
      throw new Error(
        `Insufficient stock for ${inventoryItem.name}. Available: ${previousStock} ${inventoryItem.unit}, Required: ${quantity} ${inventoryItem.unit}.`,
      );
    }

    const newStock = previousStock - quantity;

    // ------------------------------------------
    // Update inventory
    // ------------------------------------------

    await inventoryItem.update(
      {
        currentStock: newStock,
      },
      {
        transaction,
      },
    );

    // ------------------------------------------
    // Inventory transaction
    // ------------------------------------------

    const inventoryTransaction = await InventoryTransaction.create(
      {
        shopId: Number(shopId),

        inventoryItemId,

        supplierId: null,

        purchaseId: null,

        taskId: Number(taskId),

        orderId: orderId ? Number(orderId) : null,

        employeeId: Number(employeeId),

        type: "OUT",

        quantity,

        previousStock,

        newStock,

        rate: null,

        totalAmount: null,

        reason: "Laundry Usage",

        notes: material.notes?.trim() || null,

        createdBy: Number(employeeId),
      },
      {
        transaction,
      },
    );

    // ------------------------------------------
    // Detailed task usage record
    // ------------------------------------------

    const usage = await TaskInventoryUsage.create(
      {
        shopId: Number(shopId),

        taskId: Number(taskId),

        orderId: orderId ? Number(orderId) : null,

        employeeId: Number(employeeId),

        inventoryItemId,

        quantity,

        notes: material.notes?.trim() || null,
      },
      {
        transaction,
      },
    );

    usageRecords.push({
      usage,
      inventoryTransaction,
      inventoryItem,
      previousStock,
      newStock,
    });
  }

  return usageRecords;
};
