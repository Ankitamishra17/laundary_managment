import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // shops.id
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // users.id
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // employees.id
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // inventory_items.id
    inventoryItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // subscriptions.id
    subscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // tasks.id
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // orders.id
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // order | task | system | payment | LOW_STOCK
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "system",
    },

    // Frontend route
    // Example: /admin/orders
    link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

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