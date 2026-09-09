import { Op } from "sequelize";
import sequelize from "../config/database.js";

import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Customer from "../models/Customer.js";
import Shop from "../models/Shop.js";
import { sendInvoiceEmail } from "../utils/invoiceEmail.js";

// ============================================================
// HELPERS
// ============================================================

/**
 * Generate a unique invoice number with the shop's code prefix.
 * Example: WF-INV-00001  (where WF is the shopCode)
 */
async function generateInvoiceNumber(shopId) {
  const shop = await Shop.findByPk(shopId, {
    attributes: ["shopCode", "name"],
  });
  // Use the first 2 chars of shopCode, upper-cased — falls back to "INV"
  const prefix = shop?.shopCode
    ? shop.shopCode.toUpperCase().slice(0, 2)
    : "INV";

  const seqPrefix = `${prefix}-INV-`;

  const lastInvoice = await Invoice.findOne({
    where: {
      shopId,
      invoiceNumber: { [Op.like]: `${seqPrefix}%` },
    },
    order: [["invoiceNumber", "DESC"]],
  });

  let seq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-");
    seq = parseInt(parts[2], 10) + 1;
  }

  return `${seqPrefix}${String(seq).padStart(5, "0")}`;
}

/**
 * Calculate invoice total from its components.
 * Formula: total = subtotal - discount + taxAmount + deliveryCharge
 */
function calculateTotal({ subtotal, discount, taxAmount, deliveryCharge }) {
  const sub = Number(subtotal) || 0;
  const disc = Number(discount) || 0;
  const tax = Number(taxAmount) || 0;
  const delivery = Number(deliveryCharge) || 0;
  return Number((sub - disc + tax + delivery).toFixed(2));
}

// ============================================================
// GENERATE INVOICE FROM ORDER
// POST /api/invoices/generate/:orderId
// ============================================================

export const generateInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { orderId } = req.params;
    const { discount = 0, taxRate = 0, deliveryCharge = 0, notes } = req.body;

    // Find the order
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderItem, as: "items" },
        { model: Customer, as: "customer" },
        { model: Shop, as: "shop" },
      ],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Tenant isolation — admin must belong to the same shop
    if (req.user.shopId && order.shop_id !== req.user.shopId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({
      where: { orderId: order.id },
      transaction,
    });

    if (existingInvoice) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invoice already exists for this order",
        data: existingInvoice,
      });
    }

    // Build items snapshot
    const itemsSnapshot = (order.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
      lineTotal: Number(item.lineTotal),
      itemLabel: item.item_label || null,
    }));

    const subtotal = itemsSnapshot.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0
    );

    const disc = Number(discount) || 0;
    const tax = Number(taxRate) || 0;
    const taxAmount = Number(((subtotal - disc) * tax / 100).toFixed(2));
    const delivery = Number(deliveryCharge) || 0;
    const total = calculateTotal({
      subtotal,
      discount: disc,
      taxAmount,
      deliveryCharge: delivery,
    });

    // Generate invoice number with shop prefix
    const invoiceNumber = await generateInvoiceNumber(order.shop_id);

    const issuedDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await Invoice.create(
      {
        invoiceNumber,
        orderId: order.id,
        customerId: order.customer_id,
        shopId: order.shop_id,
        items: itemsSnapshot,
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(disc.toFixed(2)),
        taxRate: Number(tax),
        taxAmount,
        deliveryCharge: Number(delivery.toFixed(2)),
        total,
        paymentStatus: order.payment_status === "paid" ? "Paid" : "Unpaid",
        amountPaid:
          order.payment_status === "paid" ? total : 0,
        issuedDate: issuedDate.toISOString().split("T")[0],
        dueDate: dueDate.toISOString().split("T")[0],
        notes: notes || null,
        // Snapshot customer info
        customerName: order.customer?.name || null,
        customerEmail: order.customer?.email || null,
        customerPhone: order.customer?.phone || null,
        customerAddress: order.customer?.address || null,
        // Snapshot shop info
        shopName: order.shop?.name || null,
        shopAddress: order.shop?.address || null,
        shopPhone: order.shop?.phone || null,
        shopGstNumber: order.shop?.gstNumber || null,
      },
      { transaction }
    );

    await transaction.commit();

    // Send invoice email to customer (non-blocking)
    sendInvoiceEmail(invoice.toJSON()).catch((err) => {
      console.error("Invoice email failed (non-blocking):", err.message);
    });

    return res.status(201).json({
      success: true,
      message: "Invoice generated successfully. Email sent to customer.",
      data: invoice,
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Generate Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
      error: error.message,
    });
  }
};

