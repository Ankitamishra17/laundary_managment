import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Complaint = sequelize.define(
  "Complaint",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        "quality",
        "delay",
        "damage",
        "billing",
        "service",
        "other",
      ),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "open",
        "in_progress",
        "resolved",
        "closed",
      ),
      allowNull: false,
      defaultValue: "open",
    },
    assigned_employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    admin_reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    admin_replied_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "complaints",
    timestamps: true,
  },
);

export default Complaint;
