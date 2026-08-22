import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// ============================================================
// NOTIFICATION — in-app notification row.
// Exactly one of the three target columns is usually set:
//   userId     → users table account (customer / shop admin / super admin)
//   employeeId → employees table account
//   shopId     → broadcast to the whole shop (legacy fallback)
// The frontend scopes by role: customers read userId, employees read
// employeeId, admins read shopId.
// ============================================================
const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // users.id — the recipient when the account lives in the users table
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // employees.id — the recipient when the account is an employee
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // shops.id — shop-scoped notifications (seen by that shop's admins)
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // order | task | system | payment
    type: {
      type: DataTypes.STRING(50),
      defaultValue: "system",
    },

    // Frontend route the notification should open, e.g. "/admin/orders"
    link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
  },
);

export default Notification;
