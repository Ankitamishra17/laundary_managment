import sequelize from "../config/database.js";

import Shop from "./Shop.js";
import User from "./User.js";
import Subscription from "./Subscription.js";

import Employee from "./Employee.js";
import Task from "./Tasks.js";
import Attendance from "./Attendance.js";
import Payroll from "./Payroll.js";

import InventoryItem from "./InventoryItem.js";
import Supplier from "./Supplier.js";
import InventoryTransaction from "./InventoryTransaction.js";

import Payment from "./Payment.js";
import Purchase from "./Purchase.js";
import PurchaseItem from "./PurchaseItem.js";

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
// SHOP ↔ EMPLOYEE
// =====================================================

Shop.hasMany(Employee, {
  foreignKey: "shop_id",
  as: "employees",
});

Employee.belongsTo(Shop, {
  foreignKey: "shop_id",
  as: "shop",
});

// =====================================================
// EMPLOYEE ↔ TASK
// =====================================================

Employee.hasMany(Task, {
  foreignKey: "employee_id",
  as: "tasks",
});

Task.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// =====================================================
// TASK ↔ ORDER
// =====================================================

Order.hasMany(Task, {
  foreignKey: "order_id",
  as: "tasks",
});

Task.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

// =====================================================
// EMPLOYEE ↔ ATTENDANCE
// =====================================================

Employee.hasMany(Attendance, {
  foreignKey: "employee_id",
  as: "attendance",
});

Attendance.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
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
// SHOP ↔ CUSTOMER
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
// USER ↔ CUSTOMER
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
// CUSTOMER ↔ ORDER
// =====================================================

Customer.hasMany(Order, {
  foreignKey: "customer_id",
  as: "orders",
});

Order.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

// =====================================================
// SHOP ↔ ORDER
// =====================================================

Shop.hasMany(Order, {
  foreignKey: "shop_id",
  as: "orders",
});

Order.belongsTo(Shop, {
  foreignKey: "shop_id",
  as: "shop",
});

// =====================================================
// EMPLOYEE ↔ ORDER
// =====================================================

Employee.hasMany(Order, {
  foreignKey: "employee_id",
  as: "orders",
});

Order.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// =====================================================
// ORDER ↔ ORDER ITEM
// =====================================================

Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
});

OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

// =====================================================
// ORDER ITEM ↔ SERVICE
// =====================================================

OrderItem.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

// Optional but useful
Service.hasMany(OrderItem, {
  foreignKey: "serviceId",
  as: "orderItems",
});

// =====================================================
// SHOP ↔ SERVICE
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
// SHOP ↔ PURCHASE
// =====================================================

Shop.hasMany(Purchase, {
  foreignKey: "shopId",
  as: "purchases",
});

Purchase.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// SUPPLIER ↔ PURCHASE
// =====================================================

Supplier.hasMany(Purchase, {
  foreignKey: "supplierId",
  as: "purchases",
});

Purchase.belongsTo(Supplier, {
  foreignKey: "supplierId",
  as: "supplier",
});

// =====================================================
// PURCHASE ↔ PURCHASE ITEM
// =====================================================

Purchase.hasMany(PurchaseItem, {
  foreignKey: "purchaseId",
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PurchaseItem.belongsTo(Purchase, {
  foreignKey: "purchaseId",
  as: "purchase",
});

// =====================================================
// INVENTORY ITEM ↔ PURCHASE ITEM
// =====================================================

InventoryItem.hasMany(PurchaseItem, {
  foreignKey: "inventoryItemId",
  as: "purchaseItems",
});

PurchaseItem.belongsTo(InventoryItem, {
  foreignKey: "inventoryItemId",
  as: "inventoryItem",
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
// PURCHASE ↔ INVENTORY TRANSACTION
// =====================================================

Purchase.hasMany(InventoryTransaction, {
  foreignKey: "purchaseId",
  as: "inventoryTransactions",
});

InventoryTransaction.belongsTo(Purchase, {
  foreignKey: "purchaseId",
  as: "purchase",
});

// =====================================================
// SHOP ↔ PAYMENT
// =====================================================

Shop.hasMany(Payment, {
  foreignKey: "shopId",
  as: "payments",
});

Payment.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// CUSTOMER ↔ PAYMENT
// =====================================================

Customer.hasMany(Payment, {
  foreignKey: "customerId",
  as: "payments",
});

Payment.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

// =====================================================
// SUPPLIER ↔ PAYMENT
// =====================================================

Supplier.hasMany(Payment, {
  foreignKey: "supplierId",
  as: "payments",
});

Payment.belongsTo(Supplier, {
  foreignKey: "supplierId",
  as: "supplier",
});

// =====================================================
// PURCHASE ↔ PAYMENT
// =====================================================

Purchase.hasMany(Payment, {
  foreignKey: "purchaseId",
  as: "payments",
});

Payment.belongsTo(Purchase, {
  foreignKey: "purchaseId",
  as: "purchase",
});

// =====================================================
// EMPLOYEE ↔ PAYMENT
// =====================================================

Employee.hasMany(Payment, {
  foreignKey: "employeeId",
  as: "payments",
});

Payment.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee",
});

// =====================================================
// SHOP ↔ PAYROLL
// =====================================================

Shop.hasMany(Payroll, {
  foreignKey: "shopId",
  as: "payrolls",
});

Payroll.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// EMPLOYEE ↔ PAYROLL
// =====================================================

Employee.hasMany(Payroll, {
  foreignKey: "employeeId",
  as: "payrolls",
});

Payroll.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee",
});

// =====================================================
// PAYROLL ↔ PAYMENT
// =====================================================

Payroll.hasMany(Payment, {
  foreignKey: "payrollId",
  as: "payments",
});

Payment.belongsTo(Payroll, {
  foreignKey: "payrollId",
  as: "payroll",
});

// =====================================================
// SHOP ↔ NOTIFICATION
// =====================================================

Shop.hasMany(Notification, {
  foreignKey: "shopId",
  as: "notifications",
});

Notification.belongsTo(Shop, {
  foreignKey: "shopId",
  as: "shop",
});

// =====================================================
// USER ↔ NOTIFICATION
// =====================================================

User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
});

Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// =====================================================
// EMPLOYEE ↔ NOTIFICATION
// =====================================================

Employee.hasMany(Notification, {
  foreignKey: "employeeId",
  as: "notifications",
});

Notification.belongsTo(Employee, {
  foreignKey: "employeeId",
  as: "employee",
});

// =====================================================
// INVENTORY ITEM ↔ NOTIFICATION
// =====================================================

InventoryItem.hasMany(Notification, {
  foreignKey: "inventoryItemId",
  as: "notifications",
});

Notification.belongsTo(InventoryItem, {
  foreignKey: "inventoryItemId",
  as: "inventoryItem",
});

// =====================================================
// EXPORT
// =====================================================

export {
  Shop,
  User,
  Subscription,
  Employee,
  Task,
  Attendance,
  Payroll,
  InventoryItem,
  Supplier,
  InventoryTransaction,
  Payment,
  Purchase,
  PurchaseItem,
  Service,
  Customer,
  Order,
  OrderItem,
  Notification,
};

export default sequelize;
