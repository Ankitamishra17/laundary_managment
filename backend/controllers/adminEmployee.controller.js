import crypto from "crypto";
import { Op } from "sequelize";
import { Employee, Shop } from "../models/index.js";
import { getShopPlan } from "../utils/subscription.js";

// ============================================================
// Helper — generates a readable temporary password
// Example: LMS-4F2A9K
// ============================================================

function generateTempPassword() {
  return "LMS-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// ============================================================
// Tenant scoping
// ============================================================

function employeeScope(req) {
  const where = {};

  if (req.user.shopId) {
    where.shop_id = req.user.shopId;
  }

  return where;
}

// ============================================================
// CREATE EMPLOYEE
// POST /api/admin/employees
// ============================================================

export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      designation,
      monthlySalary,
      shop_id,
      password,
      auto_generate_password,
    } = req.body;

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "name, email and phone are required",
      });
    }

    // ==========================================================
    // MONTHLY SALARY
    // ==========================================================

    const finalMonthlySalary = Number(monthlySalary) || 0;

    if (finalMonthlySalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Monthly salary cannot be negative",
      });
    }

    // ==========================================================
    // NORMALIZE EMAIL
    // ==========================================================

    const normalizedEmail = email.trim().toLowerCase();

    // ==========================================================
    // RESOLVE SHOP ID
    // ==========================================================

    let resolvedShopId = req.user.shopId || null;

    // Super admin can provide shop_id
    if (!req.user.shopId && shop_id) {
      resolvedShopId = Number(shop_id);
    }

    if (!resolvedShopId) {
      return res.status(400).json({
        success: false,
        message: "shop_id is required",
      });
    }

    // ==========================================================
    // CHECK SHOP
    // ==========================================================

    const shop = await Shop.findByPk(resolvedShopId);

    if (!shop) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop",
      });
    }

    // ==========================================================
    // CHECK SUBSCRIPTION PLAN
    // ==========================================================

    const plan = await getShopPlan(resolvedShopId);

    if (plan && !plan.allowed) {
      return res.status(403).json({
        success: false,
        message: plan.message,
      });
    }

    // ==========================================================
    // CHECK EMPLOYEE LIMIT
    // ==========================================================

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

    // ==========================================================
    // CHECK DUPLICATE EMAIL
    // ==========================================================

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

    // ==========================================================
    // PASSWORD
    // ==========================================================

    const finalPassword = auto_generate_password
      ? generateTempPassword()
      : password;

    if (!finalPassword || finalPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // ==========================================================
    // CREATE EMPLOYEE
    // ==========================================================

    const employee = await Employee.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      designation: designation?.trim() || null,

      // IMPORTANT
      // Save monthly salary in employee table
      monthlySalary: finalMonthlySalary,

      shop_id: resolvedShopId,
      password: finalPassword,
      status: "active",
      role: "employee",
    });

    // ==========================================================
    // REMOVE HASHED PASSWORD FROM RESPONSE
    // ==========================================================

    const { password: _password, ...safeEmployee } = employee.toJSON();

    // ==========================================================
    // RESPONSE
    // ==========================================================

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

    // Unique constraint
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "An employee with this email already exists in this shop",
      });
    }

    // Validation error
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

// ============================================================
// GET ALL EMPLOYEES
// GET /api/admin/employees
// ============================================================

