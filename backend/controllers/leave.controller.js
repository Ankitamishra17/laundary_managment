import { Op } from "sequelize";
import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import { createNotification, notifyShopAdmins } from "./notification.controller.js";

const LEAVE_TYPE_LABELS = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  paid: "Paid Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

// ============================================================
// EMPLOYEE — apply for leave
// POST /api/leaves
// ============================================================
export const applyLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;

    if (!start_date || !end_date || !reason) {
      return res.status(400).json({
        success: false,
        message: "start_date, end_date, and reason are required.",
      });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    // When a employee logs in, auth middleware loads the Employee record
    // directly as req.user. So req.user.id IS the employee ID.
    let employee;
    if (req.user.role === "employee") {
      employee = req.user; // Already the Employee record from auth middleware
    } else {
      employee = await Employee.findByPk(req.user.id);
    }
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found.",
      });
    }

    // Check for overlapping leave
    const overlap = await Leave.findOne({
      where: {
        employee_id: employee.id,
        status: { [Op.in]: ["pending", "approved"] },
        [Op.or]: [
          { start_date: { [Op.between]: [start_date, end_date] } },
          { end_date: { [Op.between]: [start_date, end_date] } },
          { start_date: { [Op.lte]: start_date }, end_date: { [Op.gte]: end_date } },
        ],
      },
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "You already have a leave request that overlaps with these dates.",
      });
    }

    const leave = await Leave.create({
      employee_id: employee.id,
      shop_id: employee.shopId || employee.shop_id,
      leave_type: leave_type || "casual",
      start_date,
      end_date,
      reason,
      status: "pending",
    });

    const created = await Leave.findByPk(leave.id, {
      include: [{ model: Employee, as: "employee", attributes: ["id", "name", "email", "designation"] }],
    });

    // Notify shop admins
    const typeLabel = LEAVE_TYPE_LABELS[leave.leave_type] || leave.leave_type;
    await notifyShopAdmins(employee.shopId || employee.shop_id, {
      title: "Leave request submitted",
      message: `${employee.name} requested ${typeLabel} from ${start_date} to ${end_date}.`,
      type: "leave",
      link: "/admin/leaves",
    });

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully.",
      data: created,
    });
  } catch (error) {
    console.error("Apply Leave Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// EMPLOYEE — my leaves
// GET /api/leaves/mine
// ============================================================
export const getMyLeaves = async (req, res) => {
  try {
    let employee;
    if (req.user.role === "employee") {
      employee = req.user;
    } else {
      employee = await Employee.findByPk(req.user.id);
    }
    if (!employee) {
      return res.status(200).json({ success: true, data: [] });
    }

    const leaves = await Leave.findAll({
      where: { employee_id: employee.id },
      include: [{ model: Employee, as: "employee", attributes: ["id", "name", "email", "designation"] }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error("Get My Leaves Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — all leaves for my shop
// GET /api/leaves?status=&employee_id=
// ============================================================
export const getShopLeaves = async (req, res) => {
  try {
    const { status, employee_id } = req.query;
    const where = {};

    if (req.user.shopId) where.shop_id = req.user.shopId;
    if (status) where.status = status;
    if (employee_id) where.employee_id = employee_id;

    const leaves = await Leave.findAll({
      where,
      include: [
        { model: Employee, as: "employee", attributes: ["id", "name", "email", "designation", "shop_id"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error("Get Shop Leaves Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — approve / reject a leave
// PATCH /api/leaves/:id   { status: "approved"|"rejected", admin_remark }
// ============================================================
export const reviewLeave = async (req, res) => {
  try {
    const { status, admin_remark } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'.",
      });
    }

    const where = { id: req.params.id };
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const leave = await Leave.findOne({
      where,
      include: [{ model: Employee, as: "employee", attributes: ["id", "name", "email", "designation", "shop_id"] }],
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This leave request has already been ${leave.status}.`,
      });
    }

    leave.status = status;
    leave.admin_remark = admin_remark || null;
    leave.reviewed_by = req.user.id;
    leave.reviewed_at = new Date();
    await leave.save();

    // Notify the employee
    const typeLabel = LEAVE_TYPE_LABELS[leave.leave_type] || leave.leave_type;
    const statusWord = status === "approved" ? "approved" : "rejected";
    await createNotification({
      employeeId: leave.employee_id,
      title: `Leave ${statusWord}`,
      message: `Your ${typeLabel} request (${leave.start_date} to ${leave.end_date}) has been ${statusWord}${admin_remark ? `: ${admin_remark}` : ""}.`,
      type: "leave",
      link: "/employee/leaves",
    });

    return res.status(200).json({
      success: true,
      message: `Leave request ${statusWord} successfully.`,
      data: leave,
    });
  } catch (error) {
    console.error("Review Leave Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — leave stats
// GET /api/leaves/stats
// ============================================================
export const getLeaveStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const [total, pending, approved, rejected] = await Promise.all([
      Leave.count({ where }),
      Leave.count({ where: { ...where, status: "pending" } }),
      Leave.count({ where: { ...where, status: "approved" } }),
      Leave.count({ where: { ...where, status: "rejected" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, pending, approved, rejected },
    });
  } catch (error) {
    console.error("Get Leave Stats Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
