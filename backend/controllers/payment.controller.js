import { Op } from "sequelize";
import sequelize from "../config/database.js";

import Payment from "../models/Payment.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import Purchase from "../models/Purchase.js";
import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";

// =====================================================
// HELPER
// =====================================================

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank_Transfer", "Cheque"];

const PAYMENT_TYPES = ["CUSTOMER", "SUPPLIER", "SALARY"];

// =====================================================
// CREATE PAYMENT
// POST /api/payments
// =====================================================

export const createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      paymentType,
      customerId,
      supplierId,
      employeeId,
      orderId,
      purchaseId,
      payrollId,
      amount,
      paymentMethod,
      transactionId,
      referenceNumber,
      paymentDate,
      description,
      remarks,
    } = req.body;

    const shopId = req.user?.shopId;
    const createdBy = req.user?.id || null;

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

    if (!paymentType) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment type is required",
      });
    }

    if (!PAYMENT_TYPES.includes(paymentType)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid payment type",
      });
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0",
      });
    }

    if (!paymentMethod) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // =================================================
    // SHOP
    // =================================================

    const shop = await Shop.findByPk(shopId, {
      transaction,
    });

    if (!shop) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // =================================================
    // CUSTOMER VALIDATION
    // =================================================

    if (paymentType === "CUSTOMER") {
      if (!customerId) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Customer is required",
        });
      }

      const customer = await Customer.findOne({
        where: {
          id: customerId,
          shopId,
        },
        transaction,
      });

      if (!customer) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    // =================================================
    // SUPPLIER VALIDATION
    // =================================================

    if (paymentType === "SUPPLIER") {
      if (!supplierId) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Supplier is required",
        });
      }

      const supplier = await Supplier.findOne({
        where: {
          id: supplierId,
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
    }

    // =================================================
    // EMPLOYEE VALIDATION
    // =================================================

    if (paymentType === "SALARY") {
      if (!employeeId) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: "Employee is required",
        });
      }

      const employee = await User.findByPk(employeeId, {
        transaction,
      });

      if (!employee) {
        await transaction.rollback();

        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
    }

    // =================================================
    // PAYMENT NUMBER
    // =================================================

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

    // =================================================
    // CREATE PAYMENT
    // =================================================

    const payment = await Payment.create(
      {
        shopId,

        paymentNumber,

        paymentType,

        customerId: customerId || null,

        supplierId: supplierId || null,

        employeeId: employeeId || null,

        orderId: orderId || null,

        purchaseId: purchaseId || null,

        payrollId: payrollId || null,

        amount: paymentAmount,

        paymentMethod,

        status: "Paid",

        transactionId: transactionId || null,

        referenceNumber: referenceNumber || null,

        paymentDate: paymentDate || new Date(),

        description: description || null,

        remarks: remarks || null,

        createdBy,
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Create Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE SUPPLIER PAYMENT
// POST /api/payments/supplier
// =====================================================
//
// Used for paying an existing purchase due.
//
// Example:
//
// Purchase = 10,000
// Already Paid = 4,000
// Due = 6,000
//
// New Payment = 3,000
//
// New Paid = 7,000
// New Due = 3,000
// Status = PARTIAL
//
// =====================================================

export const createSupplierPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      supplierId,
      purchaseId,
      amount,
      paymentMethod,
      transactionId,
      referenceNumber,
      paymentDate,
      description,
      remarks,
    } = req.body;

    const shopId = req.user?.shopId;
    const createdBy = req.user?.id || null;

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

    if (!purchaseId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Purchase is required",
      });
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0",
      });
    }

    if (!paymentMethod) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // =================================================
    // SUPPLIER
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
    // PURCHASE
    // =================================================

    const purchase = await Purchase.findOne({
      where: {
        id: purchaseId,
        shopId,
        supplierId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!purchase) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Purchase not found for this supplier",
      });
    }

    // =================================================
    // CANCELLED PURCHASE
    // =================================================

    if (purchase.status === "CANCELLED") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Cannot make payment for a cancelled purchase",
      });
    }

    // =================================================
    // CURRENT DUE
    // =================================================

    const currentDue = Number(purchase.dueAmount || 0);

    if (currentDue <= 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "This purchase has no due amount",
      });
    }

    // =================================================
    // PAYMENT CANNOT EXCEED DUE
    // =================================================

    if (paymentAmount > currentDue) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment amount cannot be greater than due amount",
        dueAmount: currentDue,
        requestedAmount: paymentAmount,
      });
    }

    // =================================================
    // PAYMENT NUMBER
    // =================================================

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

    // =================================================
    // CREATE PAYMENT
    // =================================================

    const payment = await Payment.create(
      {
        shopId,

        paymentNumber,

        paymentType: "SUPPLIER",

        supplierId,

        purchaseId,

        amount: paymentAmount,

        paymentMethod,

        status: "Paid",

        transactionId: transactionId || null,

        referenceNumber: referenceNumber || null,

        paymentDate: paymentDate || new Date(),

        description:
          description ||
          `Supplier payment for purchase ${purchase.invoiceNo || purchase.id}`,

        remarks: remarks || null,

        createdBy,
      },
      {
        transaction,
      },
    );

    // =================================================
    // UPDATE PURCHASE PAYMENT
    // =================================================

    const previousPaidAmount = Number(purchase.paidAmount || 0);

    const newPaidAmount = Number(
      (previousPaidAmount + paymentAmount).toFixed(2),
    );

    const totalAmount = Number(purchase.totalAmount || 0);

    const newDueAmount = Number((totalAmount - newPaidAmount).toFixed(2));

    let newStatus = "PARTIAL";

    if (newDueAmount <= 0) {
      newStatus = "PAID";
    } else if (newPaidAmount <= 0) {
      newStatus = "PENDING";
    }

    // =================================================
    // UPDATE PURCHASE
    // =================================================

    await purchase.update(
      {
        paidAmount: newPaidAmount,

        dueAmount: Math.max(newDueAmount, 0),

        status: newStatus,

        updatedBy: createdBy,
      },
      {
        transaction,
      },
    );

    // =================================================
    // COMMIT
    // =================================================

    await transaction.commit();

    return res.status(201).json({
      success: true,

      message: "Supplier payment recorded successfully",

      data: {
        payment,

        purchase: {
          id: purchase.id,

          invoiceNo: purchase.invoiceNo,

          totalAmount,

          previousPaidAmount,

          paymentAmount,

          paidAmount: newPaidAmount,

          dueAmount: Math.max(newDueAmount, 0),

          status: newStatus,
        },
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Create Supplier Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create supplier payment",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE EMPLOYEE SALARY PAYMENT
// POST /api/payments/employee
// =====================================================

export const createEmployeePayment = async (req, res) => {
  const transaction = await Payment.sequelize.transaction();

  try {
    const {
      employeeId,
      payrollId,
      amount,
      paymentMethod,
      transactionId,
      referenceNumber,
      description,
      remarks,
      paymentDate,
    } = req.body;

    const shopId = req.user.shopId;
    const createdBy = req.user.id;

    // =================================================
    // VALIDATION
    // =================================================

    if (!employeeId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Employee is required",
      });
    }

    if (!payrollId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payroll is required",
      });
    }

    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required",
      });
    }

    if (!paymentMethod) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    // =================================================
    // CHECK EMPLOYEE
    //
    // Your Employee model uses shop_id
    // =================================================

    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        shop_id: shopId,
      },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // =================================================
    // CHECK PAYROLL
    // =================================================

    const payroll = await Payroll.findOne({
      where: {
        id: payrollId,
        shopId,
        employeeId,
      },
      transaction,
    });

    if (!payroll) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Payroll not found for this employee",
      });
    }

    // =================================================
    // CHECK PAYROLL STATUS
    // =================================================

    if (payroll.status === "CANCELLED") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Cancelled payroll cannot be paid",
      });
    }

    if (payroll.status === "PAID") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "This payroll is already fully paid",
      });
    }

    // =================================================
    // CHECK DUE AMOUNT
    // =================================================

    const currentDueAmount = Number(payroll.dueAmount) || 0;

    if (currentDueAmount <= 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "No salary payment is due",
      });
    }

    // =================================================
    // PREVENT OVERPAYMENT
    // =================================================

    if (paymentAmount > currentDueAmount) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: `Payment amount cannot be greater than remaining salary ₹${currentDueAmount}`,
      });
    }

    // =================================================
    // GENERATE PAYMENT NUMBER
    // =================================================

    const lastPayment = await Payment.findOne({
      where: {
        shopId,
      },
      order: [["id", "DESC"]],
      transaction,
    });

    const paymentNumber = lastPayment
      ? Number(lastPayment.paymentNumber) + 1
      : 1;

    // =================================================
    // CREATE PAYMENT
    // =================================================

    const payment = await Payment.create(
      {
        shopId,

        paymentNumber,

        paymentType: "SALARY",

        employeeId,

        payrollId,

        amount: paymentAmount,

        paymentMethod,

        status: "Paid",

        transactionId: transactionId || null,

        referenceNumber: referenceNumber || null,

        paymentDate: paymentDate || new Date(),

        description: description || `Salary payment for payroll #${payroll.id}`,

        remarks: remarks || null,

        createdBy,
      },
      {
        transaction,
      },
    );

    // =================================================
    // CALCULATE NEW PAYROLL PAYMENT VALUES
    // =================================================

    const oldPaidAmount = Number(payroll.paidAmount) || 0;

    const newPaidAmount = oldPaidAmount + paymentAmount;

    const newDueAmount = Math.max(Number(payroll.netSalary) - newPaidAmount, 0);

    // =================================================
    // CALCULATE PAYROLL STATUS
    // =================================================

    let payrollStatus = "PENDING";

    if (newPaidAmount > 0 && newDueAmount > 0) {
      payrollStatus = "PARTIAL";
    }

    if (newDueAmount <= 0) {
      payrollStatus = "PAID";
    }

    // =================================================
    // UPDATE PAYROLL
    // =================================================

    await payroll.update(
      {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: payrollStatus,
        updatedBy: createdBy,
      },
      {
        transaction,
      },
    );

    // =================================================
    // COMMIT TRANSACTION
    // =================================================

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Employee salary payment saved successfully",

      data: {
        payment,
        payroll: {
          id: payroll.id,
          netSalary: Number(payroll.netSalary),
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: payrollStatus,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Create employee payment error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save employee salary payment",
    });
  }
};

