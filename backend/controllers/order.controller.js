import { Op } from "sequelize";
import sequelize from "../config/database.js";

import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Customer from "../models/Customer.js";
import Shop from "../models/Shop.js";
import Service from "../models/Service.js";
import Employee from "../models/Employee.js";
import Task from "../models/Tasks.js";

import {
  notifyShopAdmins,
  notifyCustomer,
} from "./notification.controller.js";

import {
  getShopPlan,
  countShopOrdersThisMonth,
} from "../utils/subscription.js";

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

const VALID_PAYMENT_STATUSES = [
  "paid",
  "unpaid",
  "partial",
];

// ============================================================
// HELPERS
// ============================================================

const getShopId = (req) => {
  return req.user?.shopId
    ? Number(req.user.shopId)
    : null;
};

const getCustomerForUser = async (
  userId,
  shopId = null
) => {
  const where = {
    userId: Number(userId),
  };

  if (shopId) {
    where.shopId = Number(shopId);
  }

  return Customer.findOne({
    where,
  });
};

// ============================================================
// ORDER INCLUDES
// ============================================================

const ORDER_INCLUDES = [
  {
    model: OrderItem,
    as: "items",
  },

  {
    model: Shop,
    as: "shop",
    attributes: [
      "id",
      "name",
      "shopCode",
      "city",
      "address",
      "phone",
    ],
  },

  {
    model: Task,
    as: "tasks",
    attributes: [
      "id",
      "shop_id",
      "task_type",
      "status",
      "scheduled_time",
      "started_at",
      "completed_at",
      "employee_id",
      "notes",
    ],
    required: false,
  },
];

// ============================================================
// CUSTOMER — CREATE ORDER
// POST /api/orders
// ============================================================

