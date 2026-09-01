import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";

// =====================================================
// HELPER: CALCULATE CALENDAR DAYS
// =====================================================

const calculateCalendarDays = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  const difference =
    Date.UTC(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
    ) -
    Date.UTC(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );

  return (
    Math.floor(
      difference / (1000 * 60 * 60 * 24),
    ) + 1
  );
};

// =====================================================
// HELPER: PAYROLL DAYS
//
// Monthly salary is always calculated on 30 days.
//
// Examples:
//
// Aug 01 - Aug 15 = 15 days
// Aug 15 - Aug 30 = 16 days
// Aug 01 - Aug 31 = 30 payroll days
// =====================================================

const calculatePayrollDays = (startDate, endDate) => {
  const calendarDays = calculateCalendarDays(
    startDate,
    endDate,
  );

  return Math.min(calendarDays, 30);
};

// =====================================================
// CREATE PAYROLL
// POST /api/payroll
// =====================================================

export const createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      startDate,
      endDate,

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

    // =================================================
    // VALIDATION
    // =================================================

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee is required",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Start date is required",
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: "End date is required",
      });
    }

    // =================================================
    // DATE VALIDATION
    // =================================================

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date or end date",
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message:
          "Start date cannot be after end date",
      });
    }

    // =================================================
    // PAYROLL DAYS
    // =================================================

    const totalDays = 30;

    const calendarDays = calculateCalendarDays(
      startDate,
      endDate,
    );

    const paidDays = Math.min(calendarDays, 30);

    if (paidDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Paid days must be greater than 0",
      });
    }

    // =================================================
    // CHECK EMPLOYEE
    // =================================================

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

    // =================================================
    // GET MONTHLY SALARY FROM EMPLOYEE
    // =================================================

    const basicSalary =
      Number(employee.monthlySalary) || 0;

    if (basicSalary <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Employee monthly salary is not set. Please set the salary in the Employee profile.",
      });
    }

    // =================================================
    // MONTH / YEAR
    //
    // Automatically taken from startDate.
    // =================================================

    const payrollMonth =
      start.getMonth() + 1;

    const payrollYear =
      start.getFullYear();

    // =================================================
    // CHECK DUPLICATE PERIOD
    // =================================================

    const existingPayroll =
      await Payroll.findOne({
        where: {
          shopId,
          employeeId,
          startDate,
          endDate,
        },
      });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll already exists for this employee for the selected period.",
      });
    }

    // =================================================
    // SALARY CALCULATION
    // =================================================

    const perDaySalary =
      basicSalary / totalDays;

    const earnedSalary =
      perDaySalary * paidDays;

    // =================================================
    // ADDITIONS
    // =================================================

    const finalAllowances =
      Math.max(Number(allowances) || 0, 0);

    const finalOvertime =
      Math.max(Number(overtimeAmount) || 0, 0);

    const finalBonus =
      Math.max(Number(bonus) || 0, 0);

    // =================================================
    // DEDUCTIONS
    // =================================================

    const finalDeductions =
      Math.max(Number(deductions) || 0, 0);

    const finalAdvanceDeduction =
      Math.max(
        Number(advanceDeduction) || 0,
        0,
      );

    const finalOtherDeductions =
      Math.max(
        Number(otherDeductions) || 0,
        0,
      );

    // =================================================
    // GROSS SALARY
    // =================================================

    const grossSalary =
      earnedSalary +
      finalAllowances +
      finalOvertime +
      finalBonus;

    // =================================================
    // TOTAL DEDUCTIONS
    // =================================================

    const totalDeductions =
      finalDeductions +
      finalAdvanceDeduction +
      finalOtherDeductions;

    // =================================================
    // NET SALARY
    // =================================================

    const netSalary = Math.max(
      grossSalary - totalDeductions,
      0,
    );

    // =================================================
    // CREATE PAYROLL
    // =================================================

    const payroll = await Payroll.create({
      shopId,
      employeeId,

      month: payrollMonth,
      year: payrollYear,

      startDate,
      endDate,

      totalDays,
      paidDays,

      unpaidDays: Math.max(
        totalDays - paidDays,
        0,
      ),

      basicSalary,

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

      // Salary has not been paid yet
      paidAmount: 0,
      dueAmount: netSalary,

      status: "PENDING",

      notes: notes?.trim() || null,

      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data: payroll,
    });
  } catch (error) {
    console.error(
      "Create payroll error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create payroll",
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

    const payrolls =
      await Payroll.findAll({
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
          ["startDate", "DESC"],
          ["createdAt", "DESC"],
        ],
      });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error(
      "Get payrolls error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get payrolls",
    });
  }
};

// =====================================================
// GET SINGLE PAYROLL
// GET /api/payroll/:id
// =====================================================

export const getPayrollById = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const shopId = req.user.shopId;

    const payroll =
      await Payroll.findOne({
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
    console.error(
      "Get payroll error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get payroll",
    });
  }
};

// =====================================================
// GET EMPLOYEE PAYROLLS
// GET /api/payroll/employee/:employeeId
// =====================================================

