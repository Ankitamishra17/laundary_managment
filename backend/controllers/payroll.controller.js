import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import { Op } from "sequelize";

// =====================================================
// CREATE PAYROLL
// POST /api/payroll
// =====================================================

export const createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      totalDays,
      paidDays,
      allowances = 0,
      overtimeAmount = 0,
      bonus = 0,
      deductions = 0,
      advanceDeduction = 0,
      otherDeductions = 0,
      notes,
    } = req.body;

    const shopId = req.user.shopId;
    const createdBy = req.user.id;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee is required",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const finalTotalDays = Number(totalDays) || 30;
    const finalPaidDays = Number(paidDays) || 0;

    if (finalPaidDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Paid days must be greater than 0",
      });
    }

    if (finalPaidDays > finalTotalDays) {
      return res.status(400).json({
        success: false,
        message: "Paid days cannot be greater than total days",
      });
    }

    // ==========================================
    // CHECK EMPLOYEE
    //
    // IMPORTANT:
    // Your Employee model uses shop_id
    // ==========================================

    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        shop_id: shopId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ==========================================
    // CHECK DUPLICATE PAYROLL
    // One payroll per employee/month/year
    // ==========================================

    const existingPayroll = await Payroll.findOne({
      where: {
        shopId,
        employeeId,
        month: Number(month),
        year: Number(year),
      },
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll already exists for this employee for the selected month",
      });
    }

    // ==========================================
    // GET EMPLOYEE MONTHLY SALARY
    //
    // Change employee.salary if your Employee
    // model uses a different field name.
    // ==========================================

    const basicSalary = Number(employee.monthlySalary) || 0;

    if (basicSalary <= 0) {
      return res.status(400).json({
        success: false,
        message: "Employee salary is not set",
      });
    }

    // ==========================================
    // SALARY CALCULATION
    // ==========================================

    const perDaySalary =
      basicSalary / finalTotalDays;

    const earnedSalary =
      perDaySalary * finalPaidDays;

    const finalAllowances =
      Number(allowances) || 0;

    const finalOvertime =
      Number(overtimeAmount) || 0;

    const finalBonus =
      Number(bonus) || 0;

    const finalDeductions =
      Number(deductions) || 0;

    const finalAdvanceDeduction =
      Number(advanceDeduction) || 0;

    const finalOtherDeductions =
      Number(otherDeductions) || 0;

    // Gross salary

    const grossSalary =
      earnedSalary +
      finalAllowances +
      finalOvertime +
      finalBonus;

    // Total deductions

    const totalDeductions =
      finalDeductions +
      finalAdvanceDeduction +
      finalOtherDeductions;

    // Net salary

    const netSalary =
      Math.max(grossSalary - totalDeductions, 0);

    // ==========================================
    // CREATE PAYROLL
    // ==========================================

    const payroll = await Payroll.create({
      shopId,
      employeeId,

      month: Number(month),
      year: Number(year),

      totalDays: finalTotalDays,
      paidDays: finalPaidDays,
      unpaidDays:
        finalTotalDays - finalPaidDays,

      basicSalary,

      perDaySalary,
      earnedSalary,

      allowances: finalAllowances,
      overtimeAmount: finalOvertime,
      bonus: finalBonus,

      grossSalary,

      deductions: finalDeductions,
      advanceDeduction: finalAdvanceDeduction,
      otherDeductions: finalOtherDeductions,

      netSalary,

      // Initially no salary has been paid
      paidAmount: 0,
      dueAmount: netSalary,
      status: "PENDING",

      notes: notes || null,

      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("Create payroll error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create payroll",
    });
  }
};

// =====================================================
// GET ALL PAYROLLS
// GET /api/payroll
// =====================================================

export const getPayrolls = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    const payrolls = await Payroll.findAll({
      where: {
        shopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "id",
            "name",
            "email",
          ],
        },
      ],

      order: [
        ["year", "DESC"],
        ["month", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error("Get payrolls error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get payrolls",
    });
  }
};