// ============================================================
// GET MY INVOICES (Customer)
// GET /api/invoices/my
// ============================================================

export const getMyInvoices = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { userId: req.user.id },
    });

    if (!customer) {
      return res.status(200).json({ success: true, data: [] });
    }

    const invoices = await Invoice.findAll({
      where: { customerId: customer.id },
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount", "payment_status"],
        },
        {
          model: Shop,
          as: "shop",
          attributes: ["id", "name", "shopCode", "address", "phone", "email", "city"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error("Get My Invoices Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL INVOICES (Admin — scoped to their shop)
// GET /api/invoices/admin
// ============================================================

export const getAdminInvoices = async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};

    // Scope to admin's shop
    if (req.user.shopId) {
      where.shopId = req.user.shopId;
    }

    // Filter by payment status
    if (status && status !== "all") {
      where.paymentStatus = status;
    }

    // Date range filter
    if (startDate && endDate) {
      where.issuedDate = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.issuedDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.issuedDate = { [Op.lte]: endDate };
    }

    // Search by invoice number, order number, or customer name
    if (search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { customerEmail: { [Op.like]: `%${search}%` } },
      ];
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const offset = (pageNumber - 1) * limitNumber;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount", "payment_status"],
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "phone", "email"],
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
    console.error("Get Admin Invoices Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL TENANT INVOICES (Super Admin)
// GET /api/invoices/all
// ============================================================

export const getAllTenantInvoices = async (req, res) => {
  try {
    const { status, search, shopId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};

    // Super admin can optionally filter by a specific shop
    if (shopId) {
      where.shopId = shopId;
    }

    // Filter by payment status
    if (status && status !== "all") {
      where.paymentStatus = status;
    }

    // Date range filter
    if (startDate && endDate) {
      where.issuedDate = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.issuedDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.issuedDate = { [Op.lte]: endDate };
    }

    // Search by invoice number, customer name, or shop name
    if (search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { shopName: { [Op.like]: `%${search}%` } },
      ];
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const offset = (pageNumber - 1) * limitNumber;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount", "payment_status"],
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "phone", "email"],
        },
        {
          model: Shop,
          as: "shop",
          attributes: ["id", "name", "shopCode"],
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
    console.error("Get All Tenant Invoices Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

// ============================================================
// GET INVOICE BY ID
// GET /api/invoices/:id
// ============================================================

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Order,
          as: "order",
          attributes: [
            "id",
            "status",
            "total_amount",
            "payment_status",
            "pickup_date",
            "pickup_time",
            "pickup_address",
            "delivery_address",
            "delivery_date",
            "delivery_time",
            "delivery_note",
            "createdAt",
          ],
        },
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "phone", "email", "address", "city"],
        },
        {
          model: Shop,
          as: "shop",
          attributes: [
            "id",
            "name",
            "shopCode",
            "address",
            "phone",
            "email",
            "city",
            "state",
            "gstNumber",
            "logo",
          ],
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // For customers, ensure they can only see their own invoices
    if (req.user.role === "customer") {
      const customer = await Customer.findOne({
        where: { userId: req.user.id },
      });
      if (!customer || invoice.customerId !== customer.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    // For admins, ensure they can only see their shop's invoices
    if (
      req.user.role === "admin" &&
      req.user.shopId &&
      invoice.shopId !== req.user.shopId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Super admins can view any invoice — no shopId restriction

    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error("Get Invoice By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE INVOICE DETAILS (Admin)
// PATCH /api/invoices/:id
// ============================================================

export const updateInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { discount, taxRate, deliveryCharge, notes } = req.body;

    const invoice = await Invoice.findByPk(id, { transaction });

    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Scope check
    if (req.user.role !== "super_admin" && req.user.shopId && invoice.shopId !== req.user.shopId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Recalculate totals
    const newDiscount = discount !== undefined ? Number(discount) : Number(invoice.discount);
    const newTaxRate = taxRate !== undefined ? Number(taxRate) : Number(invoice.taxRate);
    const newDeliveryCharge = deliveryCharge !== undefined ? Number(deliveryCharge) : Number(invoice.deliveryCharge);
    const taxAmount = Number(((Number(invoice.subtotal) - newDiscount) * newTaxRate / 100).toFixed(2));
    const total = calculateTotal({
      subtotal: invoice.subtotal,
      discount: newDiscount,
      taxAmount,
      deliveryCharge: newDeliveryCharge,
    });

    await invoice.update(
      {
        ...(discount !== undefined && { discount: newDiscount }),
        ...(taxRate !== undefined && { taxRate: newTaxRate }),
        ...(deliveryCharge !== undefined && { deliveryCharge: newDeliveryCharge }),
        taxAmount,
        total,
        ...(notes !== undefined && { notes }),
      },
      { transaction }
    );

    await transaction.commit();

    const updated = await Invoice.findByPk(id);

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: updated,
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Update Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invoice",
      error: error.message,
    });
  }
};

// ============================================================
// MARK INVOICE AS PAID
// PATCH /api/invoices/:id/pay
// ============================================================

export const payInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { paymentMethod, amount } = req.body;

    const invoice = await Invoice.findByPk(id, { transaction });

    if (!invoice) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Only admins can mark as paid
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Only admins can update invoice payment",
      });
    }

    // Scope check (super admins can update any invoice)
    if (req.user.role !== "super_admin" && req.user.shopId && invoice.shopId !== req.user.shopId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (invoice.paymentStatus === "Paid") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Invoice is already fully paid",
      });
    }

    const payAmount = Number(amount) || Number(invoice.total) - Number(invoice.amountPaid);
    const newAmountPaid = Number(invoice.amountPaid) + payAmount;
    const total = Number(invoice.total);

    let newStatus = "Partial";
    if (newAmountPaid >= total) {
      newStatus = "Paid";
    }

    await invoice.update(
      {
        amountPaid: Number(newAmountPaid.toFixed(2)),
        paymentStatus: newStatus,
        paymentMethod: paymentMethod || invoice.paymentMethod,
        paidDate: newStatus === "Paid" ? new Date().toISOString().split("T")[0] : invoice.paidDate,
      },
      { transaction }
    );

    // Also update the linked order's payment status
    if (invoice.orderId) {
      await Order.update(
        {
          payment_status:
            newStatus === "Paid"
              ? "paid"
              : newStatus === "Partial"
              ? "partial"
              : "unpaid",
        },
        {
          where: { id: invoice.orderId },
          transaction,
        }
      );
    }

    await transaction.commit();

    const updated = await Invoice.findByPk(id);

    // Send payment confirmation email (non-blocking)
    if (updated.customerEmail) {
      sendInvoiceEmail(updated.toJSON()).catch((err) => {
        console.error("Payment confirmation email failed (non-blocking):", err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice payment updated",
      data: updated,
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Pay Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invoice payment",
      error: error.message,
    });
  }
};

