import { useEffect, useState } from "react";
import {
  Search,
  PackagePlus,
  PackageMinus,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
} from "lucide-react";

import StockInModal from "../../../components/inventory/StockInModal";
import StockOutModal from "../../../components/inventory/StockOutModal";

// =====================================================
// API IMPORTS
// Change paths/function names according to your project
// =====================================================

import { getInventoryItems } from "../../../api/inventoryApi";

import { getStockTransactions, stockIn, stockOut } from "../../../api/stockApi";

// =====================================================
// COMPONENT
// =====================================================

export default function StockInOut() {
  // =====================================================
  // STATE
  // =====================================================

  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);

  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [error, setError] = useState("");

  // =====================================================
  // LOAD INVENTORY ITEMS
  // =====================================================

  const fetchItems = async () => {
    try {
      const response = await getInventoryItems();

      console.log("Inventory Items:", response);

      // Support different API response structures
      const inventoryData = response?.items || response?.data || response || [];

      setItems(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error) {
      console.error("Inventory Fetch Error:", error);

      setError(error?.message || "Failed to load inventory items.");
    }
  };

  // =====================================================
  // LOAD STOCK TRANSACTIONS
  // =====================================================

  const fetchTransactions = async () => {
    try {
      setTransactionLoading(true);

      const response = await getStockTransactions();

      console.log("Stock Transactions:", response);

      const transactionData =
        response?.transactions || response?.data || response || [];

      setTransactions(Array.isArray(transactionData) ? transactionData : []);
    } catch (error) {
      console.error("Stock Transaction Error:", error);

      setTransactions([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  const loadData = async () => {
    setLoading(true);
    setError("");

    await Promise.all([fetchItems(), fetchTransactions()]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // STOCK IN SUBMIT
  // =====================================================

  const handleStockIn = async (data) => {
    try {
      setTransactionLoading(true);

      console.log("Stock In Payload:", data);

      await stockIn(data);

      // Refresh inventory and transactions
      await Promise.all([fetchItems(), fetchTransactions()]);

      setStockInOpen(false);
    } catch (error) {
      console.error("Stock In Error:", error);

      throw error;
    } finally {
      setTransactionLoading(false);
    }
  };

  // =====================================================
  // STOCK OUT SUBMIT
  // =====================================================

  const handleStockOut = async (data) => {
    try {
      setTransactionLoading(true);

      console.log("Stock Out Payload:", data);

      await stockOut(data);

      // Refresh inventory and transactions
      await Promise.all([fetchItems(), fetchTransactions()]);

      setStockOutOpen(false);
    } catch (error) {
      console.error("Stock Out Error:", error);

      throw error;
    } finally {
      setTransactionLoading(false);
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    await loadData();
  };

  // =====================================================
  // FILTER TRANSACTIONS
  // =====================================================

  const filteredTransactions = transactions.filter((transaction) => {
    const searchValue = search.toLowerCase().trim();

    const itemName =
      transaction.inventoryItem?.name ||
      transaction.item?.name ||
      transaction.itemName ||
      "";

    const reason = transaction.reason || "";

    const transactionType =
      transaction.type || transaction.transactionType || "";

    const matchesSearch =
      !searchValue ||
      itemName.toLowerCase().includes(searchValue) ||
      reason.toLowerCase().includes(searchValue);

    const matchesType =
      typeFilter === "ALL" || transactionType.toUpperCase() === typeFilter;

    return matchesSearch && matchesType;
  });

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // GET ITEM NAME
  // =====================================================

  const getItemName = (transaction) => {
    return (
      transaction.inventoryItem?.name ||
      transaction.item?.name ||
      transaction.itemName ||
      "Unknown Item"
    );
  };

  // =====================================================
  // GET TRANSACTION TYPE
  // =====================================================

  const getTransactionType = (transaction) => {
    return (
      transaction.type ||
      transaction.transactionType ||
      "-"
    ).toUpperCase();
  };

  // =====================================================
  // GET QUANTITY
  // =====================================================

  const getQuantity = (transaction) => {
    return Number(transaction.quantity || 0);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-[#028090]"
          />

          <p className="mt-3 text-sm text-[#718382]">Loading stock data...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE UI
  // =====================================================

  return (
    <div className="space-y-6">
      {/* ===============================================
          HEADER
      =============================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2C2E]">Stock In / Out</h1>

          <p className="mt-1 text-sm text-[#718382]">
            Manage manual stock additions and removals.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* REFRESH */}

          <button
            onClick={handleRefresh}
            disabled={loading || transactionLoading}
            className="flex items-center gap-2 rounded-xl border border-[#D8ECEA] bg-white px-4 py-2.5 text-sm font-medium text-[#526968] transition hover:bg-[#EEF7F6] disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={transactionLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {/* STOCK OUT */}

          <button
            onClick={() => setStockOutOpen(true)}
            disabled={transactionLoading}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            <PackageMinus size={18} />
            Stock Out
          </button>

          {/* STOCK IN */}

          <button
            onClick={() => setStockInOpen(true)}
            disabled={transactionLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#028090] to-[#00A896] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <PackagePlus size={18} />
            Stock In
          </button>
        </div>
      </div>

      {/* ===============================================
          ERROR
      =============================================== */}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>

          <button onClick={() => setError("")} className="text-red-500">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ===============================================
          FILTERS
      =============================================== */}

      <div className="rounded-2xl border border-[#D8ECEA] bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718382]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item or reason..."
              className="w-full rounded-xl border border-[#D8ECEA] bg-[#F7FAF9] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#028090]"
            />
          </div>

          {/* TYPE FILTER */}

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-[#D8ECEA] bg-[#F7FAF9] px-4 py-2.5 text-sm outline-none focus:border-[#028090]"
          >
            <option value="ALL">All Transactions</option>

            <option value="IN">Stock In</option>

            <option value="OUT">Stock Out</option>
          </select>
        </div>
      </div>

      {/* ===============================================
          TRANSACTION TABLE
      =============================================== */}

      <div className="overflow-hidden rounded-2xl border border-[#D8ECEA] bg-white">
        <div className="border-b border-[#D8ECEA] px-5 py-4">
          <h2 className="font-bold text-[#0F2C2E]">Stock Transactions</h2>

          <p className="mt-1 text-sm text-[#718382]">
            {filteredTransactions.length} transaction
            {filteredTransactions.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-[#F7FAF9]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#718382]">
                  Item
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#718382]">
                  Type
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#718382]">
                  Quantity
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#718382]">
                  Reason
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#718382]">
                  Notes
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[#718382]">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {transactionLoading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center">
                    <RefreshCw
                      size={24}
                      className="mx-auto animate-spin text-[#028090]"
                    />

                    <p className="mt-2 text-sm text-[#718382]">
                      Updating stock...
                    </p>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-[#718382]"
                  >
                    No stock transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const type = getTransactionType(transaction);

                  const quantity = getQuantity(transaction);

                  return (
                    <tr
                      key={transaction.id}
                      className="border-t border-[#EEF3F2] transition hover:bg-[#FAFCFC]"
                    >
                      {/* ITEM */}

                      <td className="px-5 py-4">
                        <p className="font-medium text-[#0F2C2E]">
                          {getItemName(transaction)}
                        </p>
                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            type === "IN"
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {type === "IN" ? (
                            <ArrowDownCircle size={14} />
                          ) : (
                            <ArrowUpCircle size={14} />
                          )}
                          Stock {type}
                        </span>
                      </td>

                      {/* QUANTITY */}

                      <td className="px-5 py-4">
                        <span
                          className={`font-semibold ${
                            type === "IN" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {type === "IN" ? "+" : "-"}
                          {quantity}
                        </span>
                      </td>

                      {/* REASON */}

                      <td className="px-5 py-4 text-sm text-[#526968]">
                        {transaction.reason || "-"}
                      </td>

                      {/* NOTES */}

                      <td className="max-w-[250px] truncate px-5 py-4 text-sm text-[#718382]">
                        {transaction.notes || "-"}
                      </td>

                      {/* DATE */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-[#718382]">
                        {formatDate(
                          transaction.createdAt || transaction.transactionDate,
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===============================================
          STOCK IN MODAL
      =============================================== */}

      <StockInModal
        isOpen={stockInOpen}
        onClose={() => setStockInOpen(false)}
        onSubmit={handleStockIn}
        items={items}
        loading={transactionLoading}
      />

      {/* ===============================================
          STOCK OUT MODAL
      =============================================== */}

      <StockOutModal
        isOpen={stockOutOpen}
        onClose={() => setStockOutOpen(false)}
        onSubmit={handleStockOut}
        items={items}
        loading={transactionLoading}
      />
    </div>
  );
}
