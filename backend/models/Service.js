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

    // Free-text category so the shop admin can add custom categories
    // (Washing, Dry Cleaning, Ironing, Shoe Cleaning, ...) — the form
    // suggests common ones but never restricts.
    category: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    // How the service is priced — the customer-facing unit list.
    pricingType: {
      type: DataTypes.ENUM(
        "Per Kg",
        "Per Piece",
        "Per Pair",
        "Per Item",
        "Fixed",
      ),
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
