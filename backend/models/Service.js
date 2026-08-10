import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    category: {
      type: DataTypes.ENUM(
        "Washing",
        "Ironing",
        "Dry Cleaning",
        "Premium",
        "Household",
      ),
      allowNull: false,
    },

    pricingType: {
      type: DataTypes.ENUM("Per Item", "Per Kg", "Fixed Price"),
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    estimatedTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active",
    },

    // Soft Delete
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    deletedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Audit Fields
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "services",
    timestamps: true,
  },
);

export default Service;
