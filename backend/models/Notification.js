import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// ============================================================
// NOTIFICATION
// Supports:
// - Inventory / low-stock notifications
// - User notifications
// - Employee notifications
// - Task notifications
// - Order notifications
// - Shop-wide notifications
// ============================================================

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Shop to which this notification belongs
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Recipient from users table
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Recipient from employees table
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Related inventory item for LOW_STOCK notifications
    inventoryItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Related task
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Related order
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "system",
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,

     
      allowNull: false,
 
    },

    // Frontend route to open when notification is clicked
    link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // Useful for LOW_STOCK notifications
    isResolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
  }
);

export default Notification;