import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TaskInventoryUsage = sequelize.define(
  "TaskInventoryUsage",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    inventoryItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "task_inventory_usages",
    timestamps: true,
  },
);

export default TaskInventoryUsage;
