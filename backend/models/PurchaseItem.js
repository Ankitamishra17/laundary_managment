import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PurchaseItem = sequelize.define(
  "PurchaseItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Which purchase this item belongs to
    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Which inventory item was purchased
    inventoryItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Quantity purchased
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },

    // Purchase rate per unit
    rate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },

    // quantity × rate
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: "purchase_items",
    timestamps: true,
  },
);

export default PurchaseItem;