// =====================================================
// GET ALL PAYMENTS
// GET /api/payments
// =====================================================

export const getPayments = async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop information is missing",
      });
    }

    const {
      paymentType,
      paymentMethod,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {
      shopId,
    };

    // =================================================
    // FILTER TYPE
    // =================================================

    if (paymentType) {
      where.paymentType = paymentType;
    }

    // =================================================
    // FILTER METHOD
    // =================================================

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
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
      where.paymentDate = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),
          new Date(`${endDate}T23:59:59`),
        ],
      };
    } else if (startDate) {
      where.paymentDate = {
        [Op.gte]: new Date(`${startDate}T00:00:00`),
      };
    } else if (endDate) {
      where.paymentDate = {
        [Op.lte]: new Date(`${endDate}T23:59:59`),
      };
    }

    // =================================================
    // SEARCH
    // =================================================

    if (search) {
      where[Op.or] = [
        {
          transactionId: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          referenceNumber: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          description: {
            [Op.like]: `%${search}%`,
          },
        },
      ];
    }

    // =================================================
    // PAGINATION
    // =================================================

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const offset = (pageNumber - 1) * limitNumber;

    // =================================================
    // FETCH
    // =================================================

    const { count, rows } = await Payment.findAndCountAll({
      where,

      include: [
        {
          model: Supplier,
          as: "supplier",
          required: false,
        },
        {
          model: Purchase,
          as: "purchase",
          required: false,
        },
      ],

      order: [
        ["paymentDate", "DESC"],
        ["createdAt", "DESC"],
      ],

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
    console.error("Get Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// =====================================================
// GET PAYMENT BY ID
// GET /api/payments/:id
// =====================================================

export const getPaymentById = async (req, res) => {
  try {
    const shopId = req.user?.shopId;
    const { id } = req.params;

    const payment = await Payment.findOne({
      where: {
        id,
        shopId,
      },

      include: [
        {
          model: Supplier,
          as: "supplier",
          required: false,
        },
        {
          model: Purchase,
          as: "purchase",
          required: false,
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get Payment By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

// =====================================================
// GET CUSTOMER PAYMENTS
// GET /api/payments/customer/:customerId
// =====================================================

export const getCustomerPayments = async (req, res) => {
  try {
    const { customerId } = req.params;

    const shopId = req.user?.shopId;

    const payments = await Payment.findAll({
      where: {
        customerId,
        shopId,
        paymentType: "CUSTOMER",
      },

      order: [["paymentDate", "DESC"]],
    });

    const totalPaid = payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );

    return res.status(200).json({
      success: true,

      total: payments.length,

      totalPaid: Number(totalPaid.toFixed(2)),

      data: payments,
    });
  } catch (error) {
    console.error("Get Customer Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer payments",
      error: error.message,
    });
  }
};

// =====================================================
// GET SUPPLIER PAYMENTS
// GET /api/payments/supplier/:supplierId
// =====================================================

export const getSupplierPayments = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const shopId = req.user?.shopId;

    const payments = await Payment.findAll({
      where: {
        supplierId,
        shopId,
        paymentType: "SUPPLIER",
      },

      include: [
        {
          model: Purchase,
          as: "purchase",
          required: false,
        },
      ],

      order: [["paymentDate", "DESC"]],
    });

    const totalPaid = payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );

    return res.status(200).json({
      success: true,

      total: payments.length,

      totalPaid: Number(totalPaid.toFixed(2)),

      data: payments,
    });
  } catch (error) {
    console.error("Get Supplier Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch supplier payments",
      error: error.message,
    });
  }
};

// =====================================================
// GET EMPLOYEE PAYMENTS
// GET /api/payments/employee/:employeeId
// =====================================================

export const getEmployeePayments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const shopId = req.user?.shopId;

    const payments = await Payment.findAll({
      where: {
        employeeId,
        shopId,
        paymentType: "SALARY",
      },

      order: [["paymentDate", "DESC"]],
    });

    const totalPaid = payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );

    return res.status(200).json({
      success: true,

      total: payments.length,

      totalPaid: Number(totalPaid.toFixed(2)),

      data: payments,
    });
  } catch (error) {
    console.error("Get Employee Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee payments",
      error: error.message,
    });
  }
};

