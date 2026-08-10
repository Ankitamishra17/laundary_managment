import Shop from "./Shop.js";
import User from "./User.js";
import Subscription from "./Subscription.js";
import InventoryItem from "./InventoryItem.js";
import Supplier from "./Supplier.js";
import InventoryTransaction from "./InventoryTransaction.js";

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
// EXPORT
// =====================================================

export {
  Shop,
  User,
  Subscription,
  InventoryItem,
  Supplier,
  InventoryTransaction,
};
