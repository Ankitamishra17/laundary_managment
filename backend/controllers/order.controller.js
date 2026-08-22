const { Order, Customer, Shop, Employee, Service, sequelize } = require("../models");
const { Op } = require("sequelize");

// 1. Naya order create karna
exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, shop_id, employee_id, services, payment_status } = req.body;

    if (!customer_id || !shop_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "customer_id and shop_id are required" });
    }

    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const shop = await Shop.findByPk(shop_id);
    if (!shop) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    if (employee_id) {
      const employee = await Employee.findByPk(employee_id);
      if (!employee) {
        await t.rollback();
        return res.status(404).json({ success: false, message: "Employee not found" });
      }
    }

    // services: [{ name, price, quantity }, ...]
    let total_amount = 0;
    if (Array.isArray(services) && services.length > 0) {
      total_amount = services.reduce((sum, s) => {
        const price = Number(s.price) || 0;
        const qty = Number(s.quantity) || 1;
        return sum + price * qty;
      }, 0);
    }

    const order = await Order.create(
      {
        customer_id,
        shop_id,
        employee_id: employee_id || null,
        status: "pending",
        total_amount,
        payment_status: payment_status || "unpaid",
      },
      { transaction: t }
    );

    if (Array.isArray(services) && services.length > 0) {
      const serviceRows = services.map((s) => ({
        order_id: order.id,
        name: s.name,
        price: s.price,
        quantity: s.quantity || 1,
      }));
      await Service.bulkCreate(serviceRows, { transaction: t });
    }

    await t.commit();

    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "address"] },
        { model: Shop, attributes: ["id", "name", "location"] },
        { model: Employee, attributes: ["id", "name", "phone"] },
        { model: Service },
      ],
    });

    return res.status(201).json({ success: true, message: "Order created", data: createdOrder });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Saare orders dekhna (filters + pagination ke saath)
exports.getAllOrders = async (req, res) => {
  try {
    const {
      status,
      payment_status,
      shop_id,
      employee_id,
      customer_id,
      from_date,
      to_date,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (shop_id) where.shop_id = shop_id;
    if (employee_id) where.employee_id = employee_id;
    if (customer_id) where.customer_id = customer_id;
    if (from_date || to_date) {
      where.createdAt = {};
      if (from_date) where.createdAt[Op.gte] = new Date(from_date);
      if (to_date) where.createdAt[Op.lte] = new Date(to_date);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "address"] },
        { model: Shop, attributes: ["id", "name", "location"] },
        { model: Employee, attributes: ["id", "name", "phone"] },
        { model: Service },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Single order ki poori detail
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "address"] },
        { model: Shop, attributes: ["id", "name", "location"] },
        { model: Employee, attributes: ["id", "name", "phone"] },
        { model: Service },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Order ki basic details update karna (customer/shop/amount waghera)
exports.updateOrder = async (req, res) => {
  try {
    const { customer_id, shop_id, total_amount, payment_status } = req.body;

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (customer_id !== undefined) order.customer_id = customer_id;
    if (shop_id !== undefined) order.shop_id = shop_id;
    if (total_amount !== undefined) order.total_amount = total_amount;
    if (payment_status !== undefined) order.payment_status = payment_status;

    await order.save();

    return res.status(200).json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Order ka status admin/shop-owner ki taraf se force update (koi bhi valid status)
exports.updateOrderStatusByAdmin = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "picked_up",
      "processing",
      "ready_for_delivery",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;
    if (status === "picked_up") order.pickup_time = new Date();
    if (status === "delivered") order.delivery_time = new Date();

    await order.save();

    return res.status(200).json({ success: true, message: "Order status updated", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Order ko employee assign / reassign karna
exports.assignEmployeeToOrder = async (req, res) => {
  try {
    const { employee_id } = req.body;

    if (!employee_id) {
      return res.status(400).json({ success: false, message: "employee_id is required" });
    }

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.employee_id = employee_id;
    await order.save();

    const updatedOrder = await Order.findByPk(order.id, {
      include: [{ model: Employee, attributes: ["id", "name", "phone"] }],
    });

    return res.status(200).json({ success: true, message: "Employee assigned to order", data: updatedOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Payment status update karna (paid / unpaid / partial)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status } = req.body;
    const allowed = ["paid", "unpaid", "partial"];

    if (!allowed.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment_status. Allowed: ${allowed.join(", ")}`,
      });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.payment_status = payment_status;
    await order.save();

    return res.status(200).json({ success: true, message: "Payment status updated", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Order cancel/delete karna
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await Service.destroy({ where: { order_id: order.id } });
    await order.destroy();

    return res.status(200).json({ success: true, message: "Order deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Ek shop ke saare orders dekhna
exports.getOrdersByShop = async (req, res) => {
  try {
    const { shop_id } = req.params;
    const { status } = req.query;

    const where = { shop_id };
    if (status) where.status = status;

    const orders = await Order.findAll({
      where,
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "address"] },
        { model: Employee, attributes: ["id", "name", "phone"] },
        { model: Service },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Orders ka quick summary/dashboard stats (status-wise count)
exports.getOrderStats = async (req, res) => {
  try {
    const { shop_id } = req.query;
    const where = {};
    if (shop_id) where.shop_id = shop_id;

    const statuses = [
      "pending",
      "picked_up",
      "processing",
      "ready_for_delivery",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    const counts = await Promise.all(
      statuses.map(async (status) => {
        const count = await Order.count({ where: { ...where, status } });
        return { status, count };
      })
    );

    const totalOrders = await Order.count({ where });

    return res.status(200).json({ success: true, data: { totalOrders, byStatus: counts } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};