export const getEmployeePayrolls = async (
  req,
  res,
) => {
  try {
    const { employeeId } = req.params;

    const shopId = req.user.shopId;

    // =================================================
    // CHECK EMPLOYEE
    // =================================================

    const employee =
      await Employee.findOne({
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

    // =================================================
    // GET PAYROLLS
    // =================================================

    const payrolls =
      await Payroll.findAll({
        where: {
          shopId,
          employeeId,
        },

        order: [
          ["startDate", "DESC"],
          ["createdAt", "DESC"],
        ],
      });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error(
      "Get employee payrolls error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to get employee payrolls",
    });
  }
};

// =====================================================
// UPDATE PAYROLL
// PUT /api/payroll/:id
// =====================================================

export const updatePayroll = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const shopId = req.user.shopId;

    const updatedBy = req.user.id;

    // =================================================
    // FIND PAYROLL
    // =================================================

    const payroll =
      await Payroll.findOne({
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

    // =================================================
    // DON'T EDIT AFTER PAYMENT
    // =================================================

    if (Number(payroll.paidAmount) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll cannot be edited after a salary payment has been made.",
      });
    }

    // =================================================
    // REQUEST VALUES
    // =================================================

    const {
      startDate,
      endDate,
      allowances,
      overtimeAmount,
      bonus,
      deductions,
      advanceDeduction,
      otherDeductions,
      notes,
    } = req.body;

    // =================================================
    // DATES
    // =================================================

    const finalStartDate =
      startDate || payroll.startDate;

    const finalEndDate =
      endDate || payroll.endDate;

    const start =
      new Date(
        `${finalStartDate}T00:00:00`,
      );

    const end =
      new Date(
        `${finalEndDate}T00:00:00`,
      );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll dates",
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message:
          "Start date cannot be after end date",
      });
    }

    // =================================================
    // DAYS
    // =================================================

    const totalDays = 30;

    const calendarDays =
      calculateCalendarDays(
        finalStartDate,
        finalEndDate,
      );

    const paidDays =
      Math.min(calendarDays, 30);

    if (paidDays <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Paid days must be greater than 0",
      });
    }

    // =================================================
    // VALUES
    //
    // IMPORTANT:
    // If a value isn't sent, keep the old value.
    // =================================================

    const finalAllowances =
      allowances !== undefined
        ? Math.max(Number(allowances) || 0, 0)
        : Number(payroll.allowances) || 0;

    const finalOvertime =
      overtimeAmount !== undefined
        ? Math.max(
            Number(overtimeAmount) || 0,
            0,
          )
        : Number(payroll.overtimeAmount) || 0;

    const finalBonus =
      bonus !== undefined
        ? Math.max(Number(bonus) || 0, 0)
        : Number(payroll.bonus) || 0;

    const finalDeductions =
      deductions !== undefined
        ? Math.max(Number(deductions) || 0, 0)
        : Number(payroll.deductions) || 0;

    const finalAdvanceDeduction =
      advanceDeduction !== undefined
        ? Math.max(
            Number(advanceDeduction) || 0,
            0,
          )
        : Number(payroll.advanceDeduction) || 0;

    const finalOtherDeductions =
      otherDeductions !== undefined
        ? Math.max(
            Number(otherDeductions) || 0,
            0,
          )
        : Number(payroll.otherDeductions) || 0;

    // =================================================
    // SALARY
    // =================================================

    const basicSalary =
      Number(payroll.basicSalary) || 0;

    if (basicSalary <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Employee monthly salary is not set.",
      });
    }

    const perDaySalary =
      basicSalary / totalDays;

    const earnedSalary =
      perDaySalary * paidDays;

    // =================================================
    // GROSS
    // =================================================

    const grossSalary =
      earnedSalary +
      finalAllowances +
      finalOvertime +
      finalBonus;

    // =================================================
    // DEDUCTIONS
    // =================================================

    const totalDeductions =
      finalDeductions +
      finalAdvanceDeduction +
      finalOtherDeductions;

    // =================================================
    // NET
    // =================================================

    const netSalary = Math.max(
      grossSalary - totalDeductions,
      0,
    );

    // =================================================
    // UPDATE
    // =================================================

    await payroll.update({
      startDate: finalStartDate,
      endDate: finalEndDate,

      month: start.getMonth() + 1,
      year: start.getFullYear(),

      totalDays,
      paidDays,

      unpaidDays: Math.max(
        totalDays - paidDays,
        0,
      ),

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

      paidAmount: 0,
      dueAmount: netSalary,

      status: "PENDING",

      notes:
        notes !== undefined
          ? notes?.trim() || null
          : payroll.notes,

      updatedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: payroll,
    });
  } catch (error) {
    console.error(
      "Update payroll error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update payroll",
    });
  }
};

// =====================================================
// CANCEL PAYROLL
// PATCH /api/payroll/:id/cancel
// =====================================================

export const cancelPayroll = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const shopId = req.user.shopId;

    const updatedBy = req.user.id;

    const payroll =
      await Payroll.findOne({
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

    // =================================================
    // PAID PAYROLL CANNOT BE CANCELLED
    // =================================================

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
      message:
        "Payroll cancelled successfully",
      data: payroll,
    });
  } catch (error) {
    console.error(
      "Cancel payroll error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to cancel payroll",
    });
  }
};