export const createOrder = async (
  req,
  res
) => {
  const transaction =
    await sequelize.transaction();

  try {
    const {
      pickupDate,
      pickupTime,
      pickupAddress,
      deliveryAddress,
      deliveryDate,
      deliveryNote,
      items,
    } = req.body;

    // --------------------------------------------------------
    // Customer must have a shop
    // --------------------------------------------------------

    const userShopId =
      getShopId(req);

    if (!userShopId) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Your account is not linked to a laundry shop.",
      });
    }

    const shopId =
      Number(userShopId);

    // --------------------------------------------------------
    // Validate items
    // --------------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Please add at least one service to your order.",
      });
    }

    // --------------------------------------------------------
    // Customer
    // --------------------------------------------------------

    const customer =
      await getCustomerForUser(
        req.user.id,
        shopId
      );

    if (!customer) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Customer profile not found. Please contact support.",
      });
    }

    // --------------------------------------------------------
    // Shop
    // --------------------------------------------------------

    const shop =
      await Shop.findOne({
        where: {
          id: shopId,
          isActive: true,
          isDeleted: false,
        },
      });

    if (!shop) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Laundry shop not found or inactive.",
      });
    }

    // --------------------------------------------------------
    // Subscription
    // --------------------------------------------------------

    const shopPlan =
      await getShopPlan(shop.id);

    if (!shopPlan.allowed) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message:
          shopPlan?.message ||
          "Your laundry is not available right now.",
      });
    }

    // --------------------------------------------------------
    // Monthly order limit
    // --------------------------------------------------------

    if (
      shopPlan.limits?.maxMonthlyOrders
    ) {
      const monthCount =
        await countShopOrdersThisMonth(
          shop.id
        );

      if (
        monthCount >=
        shopPlan.limits.maxMonthlyOrders
      ) {
        await transaction.rollback();

        return res.status(403).json({
          success: false,
          message:
            `Your ${shopPlan.planName} plan allows up to ${shopPlan.limits.maxMonthlyOrders} orders per month. Please contact the platform to upgrade.`,
        });
      }
    }

    // --------------------------------------------------------
    // Services — STRICT SHOP SCOPE
    // --------------------------------------------------------

    const serviceIds = [
      ...new Set(
        items.map((item) =>
          Number(item.serviceId)
        )
      ),
    ];

    if (
      serviceIds.some(
        (id) => !id || Number.isNaN(id)
      )
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Invalid service selected.",
      });
    }

    const catalog =
      await Service.findAll({
        where: {
          id: {
            [Op.in]: serviceIds,
          },

          shopId: shop.id,

          isDeleted: false,

          status: "Active",
        },
        transaction,
      });

    const catalogById =
      new Map(
        catalog.map((service) => [
          Number(service.id),
          service,
        ])
      );

    // --------------------------------------------------------
    // Build order items
    // --------------------------------------------------------

    const lineItems = [];

    let totalAmount = 0;

    for (const item of items) {
      const service =
        catalogById.get(
          Number(item.serviceId)
        );

      if (!service) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message:
            "One of the selected services is no longer available.",
        });
      }

      const quantity =
        Math.max(
          1,
          Number(item.quantity) || 1
        );

      const price =
        Number(service.price) || 0;

      const lineTotal =
        price * quantity;

      totalAmount += lineTotal;

      lineItems.push({
        serviceId:
          service.id,

        name:
          service.serviceName,

        price,

        quantity,

        lineTotal,

        item_label:
          String(
            item.itemLabel || ""
          )
            .trim()
            .slice(0, 150) || null,
      });
    }

    // --------------------------------------------------------
    // Delivery address
    // --------------------------------------------------------

    const resolvedDeliveryAddress =
      String(
        deliveryAddress || ""
      ).trim() ||
      String(
        pickupAddress || ""
      ).trim() ||
      null;

    // --------------------------------------------------------
    // CREATE ORDER
    // --------------------------------------------------------

    const order =
      await Order.create(
        {
          customer_id:
            customer.id,

          shop_id:
            shop.id,

          status:
            "pending",

          total_amount:
            totalAmount,

          payment_status:
            "unpaid",

          pickup_date:
            pickupDate || null,

          pickup_time:
            pickupTime || null,

          pickup_address:
            String(
              pickupAddress || ""
            ).trim() || null,

          delivery_address:
            resolvedDeliveryAddress,

          delivery_date:
            deliveryDate || null,

          delivery_note:
            String(
              deliveryNote || ""
            ).trim() || null,
        },
        {
          transaction,
        }
      );

    // --------------------------------------------------------
    // ORDER ITEMS
    // --------------------------------------------------------

    await OrderItem.bulkCreate(
      lineItems.map(
        (line) => ({
          ...line,
          orderId:
            order.id,
        })
      ),
      {
        transaction,
      }
    );

    await transaction.commit();

    // --------------------------------------------------------
    // Fetch created order
    // --------------------------------------------------------

    const created =
      await Order.findOne({
        where: {
          id: order.id,
          shop_id: shop.id,
        },
        include:
          ORDER_INCLUDES,
      });

    // --------------------------------------------------------
    // Admin notification
    // --------------------------------------------------------

    try {
      await notifyShopAdmins(
        shop.id,
        {
          title:
            "New order received",

          message:
            `${customer.name} placed order #${order.id} for ${totalAmount.toLocaleString("en-IN")} — pending pickup.`,

          type: "order",
          link: "/admin/orders",
        }
      );
    } catch (notificationError) {
      console.error(
        "Admin notification error:",
        notificationError.message
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Order placed successfully. We'll pick it up soon!",
      data: created,
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {}

    console.error(
      "Create Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// CUSTOMER — MY ORDERS
// GET /api/orders/mine
// ============================================================

export const getMyOrders = async (
  req,
  res
) => {
  try {
    const shopId =
      getShopId(req);

    if (!shopId) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const customer =
      await getCustomerForUser(
        req.user.id,
        shopId
      );

    if (!customer) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const orders =
      await Order.findAll({
        where: {
          customer_id:
            customer.id,

          shop_id:
            shopId,
        },

        include:
          ORDER_INCLUDES,

        order: [
          ["createdAt", "DESC"],
        ],
      });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error(
      "Get My Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// CUSTOMER — SINGLE ORDER
// GET /api/orders/:id
// ============================================================

export const getMyOrderById = async (
  req,
  res
) => {
  try {
    const shopId =
      getShopId(req);

    if (!shopId) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const customer =
      await getCustomerForUser(
        req.user.id,
        shopId
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order =
      await Order.findOne({
        where: {
          id: Number(req.params.id),
          customer_id:
            customer.id,
          shop_id:
            shopId,
        },

        include:
          ORDER_INCLUDES,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error(
      "Get My Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// CUSTOMER — CANCEL ORDER
// PATCH /api/orders/:id/cancel
// ============================================================

export const cancelMyOrder = async (
  req,
  res
) => {
  try {
    const shopId =
      getShopId(req);

    if (!shopId) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const customer =
      await getCustomerForUser(
        req.user.id,
        shopId
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order =
      await Order.findOne({
        where: {
          id: Number(req.params.id),
          customer_id:
            customer.id,
          shop_id:
            shopId,
        },
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      order.status !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending orders can be cancelled.",
      });
    }

    order.status =
      "cancelled";

    await order.save();

    try {
      await notifyShopAdmins(
        shopId,
        {
          title:
            "Order cancelled",

          message:
            `Order #${order.id} was cancelled by the customer.`,

          type: "order",
          link: "/admin/orders",
        }
      );
    } catch (notificationError) {
      console.error(
        "Cancel notification error:",
        notificationError.message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Order cancelled successfully.",
      data: order,
    });
  } catch (error) {
    console.error(
      "Cancel Order Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ADMIN — SHOP ORDERS
// GET /api/orders
// ============================================================

export const getShopOrders = async (
  req,
  res
) => {
  try {
    const {
      status,
      payment_status,
    } = req.query;

    const where = {};

    const shopId =
      getShopId(req);

    if (shopId) {
      where.shop_id =
        shopId;
    }

    if (status) {
      where.status =
        status;
    }

    if (payment_status) {
      where.payment_status =
        payment_status;
    }

    const orders =
      await Order.findAll({
        where,

        include: [
          ...ORDER_INCLUDES,

          {
            model: Customer,
            as: "customer",
            attributes: [
              "id",
              "name",
              "phone",
              "address",
              "city",
              "shopId",
            ],
          },

          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "name",
              "shop_id",
            ],
            required: false,
          },
        ],

        order: [
          ["createdAt", "DESC"],
        ],
      });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error(
      "Get Shop Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ADMIN — UPDATE ORDER STATUS
// PATCH /api/orders/:id/status
// ============================================================

export const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const {
      status,
    } = req.body;

    if (
      !VALID_STATUSES.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const where = {
      id: Number(req.params.id),
    };

    const shopId =
      getShopId(req);

    if (shopId) {
      where.shop_id =
        shopId;
    }

    const order =
      await Order.findOne({
        where,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.status =
      status;

    if (
      status === "delivered"
    ) {
      order.delivery_time =
        new Date().toISOString();
    }

    await order.save();

    const customerWhere = {
      id: order.customer_id,
    };

    if (shopId) {
      customerWhere.shopId =
        shopId;
    } else {
      customerWhere.shopId =
        order.shop_id;
    }

    const customer =
      await Customer.findOne({
        where: customerWhere,
      });

    if (customer) {
      try {
        if (
          status === "delivered"
        ) {
          await notifyCustomer(
            customer,
            {
              title:
                "Order delivered — Review us!",

              message:
                `Your order #${order.id} has been delivered! We'd love your feedback — write a review to share your experience.`,

              type: "order",

              orderId:
                order.id,

              link:
                "/customer/reviews",
            }
          );
        } else {
          await notifyCustomer(
            customer,
            {
              title:
                "Order status updated",

              message:
                `Your order #${order.id} is now ${
                  STATUS_LABELS[
                    status
                  ] || status
                }.`,


              type: "order",

              orderId:
                order.id,

              link:
                `/customer/orders/${order.id}`,
            }
          );
        }
      } catch (notificationError) {
        console.error(
          "Customer notification error:",
          notificationError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Order status updated.",
      data: order,
    });
  } catch (error) {
    console.error(
      "Update Order Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ADMIN — UPDATE PAYMENT STATUS
// PATCH /api/orders/:id/payment
// ============================================================

export const updatePaymentStatus = async (
  req,
  res
) => {
  try {
    const {
      payment_status,
    } = req.body;

    if (
      !VALID_PAYMENT_STATUSES.includes(
        payment_status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid payment status. Allowed: ${VALID_PAYMENT_STATUSES.join(", ")}`,
      });
    }

    const where = {
      id: Number(req.params.id),
    };

    const shopId =
      getShopId(req);

    if (shopId) {
      where.shop_id =
        shopId;
    }

    const order =
      await Order.findOne({
        where,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.payment_status =
      payment_status;

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Payment status updated.",
      data: order,
    });
  } catch (error) {
    console.error(
      "Update Payment Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ADMIN — ORDER STATS
// GET /api/orders/stats
// ============================================================

export const getOrderStats = async (
  req,
  res
) => {
  try {
    const where = {};

    const shopId =
      getShopId(req);

    if (shopId) {
      where.shop_id =
        shopId;
    }

    const counts =
      await Promise.all(
        VALID_STATUSES.map(
          async (status) => ({
            status,

            count:
              await Order.count({
                where: {
                  ...where,
                  status,
                },
              }),
          })
        )
      );

    const totalOrders =
      await Order.count({
        where,
      });

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        byStatus: counts,
      },
    });
  } catch (error) {
    console.error(
      "Get Order Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};