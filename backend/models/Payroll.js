import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Payroll = sequelize.define(
  "Payroll",
  {
    // ==========================================
    // ID
    // ==========================================

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // ==========================================
    // SHOP
    // ==========================================

    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ==========================================
    // EMPLOYEE
    // ==========================================

    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ==========================================
    // PAYROLL PERIOD
    // ==========================================

    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },

    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ==========================================
    // SALARY PERIOD
    // Example:
    // 01 Aug 2026 - 15 Aug 2026
    // ==========================================

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // ==========================================
    // ATTENDANCE / SALARY DAYS
    // ==========================================

    // Total days used for salary calculation
    // Example: 30
    totalDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: 1,
      },
    },

    // Days for which salary is payable
    // Example: 15
    paidDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Days without salary
    // Example: 15
    unpaidDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // ==========================================
    // MONTHLY SALARY
    // ==========================================

    // Employee's monthly salary
    // Example: ₹15,000
    basicSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // basicSalary / totalDays
    // Example: 15000 / 30 = 500
    perDaySalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // perDaySalary * paidDays
    // Example: 500 * 15 = 7500
    earnedSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // ==========================================
    // ADDITIONS
    // ==========================================

    allowances: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    overtimeAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    bonus: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // ==========================================
    // GROSS SALARY
    //
    // earnedSalary
    // + allowances
    // + overtimeAmount
    // + bonus
    // ==========================================

    grossSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // ==========================================
    // DEDUCTIONS
    // ==========================================

    deductions: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    advanceDeduction: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    otherDeductions: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // ==========================================
    // FINAL NET SALARY
    // ==========================================

    netSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // ==========================================
    // PAYMENT TRACKING
    // ==========================================

    // Amount actually paid through Employee Payment
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // netSalary - paidAmount
    dueAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: DataTypes.ENUM("PENDING", "PARTIAL", "PAID", "CANCELLED"),
      allowNull: false,
      defaultValue: "PENDING",
    },

    // ==========================================
    // NOTES
    // ==========================================

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ==========================================
    // AUDIT
    // ==========================================

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },

  {
    tableName: "payrolls",
    timestamps: true,

    // ==========================================
    // UNIQUE PAYROLL PERIOD
    //
    // Same employee can have:
    //
    // 01 Aug - 15 Aug
    // 16 Aug - 31 Aug
    //
    // But cannot create the exact same period twice.
    // ==========================================

    indexes: [
      {
        unique: true,
        fields: ["shopId", "employeeId", "startDate", "endDate"],
      },
    ],
  },
);

export default Payroll;
