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
      allowNull: false,
      defaultValue: "India",
    },

    gstNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // logoUrl: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },

    // website: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },

    // plan: {
    //   type: DataTypes.ENUM("Trial", "Basic", "Standard", "Premium"),
    //   defaultValue: "Trial",
    // },

    subscriptionStatus: {
      type: DataTypes.ENUM("Active", "Expired", "Cancelled"),
      defaultValue: "Active",
    },

    subscriptionStart: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    subscriptionEnd: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    monthlyFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "shops",
    timestamps: true,
  },
);

export default Shop;
