import { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingCart,
} from "lucide-react";

import { getInventoryItems } from "../../../api/inventoryApi";
import { getInventoryTransactions } from "../../../api/inventoryTransactionApi";
import { getSuppliers } from "../../../api/supplierApi";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInventory = async () => {
    try {
      setRefreshing(true);

      const [inventoryRes, transactionRes, supplierRes] =
        await Promise.all([
          getInventoryItems(),
          getInventoryTransactions(),
          getSuppliers(),
        ]);

      setItems(inventoryRes?.data || []);
      setTransactions(transactionRes?.data || []);
      setSuppliers(supplierRes?.data || []);
    } catch (error) {
      console.error("Inventory Summary Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // ============================
  // INVENTORY CALCULATIONS
  // ============================

  const totalItems = items.length;

  const lowStockItems = items.filter(
    (item) =>
      Number(item.currentStock) <= Number(item.minStock)
  );

  const outOfStockItems = items.filter(
    (item) => Number(item.currentStock) <= 0
  );

  const totalStock = items.reduce(
    (total, item) => total + Number(item.currentStock || 0),
    0
  );

  const activeItems = items.filter(
    (item) => item.status === "Active"
  ).length;

  const stockInTransactions = transactions.filter(
    (transaction) => transaction.type === "IN"
  );

  const stockOutTransactions = transactions.filter(
    (transaction) => transaction.type === "OUT"
  );

  // ============================
  // RECENT TRANSACTIONS
  // ============================

  const recentTransactions = transactions.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#F4F8F7] p-4 sm:p-6 lg:p-8">

      {/* ================= HEADER ================= */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1
            className="text-2xl font-semibold text-[#05282A]"
            style={{
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            Inventory
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor stock, suppliers and inventory movements.
          </p>
        </div>

        <button
          onClick={loadInventory}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Items */}
        <SummaryCard
          title="Total Items"
          value={loading ? "..." : totalItems}
          subtitle={`${activeItems} active items`}
          icon={Package}
          iconBg="#E3F5F3"
          iconColor="#028090"
        />

        {/* Total Stock */}
        <SummaryCard
          title="Current Stock"
          value={loading ? "..." : totalStock}
          subtitle="Total available quantity"
          icon={TrendingUp}
          iconBg="#E5F7EF"
          iconColor="#02A67D"
        />

        {/* Low Stock */}
        <SummaryCard
          title="Low Stock"
          value={loading ? "..." : lowStockItems.length}
          subtitle="Items need attention"
          icon={AlertTriangle}
          iconBg="#FFF4DD"
          iconColor="#D99000"
        />

        {/* Suppliers */}
        <SummaryCard
          title="Suppliers"
          value={loading ? "..." : suppliers.length}
          subtitle="Registered suppliers"
          icon={Users}
          iconBg="#E8F0FA"
          iconColor="#4169A1"
        />
      </div>

      {/* ================= QUICK ACTIONS ================= */}

      <div className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#05282A]">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            Manage your inventory quickly.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <QuickAction
            icon={Plus}
            label="Add Item"
            onClick={() => console.log("Add Item")}
          />

          <QuickAction
            icon={ArrowDownToLine}
            label="Stock In"
            onClick={() => console.log("Stock In")}
          />

          <QuickAction
            icon={ArrowUpFromLine}
            label="Stock Out"
            onClick={() => console.log("Stock Out")}
          />

          <QuickAction
            icon={ShoppingCart}
            label="Purchase"
            onClick={() => console.log("Purchase")}
          />

        </div>
      </div>

      {/* ================= STOCK STATUS ================= */}

      <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Low Stock */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

            <div>
              <h2 className="font-semibold text-[#05282A]">
                Low Stock Items
              </h2>

              <p className="text-xs text-gray-400">
                Items below minimum stock level
              </p>
            </div>

            <AlertTriangle
              size={20}
              className="text-orange-500"
            />

          </div>

          {lowStockItems.length === 0 ? (
            <EmptyState message="All inventory items have sufficient stock." />
          ) : (
            <div className="divide-y divide-gray-100">

              {lowStockItems.slice(0, 6).map((item) => (

                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                      <Package
                        size={17}
                        className="text-orange-500"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {item.name}
                      </p>

                      <p className="text-xs text-gray-400">
                        Minimum: {item.minStock} {item.unit}
                      </p>
                    </div>

                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500">
                      {item.currentStock} {item.unit}
                    </p>

                    <p className="text-[11px] text-gray-400">
                      Current
                    </p>
                  </div>

                </div>

              ))}

            </div>
          )}

        </div>

        {/* Stock Overview */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-5 py-4">

            <h2 className="font-semibold text-[#05282A]">
              Stock Overview
            </h2>

            <p className="text-xs text-gray-400">
              Current inventory levels
            </p>

          </div>

          <div className="divide-y divide-gray-100">

            {items.length === 0 ? (
              <EmptyState message="No inventory items found." />
            ) : (
              items.slice(0, 6).map((item) => {

                const current = Number(item.currentStock || 0);
                const minimum = Number(item.minStock || 0);

                const percentage =
                  minimum > 0
                    ? Math.min((current / minimum) * 100, 100)
                    : 100;

                const isLow = current <= minimum;

                return (
                  <div
                    key={item.id}
                    className="px-5 py-4"
                  >

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-sm font-medium text-gray-700">
                        {item.name}
                      </span>

                      <span
                        className={`text-xs font-semibold ${
                          isLow
                            ? "text-red-500"
                            : "text-[#028090]"
                        }`}
                      >
                        {current} {item.unit}
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                      <div
                        className={`h-full rounded-full ${
                          isLow
                            ? "bg-orange-400"
                            : "bg-[#02C39A]"
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </div>
      </div>

      {/* ================= RECENT TRANSACTIONS ================= */}

      <div className="mt-7 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-5 py-4">

          <h2 className="font-semibold text-[#05282A]">
            Recent Stock Movements
          </h2>

          <p className="text-xs text-gray-400">
            Latest inventory transactions
          </p>

        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState message="No inventory transactions yet." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px]">

              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Item
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                    Date
                  </th>

                </tr>
              </thead>

              <tbody>

                {recentTransactions.map((transaction) => {

                  const isIn = transaction.type === "IN";

                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-50 last:border-0"
                    >

                      <td className="px-5 py-4 text-sm font-medium text-gray-700">
                        {transaction.inventoryItem?.name ||
                          transaction.itemName ||
                          "Inventory Item"}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            isIn
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {isIn ? "Stock In" : "Stock Out"}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {transaction.quantity || 0}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-400">
                        {transaction.createdAt
                          ? new Date(
                              transaction.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}


/* ==========================================
   SUMMARY CARD
========================================== */

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-semibold text-[#05282A]">
            {value}
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            {subtitle}
          </p>
        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: iconBg,
          }}
        >
          <Icon
            size={20}
            style={{
              color: iconColor,
            }}
          />
        </div>

      </div>

    </div>
  );
}


/* ==========================================
   QUICK ACTION
========================================== */

function QuickAction({
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-[#028090] hover:bg-[#EAF8F6] hover:text-[#028090]"
    >
      <Icon size={17} />
      {label}
    </button>
  );
}


/* ==========================================
   EMPTY STATE
========================================== */

function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center px-5 py-10 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}