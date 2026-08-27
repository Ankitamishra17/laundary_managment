import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Shop = sequelize.define(
  "Shop",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    shopCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    // Customer-facing URL with the help of slug
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    ownerName: {
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
      unique: true,
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    country: {
      type: DataTypes.STRING,
      defaultValue: "India",
    },

    gstNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Tenant branding — the customer storefront renders these dynamically
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    favicon: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    primaryColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    secondaryColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Subscription plan tier (Free / Basic / Pro / Premium) — limits are
    // enforced server-side via utils/subscription.js
    planName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Basic",
    },

    // Subscription
    subscriptionPlan: {
      type: DataTypes.ENUM("Monthly", "Yearly"),
      allowNull: false,
    },

    subscriptionAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    subscriptionStatus: {
      type: DataTypes.ENUM("Active", "Expired", "Cancelled", "Trial"),
      defaultValue: "Active",
    },

    subscriptionStart: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    subscriptionEnd: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "shops",
    timestamps: true,
  },
);

export default Shop;