// ============================================================
// GET INVOICE STATS (Admin Dashboard)
// GET /api/invoices/stats
// ============================================================

export const getInvoiceStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.role !== "super_admin" && req.user.shopId) {
      where.shopId = req.user.shopId;
    }

    const allInvoices = await Invoice.findAll({ where });

    const totalInvoices = allInvoices.length;
    const totalAmount = allInvoices.reduce(
      (sum, inv) => sum + Number(inv.total || 0),
      0
    );
    const totalPaid = allInvoices
      .filter((inv) => inv.paymentStatus === "Paid")
      .reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const totalUnpaid = allInvoices
      .filter((inv) => inv.paymentStatus === "Unpaid" || inv.paymentStatus === "Partial")
      .reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid || 0)), 0);

    const paidCount = allInvoices.filter(
      (inv) => inv.paymentStatus === "Paid"
    ).length;
    const unpaidCount = allInvoices.filter(
      (inv) => inv.paymentStatus === "Unpaid"
    ).length;
    const partialCount = allInvoices.filter(
      (inv) => inv.paymentStatus === "Partial"
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        totalAmount: Number(totalAmount.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalUnpaid: Number(totalUnpaid.toFixed(2)),
        paidCount,
        unpaidCount,
        partialCount,
      },
    });
  } catch (error) {
    console.error("Get Invoice Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice stats",
      error: error.message,
    });
  }
};
