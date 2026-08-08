import crypto from "crypto";
import { Op } from "sequelize";
import { Employee, Shop } from "../models/index.js";

// Helper — generates a readable temp password like "LMS-4F2A9K"
function generateTempPassword() {
  return "LMS-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// POST /api/admin/employees  — Admin creates a new employee
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

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "name, email and phone are required",
      });
    }

    const existing = await Employee.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An employee with this email already exists",
      });
    }

    if (shop_id) {
      const shop = await Shop.findByPk(shop_id);
      if (!shop) {
        return res.status(400).json({ success: false, message: "Invalid shop_id" });
      }
    }

    const finalPassword = auto_generate_password ? generateTempPassword() : password;
    if (!finalPassword || finalPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "password must be at least 6 characters",
      });
    }

    const employee = await Employee.create({
      name,
      email,
      phone,
      designation: designation || null,
      shop_id: shop_id || null,
      password: finalPassword, // hashed automatically by Employee model's hook
      status: "active",
    });

    const { password: _pw, ...safeEmployee } = employee.toJSON();

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: safeEmployee,
      temp_password: auto_generate_password ? finalPassword : undefined,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ success: false, message: "Email is already in use" });
    }
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ success: false, message: error.errors?.[0]?.message || error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/employees — Admin sees all employees
export const getEmployees = async (req, res) => {
  try {
    const { search = "", status, shop_id } = req.query;

    const where = {
      ...(status ? { status } : {}),
      ...(shop_id ? { shop_id } : {}),
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
      include: [{ model: Shop, as: "shop", attributes: ["id", "name", "shopCode", "city"] }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: employees });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/employees/:id — Admin views one employee
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Shop, as: "shop", attributes: ["id", "name", "shopCode", "city"] }],
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    return res.status(200).json({ success: true, data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/employees/:id — Admin edits an employee
export const updateEmployeeByAdmin = async (req, res) => {
  try {
    const { name, phone, designation, shop_id, status } = req.body;

    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    if (shop_id) {
      const shop = await Shop.findByPk(shop_id);
      if (!shop) {
        return res.status(400).json({ success: false, message: "Invalid shop_id" });
      }
    }

    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (designation !== undefined) employee.designation = designation;
    if (shop_id !== undefined) employee.shop_id = shop_id;
    if (status !== undefined) employee.status = status;

    await employee.save();

    const { password, ...safeEmployee } = employee.toJSON();
    return res.status(200).json({ success: true, message: "Employee updated", data: safeEmployee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/employees/:id — Admin deactivates an employee (soft delete)
export const deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    employee.status = "inactive";
    await employee.save();

    return res.status(200).json({ success: true, message: "Employee deactivated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/employees/:id/reactivate
export const reactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    employee.status = "active";
    await employee.save();

    return res.status(200).json({ success: true, message: "Employee reactivated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/employees/:id/reset-password — Admin resets a forgotten password
export const adminResetEmployeePassword = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
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
