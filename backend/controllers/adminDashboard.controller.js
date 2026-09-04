import { Op, fn, col } from "sequelize";

import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";
import Payment from "../models/Payment.js";
import Purchase from "../models/Purchase.js";
import Payroll from "../models/Payroll.js";
import InventoryItem from "../models/InventoryItem.js";
import Supplier from "../models/Supplier.js";
import Attendance from "../models/Attendance.js";
import Service from "../models/Service.js";
import Task from "../models/Tasks.js";

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
      totalEmployees,
      totalSuppliers,
      totalInventoryItems,
      totalOrders,
      todayOrders,

      totalCustomers,
      newCustomersToday,
      recentCustomers,

      totalCustomerPayments,
      todayCustomerPayments,
      totalSupplierPayments,
      totalSalaryPayments,
      pendingPayments,

      totalPurchaseData,
      purchaseDueData,

      payrollData,

      lowStockItems,

      recentOrders,
      recentPayments,
      recentPurchases,

      orderStatusData,

      presentToday,
      absentToday,
      lateToday,

      // NEW: Revenue from delivered orders
      deliveredOrderRevenue,
      todayDeliveredRevenue,

      // NEW: Recent 30 days of orders for chart
      recentOrderData,

      // NEW: Employee tasks (pending/in-progress)
      employeeTaskData,

      // NEW: Top services by order count
      topServiceData,
    ] = await Promise.all([
      // =================================================
      // TOTAL EMPLOYEES
      // =================================================

      Employee.count({
        where: { shop_id: shopId },
      }),

      // =================================================
      // TOTAL SUPPLIERS
      // =================================================

      Supplier.count({
        where: { shopId },
      }),

      // =================================================
      // TOTAL INVENTORY ITEMS
      // =================================================

      InventoryItem.count({
        where: { shopId },
      }),

      // =================================================
      // TOTAL ORDERS
      // =================================================

      Order.count({
        where: { shop_id: shopId },
      }),

      // =================================================
      // TODAY'S ORDERS
      // =================================================

      Order.count({
        where: {
          shop_id: shopId,
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        },
      }),

      // =================================================
      // TOTAL CUSTOMERS
      // =================================================

      Customer.count({
        where: { shopId },
      }),

      // =================================================
      // NEW CUSTOMERS TODAY
      // =================================================

      Customer.count({
        where: {
          shopId,
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        },
      }),

      // =================================================
      // RECENT CUSTOMERS
      // =================================================

      Customer.findAll({
        where: { shopId },
        attributes: ["id", "name", "phone", "email", "createdAt"],
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
          paymentDate: { [Op.between]: [todayStart, todayEnd] },
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
        where: { shopId },
      }),

      // =================================================
      // TOTAL PURCHASE DUE
      // =================================================

      Purchase.sum("dueAmount", {
        where: { shopId },
      }),

      // =================================================
      // PAYROLL SUMMARY
      // =================================================

      Payroll.findOne({
        attributes: [
          [fn("COALESCE", fn("SUM", col("netSalary")), 0), "totalSalary"],
          [fn("COALESCE", fn("SUM", col("paidAmount")), 0), "paidSalary"],
          [fn("COALESCE", fn("SUM", col("dueAmount")), 0), "pendingSalary"],
        ],
        where: { shopId },
        raw: true,
      }),

      // =================================================
      // LOW STOCK ITEMS
      // =================================================

      InventoryItem.findAll({
        where: {
          shopId,
          currentStock: { [Op.lte]: col("minStock") },
          isDeleted: false,
        },
        attributes: [
          "id", "name", "category", "unit",
          "currentStock", "minStock", "status",
        ],
        order: [["currentStock", "ASC"]],
        limit: 5,
        raw: true,
      }),

      // =================================================
      // RECENT ORDERS
      // =================================================

      Order.findAll({
        where: { shop_id: shopId },
        attributes: ["id", "total_amount", "status", "createdAt", "pickup_time", "delivery_date", "employee_id"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name", "phone"],
          },
          {
            model: Employee,
            as: "employee",
            attributes: ["id", "name"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),

      // =================================================
      // RECENT PAYMENTS
      // =================================================

      Payment.findAll({
        where: { shopId },
        attributes: [
          "id", "paymentNumber", "paymentType", "amount",
          "paymentMethod", "status", "paymentDate", "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
        raw: true,
      }),

      // =================================================
      // RECENT PURCHASES
      // =================================================

      Purchase.findAll({
        where: { shopId },
        attributes: [
          "id", "invoiceNo", "totalAmount", "paidAmount",
          "dueAmount", "status", "purchaseDate", "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
        raw: true,
      }),

      // =================================================
      // ORDER STATUS SUMMARY
      // =================================================

      Order.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        where: { shop_id: shopId },
        group: ["status"],
        raw: true,
      }),

      // =================================================
      // PRESENT TODAY
      // =================================================

      Attendance.count({
        where: {
          status: "PRESENT",
          date: { [Op.between]: [todayStart, todayEnd] },
        },
        include: [
          {
            model: Employee,
            as: "employee",
            required: true,
            attributes: [],
            where: { shop_id: shopId },
          },
        ],
      }),

      // =================================================
      // ABSENT TODAY
      // =================================================

      Attendance.count({
        where: {
          status: "ABSENT",
          date: { [Op.between]: [todayStart, todayEnd] },
        },
        include: [
          {
            model: Employee,
            as: "employee",
            required: true,
            attributes: [],
            where: { shop_id: shopId },
          },
        ],
      }),

      // =================================================
      // LATE TODAY
      // =================================================

      Attendance.count({
        where: {
          status: "LATE",
          date: { [Op.between]: [todayStart, todayEnd] },
        },
        include: [
          {
            model: Employee,
            as: "employee",
            required: true,
            attributes: [],
            where: { shop_id: shopId },
          },
        ],
      }).catch(() => 0),

      // =================================================
      // TOTAL REVENUE FROM DELIVERED ORDERS
      // =================================================

      Order.sum("total_amount", {
        where: {
          shop_id: shopId,
          status: "delivered",
        },
      }),

      // =================================================
      // TODAY'S REVENUE FROM DELIVERED ORDERS
      // =================================================

      Order.sum("total_amount", {
        where: {
          shop_id: shopId,
          status: "delivered",
          delivery_time: { [Op.between]: [todayStart, todayEnd] },
        },
      }).catch(() => 0),

      // =================================================
      // RECENT 30 DAYS ORDERS (for revenue chart)
      // =================================================

      Order.findAll({
        where: {
          shop_id: shopId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          status: { [Op.ne]: "cancelled" },
        },
        attributes: ["id", "total_amount", "status", "createdAt"],
        order: [["createdAt", "ASC"]],
        raw: true,
      }),

      // =================================================
      // EMPLOYEE TASKS (pending/in-progress only)
      // =================================================

      Task.findAll({
        where: {
          status: { [Op.in]: ["pending", "in_progress"] },
        },
        attributes: [
          "id", "task_type", "status", "employee_id", "order_id", "createdAt",
        ],
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: ["id", "name"],
            where: { shop_id: shopId },
            required: true,
          },
        ],
        order: [["createdAt", "DESC"]],
        raw: true,
      }),

      // =================================================
      // TOP SERVICES (by order item usage)
      // =================================================

      OrderItem.findAll({
        attributes: [
          "serviceId",
          [fn("COUNT", col("OrderItem.id")), "orderCount"],
          [fn("SUM", col("OrderItem.quantity")), "totalQuantity"],
        ],
        include: [
          {
            model: Order,
            as: "order",
            attributes: [],
            where: {
              shop_id: shopId,
              status: { [Op.ne]: "cancelled" },
            },
            required: true,
          },
          {
            model: Service,
            as: "service",
            attributes: ["id", "serviceName"],
            required: true,
          },
        ],
        group: ["serviceId", "service.id", "service.serviceName"],
        order: [[fn("COUNT", col("OrderItem.id")), "DESC"]],
        limit: 5,
        raw: true,
      }),
    ]);

    // =================================================
    // CALCULATE PAYMENT VALUES
    // =================================================

    // Use delivered order revenue as the primary revenue source
    // (this captures ALL revenue, not just explicitly recorded payments)
    const totalRevenueFromOrders = toNumber(deliveredOrderRevenue);
    const todayRevenueFromOrders = toNumber(todayDeliveredRevenue);

    // Also consider recorded payments
    const totalRevenueFromPayments = toNumber(totalCustomerPayments);
    const todayRevenueFromPayments = toNumber(todayCustomerPayments);

    // Take the higher of order-based or payment-based revenue
    const totalRevenue = Math.max(totalRevenueFromOrders, totalRevenueFromPayments);
    const todayRevenue = Math.max(todayRevenueFromOrders, todayRevenueFromPayments);

    const supplierExpenses = toNumber(totalSupplierPayments);
    const salaryExpenses = toNumber(totalSalaryPayments);
    const totalExpenses = supplierExpenses + salaryExpenses;
    const netProfit = totalRevenue - totalExpenses;

    // =================================================
    // PURCHASE VALUES
    // =================================================

    const totalPurchases = toNumber(totalPurchaseData);
    const purchaseDueAmount = toNumber(purchaseDueData);

    // =================================================
    // PAYROLL VALUES
    // =================================================

    const totalSalary = toNumber(payrollData?.totalSalary);
    const paidSalary = toNumber(payrollData?.paidSalary);
    const pendingSalary = toNumber(payrollData?.pendingSalary);

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
      const status = String(item.status || "").toLowerCase();
      const count = Number(item.count || 0);

      switch (status) {
        case "pending":
          orderSummary.pending += count;
          break;
        case "picked_up":
        case "processing":
        case "in_progress":
          orderSummary.processing += count;
          break;
        case "ready_for_delivery":
        case "out_for_delivery":
          orderSummary.ready += count;
          break;
        case "delivered":
        case "completed":
          orderSummary.delivered += count;
          break;
        case "cancelled":
        case "canceled":
          orderSummary.cancelled += count;
          break;
        default:
          break;
      }
    });

    // =================================================
    // ACTIVE ORDERS
    // =================================================

    const activeOrders =
      orderSummary.pending + orderSummary.processing + orderSummary.ready;

    // =================================================
    // PICKUPS AND DELIVERIES
    // =================================================

    const pendingOrders = recentOrders.filter(
      (o) => o.status === "pending",
    );

    const readyOrders = recentOrders.filter(
      (o) =>
        o.status === "ready_for_delivery" ||
        o.status === "out_for_delivery",
    );

    const pickups = pendingOrders.slice(0, 5).map((o) => ({
      id: o.id,
      customer: o.customer?.name || `Order #${o.id}`,
      time: o.pickup_time || "—",
    }));

    const deliveries = readyOrders.slice(0, 5).map((o) => ({
      id: o.id,
      customer: o.customer?.name || `Order #${o.id}`,
      time: o.delivery_date
        ? new Date(o.delivery_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })
        : "—",
    }));

    // =================================================
    // EMPLOYEE TASKS AGGREGATION
    // =================================================

    const taskMap = {};
    employeeTaskData.forEach((task) => {
      const empName = task["employee.name"] || "Employee";
      const empId = task.employee_id;
      if (!taskMap[empId]) {
        taskMap[empId] = { name: empName, orders: 0 };
      }
      taskMap[empId].orders += 1;
    });

    const employeeTasks = Object.values(taskMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);

    // =================================================
    // TOP SERVICES
    // =================================================

    const topServices = topServiceData.map((item) => ({
      id: item.serviceId,
      name: item["service.serviceName"] || "Unknown Service",
      orderCount: toNumber(item.orderCount),
      totalQuantity: toNumber(item.totalQuantity),
    }));

    // =================================================
    // REVENUE CHART DATA (last 7 days)
    // =================================================

    const buildRevenueChart = (days, ordersData) => {
      const now = new Date();
      const buckets = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const key = d.toDateString();
        const label =
          days <= 7
            ? d.toLocaleDateString("en-US", { weekday: "short" })
            : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

        buckets.push({ key, label, value: 0 });
      }

      const bucketMap = new Map(buckets.map((b) => [b.key, b]));

      ordersData.forEach((order) => {
        if (order.status === "cancelled") return;
        const d = new Date(order.createdAt);
        d.setHours(0, 0, 0, 0);
        const bucket = bucketMap.get(d.toDateString());
        if (bucket) {
          bucket.value += Number(order.total_amount) || 0;
        }
      });

      return buckets.map(({ label, value }) => ({ label, value }));
    };

    const revenue = {
      daily: buildRevenueChart(7, recentOrderData),
      weekly: buildRevenueChart(4, recentOrderData.map((o) => {
        // Group by week
        const d = new Date(o.createdAt);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return { ...o, createdAt: weekStart.toISOString() };
      })),
      monthly: (() => {
        // Build last 6 months
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            key: `${d.getFullYear()}-${d.getMonth()}`,
            label: d.toLocaleDateString("en-IN", { month: "short" }),
            value: 0,
          });
        }
        const monthMap = new Map(months.map((m) => [m.key, m]));

        recentOrderData.forEach((order) => {
          if (order.status === "cancelled") return;
          const d = new Date(order.createdAt);
          const mKey = `${d.getFullYear()}-${d.getMonth()}`;
          const bucket = monthMap.get(mKey);
          if (bucket) {
            bucket.value += Number(order.total_amount) || 0;
          }
        });

        return months.map(({ label, value }) => ({ label, value }));
      })(),
    };

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
        date: payment.paymentDate || payment.createdAt,
      })),

      ...recentPurchases.map((purchase) => ({
        id: `purchase-${purchase.id}`,
        type: "PURCHASE",
        title: `Purchase ${purchase.invoiceNo || `#${purchase.id}`} added`,
        amount: toNumber(purchase.totalAmount),
        status: purchase.status,
        date: purchase.purchaseDate || purchase.createdAt,
      })),

      ...recentOrders.slice(0, 5).map((order) => ({
        id: `order-${order.id}`,
        type: "ORDER",
        title: `Order #${order.id} created`,
        amount: toNumber(order.total_amount),
        status: order.status,
        date: order.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // =================================================
    // SUCCESS RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Admin dashboard data fetched successfully",

      // ===============================================
      // MAIN DASHBOARD SUMMARY
      // ===============================================

      summary: {
        totalOrders,
        todayOrders,
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
      // ===============================================

      recentOrders: recentOrders.slice(0, 5),

      // ===============================================
      // EMPLOYEE / BUSINESS DATA
      // ===============================================

      business: {
        totalEmployees,
        presentToday,
        absentToday,
        totalSuppliers,
        totalInventoryItems,
        lowStockCount: lowStockItems.length,
        totalPurchases,
        purchaseDueAmount,
        totalSalary,
        paidSalary,
        pendingSalary,
      },

      // ===============================================
      // ATTENDANCE (used by dashboard)
      // ===============================================

      attendance: {
        present: toNumber(presentToday),
        absent: toNumber(absentToday),
        late: toNumber(lateToday),
      },

      // ===============================================
      // EMPLOYEE TASKS
      // ===============================================

      employeeTasks,

      // ===============================================
      // PICKUPS & DELIVERIES
      // ===============================================

      pickups,
      deliveries,

      // ===============================================
      // PAYMENT DATA
      // ===============================================

      payments: {
        customerRevenue: totalRevenue,
        supplierPayments: supplierExpenses,
        salaryPayments: salaryExpenses,
        totalExpenses,
      },

      // ===============================================
      // REVENUE CHART DATA
      // ===============================================

      revenue,

      // ===============================================
      // TOP SERVICES
      // ===============================================

      topServices,

      // ===============================================
      // INVENTORY
      // ===============================================

      lowStockItems,

      // ===============================================
      // RECENT TRANSACTIONS
      // ===============================================

      recentTransactions: recentPayments,

      // ===============================================
      // RECENT ACTIVITIES
      // ===============================================

      recentActivities,

      // ===============================================
      // CHARTS
      // ===============================================

      charts: {
        orderStatus: [
          { name: "Pending", value: orderSummary.pending },
          { name: "Processing", value: orderSummary.processing },
          { name: "Ready", value: orderSummary.ready },
          { name: "Delivered", value: orderSummary.delivered },
          { name: "Cancelled", value: orderSummary.cancelled },
        ],
      },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard data",
      error: error.message,
    });
  }
};
