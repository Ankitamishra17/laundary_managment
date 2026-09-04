import { Model, DataTypes, Op } from "sequelize";

import sequelize from "../config/database.js";

class Task extends Model {}

Task.init(
  {
    // ============================================================
    // SHOP — TENANT
    // Every task belongs to exactly one shop.
    // ============================================================
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ============================================================
    // EMPLOYEE
    // Employee assigned to this task.
    // ============================================================
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ============================================================
    // ORDER
    // Optional because standalone tasks are allowed.
    // ============================================================
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // ============================================================
    // CUSTOMER SNAPSHOT
    // ============================================================
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

    // ============================================================
    // TASK TYPE
    // ============================================================
    task_type: {
      type: DataTypes.ENUM("pickup", "wash", "dry", "iron", "pack", "delivery"),
      allowNull: false,
    },

    // ============================================================
    // TASK SEQUENCE
    //
    // pickup   = 1
    // wash     = 2
    // dry      = 3
    // iron     = 4
    // pack     = 5
    // delivery = 6
    //
    // This is used to control the order in which tasks can start.
    // ============================================================
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ============================================================
    // SCHEDULE
    // ============================================================
    scheduled_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // ============================================================
    // PRIORITY
    // ============================================================
    priority: {
      type: DataTypes.ENUM("normal", "urgent"),
      defaultValue: "normal",
    },

    // ============================================================
    // STATUS
    // ============================================================
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed"),
      defaultValue: "pending",
    },

    // ============================================================
    // ACTIVATED AT
    //
    // When the task becomes ready/active.
    // ============================================================
    activated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // ============================================================
    // NOTES
    // ============================================================
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ============================================================
    // LIFECYCLE
    // ============================================================
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
      // ==========================================================
      // Prevent duplicate assignment inside SAME SHOP.
      //
      // Same shop + same order + same task + same employee
      // cannot be assigned twice.
      //
      // Because order_id can be NULL, MySQL allows multiple
      // standalone tasks with NULL order_id.
      // ==========================================================
      {
        unique: true,
        fields: ["shop_id", "order_id", "task_type", "employee_id"],
        name: "unique_shop_order_task_employee",
      },

      // ==========================================================
      // Employee task queries
      // ==========================================================
      {
        fields: ["shop_id", "employee_id", "status"],
        name: "idx_task_shop_employee_status",
      },

      // ==========================================================
      // Order task queries
      // ==========================================================
      {
        fields: ["shop_id", "order_id", "status"],
        name: "idx_task_shop_order_status",
      },

      // ==========================================================
      // Sequence queries
      // ==========================================================
      {
        fields: ["shop_id", "order_id", "sequence"],
        name: "idx_task_shop_order_sequence",
      },
    ],
  },
);

export default Task;
