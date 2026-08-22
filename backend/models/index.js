import sequelize from "../config/database.js";

import Shop from "./Shop.js";
import User from "./User.js";
import Subscription from "./Subscription.js";
import Employee from "./Employee.js";
import Task from "./Tasks.js";
import Attendance from "./Attendance.js";
import InventoryItem from "./InventoryItem.js";
import Supplier from "./Supplier.js";
import InventoryTransaction from "./InventoryTransaction.js";
import Service from "./Service.js";
import Customer from "./Customer.js";
import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import Notification from "./Notification.js";

// =====================================================
// SHOP ↔ USER
// =====================================================
Shop.hasMany(User, {
  foreignKey: "shopId",
  as: "users",
});

User.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// SHOP ↔ SUBSCRIPTION
// =====================================================
Shop.hasMany(Subscription, {
  foreignKey: "shopId",
  as: "subscriptions",
});

Subscription.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// Shop level (admin) — employees & tasks
// =====================================================
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

// =====================================================
// TASK ↔ ORDER (task assigned to fulfil an order)
// =====================================================
Task.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

Order.hasMany(Task, {
  foreignKey: "order_id",
  as: "tasks",
});

// =====================================================
// Attendance — one record per employee per day
// =====================================================
Attendance.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

Employee.hasMany(Attendance, {
  foreignKey: "employee_id",
  as: "attendance",
});

// =====================================================
// SHOP ↔ INVENTORY ITEM
// =====================================================
Shop.hasMany(InventoryItem, {
  foreignKey: "shopId",
  as: "inventoryItems",
});

InventoryItem.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// SHOP ↔ SUPPLIER
// =====================================================
Shop.hasMany(Supplier, {
  foreignKey: "shopId",
  as: "suppliers",
});

Supplier.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// INVENTORY ITEM ↔ INVENTORY TRANSACTION
// =====================================================
InventoryItem.hasMany(InventoryTransaction, {
  foreignKey: "inventoryItemId",
  as: "transactions",
});

InventoryTransaction.belongsTo(InventoryItem, {
  foreignKey: "inventoryItemId",
  as: "inventoryItem",
});

// =====================================================
// SUPPLIER ↔ INVENTORY TRANSACTION
// =====================================================
Supplier.hasMany(InventoryTransaction, {
  foreignKey: "supplierId",
  as: "inventoryTransactions",
});

InventoryTransaction.belongsTo(Supplier, {
  foreignKey: "supplierId",
  as: "supplier",
});

// =====================================================
// SHOP ↔ SERVICES (catalog)
// =====================================================
Shop.hasMany(Service, {
  foreignKey: "shopId",
  as: "services",
});

Service.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// USER ↔ CUSTOMER (login account ↔ profile record)
// =====================================================
User.hasOne(Customer, {
  foreignKey: "userId",
  as: "customer",
});

Customer.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// =====================================================
// SHOP ↔ CUSTOMER (default shop)
// =====================================================
Shop.hasMany(Customer, {
  foreignKey: "shopId",
  as: "customers",
});

Customer.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// ORDER ↔ CUSTOMER / SHOP / EMPLOYEE / ORDER ITEMS
// =====================================================
Customer.hasMany(Order, {
  foreignKey: "customer_id",
  as: "orders",
});

Order.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

Shop.hasMany(Order, {
  foreignKey: "shop_id",
  as: "orders",
});

Order.belongsTo(Shop, {
  foreignKey: "shop_id",
  as: "shop",
});

Order.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
});

OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

OrderItem.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

// =====================================================
// NOTIFICATIONS — target by user / employee / shop
// =====================================================
Shop.hasMany(Notification, {
  foreignKey: "shopId",
  as: "notifications",
});

Notification.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
});

Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Employee.hasMany(Notification, {
  foreignKey: "employeeId",
  as: "notifications",
});

Notification.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee",
});

export { sequelize, Shop, User, Subscription, Employee, Task, Attendance, InventoryItem, Supplier, InventoryTransaction, Service, Customer, Order, OrderItem, Notification };
export default sequelize;