// =====================================================
// GET SUBSCRIPTION PAYMENTS
// GET /api/payments/subscriptions
// =====================================================

export const getSubscriptionPayments = async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    const payments = await Payment.findAll({
      where: {
        shopId,
        paymentType: "SUBSCRIPTION",
      },

      order: [["paymentDate", "DESC"]],
    });

    const totalPaid = payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );

    return res.status(200).json({
      success: true,

      total: payments.length,

      totalPaid: Number(totalPaid.toFixed(2)),

      data: payments,
    });
  } catch (error) {
    console.error("Get Subscription Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription payments",
      error: error.message,
    });
  }
};

// =====================================================
// PAYMENT DASHBOARD
// GET /api/payments/dashboard
// =====================================================

export const getPaymentDashboard = async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    const payments = await Payment.findAll({
      where: {
        shopId,
      },
    });

    const totalTransactions = payments.length;

    const totalAmount = payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );

    const customerPayments = payments.filter(
      (payment) => payment.paymentType === "CUSTOMER",
    );

    const supplierPayments = payments.filter(
      (payment) => payment.paymentType === "SUPPLIER",
    );

    const salaryPayments = payments.filter(
      (payment) => payment.paymentType === "SALARY",
    );

    const customerTotal = customerPayments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );

    const supplierTotal = supplierPayments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );

    const salaryTotal = salaryPayments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    );

    // =================================================
    // PAYMENT METHOD TOTALS
    // =================================================

    const cashTotal = payments
      .filter((payment) => payment.paymentMethod === "Cash")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const upiTotal = payments
      .filter((payment) => payment.paymentMethod === "UPI")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const cardTotal = payments
      .filter((payment) => payment.paymentMethod === "Card")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const bankTransferTotal = payments
      .filter((payment) => payment.paymentMethod === "Bank_Transfer")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    return res.status(200).json({
      success: true,

      data: {
        overview: {
          totalTransactions,

          totalAmount: Number(totalAmount.toFixed(2)),

          customerTotal: Number(customerTotal.toFixed(2)),

          supplierTotal: Number(supplierTotal.toFixed(2)),

          salaryTotal: Number(salaryTotal.toFixed(2)),
        },

        paymentMethods: {
          cash: Number(cashTotal.toFixed(2)),

          upi: Number(upiTotal.toFixed(2)),

          card: Number(cardTotal.toFixed(2)),

          bankTransfer: Number(bankTransferTotal.toFixed(2)),
        },

        counts: {
          customer: customerPayments.length,

          supplier: supplierPayments.length,

          salary: salaryPayments.length,
        },
      },
    });
  } catch (error) {
    console.error("Payment Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load payment dashboard",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE PAYMENT
// PUT /api/payments/:id
// =====================================================

export const updatePayment = async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    const { id } = req.params;

    const payment = await Payment.findOne({
      where: {
        id,
        shopId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const allowedFields = [
      "paymentMethod",
      "transactionId",
      "referenceNumber",
      "paymentDate",
      "description",
      "remarks",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (
      updateData.paymentMethod &&
      !PAYMENT_METHODS.includes(updateData.paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    await payment.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Update Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment",
      error: error.message,
    });
  }
};

// =====================================================
// CANCEL PAYMENT
// PATCH /api/payments/:id/cancel
// =====================================================

export const cancelPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const shopId = req.user?.shopId;

    const { id } = req.params;

    const payment = await Payment.findOne({
      where: {
        id,
        shopId,
      },

      transaction,

      lock: transaction.LOCK.UPDATE,
    });

    if (!payment) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status === "Cancelled") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment is already cancelled",
      });
    }

    // =================================================
    // SUPPLIER PAYMENT
    // =================================================
    //
    // If supplier payment is cancelled,
    // purchase paid/due must be recalculated.
    //
    // =================================================

    if (payment.paymentType === "SUPPLIER" && payment.purchaseId) {
      const purchase = await Purchase.findOne({
        where: {
          id: payment.purchaseId,

          shopId,
        },

        transaction,

        lock: transaction.LOCK.UPDATE,
      });

      if (purchase) {
        const paidAmount = Number(purchase.paidAmount || 0);

        const paymentAmount = Number(payment.amount || 0);

        const newPaidAmount = Math.max(paidAmount - paymentAmount, 0);

        const totalAmount = Number(purchase.totalAmount || 0);

        const newDueAmount = Math.max(totalAmount - newPaidAmount, 0);

        let newStatus = "PENDING";

        if (newPaidAmount >= totalAmount) {
          newStatus = "PAID";
        } else if (newPaidAmount > 0) {
          newStatus = "PARTIAL";
        }

        await purchase.update(
          {
            paidAmount: newPaidAmount,

            dueAmount: newDueAmount,

            status: newStatus,

            updatedBy: req.user?.id || null,
          },
          {
            transaction,
          },
        );
      }
    }

    // =================================================
    // CANCEL PAYMENT
    // =================================================

    await payment.update(
      {
        status: "Cancelled",
      },
      {
        transaction,
      },
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Payment cancelled successfully",
      data: payment,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Cancel Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel payment",
      error: error.message,
    });
  }
};

