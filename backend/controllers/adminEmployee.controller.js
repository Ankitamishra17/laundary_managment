import crypto from "crypto";
import { Op } from "sequelize";
import { Employee, Shop } from "../models/index.js";
import { getShopPlan } from "../utils/subscription.js";

// Helper — generates a readable temp password like "LMS-4F2A9K"
function generateTempPassword() {
  return "LMS-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// ------------------------------------------------------------
// Tenant scoping
// ------------------------------------------------------------
// Shop admins may only touch employees of their OWN shop — the shop_id is
// derived from the authenticated account, never from the request body/query.
// Super admins (no shopId) operate platform-wide and may pass an explicit
// shop_id where required.
function employeeScope(req) {
  const where = {};
  if (req.user.shopId) where.shop_id = req.user.shopId;
  return where;
}

// POST /api/admin/employees  — Admin creates a new employee
// POST /api/admin/employees — Admin creates a new employee
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      designation,
      shop_id,
      password,
      auto_generate_password,
    } = req.body;

    // ==============================
    // Validation
    // ==============================
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "name, email and phone are required",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // ==============================
    // Resolve Shop ID
    // ==============================
    // Shop admin can only create employees in their own shop
    // Super admin can provide shop_id
    let resolvedShopId = req.user.shopId || null;

    if (!req.user.shopId && shop_id) {
      resolvedShopId = Number(shop_id);
    }

    // Employee must belong to a shop
    if (!resolvedShopId) {
      return res.status(400).json({
        success: false,
        message: "shop_id is required",
      });
    }

    // ==============================
    // Check Shop Exists
    // ==============================
    const shop = await Shop.findByPk(resolvedShopId);

    if (!shop) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop",
      });
    }

    // ==============================
    // Check Subscription Plan
    // ==============================
    const plan = await getShopPlan(resolvedShopId);

    if (plan && !plan.allowed) {
      return res.status(403).json({
        success: false,
        message: plan.message,
      });
    }

    // Check employee limit
    if (plan?.limits?.maxEmployees) {
      const employeeCount = await Employee.count({
        where: {
          shop_id: resolvedShopId,
        },
      });

      if (employeeCount >= plan.limits.maxEmployees) {
        return res.status(403).json({
          success: false,
          message: `Your ${plan.planName} plan allows up to ${plan.limits.maxEmployees} employees. Please upgrade to add more.`,
        });
      }
    }

    // ==============================
    // IMPORTANT:
    // Check email ONLY inside this shop
    // Same email in another shop is allowed
    // ==============================
    const existingEmployee = await Employee.findOne({
      where: {
        email: normalizedEmail,
        shop_id: resolvedShopId,
      },
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "An employee with this email already exists in this shop",
      });
    }

    // ==============================
    // Password
    // ==============================
    const finalPassword = auto_generate_password
      ? generateTempPassword()
      : password;

    if (!finalPassword || finalPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // ==============================
    // Create Employee
    // ==============================
    const employee = await Employee.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      designation: designation?.trim() || null,
      shop_id: resolvedShopId,
      password: finalPassword,
      status: "active",
      role: "employee",
    });

    // Don't return hashed password
    const { password: _password, ...safeEmployee } = employee.toJSON();

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: safeEmployee,
      ...(auto_generate_password && {
        temp_password: finalPassword,
      }),
    });
  } catch (error) {
    console.error("Create employee error:", error);

    // Composite unique constraint error
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "An employee with this email already exists in this shop",
      });
    }

    // Sequelize validation error
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message:
          error.errors?.[0]?.message || error.message || "Validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create employee",
    });
  }
};

// GET /api/admin/employees — Admin sees only their own shop's employees
export const getEmployees = async (req, res) => {
  try {
    const { search = "", status } = req.query;

    const where = {
      ...employeeScope(req),
      ...(status ? { status } : {}),
      ...(search
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
              { phone: { [Op.like]: `%${search}%` } },
            ],
          }
        : {}),
    };

    const employees = await Employee.findAll({
      where,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Shop,
          as: "shop",
          attributes: ["id", "name", "shopCode", "city"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: employees });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/employees/:id — Admin views one employee (own shop only)
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, ...employeeScope(req) },
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Shop,
          as: "shop",
          attributes: ["id", "name", "shopCode", "city"],
        },
      ],
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    return res.status(200).json({ success: true, data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/employees/:id — Admin edits an employee (own shop only)
export const updateEmployeeByAdmin = async (req, res) => {
  try {
    const { name, phone, designation, shop_id, status } = req.body;

    const employee = await Employee.findOne({
      where: { id: req.params.id, ...employeeScope(req) },
    });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Shop admins can't move an employee to another shop.
    if (shop_id !== undefined && req.user.shopId) {
      return res.status(403).json({
        success: false,
        message: "You cannot change the shop of an employee.",
      });
    }
    if (shop_id) {
      const shop = await Shop.findByPk(shop_id);
      if (!shop) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid shop_id" });
      }
    }

    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (designation !== undefined) employee.designation = designation;
    if (shop_id !== undefined && !req.user.shopId) employee.shop_id = shop_id;
    if (status !== undefined) employee.status = status;

    await employee.save();

    const { password, ...safeEmployee } = employee.toJSON();
    return res
      .status(200)
      .json({ success: true, message: "Employee updated", data: safeEmployee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/employees/:id/permanent — Admin permanently deletes an
// employee record (only used for accounts with no future use — deactivation
// is the safer default). Their task history keeps the employee_id but no
// longer resolves to an account.
export const deleteEmployeePermanently = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, ...employeeScope(req) },
    });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    await employee.destroy();

    return res
      .status(200)
      .json({ success: true, message: "Employee permanently deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/employees/:id — Admin deactivates an employee (soft delete)
export const deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, ...employeeScope(req) },
    });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    employee.status = "inactive";
    await employee.save();

    return res
      .status(200)
      .json({ success: true, message: "Employee deactivated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/employees/:id/reactivate
export const reactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, ...employeeScope(req) },
    });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    employee.status = "active";
    await employee.save();

    return res
      .status(200)
      .json({ success: true, message: "Employee reactivated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/employees/:id/reset-password — Admin resets a forgotten password
export const adminResetEmployeePassword = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { id: req.params.id, ...employeeScope(req) },
    });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const newPassword = generateTempPassword();
    employee.password = newPassword; // hashed by Employee model's hook
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Password reset. Share this with the employee securely.",
      temp_password: newPassword,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
