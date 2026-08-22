import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// ============================================================
// CUSTOMER — profile record for users with role "customer"
// The users table holds the login credentials (email/password),
// while this table stores the customer profile & default shop.
// ============================================================
const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Links to users.id (login account)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Default laundry the customer orders from.
    // Optional — a customer can sign up first and pick a laundry later
    // (it is auto-set to the shop of their first order).
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "customers",
    timestamps: true,
  },
);

export default Customer;