export const getEmployees = async (req, res) => {
  try {
    const { search = "", status } = req.query;

    const where = {
      ...employeeScope(req),

      ...(status ? { status } : {}),

      ...(search
        ? {
            [Op.or]: [
              {
                name: {
                  [Op.like]: `%${search}%`,
                },
              },
              {
                email: {
                  [Op.like]: `%${search}%`,
                },
              },
              {
                phone: {
                  [Op.like]: `%${search}%`,
                },
              },
              {
                designation: {
                  [Op.like]: `%${search}%`,
                },
              },
            ],
          }
        : {}),
    };

    const employees = await Employee.findAll({
      where,

      // Don't send password
      attributes: {
        exclude: ["password"],
      },

      include: [
        {
          model: Shop,
          as: "shop",
          attributes: ["id", "name", "shopCode", "city"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get employees",
    });
  }
};

// ============================================================
// GET SINGLE EMPLOYEE
// GET /api/admin/employees/:id
// ============================================================

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: {
        id: req.params.id,
        ...employeeScope(req),
      },

      attributes: {
        exclude: ["password"],
      },

      include: [
        {
          model: Shop,
          as: "shop",
          attributes: ["id", "name", "shopCode", "city"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Get employee error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get employee",
    });
  }
};

// ============================================================
// UPDATE EMPLOYEE BY ADMIN
// PATCH /api/admin/employees/:id
// ============================================================

export const updateEmployeeByAdmin = async (req, res) => {
  try {
    const { name, phone, designation, monthlySalary, shop_id, status } =
      req.body;

    // ==========================================================
    // FIND EMPLOYEE
    // ==========================================================

    const employee = await Employee.findOne({
      where: {
        id: req.params.id,
        ...employeeScope(req),
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ==========================================================
    // SHOP VALIDATION
    // ==========================================================

    // Shop admin cannot move employee to another shop
    if (shop_id !== undefined && req.user.shopId) {
      return res.status(403).json({
        success: false,
        message: "You cannot change the shop of an employee.",
      });
    }

    // Super admin can change shop
    if (shop_id !== undefined && !req.user.shopId) {
      const shop = await Shop.findByPk(Number(shop_id));

      if (!shop) {
        return res.status(400).json({
          success: false,
          message: "Invalid shop_id",
        });
      }

      employee.shop_id = Number(shop_id);
    }

    // ==========================================================
    // UPDATE BASIC DETAILS
    // ==========================================================

    if (name !== undefined) {
      employee.name = name.trim();
    }

    if (phone !== undefined) {
      employee.phone = phone.trim();
    }

    if (designation !== undefined) {
      employee.designation = designation?.trim() || null;
    }

    // ==========================================================
    // UPDATE MONTHLY SALARY
    // ==========================================================

    if (monthlySalary !== undefined) {
      const finalMonthlySalary = Number(monthlySalary);

      if (Number.isNaN(finalMonthlySalary)) {
        return res.status(400).json({
          success: false,
          message: "Monthly salary must be a valid number",
        });
      }

      if (finalMonthlySalary < 0) {
        return res.status(400).json({
          success: false,
          message: "Monthly salary cannot be negative",
        });
      }

      employee.monthlySalary = finalMonthlySalary;
    }

    // ==========================================================
    // UPDATE STATUS
    // ==========================================================

    if (status !== undefined) {
      employee.status = status;
    }

    // ==========================================================
    // SAVE
    // ==========================================================

    await employee.save();

    // ==========================================================
    // SAFE RESPONSE
    // ==========================================================

    const { password: _password, ...safeEmployee } = employee.toJSON();

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: safeEmployee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message:
          error.errors?.[0]?.message || error.message || "Validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update employee",
    });
  }
};

// ============================================================
// DELETE EMPLOYEE PERMANENTLY
// DELETE /api/admin/employees/:id/permanent
// ============================================================

export const deleteEmployeePermanently = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: {
        id: req.params.id,
        ...employeeScope(req),
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await employee.destroy();

    return res.status(200).json({
      success: true,
      message: "Employee permanently deleted",
    });
  } catch (error) {
    console.error("Delete employee error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete employee",
    });
  }
};

// ============================================================
// DEACTIVATE EMPLOYEE
// DELETE /api/admin/employees/:id
// ============================================================

export const deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: {
        id: req.params.id,
        ...employeeScope(req),
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.status = "inactive";

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee deactivated",
    });
  } catch (error) {
    console.error("Deactivate employee error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to deactivate employee",
    });
  }
};

// ============================================================
// REACTIVATE EMPLOYEE
// PATCH /api/admin/employees/:id/reactivate
// ============================================================

export const reactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: {
        id: req.params.id,
        ...employeeScope(req),
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.status = "active";

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee reactivated",
    });
  } catch (error) {
    console.error("Reactivate employee error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reactivate employee",
    });
  }
};

// ============================================================
// RESET EMPLOYEE PASSWORD
// POST /api/admin/employees/:id/reset-password
// ============================================================

export const adminResetEmployeePassword = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: {
        id: req.params.id,
        ...employeeScope(req),
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const newPassword = generateTempPassword();

    // Employee model hook will hash password
    employee.password = newPassword;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Password reset. Share this with the employee securely.",
      temp_password: newPassword,
    });
  } catch (error) {
    console.error("Reset employee password error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset employee password",
    });
  }
};
