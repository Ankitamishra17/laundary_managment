const PDFDocument = require("pdfkit");
const { Order, Customer, Shop, Service, Employee, Salary } = require("../models");

// 1. Employee ke saare assigned orders dekhna
exports.getMyAssignedOrders = async (req, res) => {
  try {
    const employeeId = req.user.id; // auth middleware se aayega
    const { status } = req.query;

    const where = { employee_id: employeeId };
    if (status) where.status = status;

    const orders = await Order.findAll({
      where,
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "address"] },
        { model: Shop, attributes: ["id", "name", "location"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Single order ki detail dekhna (sirf apna assigned order)
exports.getMyOrderById = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "address"] },
        { model: Shop, attributes: ["id", "name", "location"] },
        { model: Service },
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
exports.updateOrderStatus = async (req, res) => {
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
    if (status === "picked_up") order.pickup_time = new Date();
    if (status === "delivered") order.delivery_time = new Date();

    await order.save();

    return res.status(200).json({ success: true, message: "Order status updated", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Pickup complete mark karna (shortcut endpoint)
exports.markPickupDone = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    order.status = "picked_up";
    order.pickup_time = new Date();
    await order.save();

    return res.status(200).json({ success: true, message: "Pickup marked as done", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delivery complete mark karna (shortcut endpoint)
exports.markDeliveryDone = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    order.status = "delivered";
    order.delivery_time = new Date();
    await order.save();

    return res.status(200).json({ success: true, message: "Delivery marked as done", data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Receipt data generate karna
exports.generateReceipt = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "address"] },
        { model: Shop, attributes: ["id", "name", "location"] },
        { model: Service },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    const receipt = {
      receipt_no: `RCPT-${order.id}`,
      date: new Date().toLocaleDateString(),
      customer_name: order.Customer?.name,
      customer_phone: order.Customer?.phone,
      shop_name: order.Shop?.name,
      services: order.Services || order.Service,
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
exports.getMyProfile = async (req, res) => {
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
exports.resetPassword = async (req, res) => {
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
exports.updateMyProfile = async (req, res) => {
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
exports.getPaymentReceipt = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const order = await Order.findOne({
      where: { id: req.params.id, employee_id: employeeId },
      include: [
        { model: Customer, attributes: ["id", "name", "phone", "address"] },
        { model: Shop, attributes: ["id", "name", "location"] },
        { model: Service },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    const paymentReceipt = {
      receipt_no: `PAY-${order.id}`,
      date: new Date().toLocaleDateString(),
      customer_name: order.Customer?.name,
      customer_phone: order.Customer?.phone,
      shop_name: order.Shop?.name,
      total_amount: order.total_amount,
      payment_status: order.payment_status, // "paid" | "unpaid" | "partial"
      order_status: order.status,
    };

    return res.status(200).json({ success: true, data: paymentReceipt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Employee ki apni saari salary history dekhna
exports.getMySalaries = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { year, month } = req.query;

    const where = { employee_id: employeeId };
    if (year) where.year = year;
    if (month) where.month = month;

    const salaries = await Salary.findAll({
      where,
      order: [
        ["year", "DESC"],
        ["month", "DESC"],
      ],
    });

    return res.status(200).json({ success: true, data: salaries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Ek specific salary record ki detail (sirf apni)
exports.getMySalaryById = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const salary = await Salary.findOne({
      where: { id: req.params.id, employee_id: employeeId },
    });

    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    return res.status(200).json({ success: true, data: salary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Salary slip PDF generate karke download karna
exports.downloadSalarySlip = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const salary = await Salary.findOne({
      where: { id: req.params.id, employee_id: employeeId },
    });

    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }

    const employee = await Employee.findByPk(employeeId, {
      attributes: { exclude: ["password"] },
      include: [{ model: Shop, attributes: ["id", "name", "location"] }],
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const monthLabel = monthNames[salary.month - 1] || salary.month;

    const fileName = `salary-slip-${employee.id}-${salary.month}-${salary.year}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(18).text("Salary Slip", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(11).text(`${monthLabel} ${salary.year}`, { align: "center" });
    doc.moveDown(1.5);

    // Employee details
    doc.fontSize(12).text(`Employee Name: ${employee.name}`);
    doc.text(`Employee ID: ${employee.id}`);
    doc.text(`Designation: ${employee.designation || "-"}`);
    doc.text(`Shop: ${employee.Shop?.name || "-"}`);
    doc.text(`Email: ${employee.email}`);
    doc.moveDown(1);

    // Salary breakdown table (simple layout)
    doc.fontSize(13).text("Salary Breakdown", { underline: true });
    doc.moveDown(0.5);

    const rows = [
      ["Basic Salary", salary.basic_salary],
      ["Allowances", salary.allowances],
      ["Deductions", `- ${salary.deductions}`],
      ["Net Salary", salary.net_salary],
    ];

    rows.forEach(([label, value]) => {
      doc.fontSize(11).text(`${label}:`, { continued: true }).text(`  ${value}`, { align: "right" });
    });

    doc.moveDown(1);
    doc.fontSize(11).text(`Payment Status: ${salary.payment_status}`);
    doc.text(`Payment Mode: ${salary.payment_mode || "-"}`);
    doc.text(
      `Payment Date: ${salary.payment_date ? new Date(salary.payment_date).toLocaleDateString() : "-"}`
    );

    doc.moveDown(2);
    doc.fontSize(9).text("This is a system-generated salary slip.", { align: "center" });

    doc.end();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};