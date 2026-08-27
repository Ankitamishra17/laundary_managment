import Complaint from "../models/Complaint.js";
import ComplaintReply from "../models/ComplaintReply.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";
import { notifyShopAdmins, notifyCustomer, notifyEmployee } from "./notification.controller.js";
import { findOrCreateCustomer } from "../utils/customerHelper.js";

const VALID_CATEGORIES = ["quality", "delay", "damage", "billing", "service", "other"];
const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];

// ============================================================
// CUSTOMER — submit a complaint
// POST /api/complaints
// ============================================================
export const submitComplaint = async (req, res) => {
  try {
    const { order_id, category, subject, description, image_url } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "category, subject, and description are required.",
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const customer = await findOrCreateCustomer(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found." });
    }

    let shopId = customer.shopId;
    if (order_id) {
      const order = await Order.findByPk(order_id);
      if (order && order.customer_id === customer.id) {
        shopId = order.shop_id;
      }
    }

    if (!shopId) {
      return res.status(400).json({ success: false, message: "No shop associated with your account." });
    }

    const complaint = await Complaint.create({
      customer_id: customer.id,
      order_id: order_id || null,
      shop_id: shopId,
      category,
      subject,
      description,
      image_url: image_url || null,
    });

    await notifyShopAdmins(shopId, {
      title: "New complaint filed",
      message: `Customer filed a "${category}" complaint: ${subject}`,
      type: "complaint",
      link: "/admin/complaints",
    });

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully.",
      data: complaint,
    });
  } catch (error) {
    console.error("Submit Complaint Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CUSTOMER — my complaints
// GET /api/complaints/mine
// ============================================================
export const getMyComplaints = async (req, res) => {
  try {
    const customer = await findOrCreateCustomer(req.user.id);
    if (!customer) return res.status(200).json({ success: true, data: [] });

    const complaints = await Complaint.findAll({
      where: { customer_id: customer.id },
      include: [
        { model: Order, as: "order", attributes: ["id", "status"] },
        { model: ComplaintReply, as: "replies", order: [["createdAt", "ASC"]] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    console.error("Get My Complaints Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CUSTOMER — add reply to own complaint
// POST /api/complaints/:id/reply
// ============================================================
export const customerReply = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const customer = await findOrCreateCustomer(req.user.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    const complaint = await Complaint.findOne({
      where: { id: req.params.id, customer_id: customer.id },
    });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const reply = await ComplaintReply.create({
      complaint_id: complaint.id,
      user_id: req.user.id,
      message,
      is_admin: false,
    });

    // Notify shop admins
    await notifyShopAdmins(complaint.shop_id, {
      title: "Customer replied to complaint",
      message: `Customer replied to complaint #${complaint.id}: "${complaint.subject}"`,
      type: "complaint",
      link: "/admin/complaints",
    });

    return res.status(201).json({ success: true, data: reply });
  } catch (error) {
    console.error("Customer Reply Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — get all complaints for my shop
// GET /api/complaints
// ============================================================
export const getShopComplaints = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (req.user.shopId) where.shop_id = req.user.shopId;
    if (status && VALID_STATUSES.includes(status)) where.status = status;

    const complaints = await Complaint.findAll({
      where,
      include: [
        { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
        { model: Order, as: "order", attributes: ["id", "status"] },
        {
          model: Employee,
          as: "assignedEmployee",
          attributes: ["id", "name"],
          required: false,
        },
        { model: ComplaintReply, as: "replies", order: [["createdAt", "ASC"]] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    console.error("Get Shop Complaints Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — update complaint status
// PATCH /api/complaints/:id/status
// ============================================================
export const updateComplaintStatus = async (req, res) => {
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

    const complaint = await Complaint.findOne({ where });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    complaint.status = status;
    if (status === "resolved") complaint.resolved_at = new Date();
    await complaint.save();

    // Notify customer
    const customer = await Customer.findByPk(complaint.customer_id);
    await notifyCustomer(customer, {
      title: "Complaint status updated",
      message: `Your complaint "${complaint.subject}" is now ${status.replace("_", " ")}.`,
      type: "complaint",
      link: "/customer/complaints",
    });

    return res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    console.error("Update Complaint Status Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — assign complaint to employee
// PATCH /api/complaints/:id/assign
// ============================================================
export const assignComplaint = async (req, res) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({ success: false, message: "employee_id is required." });
    }

    const where = { id: req.params.id };
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const complaint = await Complaint.findOne({ where });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    complaint.assigned_employee_id = employee_id;
    if (complaint.status === "open") complaint.status = "in_progress";
    await complaint.save();

    // Notify employee
    await notifyEmployee(employee, {
      title: "Complaint assigned to you",
      message: `You have been assigned complaint #${complaint.id}: "${complaint.subject}"`,
      type: "complaint",
      link: "/employee/tasks",
    });

    return res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    console.error("Assign Complaint Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — reply to complaint
// POST /api/complaints/:id/reply
// ============================================================
export const adminReply = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const where = { id: req.params.id };
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const complaint = await Complaint.findOne({ where });
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const reply = await ComplaintReply.create({
      complaint_id: complaint.id,
      user_id: req.user.id,
      message,
      is_admin: true,
    });

    complaint.admin_reply = message;
    complaint.admin_replied_at = new Date();
    await complaint.save();

    // Notify customer
    const customer = await Customer.findByPk(complaint.customer_id);
    await notifyCustomer(customer, {
      title: "Reply to your complaint",
      message: `Admin replied to your complaint "${complaint.subject}".`,
      type: "complaint",
      link: "/customer/complaints",
    });

    return res.status(201).json({ success: true, data: reply });
  } catch (error) {
    console.error("Admin Reply Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — complaint stats
// GET /api/complaints/stats
// ============================================================
export const getComplaintStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const total = await Complaint.count({ where });
    const open = await Complaint.count({ where: { ...where, status: "open" } });
    const inProgress = await Complaint.count({ where: { ...where, status: "in_progress" } });
    const resolved = await Complaint.count({ where: { ...where, status: "resolved" } });
    const closed = await Complaint.count({ where: { ...where, status: "closed" } });

    const byCategory = {};
    for (const cat of VALID_CATEGORIES) {
      byCategory[cat] = await Complaint.count({ where: { ...where, category: cat } });
    }

    return res.status(200).json({
      success: true,
      data: { total, open, inProgress, resolved, closed, byCategory },
    });
  } catch (error) {
    console.error("Get Complaint Stats Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
