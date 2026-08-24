import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Purchase = sequelize.define(
  "Purchase",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Which shop owns this purchase
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Supplier from whom the purchase was made
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Supplier invoice number
    invoiceNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Date of purchase
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // Total before discount/tax
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Discount given by supplier
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Tax amount, if applicable
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Final purchase amount
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Amount already paid to supplier
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Remaining amount payable to supplier
    dueAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Purchase payment status
    status: {
      type: DataTypes.ENUM("PENDING", "PARTIAL", "PAID"),
      allowNull: false,
      defaultValue: "PENDING",
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

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
    tableName: "purchases",
    timestamps: true,
  },
);

export default Purchase;
