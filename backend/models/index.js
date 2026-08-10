import sequelize from "../config/database.js";

import Shop from "./Shop.js";
import User from "./User.js";
import Subscription from "./Subscription.js";
import Employee from "./Employee.js";
import Task from "./Tasks.js";
import Attendance from "./Attendance.js";

// ============================================================
// Platform level (super admin) associations
// ============================================================
Shop.hasMany(User, {
  foreignKey: "shopId",
  as: "users",
});

User.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

Shop.hasMany(Subscription, {
  foreignKey: "shopId",
  as: "subscriptions",
});

Subscription.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// ============================================================
// Shop level (admin) associations — employees & tasks
// ============================================================
Shop.hasMany(Employee, {
  foreignKey: "shop_id",
  as: "employees",
});

Employee.belongsTo(Shop, {
  foreignKey: "shop_id",
  as: "shop",
});

Task.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

Employee.hasMany(Task, {
  foreignKey: "employee_id",
  as: "tasks",
});

// ============================================================
// Attendance — one record per employee per day
// ============================================================
Attendance.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

Employee.hasMany(Attendance, {
  foreignKey: "employee_id",
  as: "attendance",
});

export { sequelize, Shop, User, Subscription, Employee, Task, Attendance };
export default sequelize;
