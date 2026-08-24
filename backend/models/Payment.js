import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Shop
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Payment Number
    paymentNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    // CUSTOMER / SUPPLIER / SALARY
    paymentType: {
      type: DataTypes.ENUM("CUSTOMER", "SUPPLIER", "SALARY"),
      allowNull: false,
    },

    // Related person
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Related records
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    payrollId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Payment Amount
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },

    // Payment Method
    paymentMethod: {
      type: DataTypes.ENUM(
        "Cash",
        "UPI",
        "Card",
        "Bank_Transfer",
        "Cheque"
      ),
      allowNull: false,
    },

    // Payment Status
    status: {
      type: DataTypes.ENUM(
        "Pending",
        "Paid",
        "Failed",
        "Cancelled",
        "Refunded"
      ),
      allowNull: false,
      defaultValue: "Paid",
    },

    // Transaction Details
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    referenceNumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // Payment Date
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // Notes
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Created By
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Refund Information
    refundAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    refundDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
  }
);

export default Payment;