// =====================================================
// PAYMENT REPORT
// GET /api/payments/report
// =====================================================

export const getPaymentReport = async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    const { startDate, endDate, paymentType } = req.query;

    const where = {
      shopId,
      status: "Paid",
    };

    // =================================================
    // PAYMENT TYPE
    // =================================================

    if (paymentType) {
      where.paymentType = paymentType;
    }

    // =================================================
    // DATE FILTER
    // =================================================

    if (startDate && endDate) {
      where.paymentDate = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),

          new Date(`${endDate}T23:59:59`),
        ],
      };
    } else if (startDate) {
      where.paymentDate = {
        [Op.gte]: new Date(`${startDate}T00:00:00`),
      };
    } else if (endDate) {
      where.paymentDate = {
        [Op.lte]: new Date(`${endDate}T23:59:59`),
      };
    }

    const payments = await Payment.findAll({
      where,

      include: [
        {
          model: Supplier,
          as: "supplier",
          required: false,
        },

        {
          model: Purchase,
          as: "purchase",
          required: false,
        },
      ],

      order: [["paymentDate", "DESC"]],
    });

    // =================================================
    // INCOME
    // =================================================

    const totalIncome = payments
      .filter((payment) => payment.paymentType === "CUSTOMER")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    // =================================================
    // SUPPLIER EXPENSE
    // =================================================

    const totalSupplierExpense = payments
      .filter((payment) => payment.paymentType === "SUPPLIER")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    // =================================================
    // SALARY EXPENSE
    // =================================================

    const totalSalaryExpense = payments
      .filter((payment) => payment.paymentType === "SALARY")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const totalExpense = totalSupplierExpense + totalSalaryExpense;

    const netAmount = totalIncome - totalExpense;

    return res.status(200).json({
      success: true,

      data: {
        totalIncome: Number(totalIncome.toFixed(2)),

        totalSupplierExpense: Number(totalSupplierExpense.toFixed(2)),

        totalSalaryExpense: Number(totalSalaryExpense.toFixed(2)),

        totalExpense: Number(totalExpense.toFixed(2)),

        netAmount: Number(netAmount.toFixed(2)),

        totalTransactions: payments.length,

        payments,
      },
    });
  } catch (error) {
    console.error("Payment Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate payment report",
      error: error.message,
    });
  }
};
