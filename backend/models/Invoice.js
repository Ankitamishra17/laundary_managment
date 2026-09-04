import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Invoice = sequelize.define(
  "Invoice",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Unique invoice number per tenant, e.g. WF-INV-00001
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    // Linked order — one order has at most one invoice
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Customer who owns this invoice
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Shop / tenant that issued the invoice
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Line items snapshot (JSON array of { name, quantity, price, lineTotal, itemLabel })
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    // Financials
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Tax percentage, e.g. 18 for 18% GST",
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    deliveryCharge: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Delivery / shipping charge added to the invoice",
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "subtotal - discount + taxAmount + deliveryCharge",
    },

    // Payment
    paymentStatus: {
      type: DataTypes.ENUM(
        "Unpaid",
        "Pending",
        "Partial",
        "Paid",
        "Failed",
        "Refunded",
        "Cancelled"
      ),
      allowNull: false,
      defaultValue: "Unpaid",
    },
    amountPaid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paymentMethod: {
      type: DataTypes.ENUM("Cash", "UPI", "Card", "Bank_Transfer", "Online"),
      allowNull: true,
    },

    // Dates
    issuedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    paidDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // Customer info snapshot (so invoice stays valid even if customer changes details)
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Shop info snapshot
    shopName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shopAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shopPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shopGstNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "invoices",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["orderId", "shopId"],
        name: "uniq_invoice_order_shop",
      },
      {
        fields: ["shopId"],
      },
      {
        fields: ["customerId"],
      },
      {
        fields: ["invoiceNumber"],
      },
    ],
  }
);

export default Invoice;
