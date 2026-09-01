import { Order, Customer, Shop, Employee, Service, OrderItem } from "../models/index.js";

// 1. Employee orders
export const getMyAssignedOrders = async (req, res) => {
  try {
    const employeeId = req.user.id; // auth middleware se aayega
    const { status } = req.query;

    const where = { employee_id: employeeId };
    if (status) where.status = status;

    const orders = await Order.findAll({
      where,
      include: [
        { model: Customer, as: "customer", attributes: ["id", "name", "phone", "address"] },
        { model: Shop, as: "shop", attributes: ["id", "name", "address", "city"] },
        { model: OrderItem, as: "items" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Single order ki detail dekhna (sirf apna assigned order)
export const getMyOrderById = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
      include: [
        { model: Customer, as: "customer", attributes: ["id", "name", "phone", "address"] },
        { model: Shop, as: "shop", attributes: ["id", "name", "address", "city"] },
        { model: OrderItem, as: "items" },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Order status update karna (employee ke allowed statuses)
export const updateOrderStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status } = req.body;

    // Employee ko sirf ye statuses set karne ki permission hogi
    const allowedStatuses = [
      "picked_up",
      "processing",
      "ready_for_delivery",
      "out_for_delivery",
      "delivered",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    order.status = status;

    // Timestamps track karne ke liye (agar model me columns bana rakhe hai)
    if (status === "picked_up") order.pickup_time = new Date().toISOString();
    if (status === "delivered") order.delivery_time = new Date().toISOString();

    await order.save();

    return res.status(200).json({ success: true, message: "Order status updated", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Pickup complete mark karna (shortcut endpoint)
export const markPickupDone = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    order.status = "picked_up";
    order.pickup_time = new Date().toISOString();
    await order.save();

    return res.status(200).json({ success: true, message: "Pickup marked as done", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delivery complete mark karna (shortcut endpoint)
export const markDeliveryDone = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    order.status = "delivered";
    order.delivery_time = new Date().toISOString();
    await order.save();

    return res.status(200).json({ success: true, message: "Delivery marked as done", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Receipt data generate karna
export const generateReceipt = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
      include: [
        { model: Customer, as: "customer", attributes: ["id", "name", "phone", "address"] },
        { model: Shop, as: "shop", attributes: ["id", "name", "address", "city"] },
        { model: OrderItem, as: "items" },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    const receipt = {
      receipt_no: `RCPT-${order.id}`,
      date: new Date().toLocaleDateString(),
      customer_name: order.customer?.name,
      customer_phone: order.customer?.phone,
      shop_name: order.shop?.name,
      items: order.items || [],
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      order_status: order.status,
    };

    return res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Employee ka apna profile dekhna
export const getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    return res.status(200).json({ success: true, data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Employee reset password (logged-in employee apna password badal sakta hai)
export const resetPassword = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { old_password, new_password, confirm_password } = req.body;

    if (!old_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "old_password, new_password and confirm_password are required",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "new_password and confirm_password do not match",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "new_password must be at least 6 characters long",
      });
    }

    const employee = await Employee.findByPk(employeeId);

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const isMatch = await employee.comparePassword(old_password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Old password is incorrect" });
    }

    // Assign plain password — the model's beforeUpdate hook hashes it automatically
    employee.password = new_password;
    await employee.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Update employee profile (sirf apni profile ke allowed fields)
export const updateMyProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { name, phone, designation, email } = req.body;

    const employee = await Employee.findByPk(employeeId);

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Employee sirf apne allowed fields update kar sakta hai
    // (status, role, shop_id jaisi cheezein yaha se update nahi hongi)
    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (designation !== undefined) employee.designation = designation;
    if (email !== undefined) employee.email = email; // unique + isEmail validated by the model

    await employee.save();

    const { password, ...safeEmployee } = employee.toJSON();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: safeEmployee,
    });
  } catch (error) {
    // Handles unique-email violations and isEmail validation errors from the model
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ success: false, message: "Email is already in use" });
    }
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ success: false, message: error.errors?.[0]?.message || error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Payment receipt (order ke payment details ki receipt)
export const getPaymentReceipt = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
      include: [
        { model: Customer, as: "customer", attributes: ["id", "name", "phone", "address"] },
        { model: Shop, as: "shop", attributes: ["id", "name", "address", "city"] },
        { model: OrderItem, as: "items" },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    const paymentReceipt = {
      receipt_no: `PAY-${order.id}`,
      date: new Date().toLocaleDateString(),
      customer_name: order.customer?.name,
      customer_phone: order.customer?.phone,
      shop_name: order.shop?.name,
      total_amount: order.total_amount,
      payment_status: order.payment_status, // "paid" | "unpaid" | "partial"
      order_status: order.status,
    };

    return res.status(200).json({ success: true, data: paymentReceipt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Employee salary history — requires Salary model (not yet available)
export const getMySalaries = async (req, res) => {
  return res.status(501).json({ success: false, message: "Salary module is not yet available." });
};

// 12. Specific salary record
export const getMySalaryById = async (req, res) => {
  return res.status(501).json({ success: false, message: "Salary module is not yet available." });
};

// 13. Salary slip PDF
export const downloadSalarySlip = async (req, res) => {
  return res.status(501).json({ success: false, message: "Salary module is not yet available." });
};