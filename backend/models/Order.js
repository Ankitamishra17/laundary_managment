import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Customer who placed the order
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Shop to which this order belongs
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Employee assigned to this order
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Order Status
    status: {
      type: DataTypes.ENUM(
        "pending",
        "picked_up",
        "processing",
        "ready_for_delivery",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    // Pickup Date & Time
    pickup_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    pickup_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Delivery Date & Time
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    delivery_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Final Order Amount
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    // Payment Status
    payment_status: {
      type: DataTypes.ENUM("paid", "unpaid", "partial"),
      allowNull: false,
      defaultValue: "unpaid",
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  },
);

export default Order;
