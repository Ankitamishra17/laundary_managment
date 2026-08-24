import { Op } from "sequelize";

import sequelize from "../config/database.js";

import {
  Purchase,
  PurchaseItem,
  InventoryItem,
  InventoryTransaction,
  Supplier,
  Payment,
} from "../models/index.js";

// =====================================================
// CREATE PURCHASE
// POST /api/purchases
// =====================================================

export const createPurchase = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      supplierId,
      invoiceNo,
      purchaseDate,
      items,
      discount = 0,
      tax = 0,
      paidAmount = 0,
      paymentMethod,
      transactionId,
      referenceNumber,
      description,
      remarks,
    } = req.body;

    const shopId = req.user?.shopId;
    const createdBy = req.user?.id;

    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (!shopId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Shop information is missing",
      });
    }

    if (!createdBy) {
      await transaction.rollback();

      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    if (!supplierId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Supplier is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "At least one purchase item is required",
      });
    }

    // =================================================
    // NUMERIC VALUES
    // =================================================

    const discountAmount = Number(discount);
    const taxAmount = Number(tax);
    const paid = Number(paidAmount);

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid discount amount",
      });
    }

    if (!Number.isFinite(taxAmount) || taxAmount < 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid tax amount",
      });
    }

    if (!Number.isFinite(paid) || paid < 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid paid amount",
      });
    }

    // =================================================
    // FIND SUPPLIER
    // =================================================

    const supplier = await Supplier.findOne({
      where: {
        id: supplierId,
        shopId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!supplier) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // =================================================
    // PREPARE ITEMS
    // =================================================

    let subtotal = 0;

    const preparedItems = [];

    const usedItems = new Set();

    for (const item of items) {
      const { inventoryItemId, quantity, rate } = item;

      if (!inventoryItemId) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "inventoryItemId is required",
        });
      }

      // Prevent same item twice
      if (usedItems.has(Number(inventoryItemId))) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: `Inventory item ${inventoryItemId} is added more than once`,
        });
      }

      usedItems.add(Number(inventoryItemId));

      const itemQuantity = Number(quantity);
      const itemRate = Number(rate);

      if (!Number.isFinite(itemQuantity) || itemQuantity <= 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: `Invalid quantity for inventory item ${inventoryItemId}`,
        });
      }

      if (!Number.isFinite(itemRate) || itemRate < 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: `Invalid rate for inventory item ${inventoryItemId}`,
        });
      }

      // =================================================
      // FIND INVENTORY ITEM
      // =================================================

      const inventoryItem = await InventoryItem.findOne({
        where: {
          id: inventoryItemId,
          shopId,
          isDeleted: false,
          status: "Active",
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!inventoryItem) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: `Inventory item ${inventoryItemId} not found or inactive`,
        });
      }

      // =================================================
      // ITEM AMOUNT
      // =================================================

      const amount = Number((itemQuantity * itemRate).toFixed(2));

      subtotal += amount;

      preparedItems.push({
        inventoryItem,
        inventoryItemId: Number(inventoryItemId),
        quantity: itemQuantity,
        rate: itemRate,
        amount,
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    // =================================================
    // TOTAL
    // =================================================

    const totalAmount = Number(
      (subtotal - discountAmount + taxAmount).toFixed(2),
    );

    if (totalAmount < 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Purchase total cannot be negative",
      });
    }

    if (paid > totalAmount) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be greater than purchase total",
      });
    }

    const dueAmount = Number((totalAmount - paid).toFixed(2));

    // =================================================
    // STATUS
    // =================================================

    let status = "PENDING";

    if (paid === 0) {
      status = "PENDING";
    } else if (paid < totalAmount) {
      status = "PARTIAL";
    } else {
      status = "PAID";
    }

    // =================================================
    // PAYMENT VALIDATION
    // =================================================

    if (paid > 0 && !paymentMethod) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    // =================================================
    // CREATE PURCHASE
    // =================================================

    const purchase = await Purchase.create(
      {
        shopId,
        supplierId,

        invoiceNo: invoiceNo?.trim() || null,

        purchaseDate: purchaseDate || new Date(),

        subtotal,

        discount: Number(discountAmount.toFixed(2)),

        tax: Number(taxAmount.toFixed(2)),

        totalAmount,

        paidAmount: paid,

        dueAmount,

        status,

        notes: remarks || null,

        createdBy,

        updatedBy: createdBy,
      },
      {
        transaction,
      },
    );

    // =================================================
    // PURCHASE ITEMS + STOCK IN
    // =================================================

    const purchaseItems = [];
    const inventoryTransactions = [];

    for (const item of preparedItems) {
      // -----------------------------------------------
      // Purchase Item
      // -----------------------------------------------

      const purchaseItem = await PurchaseItem.create(
        {
          purchaseId: purchase.id,

          inventoryItemId: item.inventoryItemId,

          quantity: item.quantity,

          rate: item.rate,

          amount: item.amount,
        },
        {
          transaction,
        },
      );

      purchaseItems.push(purchaseItem);

      // -----------------------------------------------
      // STOCK
      // -----------------------------------------------

      const previousStock = Number(item.inventoryItem.currentStock);

      const newStock = Number((previousStock + item.quantity).toFixed(2));

      await item.inventoryItem.update(
        {
          currentStock: newStock,
          updatedBy: createdBy,
        },
        {
          transaction,
        },
      );

      // -----------------------------------------------
      // INVENTORY TRANSACTION
      // -----------------------------------------------

      const inventoryTransaction = await InventoryTransaction.create(
        {
          shopId,

          inventoryItemId: item.inventoryItemId,

          supplierId,

          purchaseId: purchase.id,

          type: "IN",

          quantity: item.quantity,

          previousStock,

          newStock,

          rate: item.rate,

          totalAmount: item.amount,

          reason: "Purchase",

          notes: remarks || null,

          createdBy,
        },
        {
          transaction,
        },
      );

      inventoryTransactions.push(inventoryTransaction);
    }

    // =================================================
    // INITIAL SUPPLIER PAYMENT
    // =================================================

    let payment = null;

    if (paid > 0) {
      const lastPayment = await Payment.findOne({
        where: {
          shopId,
        },

        order: [["paymentNumber", "DESC"]],

        transaction,

        lock: transaction.LOCK.UPDATE,
      });

      const paymentNumber = lastPayment
        ? Number(lastPayment.paymentNumber) + 1
        : 1;

      payment = await Payment.create(
        {
          shopId,

          paymentNumber,

          paymentType: "SUPPLIER",

          supplierId,

          purchaseId: purchase.id,

          amount: paid,

          paymentMethod,

          status: "Paid",

          transactionId: transactionId || null,

          referenceNumber: referenceNumber || null,

          paymentDate: new Date(),

          description:
            description || `Payment for purchase ${invoiceNo || purchase.id}`,

          remarks: remarks || null,

          createdBy,
        },
        {
          transaction,
        },
      );
    }

    // =================================================
    // COMMIT
    // =================================================

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Purchase created successfully",

      data: {
        purchase,
        items: purchaseItems,
        inventoryTransactions,
        payment,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Create Purchase Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL PURCHASES
// GET /api/purchases
// =====================================================

export const getPurchases = async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop information is missing",
      });
    }

    const {
      search,
      supplierId,
      status,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const offset = (pageNumber - 1) * limitNumber;

    const where = {
      shopId,
    };

    // =================================================
    // FILTER SUPPLIER
    // =================================================

    if (supplierId) {
      where.supplierId = supplierId;
    }

    // =================================================
    // FILTER STATUS
    // =================================================

    if (status) {
      where.status = status;
    }

    // =================================================
    // DATE FILTER
    // =================================================

    if (startDate && endDate) {
      where.purchaseDate = {
        [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
      };
    } else if (startDate) {
      where.purchaseDate = {
        [Op.gte]: `${startDate} 00:00:00`,
      };
    } else if (endDate) {
      where.purchaseDate = {
        [Op.lte]: `${endDate} 23:59:59`,
      };
    }

    // =================================================
    // SEARCH
    // =================================================

    if (search) {
      where[Op.or] = [
        {
          invoiceNo: {
            [Op.like]: `%${search}%`,
          },
        },
      ];
    }

    // =================================================
    // FETCH
    // =================================================

    const { count, rows } = await Purchase.findAndCountAll({
      where,

      include: [
        {
          model: Supplier,
          as: "supplier",
          attributes: ["id", "name", "phone", "email"],
        },

        {
          model: PurchaseItem,
          as: "items",
          include: [
            {
              model: InventoryItem,
              as: "inventoryItem",
              attributes: ["id", "name", "category", "unit"],
            },
          ],
        },
      ],

      order: [["createdAt", "DESC"]],

      limit: limitNumber,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,

      data: rows,

      pagination: {
        total: count,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(count / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get Purchases Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
};

// =====================================================
// GET PURCHASE BY ID
// GET /api/purchases/:id
// =====================================================

export const getPurchaseById = async (req, res) => {
  try {
    const shopId = req.user?.shopId;
    const { id } = req.params;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop information is missing",
      });
    }

    const purchase = await Purchase.findOne({
      where: {
        id,
        shopId,
      },

      include: [
        {
          model: Supplier,
          as: "supplier",
        },

        {
          model: PurchaseItem,
          as: "items",

          include: [
            {
              model: InventoryItem,
              as: "inventoryItem",
            },
          ],
        },

        {
          model: Payment,
          as: "payments",
        },

        {
          model: InventoryTransaction,
          as: "inventoryTransactions",
        },
      ],
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Get Purchase By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase",
      error: error.message,
    });
  }
};

// =====================================================
// GET PURCHASES BY SUPPLIER
// GET /api/purchases/supplier/:supplierId
// =====================================================

export const getSupplierPurchases = async (req, res) => {
  try {
    const shopId = req.user?.shopId;
    const { supplierId } = req.params;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop information is missing",
      });
    }

    // =================================================
    // CHECK SUPPLIER
    // =================================================

    const supplier = await Supplier.findOne({
      where: {
        id: supplierId,
        shopId,
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // =================================================
    // GET PURCHASES
    // =================================================

    const purchases = await Purchase.findAll({
      where: {
        shopId,
        supplierId,
      },

      include: [
        {
          model: PurchaseItem,
          as: "items",

          include: [
            {
              model: InventoryItem,
              as: "inventoryItem",
            },
          ],
        },

        {
          model: Payment,
          as: "payments",
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    // =================================================
    // CALCULATE SUMMARY
    // =================================================

    let totalPurchase = 0;
    let totalPaid = 0;
    let totalDue = 0;

    for (const purchase of purchases) {
      totalPurchase += Number(purchase.totalAmount || 0);

      totalPaid += Number(purchase.paidAmount || 0);

      totalDue += Number(purchase.dueAmount || 0);
    }

    return res.status(200).json({
      success: true,

      supplier,

      summary: {
        totalPurchase: Number(totalPurchase.toFixed(2)),

        totalPaid: Number(totalPaid.toFixed(2)),

        totalDue: Number(totalDue.toFixed(2)),
      },

      data: purchases,
    });
  } catch (error) {
    console.error("Get Supplier Purchases Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch supplier purchases",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE PURCHASE
// PUT /api/purchases/:id
// =====================================================
//
// IMPORTANT:
// We allow update only when purchase has NO payment
// and is still PENDING.
//
// This prevents stock/accounting mismatch.
// =====================================================

export const updatePurchase = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const shopId = req.user?.shopId;
    const updatedBy = req.user?.id;

    const { id } = req.params;

    const {
      supplierId,
      invoiceNo,
      purchaseDate,
      items,
      discount = 0,
      tax = 0,
      remarks,
    } = req.body;

    if (!shopId || !updatedBy) {
      await transaction.rollback();

      return res.status(401).json({
        success: false,
        message: "Authentication information missing",
      });
    }

    // =================================================
    // FIND PURCHASE
    // =================================================

    const purchase = await Purchase.findOne({
      where: {
        id,
        shopId,
      },

      transaction,

      lock: transaction.LOCK.UPDATE,
    });

    if (!purchase) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // =================================================
    // ONLY PENDING PURCHASE CAN BE UPDATED
    // =================================================

    if (purchase.status !== "PENDING") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Only pending purchases can be updated",
      });
    }

    // =================================================
    // CHECK PAYMENT
    // =================================================

    const existingPayment = await Payment.findOne({
      where: {
        purchaseId: purchase.id,
        shopId,
      },

      transaction,
    });

    if (existingPayment) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Purchase with payment cannot be updated",
      });
    }

    // =================================================
    // SUPPLIER
    // =================================================

    const newSupplierId = supplierId || purchase.supplierId;

    const supplier = await Supplier.findOne({
      where: {
        id: newSupplierId,
        shopId,
      },

      transaction,
    });

    if (!supplier) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // =================================================
    // GET OLD ITEMS
    // =================================================

    const oldItems = await PurchaseItem.findAll({
      where: {
        purchaseId: purchase.id,
      },

      transaction,

      lock: transaction.LOCK.UPDATE,
    });

    // =================================================
    // REVERSE OLD STOCK
    // =================================================

    for (const oldItem of oldItems) {
      const inventoryItem = await InventoryItem.findOne({
        where: {
          id: oldItem.inventoryItemId,
          shopId,
          isDeleted: false,
        },

        transaction,

        lock: transaction.LOCK.UPDATE,
      });

      if (!inventoryItem) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: `Inventory item ${oldItem.inventoryItemId} not found`,
        });
      }

      const previousStock = Number(inventoryItem.currentStock);

      const quantity = Number(oldItem.quantity);

      const newStock = Number((previousStock - quantity).toFixed(2));

      if (newStock < 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: `Cannot update purchase because stock for ${inventoryItem.name} has already been used`,
        });
      }

      await inventoryItem.update(
        {
          currentStock: newStock,
          updatedBy,
        },
        {
          transaction,
        },
      );

      await InventoryTransaction.create(
        {
          shopId,

          inventoryItemId: inventoryItem.id,

          supplierId: purchase.supplierId,

          purchaseId: purchase.id,

          type: "ADJUSTMENT",

          quantity: quantity,

          previousStock,

          newStock,

          rate: Number(oldItem.rate),

          totalAmount: Number(oldItem.amount),

          reason: "Purchase update - stock reversal",

          notes: "Old purchase quantity reversed before update",

          createdBy: updatedBy,
        },
        {
          transaction,
        },
      );
    }

    // =================================================
    // DELETE OLD PURCHASE ITEMS
    // =================================================

    await PurchaseItem.destroy({
      where: {
        purchaseId: purchase.id,
      },

      transaction,
    });

    // =================================================
    // VALIDATE NEW ITEMS
    // =================================================

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "At least one purchase item is required",
      });
    }

    // =================================================
    // CREATE NEW ITEMS
    // =================================================

    let subtotal = 0;

    const usedItems = new Set();

    const preparedItems = [];

    for (const item of items) {
      const { inventoryItemId, quantity, rate } = item;

      if (usedItems.has(Number(inventoryItemId))) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Duplicate inventory item in purchase",
        });
      }

      usedItems.add(Number(inventoryItemId));

      const itemQuantity = Number(quantity);

      const itemRate = Number(rate);

      if (!Number.isFinite(itemQuantity) || itemQuantity <= 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Invalid quantity",
        });
      }

      if (!Number.isFinite(itemRate) || itemRate < 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Invalid rate",
        });
      }

      const inventoryItem = await InventoryItem.findOne({
        where: {
          id: inventoryItemId,
          shopId,
          isDeleted: false,
          status: "Active",
        },

        transaction,

        lock: transaction.LOCK.UPDATE,
      });

      if (!inventoryItem) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: `Inventory item ${inventoryItemId} not found`,
        });
      }

      const amount = Number((itemQuantity * itemRate).toFixed(2));

      subtotal += amount;

      preparedItems.push({
        inventoryItem,
        inventoryItemId,
        quantity: itemQuantity,
        rate: itemRate,
        amount,
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    const discountAmount = Number(discount);

    const taxAmount = Number(tax);

    const totalAmount = Number(
      (subtotal - discountAmount + taxAmount).toFixed(2),
    );

    // =================================================
    // UPDATE PURCHASE
    // =================================================

    await purchase.update(
      {
        supplierId: newSupplierId,

        invoiceNo: invoiceNo?.trim() || null,

        purchaseDate: purchaseDate || purchase.purchaseDate,

        subtotal,

        discount: discountAmount,

        tax: taxAmount,

        totalAmount,

        paidAmount: 0,

        dueAmount: totalAmount,

        status: "PENDING",

        notes: remarks || null,

        updatedBy,
      },
      {
        transaction,
      },
    );

    // =================================================
    // ADD NEW STOCK
    // =================================================

    for (const item of preparedItems) {
      const inventoryItem = item.inventoryItem;

      const previousStock = Number(inventoryItem.currentStock);

      const newStock = Number((previousStock + item.quantity).toFixed(2));

      await inventoryItem.update(
        {
          currentStock: newStock,
          updatedBy,
        },
        {
          transaction,
        },
      );

      await PurchaseItem.create(
        {
          purchaseId: purchase.id,

          inventoryItemId: item.inventoryItemId,

          quantity: item.quantity,

          rate: item.rate,

          amount: item.amount,
        },
        {
          transaction,
        },
      );

      await InventoryTransaction.create(
        {
          shopId,

          inventoryItemId: item.inventoryItemId,

          supplierId: newSupplierId,

          purchaseId: purchase.id,

          type: "IN",

          quantity: item.quantity,

          previousStock,

          newStock,

          rate: item.rate,

          totalAmount: item.amount,

          reason: "Purchase update",

          notes: "Stock added after purchase update",

          createdBy: updatedBy,
        },
        {
          transaction,
        },
      );
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      data: purchase,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Update Purchase Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update purchase",
      error: error.message,
    });
  }
};

