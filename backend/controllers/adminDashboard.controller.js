import { Op, fn, col } from "sequelize";

import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";
import Payment from "../models/Payment.js";
import Purchase from "../models/Purchase.js";
import Payroll from "../models/Payroll.js";
import InventoryItem from "../models/InventoryItem.js";
import Supplier from "../models/Supplier.js";
import Attendance from "../models/Attendance.js";

// =====================================================
// HELPERS
// =====================================================

const toNumber = (value) => Number(value || 0);

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getEndOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

// =====================================================
// GET ADMIN DASHBOARD
// GET /api/admin/dashboard
// =====================================================

export const getAdminDashboard = async (req, res) => {
  try {
    // =================================================
    // GET SHOP ID
    // =================================================

    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop ID not found",
      });
    }

    const todayStart = getStartOfToday();
    const todayEnd = getEndOfToday();

    // =================================================
    // FETCH ALL DATA IN PARALLEL
    // =================================================

    const [
      // COUNTS
      totalEmployees,
      totalSuppliers,
      totalInventoryItems,
      totalOrders,

      // CUSTOMERS
      totalCustomers,
      newCustomersToday,
      recentCustomers,

      // PAYMENTS
      totalCustomerPayments,
      todayCustomerPayments,
      totalSupplierPayments,
      totalSalaryPayments,
      pendingPayments,

      // PURCHASES
      totalPurchaseData,
      purchaseDueData,

      // PAYROLL
      payrollData,

      // INVENTORY
      lowStockItems,

      // RECENT DATA
      recentOrders,
      recentPayments,
      recentPurchases,

      // ORDER STATUS
      orderStatusData,

      // ATTENDANCE
      presentToday,
      absentToday,
    ] = await Promise.all([
      // =================================================
      // TOTAL EMPLOYEES
      // =================================================

      Employee.count({
        where: {
          shop_id: shopId,
        },
      }),

      // =================================================
      // TOTAL SUPPLIERS
      // =================================================

      Supplier.count({
        where: {
          shopId,
        },
      }),

      // =================================================
      // TOTAL INVENTORY ITEMS
      // =================================================

      InventoryItem.count({
        where: {
          shopId,
        },
      }),

      // =================================================
      // TOTAL ORDERS
      // =================================================

      Order.count({
        where: {
          shopId,
        },
      }),

      // =================================================
      // TOTAL CUSTOMERS
      // =================================================

      Customer.count({
        where: {
          shopId,
        },
      }),

      // =================================================
      // NEW CUSTOMERS TODAY
      // =================================================

      Customer.count({
        where: {
          shopId,
          createdAt: {
            [Op.between]: [todayStart, todayEnd],
          },
        },
      }),

      // =================================================
      // RECENT CUSTOMERS
      // =================================================

      Customer.findAll({
        where: {
          shopId,
        },

        attributes: [
          "id",
          "name",
          "phone",
          "email",
          "createdAt",
        ],

        order: [["createdAt", "DESC"]],

        limit: 5,

        raw: true,
      }),

      // =================================================
      // TOTAL CUSTOMER PAYMENTS / REVENUE
      // =================================================

      Payment.sum("amount", {
        where: {
          shopId,
          paymentType: "CUSTOMER",
          status: "Paid",
        },
      }),

      // =================================================
      // TODAY CUSTOMER PAYMENTS / REVENUE
      // =================================================

      Payment.sum("amount", {
        where: {
          shopId,
          paymentType: "CUSTOMER",
          status: "Paid",
          paymentDate: {
            [Op.between]: [todayStart, todayEnd],
          },
        },
      }),

      // =================================================
      // TOTAL SUPPLIER PAYMENTS
      // =================================================

      Payment.sum("amount", {
        where: {
          shopId,
          paymentType: "SUPPLIER",
          status: "Paid",
        },
      }),

      // =================================================
      // TOTAL SALARY PAYMENTS
      // =================================================

      Payment.sum("amount", {
        where: {
          shopId,
          paymentType: "SALARY",
          status: "Paid",
        },
      }),

      // =================================================
      // PENDING PAYMENTS
      // =================================================

      Payment.count({
        where: {
          shopId,
          status: "Pending",
        },
      }),

      // =================================================
      // TOTAL PURCHASE AMOUNT
      // =================================================

      Purchase.sum("totalAmount", {
        where: {
          shopId,
        },
      }),

      // =================================================
      // TOTAL PURCHASE DUE
      // =================================================

      Purchase.sum("dueAmount", {
        where: {
          shopId,
        },
      }),

      // =================================================
      // PAYROLL SUMMARY
      // =================================================

      Payroll.findOne({
        attributes: [
          [
            fn(
              "COALESCE",
              fn("SUM", col("netSalary")),
              0,
            ),
            "totalSalary",
          ],
          [
            fn(
              "COALESCE",
              fn("SUM", col("paidAmount")),
              0,
            ),
            "paidSalary",
          ],
          [
            fn(
              "COALESCE",
              fn("SUM", col("dueAmount")),
              0,
            ),
            "pendingSalary",
          ],
        ],

        where: {
          shopId,
        },

        raw: true,
      }),

      // =================================================
      // LOW STOCK ITEMS
      //
      // Uses quantity <= minimumStock
      // =================================================

      InventoryItem.findAll({
        where: {
          shopId,
          quantity: {
            [Op.lte]: col("minimumStock"),
          },
        },

        attributes: [
          "id",
          "name",
          "quantity",
          "minimumStock",
        ],

        order: [["quantity", "ASC"]],

        limit: 5,

        raw: true,
      }),

      // =================================================
      // RECENT ORDERS
      // =================================================

      Order.findAll({
        where: {
          shopId,
        },

        attributes: [
          "id",
          "totalAmount",
          "status",
          "createdAt",
        ],

        include: [
          {
            model: Customer,
            as: "customer",
            attributes: [
              "id",
              "name",
              "phone",
            ],
          },
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "name",
            ],
          },
        ],

        order: [["createdAt", "DESC"]],

        limit: 5,
      }),

      // =================================================
      // RECENT PAYMENTS
      // =================================================

      Payment.findAll({
        where: {
          shopId,
        },

        attributes: [
          "id",
          "paymentNumber",
          "paymentType",
          "amount",
          "paymentMethod",
          "status",
          "paymentDate",
          "createdAt",
        ],

        order: [["createdAt", "DESC"]],

        limit: 5,

        raw: true,
      }),

      // =================================================
      // RECENT PURCHASES
      // =================================================

      Purchase.findAll({
        where: {
          shopId,
        },

        attributes: [
          "id",
          "invoiceNo",
          "totalAmount",
          "paidAmount",
          "dueAmount",
          "status",
          "purchaseDate",
          "createdAt",
        ],

        order: [["createdAt", "DESC"]],

        limit: 5,

        raw: true,
      }),

      // =================================================
      // ORDER STATUS SUMMARY
      // =================================================

      Order.findAll({
        attributes: [
          "status",
          [
            fn("COUNT", col("id")),
            "count",
          ],
        ],

        where: {
          shopId,
        },

        group: ["status"],

        raw: true,
      }),

      // =================================================
      // PRESENT TODAY
      // =================================================

      Attendance.count({
        where: {
          status: "PRESENT",
          date: {
            [Op.between]: [
              todayStart,
              todayEnd,
            ],
          },
        },

        include: [
          {
            model: Employee,
            as: "employee",
            required: true,
            attributes: [],
            where: {
              shop_id: shopId,
            },
          },
        ],
      }),

      // =================================================
      // ABSENT TODAY
      // =================================================

      Attendance.count({
        where: {
          status: "ABSENT",
          date: {
            [Op.between]: [
              todayStart,
              todayEnd,
            ],
          },
        },

        include: [
          {
            model: Employee,
            as: "employee",
            required: true,
            attributes: [],
            where: {
              shop_id: shopId,
            },
          },
        ],
      }),
    ]);

    // =================================================
    // CALCULATE PAYMENT VALUES
    // =================================================

    const totalRevenue = toNumber(
      totalCustomerPayments,
    );

    const todayRevenue = toNumber(
      todayCustomerPayments,
    );

    const supplierExpenses = toNumber(
      totalSupplierPayments,
    );

    const salaryExpenses = toNumber(
      totalSalaryPayments,
    );

    const totalExpenses =
      supplierExpenses + salaryExpenses;

    const netProfit =
      totalRevenue - totalExpenses;

    // =================================================
    // PURCHASE VALUES
    // =================================================

    const totalPurchases = toNumber(
      totalPurchaseData,
    );

    const purchaseDueAmount = toNumber(
      purchaseDueData,
    );

    // =================================================
    // PAYROLL VALUES
    // =================================================

    const totalSalary = toNumber(
      payrollData?.totalSalary,
    );

    const paidSalary = toNumber(
      payrollData?.paidSalary,
    );

    const pendingSalary = toNumber(
      payrollData?.pendingSalary,
    );

    // =================================================
    // ORDER STATUS SUMMARY
    // =================================================

    const orderSummary = {
      total: totalOrders,
      pending: 0,
      processing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    };

    orderStatusData.forEach((item) => {
      const status = String(
        item.status || "",
      ).toLowerCase();

      const count = toNumber(
        item.count,
      );

      if (status === "pending") {
        orderSummary.pending = count;
      } else if (
        status === "processing" ||
        status === "in_progress"
      ) {
        orderSummary.processing = count;
      } else if (status === "ready") {
        orderSummary.ready = count;
      } else if (
        status === "delivered" ||
        status === "completed"
      ) {
        orderSummary.delivered = count;
      } else if (
        status === "cancelled" ||
        status === "canceled"
      ) {
        orderSummary.cancelled = count;
      }
    });

    // =================================================
    // ACTIVE ORDERS
    // =================================================

    const activeOrders =
      orderSummary.pending +
      orderSummary.processing +
      orderSummary.ready;

    // =================================================
    // RECENT ACTIVITIES
    // =================================================

    const recentActivities = [
      ...recentPayments.map((payment) => ({
        id: `payment-${payment.id}`,
        type: "PAYMENT",
        title: `${payment.paymentType} payment recorded`,
        amount: toNumber(payment.amount),
        status: payment.status,
        date:
          payment.paymentDate ||
          payment.createdAt,
      })),

      ...recentPurchases.map((purchase) => ({
        id: `purchase-${purchase.id}`,
        type: "PURCHASE",
        title: `Purchase ${
          purchase.invoiceNo ||
          `#${purchase.id}`
        } added`,
        amount: toNumber(
          purchase.totalAmount,
        ),
        status: purchase.status,
        date:
          purchase.purchaseDate ||
          purchase.createdAt,
      })),

      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: "ORDER",
        title: `Order #${order.id} created`,
        amount: toNumber(
          order.totalAmount,
        ),
        status: order.status,
        date: order.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 10);

    // =================================================
    // SUCCESS RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        "Admin dashboard data fetched successfully",

      // ===============================================
      // MAIN DASHBOARD SUMMARY
      // ===============================================

      summary: {
        totalRevenue,
        todayRevenue,
        totalExpenses,
        netProfit,
        pendingPayments,
        activeOrders,
      },

      // ===============================================
      // CUSTOMERS
      // ===============================================

      customers: {
        total: totalCustomers,
        newToday: newCustomersToday,
        recent: recentCustomers,
      },

      // ===============================================
      // ORDERS
      // ===============================================

      orders: orderSummary,

      // ===============================================
      // RECENT ORDERS
      //
      // Order ID | Customer | Employee | Amount | Status
      // ===============================================

      recentOrders,

      // ===============================================
      // EMPLOYEE / BUSINESS DATA
      // ===============================================

      business: {
        totalEmployees,
        presentToday,
        absentToday,

        totalSuppliers,

        totalInventoryItems,

        lowStockCount:
          lowStockItems.length,

        totalPurchases,
        purchaseDueAmount,

        totalSalary,
        paidSalary,
        pendingSalary,
      },

      // ===============================================
      // PAYMENT DATA
      // ===============================================

      payments: {
        customerRevenue: totalRevenue,
        supplierPayments:
          supplierExpenses,
        salaryPayments:
          salaryExpenses,
        totalExpenses,
      },

      // ===============================================
      // INVENTORY
      // ===============================================

      lowStockItems,

      // ===============================================
      // RECENT TRANSACTIONS
      // ===============================================

      recentTransactions:
        recentPayments,

      // ===============================================
      // RECENT ACTIVITIES
      // ===============================================

      recentActivities,

      // ===============================================
      // CHARTS
      // ===============================================

      charts: {
        orderStatus: [
          {
            name: "Pending",
            value: orderSummary.pending,
          },
          {
            name: "Processing",
            value:
              orderSummary.processing,
          },
          {
            name: "Ready",
            value: orderSummary.ready,
          },
          {
            name: "Delivered",
            value:
              orderSummary.delivered,
          },
          {
            name: "Cancelled",
            value:
              orderSummary.cancelled,
          },
        ],
      },
    });
  } catch (error) {
    console.error(
      "ADMIN DASHBOARD ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch admin dashboard data",
      error: error.message,
    });
  }
};