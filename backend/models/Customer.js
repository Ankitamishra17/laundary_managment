import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// ============================================================
// CUSTOMER
// Profile record for users with role "customer"
// Users table → login credentials
// Customers table → customer profile & shop information
// ============================================================

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Links to users.id
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Default shop
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
      allowNull: true,
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
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "customers",
    timestamps: true,
  },
);

export default Customer;
