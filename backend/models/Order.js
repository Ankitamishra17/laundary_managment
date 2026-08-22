import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// ============================================================
// ORDER — a customer's laundry order for a shop.
// Keeps the legacy `orders` table shape (customer_id, shop_id,
// employee_id) so any existing rows stay compatible.
// ============================================================
const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // customers.id — the customer who placed the order
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // shops.id — the laundry fulfilling the order
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // employees.id — assigned staff (optional, set by the shop)
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

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
      defaultValue: "pending",
    },

    pickup_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    pickup_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Where the clothes will be picked up from (customer supplied).
    pickup_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Where the finished clothes should be delivered (defaults to the
    // pickup address when the customer doesn't supply a separate one).
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Free-form note about the delivery (landmark, instructions, ...).
    delivery_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    delivery_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },

    payment_status: {
      type: DataTypes.ENUM("paid", "unpaid", "partial"),
      defaultValue: "unpaid",
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  },
);

export default Order;
