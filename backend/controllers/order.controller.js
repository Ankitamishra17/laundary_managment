import { Op } from "sequelize";
import sequelize from "../config/database.js";

import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Customer from "../models/Customer.js";
import Shop from "../models/Shop.js";
import Service from "../models/Service.js";
import Employee from "../models/Employee.js";
import Task from "../models/Tasks.js";
import { notifyShopAdmins, notifyCustomer } from "./notification.controller.js";
import { getShopPlan, countShopOrdersThisMonth } from "../utils/subscription.js";

const STATUS_LABELS = {
  pending: "Pending",
  picked_up: "Picked Up",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const VALID_STATUSES = [
  "pending",
  "picked_up",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const VALID_PAYMENT_STATUSES = ["paid", "unpaid", "partial"];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// The Customer record belonging to the logged-in user (users table)
async function getCustomerForUser(userId) {
  return Customer.findOne({ where: { userId } });
}

const ORDER_INCLUDES = [
  { model: OrderItem, as: "items" },
  {
    model: Shop,
    as: "shop",
    attributes: ["id", "name", "shopCode", "city", "address", "phone"],
  },
  {
    model: Task,
    as: "tasks",
    attributes: ["id", "task_type", "status", "scheduled_time", "started_at", "completed_at", "employee_id", "notes"],
    required: false,
  },
];

// ============================================================
// CUSTOMER — place a new order
// Customers may order from their linked laundry (account shopId) or
// pick any active laundry at order time (body shopId). Unlinked
// accounts are automatically linked to the chosen shop after the
// first order. Order lines carry an optional clothes label.
// POST /api/orders   { shopId, pickupDate, pickupTime, pickupAddress,
//                      deliveryAddress, deliveryDate, deliveryNote,
//                      items: [{ serviceId, quantity, itemLabel }] }
// ============================================================
export const createOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      shopId: bodyShopId,
      pickupDate,
      pickupTime,
      pickupAddress,
      deliveryAddress,
      deliveryDate,
      deliveryNote,
      items,
    } = req.body;

    // The laundry to order from: the customer's linked laundry, or — for
    // accounts that haven't ordered yet — WashFlow's first active laundry.
    // Customers never pick a laundry themselves; the order always belongs to
    // the WashFlow business context. The resolved shop is validated below,
    // so an order can only go to an active, subscribed shop.
    let shopId = Number(bodyShopId) || req.user.shopId;

    if (!shopId) {
      const defaultShop = await Shop.findOne({
        where: { isActive: true, subscriptionStatus: "Active" },
        order: [["createdAt", "ASC"]],
      });
      shopId = defaultShop ? defaultShop.id : null;
    }

    if (!shopId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No laundry is available right now. Please check back soon.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Please add at least one service to your order.",
      });
    }

    const customer = await getCustomerForUser(req.user.id);
    if (!customer) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Customer profile not found. Please contact support.",
      });
    }

    const shop = await Shop.findByPk(Number(shopId));
    const shopPlan = await getShopPlan(shop?.id);
    if (!shop || !shopPlan.allowed) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: shopPlan?.message || "Your laundry is not available right now.",
      });
    }

    // Subscription plan cap — enforce the monthly order limit server-side.
    if (shopPlan.limits?.maxMonthlyOrders) {
      const monthCount = await countShopOrdersThisMonth(shop.id);
      if (monthCount >= shopPlan.limits.maxMonthlyOrders) {
        await t.rollback();
        return res.status(403).json({
          success: false,
          message: `Your ${shopPlan.planName} plan allows up to ${shopPlan.limits.maxMonthlyOrders} orders per month. Please contact the platform to upgrade.`,
        });
      }
    }

    // Validate each line against the shop's active catalog
    const serviceIds = [...new Set(items.map((i) => Number(i.serviceId)))];
    const catalog = await Service.findAll({
      where: {
        id: { [Op.in]: serviceIds },
        shopId: shop.id,
        isDeleted: false,
        status: "Active",
      },
    });
    const catalogById = new Map(catalog.map((s) => [Number(s.id), s]));

    const lineItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const service = catalogById.get(Number(item.serviceId));
      if (!service) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "One of the selected services is no longer available.",
        });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = Number(service.price) || 0;
      const lineTotal = price * quantity;

      totalAmount += lineTotal;
      lineItems.push({
        serviceId: service.id,
        name: service.serviceName,
        price,
        quantity,
        lineTotal,
        // Optional clothes label the customer typed, e.g. "Shirt"
        item_label: String(item.itemLabel || "").trim().slice(0, 150) || null,
      });
    }

    // Delivery defaults to the pickup address unless the customer gave a
    // separate delivery address.
    const resolvedDeliveryAddress =
      String(deliveryAddress || "").trim() || String(pickupAddress || "").trim() || null;

    const order = await Order.create(
      {
        customer_id: customer.id,
        shop_id: shop.id,
        status: "pending",
        total_amount: totalAmount,
        payment_status: "unpaid",
        pickup_date: pickupDate || null,
        pickup_time: pickupTime || null,
        pickup_address: String(pickupAddress || "").trim() || null,
        delivery_address: resolvedDeliveryAddress,
        delivery_date: deliveryDate || null,
        delivery_note: String(deliveryNote || "").trim() || null,
      },
      { transaction: t },
    );

    await OrderItem.bulkCreate(
      lineItems.map((line) => ({ ...line, orderId: order.id })),
      { transaction: t },
    );

    // Auto-link the customer to this laundry if their account has no
    // default yet, so future orders default to the same shop.
    if (!customer.shopId || !req.user.shopId) {
      customer.shopId = shop.id;
      await customer.save({ transaction: t });

      if (!req.user.shopId) {
        req.user.shopId = shop.id;
        await req.user.save({ transaction: t });
      }
    }

    await t.commit();

    const created = await Order.findByPk(order.id, {
      include: ORDER_INCLUDES,
    });

    // Let the shop admins know a new order came in.
    await notifyShopAdmins(shop.id, {
      title: "New order received",
      message: `${customer.name} placed order #${order.id} for ${totalAmount.toLocaleString("en-IN")} — pending pickup.`,
      type: "order",
      link: "/admin/orders",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully. We'll pick it up soon!",
      data: created,
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Order Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CUSTOMER — my orders
// GET /api/orders/mine
// ============================================================
export const getMyOrders = async (req, res) => {
  try {
    const customer = await getCustomerForUser(req.user.id);
    if (!customer) {
      return res.status(200).json({ success: true, data: [] });
    }

    const orders = await Order.findAll({
      where: { customer_id: customer.id },
      include: ORDER_INCLUDES,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Get My Orders Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CUSTOMER — one of my orders
// GET /api/orders/:id
// ============================================================
export const getMyOrderById = async (req, res) => {
  try {
    const customer = await getCustomerForUser(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = await Order.findOne({
      where: { id: req.params.id, customer_id: customer.id },
      include: ORDER_INCLUDES,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Get Order Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CUSTOMER — cancel a pending order
// PATCH /api/orders/:id/cancel
// ============================================================
export const cancelMyOrder = async (req, res) => {
  try {
    const customer = await getCustomerForUser(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = await Order.findOne({
      where: { id: req.params.id, customer_id: customer.id },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled.",
      });
    }

    order.status = "cancelled";
    await order.save();

    // Let the shop admins know the order was cancelled.
    await notifyShopAdmins(order.shop_id, {
      title: "Order cancelled",
      message: `Order #${order.id} was cancelled by the customer.`,
      type: "order",
      link: "/admin/orders",
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — all orders of my shop
// GET /api/orders
// ============================================================
// Orders are scoped to the admin's shop. Super admins (no shopId) see every
// shop's orders. A null/undefined shop filter would match `shop_id IS NULL`
// and return nothing — which is exactly why the filter is only applied when
// the account actually has a shop.
export const getShopOrders = async (req, res) => {
  try {
    const { status, payment_status } = req.query;
    const where = {};
    if (req.user.shopId) where.shop_id = req.user.shopId;

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;

    const orders = await Order.findAll({
      where,
      include: [
        ...ORDER_INCLUDES,
        { model: Customer, as: "customer", attributes: ["id", "name", "phone", "address", "city"] },
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Get Shop Orders Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — update order status
// PATCH /api/orders/:id/status   { status }
// ============================================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const where = { id: req.params.id };
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const order = await Order.findOne({ where });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;
    // Note: pickup_time is the customer's preferred pickup time (string) —
    // never overwrite it with a Date here.
    if (status === "delivered") order.delivery_time = new Date().toISOString();

    await order.save();

    // Tell the customer their order moved forward.
    const customer = await Customer.findOne({ where: { id: order.customer_id } });

    if (status === "delivered") {
      await notifyCustomer(customer, {
        title: "Order delivered — Review us!",
        message: `Your order #${order.id} has been delivered! We'd love your feedback — write a review to share your experience.`,
        type: "order",
        link: "/customer/reviews",
      });
    } else {
      await notifyCustomer(customer, {
        title: "Order status updated",
        message: `Your order #${order.id} is now ${STATUS_LABELS[status] || status}.`,
        type: "order",
        link: `/customer/orders/${order.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated.",
      data: order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — update payment status
// PATCH /api/orders/:id/payment   { payment_status }
// ============================================================
export const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status } = req.body;

    if (!VALID_PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Allowed: ${VALID_PAYMENT_STATUSES.join(", ")}`,
      });
    }

    const where = { id: req.params.id };
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const order = await Order.findOne({ where });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.payment_status = payment_status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated.",
      data: order,
    });
  } catch (error) {
    console.error("Update Payment Status Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — quick order stats for my shop
// GET /api/orders/stats
// ============================================================
export const getOrderStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const counts = await Promise.all(
      VALID_STATUSES.map(async (status) => ({
        status,
        count: await Order.count({ where: { ...where, status } }),
      })),
    );

    const totalOrders = await Order.count({ where });

    return res.status(200).json({
      success: true,
      data: { totalOrders, byStatus: counts },
    });
  } catch (error) {
    console.error("Get Order Stats Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
