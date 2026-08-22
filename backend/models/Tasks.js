import { Model, DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

class Task extends Model {}

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
    // Lifecycle timestamps — track when the task was started and completed
    // so the admin/employee history views can show accurate timing.
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },


  
  {
    sequelize,
    modelName: "Task",
    tableName: "tasks",
    timestamps: true,
    indexes: [
      {
        // Prevent duplicate task assignment: the same employee cannot be
        // assigned the same task_type for the same order more than once.
        // A null order_id is excluded (unique constraint allows multiple
        // nulls in most databases, but we handle nulls explicitly in code).
        unique: true,
        fields: ["order_id", "task_type", "employee_id"],
        where: {
          order_id: { [Op.ne]: null },
        },
      },
    ],
  }
);

export default Task;
