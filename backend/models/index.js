import sequelize from "../config/database.js";

import Shop from "./Shop.js";
import User from "./User.js";
import Subscription from "./Subscription.js";
import InventoryItem from "./InventoryItem.js";
import Supplier from "./Supplier.js";
import InventoryTransaction from "./InventoryTransaction.js";
import Notification from "./Notification.js";
import Payment from "./Payment.js";
import Purchase from "./Purchase.js";
import PurchaseItem from "./PurchaseItem.js";
import Employee from "./Employee.js";
import Task from "./Tasks.js";
import Attendance from "./Attendance.js";
import Payroll from "./Payroll.js";

// If Customer model exists in your project, uncomment:
// import Customer from "./Customer.js";

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
// CUSTOMER ↔ PAYMENT
// =====================================================

// Uncomment only if Customer model exists

// Customer.hasMany(Payment, {
//   foreignKey: "customerId",
//   as: "payments",
// });

// Payment.belongsTo(Customer, {
//   foreignKey: "customerId",
//   as: "customer",
// });

// =====================================================
// NOTIFICATION ↔ SHOP
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
// NOTIFICATION ↔ USER
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
// NOTIFICATION ↔ INVENTORY ITEM
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
// SHOP ↔ EMPLOYEE
// =====================================================

// Your Employee model currently uses shop_id

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

Task.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

Employee.hasMany(Task, {
  foreignKey: "employee_id",
  as: "tasks",
});

// =====================================================
// EMPLOYEE ↔ ATTENDANCE
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
// SHOP ↔ PAYROLL
// =====================================================

// Payroll model uses shopId

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

// Payroll model uses employeeId

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

// Payment.payrollId points to Payroll.id

Payroll.hasMany(Payment, {
  foreignKey: "payrollId",
  as: "payments",
});

Payment.belongsTo(Payroll, {
  foreignKey: "payrollId",
  as: "payroll",
});

// =====================================================
// EXPORT
// =====================================================

export {
  sequelize,
  Shop,
  User,
  Subscription,
  InventoryItem,
  Supplier,
  InventoryTransaction,
  Notification,
  Employee,
  Task,
  Attendance,
  Payroll,
  Payment,
  Purchase,
  PurchaseItem,
};