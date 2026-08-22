import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const InventoryTransaction = sequelize.define(
  "InventoryTransaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Which shop owns this transaction
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Which inventory item changed
    inventoryItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Supplier is required for purchase/stock-in
    // but not required for stock-out
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Type of stock movement
    type: {
      type: DataTypes.ENUM(
        "IN",
        "OUT",
        "ADJUSTMENT"
      ),
      allowNull: false,
    },

    // Quantity that was added/removed
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Stock before this transaction
    previousStock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Stock after this transaction
    newStock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Purchase rate per unit
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    // Total purchase amount
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },

    // Why stock changed
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Optional additional information
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // User who performed transaction
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "inventory_transactions",
    timestamps: true,
  }
);

export default InventoryTransaction;