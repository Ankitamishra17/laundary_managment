"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      if (models.Employee) {
        Task.belongsTo(models.Employee, { foreignKey: "employee_id", as: "employee" });
      }
      if (models.Order) {
        Task.belongsTo(models.Order, { foreignKey: "order_id", as: "order" });
      }
    }
  }

  Task.init(
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // some tasks (rare) may not map to an order
      },
      customer_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customer_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customer_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      task_type: {
        type: DataTypes.ENUM("pickup", "wash", "dry", "iron", "pack", "delivery"),
        allowNull: false,
      },
      scheduled_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM("normal", "urgent"),
        defaultValue: "normal",
      },
      status: {
        type: DataTypes.ENUM("pending", "in_progress", "completed"),
        defaultValue: "pending",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Task",
      tableName: "tasks",
      timestamps: true,
    }
  );

  return Task;
};