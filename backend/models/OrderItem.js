import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// ============================================================
// ORDER ITEM — a single line on an order (snapshot of the
// service at the time of ordering, so prices never change
// retroactively).
// ============================================================
const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Reference to the services catalog row (optional — kept
    // even if the service is later deleted from the catalog)
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    // Optional customer-supplied label for the clothes on this line,
    // e.g. "Shirt", "Pant", "Jacket". Falls back to the service name
    // in the UI when empty.
    item_label: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    lineTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "order_items",
    timestamps: true,
  },
);

export default OrderItem;
