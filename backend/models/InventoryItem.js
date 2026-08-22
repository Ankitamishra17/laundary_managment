import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const InventoryItem = sequelize.define(
  "InventoryItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Which shop owns this inventory item
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // Kg, Litre, Piece, Box, Pack etc.
    unit: {
      type: DataTypes.ENUM("Kg", "Litre", "Piece", "Box", "Pack"),
      allowNull: false,
    },

    // Current available quantity
    currentStock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Alert when stock reaches this level
    minStock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
      defaultValue: "Active",
    },

    // Soft delete
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: "inventory_items",
    timestamps: true,
  },
);

export default InventoryItem;
