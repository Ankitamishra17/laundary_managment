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
    // ATTENDANCE / SALARY DAYS
    // ==========================================

    // Total salary calculation days
    totalDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: 1,
      },
    },

    // Days for which salary is payable
    paidDays: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Days without salary
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

    basicSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Automatically calculated by controller:
    // basicSalary / totalDays
    perDaySalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Salary earned for paidDays:
    // perDaySalary * paidDays
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
    //
    // grossSalary
    // - deductions
    // - advanceDeduction
    // - otherDeductions
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
    // Updated when employee salary payment is made
    // ==========================================

    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    dueAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

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

    // One payroll per employee per month/year/shop
    indexes: [
      {
        unique: true,
        fields: ["shopId", "employeeId", "month", "year"],
      },
    ],
  },
);

export default Payroll;