// =====================================================
// CANCEL PURCHASE
// PATCH /api/purchases/:id/cancel
// =====================================================

export const cancelPurchase = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const shopId = req.user?.shopId;
    const updatedBy = req.user?.id;

    const { id } = req.params;

    if (!shopId || !updatedBy) {
      await transaction.rollback();

      return res.status(401).json({
        success: false,
        message: "Authentication information missing",
      });
    }

    // =================================================
    // FIND PURCHASE
    // =================================================

    const purchase = await Purchase.findOne({
      where: {
        id,
        shopId,
      },

      transaction,

      lock: transaction.LOCK.UPDATE,
    });

    if (!purchase) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // =================================================
    // ALREADY CANCELLED
    // =================================================

    if (purchase.status === "CANCELLED") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Purchase is already cancelled",
      });
    }

    // =================================================
    // GET ITEMS
    // =================================================

    const purchaseItems = await PurchaseItem.findAll({
      where: {
        purchaseId: purchase.id,
      },

      transaction,

      lock: transaction.LOCK.UPDATE,
    });

    // =================================================
    // REVERSE STOCK
    // =================================================

    for (const item of purchaseItems) {
      const inventoryItem = await InventoryItem.findOne({
        where: {
          id: item.inventoryItemId,

          shopId,

          isDeleted: false,
        },

        transaction,

        lock: transaction.LOCK.UPDATE,
      });

      if (!inventoryItem) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: `Inventory item ${item.inventoryItemId} not found`,
        });
      }

      const previousStock = Number(inventoryItem.currentStock);

      const quantity = Number(item.quantity);

      const newStock = Number((previousStock - quantity).toFixed(2));

      // =================================================
      // PREVENT NEGATIVE STOCK
      // =================================================

      if (newStock < 0) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,

          message: `Cannot cancel purchase. Stock for "${inventoryItem.name}" has already been used.`,
        });
      }

      // =================================================
      // UPDATE STOCK
      // =================================================

      await inventoryItem.update(
        {
          currentStock: newStock,

          updatedBy,
        },
        {
          transaction,
        },
      );

      // =================================================
      // STOCK REVERSAL TRANSACTION
      // =================================================

      await InventoryTransaction.create(
        {
          shopId,

          inventoryItemId: inventoryItem.id,

          supplierId: purchase.supplierId,

          purchaseId: purchase.id,

          type: "ADJUSTMENT",

          quantity: quantity,

          previousStock,

          newStock,

          rate: Number(item.rate),

          totalAmount: Number(item.amount),

          reason: "Purchase cancellation - stock reversal",

          notes: req.body.reason || "Purchase cancelled",

          createdBy: updatedBy,
        },
        {
          transaction,
        },
      );
    }

    // =================================================
    // CHECK PAYMENT
    // =================================================

    const payments = await Payment.findAll({
      where: {
        purchaseId: purchase.id,

        shopId,
      },

      transaction,
    });

    const totalPayments = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    // =================================================
    // IMPORTANT
    // DO NOT DELETE PAYMENTS
    // =================================================

    // Payment records are financial history.
    // They remain in the database.

    // =================================================
    // UPDATE PURCHASE
    // =================================================

    await purchase.update(
      {
        status: "CANCELLED",

        updatedBy,

        notes: req.body.reason || "Purchase cancelled",
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,

      message: "Purchase cancelled successfully",

      data: {
        purchase,

        stockReversed: true,

        totalPaid: Number(totalPayments.toFixed(2)),

        paymentCount: payments.length,

        warning:
          totalPayments > 0
            ? "This purchase has existing supplier payments. Payment records were preserved and should be handled separately according to your refund/adjustment policy."
            : null,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Cancel Purchase Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel purchase",
      error: error.message,
    });
  }
};
