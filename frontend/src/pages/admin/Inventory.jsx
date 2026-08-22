import React, { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  XCircle,
  IndianRupee,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
} from "lucide-react";

import {
  getInventoryItems,
  createInventoryItem,
} from "../../api/inventoryApi";

import { getInventoryTransactions } from "../../api/inventoryTransactionApi";

import InventoryItemModal from "../../components/inventory/InventoryItemModal";

const COLORS = {
  dark: "#05282A",
  primary: "#028090",
  accent: "#02C39A",
  light: "#EEF7F6",
  border: "#D8ECEA",
  muted: "#5C7A78",
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // ==========================================
  // LOAD INVENTORY
  // ==========================================

  const loadInventory = async () => {
    try {
      setLoading(true);

      const [inventoryResponse, transactionResponse] =
        await Promise.all([
          getInventoryItems(),
          getInventoryTransactions(),
        ]);

      setItems(inventoryResponse?.data || []);
      setTransactions(transactionResponse?.data || []);
    } catch (error) {
      console.error("Inventory Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // ==========================================
  // CREATE INVENTORY ITEM
  // ==========================================

  const handleCreateItem = async (formData) => {
    try {
      setModalLoading(true);

      await createInventoryItem(formData);

      // Close modal
      setShowModal(false);

      // Refresh inventory
      await loadInventory();
    } catch (error) {
      console.error("Create Inventory Item Error:", error);

      // Throw error so modal can display backend error
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  // ==========================================
  // SUMMARY CALCULATIONS
  // ==========================================

  const totalItems = items.length;

  // IMPORTANT:
  // Backend uses minStock, NOT minimumStock
  const lowStockItems = items.filter((item) => {
    const currentStock = Number(item.currentStock || 0);
    const minStock = Number(item.minStock || 0);

    return currentStock <= minStock;
  });

  const outOfStockItems = items.filter(
    (item) => Number(item.currentStock || 0) <= 0,
  );

  const inventoryValue = items.reduce(
    (total, item) =>
      total +
      Number(item.currentStock || 0) *
        Number(item.costPrice || 0),
    0,
  );

  const cards = [
    {
      title: "Total Items",
      value: totalItems,
      icon: Package,
    },
    {
      title: "Low Stock",
      value: lowStockItems.length,
      icon: AlertTriangle,
    },
    {
      title: "Out of Stock",
      value: outOfStockItems.length,
      icon: XCircle,
    },
    {
      title: "Inventory Value",
      value: `₹${inventoryValue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
    },
  ];

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className="min-h-screen bg-white p-6"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl"
            style={{
              fontFamily: "'Libre Baskerville', serif",
              color: COLORS.dark,
            }}
          >
            Inventory
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: COLORS.muted }}
          >
            Manage laundry supplies and stock levels.
          </p>
        </div>

        {/* Add Item Button */}

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0 transition hover:opacity-90"
          style={{
            background:
              "linear-gradient(95deg, #028090, #02C39A)",
          }}
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* ========================================
          SUMMARY CARDS
      ======================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl p-5 border"
              style={{
                borderColor: COLORS.border,
                backgroundColor: "#FFFFFF",
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: COLORS.light,
                    color: COLORS.primary,
                  }}
                >
                  <Icon size={21} />
                </div>
              </div>

              <p
                className="text-2xl font-semibold mt-4"
                style={{ color: COLORS.dark }}
              >
                {loading ? "—" : card.value}
              </p>

              <p
                className="text-sm mt-1"
                style={{ color: COLORS.muted }}
              >
                {card.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* ========================================
          INVENTORY ITEMS
      ======================================== */}

      <div
        className="rounded-2xl border overflow-hidden mb-8"
        style={{ borderColor: COLORS.border }}
      >
        <div className="px-5 py-4 border-b">
          <h2
            className="font-semibold"
            style={{ color: COLORS.dark }}
          >
            Inventory Items
          </h2>

          <p
            className="text-xs mt-1"
            style={{ color: COLORS.muted }}
          >
            All items currently managed in your inventory.
          </p>
        </div>

        {/* Loading */}

        {loading ? (
          <div
            className="py-12 text-center text-sm"
            style={{ color: COLORS.muted }}
          >
            Loading inventory...
          </div>
        ) : items.length === 0 ? (
          /* Empty */

          <div
            className="py-12 text-center text-sm"
            style={{ color: COLORS.muted }}
          >
            No inventory items found.

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-sm font-medium"
                style={{ color: COLORS.primary }}
              >
                + Add your first item
              </button>
            </div>
          </div>
        ) : (
          /* Table */

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                style={{
                  backgroundColor: COLORS.light,
                }}
              >
                <tr>
                  <th className="text-left px-5 py-3">
                    Item
                  </th>

                  <th className="text-left px-5 py-3">
                    Category
                  </th>

                  <th className="text-left px-5 py-3">
                    Current Stock
                  </th>

                  <th className="text-left px-5 py-3">
                    Min Stock
                  </th>

                  <th className="text-left px-5 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const currentStock = Number(
                    item.currentStock || 0,
                  );

                  const minStock = Number(
                    item.minStock || 0,
                  );

                  const isOutOfStock =
                    currentStock <= 0;

                  const isLowStock =
                    currentStock <= minStock;

                  return (
                    <tr
                      key={item.id}
                      className="border-t"
                      style={{
                        borderColor: COLORS.border,
                      }}
                    >
                      {/* Item */}

                      <td className="px-5 py-4">
                        <div
                          className="font-medium"
                          style={{
                            color: COLORS.dark,
                          }}
                        >
                          {item.name}
                        </div>
                      </td>

                      {/* Category */}

                      <td className="px-5 py-4">
                        {item.category || "—"}
                      </td>

                      {/* Current Stock */}

                      <td className="px-5 py-4">
                        <span
                          className={
                            isOutOfStock
                              ? "text-red-600 font-semibold"
                              : isLowStock
                                ? "text-orange-500 font-semibold"
                                : "text-gray-700"
                          }
                        >
                          {currentStock}{" "}
                          {item.unit}
                        </span>
                      </td>

                      {/* Minimum Stock */}

                      <td className="px-5 py-4">
                        {minStock} {item.unit}
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor:
                              item.status === "Active"
                                ? "#E6F8F2"
                                : "#FDECEC",

                            color:
                              item.status === "Active"
                                ? COLORS.primary
                                : "#DC2626",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================
          RECENT STOCK ACTIVITY
      ======================================== */}

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: COLORS.border }}
      >
        <div className="px-5 py-4 border-b">
          <h2
            className="font-semibold"
            style={{ color: COLORS.dark }}
          >
            Recent Stock Activity
          </h2>

          <p
            className="text-xs mt-1"
            style={{ color: COLORS.muted }}
          >
            Recent stock movements in your inventory.
          </p>
        </div>

        {transactions.length === 0 ? (
          <div
            className="py-16 text-center text-sm"
            style={{ color: COLORS.muted }}
          >
            No inventory transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                style={{
                  backgroundColor: COLORS.light,
                }}
              >
                <tr>
                  <th className="text-left px-5 py-3">
                    Item
                  </th>

                  <th className="text-left px-5 py-3">
                    Type
                  </th>

                  <th className="text-left px-5 py-3">
                    Quantity
                  </th>

                  <th className="text-left px-5 py-3">
                    Previous
                  </th>

                  <th className="text-left px-5 py-3">
                    New Stock
                  </th>

                  <th className="text-left px-5 py-3">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions
                  .slice(0, 10)
                  .map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-t"
                      style={{
                        borderColor: COLORS.border,
                      }}
                    >
                      {/* Item */}

                      <td className="px-5 py-4">
                        {transaction.inventoryItem?.name ||
                          "—"}
                      </td>

                      {/* Type */}

                      <td className="px-5 py-4">
                        {transaction.type === "IN" ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <ArrowDownToLine size={15} />
                            Stock In
                          </span>
                        ) : transaction.type ===
                          "OUT" ? (
                          <span className="flex items-center gap-1 text-red-500">
                            <ArrowUpFromLine size={15} />
                            Stock Out
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {transaction.type}
                          </span>
                        )}
                      </td>

                      {/* Quantity */}

                      <td className="px-5 py-4">
                        {transaction.quantity}
                      </td>

                      {/* Previous */}

                      <td className="px-5 py-4">
                        {transaction.previousStock}
                      </td>

                      {/* New Stock */}

                      <td className="px-5 py-4 font-medium">
                        {transaction.newStock}
                      </td>

                      {/* Date */}

                      <td className="px-5 py-4">
                        {transaction.createdAt
                          ? new Date(
                              transaction.createdAt,
                            ).toLocaleDateString(
                              "en-IN",
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================
          INVENTORY ITEM MODAL
      ======================================== */}

      {showModal && (
        <InventoryItemModal
          isOpen={showModal}
          loading={modalLoading}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateItem}
        />
      )}
    </div>
  );
}