// =====================================================
// GET SINGLE PAYROLL
// GET /api/payroll/:id
// =====================================================

export const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const shopId = req.user.shopId;

    const payroll = await Payroll.findOne({
      where: {
        id,
        shopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",
        },
      ],
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    console.error("Get payroll error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get payroll",
    });
  }
};

// =====================================================
// GET EMPLOYEE PAYROLLS
// GET /api/payroll/employee/:employeeId
// =====================================================

export const getEmployeePayrolls = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const shopId = req.user.shopId;

    const payrolls = await Payroll.findAll({
      where: {
        shopId,
        employeeId,
      },

      order: [
        ["year", "DESC"],
        ["month", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error("Get employee payrolls error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to get employee payrolls",
    });
  }
};

// =====================================================
// UPDATE PAYROLL
// PUT /api/payroll/:id
//
// Only allow update before salary payment.
// =====================================================

export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const shopId = req.user.shopId;
    const updatedBy = req.user.id;

    const payroll = await Payroll.findOne({
      where: {
        id,
        shopId,
      },
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    // Do not modify salary calculation after payment
    if (Number(payroll.paidAmount) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll cannot be edited after a salary payment has been made",
      });
    }

    const {
      totalDays,
      paidDays,
      allowances = 0,
      overtimeAmount = 0,
      bonus = 0,
      deductions = 0,
      advanceDeduction = 0,
      otherDeductions = 0,
      notes,
    } = req.body;

    const finalTotalDays =
      totalDays !== undefined
        ? Number(totalDays)
        : Number(payroll.totalDays);

    const finalPaidDays =
      paidDays !== undefined
        ? Number(paidDays)
        : Number(payroll.paidDays);

    if (finalPaidDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Paid days must be greater than 0",
      });
    }

    if (finalPaidDays > finalTotalDays) {
      return res.status(400).json({
        success: false,
        message:
          "Paid days cannot be greater than total days",
      });
    }

    const basicSalary =
      Number(payroll.basicSalary);

    const perDaySalary =
      basicSalary / finalTotalDays;

    const earnedSalary =
      perDaySalary * finalPaidDays;

    const finalAllowances =
      Number(allowances);

    const finalOvertime =
      Number(overtimeAmount);

    const finalBonus =
      Number(bonus);

    const finalDeductions =
      Number(deductions);

    const finalAdvanceDeduction =
      Number(advanceDeduction);

    const finalOtherDeductions =
      Number(otherDeductions);

    const grossSalary =
      earnedSalary +
      finalAllowances +
      finalOvertime +
      finalBonus;

    const netSalary = Math.max(
      grossSalary -
        finalDeductions -
        finalAdvanceDeduction -
        finalOtherDeductions,
      0,
    );

    await payroll.update({
      totalDays: finalTotalDays,
      paidDays: finalPaidDays,
      unpaidDays:
        finalTotalDays - finalPaidDays,

      perDaySalary,
      earnedSalary,

      allowances: finalAllowances,
      overtimeAmount: finalOvertime,
      bonus: finalBonus,

      grossSalary,

      deductions: finalDeductions,
      advanceDeduction:
        finalAdvanceDeduction,
      otherDeductions:
        finalOtherDeductions,

      netSalary,

      // Since paidAmount is 0 here
      dueAmount: netSalary,
      status: "PENDING",

      notes:
        notes !== undefined
          ? notes
          : payroll.notes,

      updatedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("Update payroll error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to update payroll",
    });
  }
};

// =====================================================
// CANCEL PAYROLL
// PATCH /api/payroll/:id/cancel
// =====================================================

export const cancelPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const shopId = req.user.shopId;
    const updatedBy = req.user.id;

    const payroll = await Payroll.findOne({
      where: {
        id,
        shopId,
      },
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.status === "PAID") {
      return res.status(400).json({
        success: false,
        message:
          "Paid payroll cannot be cancelled",
      });
    }

    await payroll.update({
      status: "CANCELLED",
      updatedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll cancelled successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("Cancel payroll error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to cancel payroll",
    });
  }
};