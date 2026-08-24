import { useCallback, useEffect, useMemo, useState } from "react";

import { Plus, RefreshCw, Search, X, AlertCircle, Package } from "lucide-react";

import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../../api/inventoryApi";

import InventorySummary from "../../components/inventory/InventorySummary";
import InventoryTable from "../../components/inventory/InventoryTable";
import InventoryItemModal from "../../components/inventory/InventoryItemModal";
import LowStockTable from "../../components/inventory/LowStockTable";

// =====================================================
// HELPERS
// =====================================================

const extractList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  if (Array.isArray(data?.inventoryItems)) {
    return data.inventoryItems;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

// =====================================================
// COMPONENT
// =====================================================

export default function Inventory() {
  // ===================================================
  // DATA
  // ===================================================

  const [inventoryItems, setInventoryItems] = useState([]);

  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  // ===================================================
  // MODAL
  // ===================================================

  const [showItemModal, setShowItemModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  // ===================================================
  // MESSAGE
  // ===================================================

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("");

  const [status, setStatus] = useState("");

  const [stockStatus, setStockStatus] = useState("");

  // ===================================================
  // PAGINATION
  // ===================================================

  const [page, setPage] = useState(1);

  const [limit] = useState(10);

  // ===================================================
  // FETCH INVENTORY
  // ===================================================

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (category) {
        params.category = category;
      }

      if (status) {
        params.status = status;
      }

      const response = await getInventoryItems(params);

      const list = extractList(response);

      setInventoryItems(list);
    } catch (err) {
      console.error("Fetch inventory error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch inventory.",
      );

      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, category, status]);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // ===================================================
  // SUCCESS AUTO HIDE
  // ===================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  // ===================================================
  // CREATE ITEM
  // ===================================================

  const handleCreateItem = async (itemData) => {
    try {
      setActionLoading(true);
      setError("");

      await createInventoryItem(itemData);

      setSuccess("Inventory item added successfully.");

      setShowItemModal(false);
      setSelectedItem(null);

      await fetchInventory();
    } catch (err) {
      console.error("Create inventory item error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to add inventory item.",
      );

      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // UPDATE ITEM
  // ===================================================

  const handleUpdateItem = async (itemData) => {
    if (!selectedItem?.id) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await updateInventoryItem(selectedItem.id, itemData);

      setSuccess("Inventory item updated successfully.");

      setShowItemModal(false);
      setSelectedItem(null);

      await fetchInventory();
    } catch (err) {
      console.error("Update inventory item error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update inventory item.",
      );

      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // VIEW ITEM
  // ===================================================

  const handleViewItem = (item) => {
    setSelectedItem(item);
  };

  // ===================================================
  // EDIT ITEM
  // ===================================================

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setError("");

    setShowItemModal(true);
  };

  // ===================================================
  // DELETE ITEM
  // ===================================================

  const handleDeleteItem = async (item) => {
    const itemName = item?.name || "this inventory item";

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${itemName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await deleteInventoryItem(item.id);

      setSuccess("Inventory item removed successfully.");

      await fetchInventory();
    } catch (err) {
      console.error("Delete inventory item error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove inventory item.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // ADD ITEM
  // ===================================================

  const handleAddItem = () => {
    setSelectedItem(null);
    setError("");

    setShowItemModal(true);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const handleCloseModal = () => {
    if (actionLoading) {
      return;
    }

    setShowItemModal(false);
    setSelectedItem(null);
  };

  // ===================================================
  // RESET FILTERS
  // ===================================================

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setStockStatus("");
    setPage(1);
    setError("");
  };

  // ===================================================
  // CATEGORIES
  // ===================================================

  const categories = useMemo(() => {
    const values = inventoryItems.map((item) => item.category).filter(Boolean);

    return [...new Set(values)];
  }, [inventoryItems]);

  // ===================================================
  // LOW STOCK
  // ===================================================

  const lowStockItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const current = Number(item.currentStock) || 0;

      const minimum = Number(item.minStock) || 0;

      return current <= minimum;
    });
  }, [inventoryItems]);

  // ===================================================
  // DISPLAYED ITEMS
  // ===================================================

  const displayedItems = useMemo(() => {
    if (!stockStatus) {
      return inventoryItems;
    }

    return inventoryItems.filter((item) => {
      const current = Number(item.currentStock) || 0;

      const minimum = Number(item.minStock) || 0;

      if (stockStatus === "LOW") {
        return current <= minimum;
      }

      if (stockStatus === "OUT") {
        return current <= 0;
      }

      if (stockStatus === "AVAILABLE") {
        return current > minimum;
      }

      return true;
    });
  }, [inventoryItems, stockStatus]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const summary = useMemo(() => {
    const totalItems = inventoryItems.length;

    let lowStock = 0;
    let outOfStock = 0;
    let activeItems = 0;

    inventoryItems.forEach((item) => {
      const current = Number(item.currentStock) || 0;

      const minimum = Number(item.minStock) || 0;

      if (current <= minimum) {
        lowStock++;
      }

      if (current <= 0) {
        outOfStock++;
      }

      if (item.status === "Active") {
        activeItems++;
      }
    });

    return {
      totalItems,
      lowStock,
      outOfStock,
      activeItems,
    };
  }, [inventoryItems]);

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-full space-y-6 bg-[#F7FAF9] p-4 sm:p-6 lg:p-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6F7F5]">
            <Package size={24} className="text-[#028090]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#0F2C2E] sm:text-3xl">
              Inventory Management
            </h1>

            <p className="mt-1 text-sm text-[#6B7F7E]">
              Manage inventory items, current stock and minimum stock levels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* REFRESH */}

          <button
            type="button"
            onClick={fetchInventory}
            disabled={loading || actionLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#D8ECEA] bg-white px-4 py-2.5 text-sm font-medium text-[#526968] transition hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />

            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* ADD ITEM */}

          <button
            type="button"
            onClick={handleAddItem}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#028090] to-[#00A896] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={17} />
            Add Item
          </button>
        </div>
      </div>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />

            {success}
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="rounded-lg p-1 hover:bg-green-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <div className="flex items-start gap-2">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <InventorySummary
        items={inventoryItems}
        summary={summary}
        loading={loading}
      />

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="rounded-2xl border border-[#D8ECEA] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#0F2C2E]">Inventory Filters</h2>

            <p className="mt-1 text-xs text-[#718382]">
              Search and filter inventory items.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-left text-xs font-medium text-[#028090] hover:underline sm:text-right"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* SEARCH */}

          <div className="relative lg:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);

                setPage(1);
              }}
              placeholder="Search item name..."
              className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] py-2.5 pl-10 pr-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white"
            />
          </div>

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);

              setPage(1);
            }}
            className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
          >
            <option value="">All Categories</option>

            {categories.map((itemCategory) => (
              <option key={itemCategory} value={itemCategory}>
                {itemCategory}
              </option>
            ))}
          </select>

          {/* STOCK STATUS */}

          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
          >
            <option value="">All Stock Status</option>

            <option value="AVAILABLE">Available</option>

            <option value="LOW">Low Stock</option>

            <option value="OUT">Out of Stock</option>
          </select>
        </div>

        {/* QUICK FILTERS */}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStockStatus("");
              setStatus("");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !stockStatus && !status
                ? "bg-[#028090] text-white"
                : "bg-[#EEF7F6] text-[#526968]"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => {
              setStatus("Active");

              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              status === "Active"
                ? "bg-[#028090] text-white"
                : "bg-[#EEF7F6] text-[#526968]"
            }`}
          >
            Active
          </button>

          <button
            type="button"
            onClick={() => {
              setStatus("Inactive");

              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              status === "Inactive"
                ? "bg-[#028090] text-white"
                : "bg-[#EEF7F6] text-[#526968]"
            }`}
          >
            Inactive
          </button>

          <button
            type="button"
            onClick={() => {
              setStockStatus("LOW");

              setStatus("");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              stockStatus === "LOW"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            Low Stock
          </button>

          <button
            type="button"
            onClick={() => {
              setStockStatus("OUT");

              setStatus("");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              stockStatus === "OUT"
                ? "bg-red-500 text-white"
                : "bg-red-50 text-red-700"
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* =================================================
          LOW STOCK
      ================================================= */}

      <LowStockTable
        items={lowStockItems}
        loading={loading}
        onView={handleViewItem}
      />

      {/* =================================================
          INVENTORY TABLE
      ================================================= */}

      <InventoryTable
        items={displayedItems}
        loading={loading || actionLoading}
        onView={handleViewItem}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

      {/* =================================================
          PAGINATION
      ================================================= */}

      {!loading && displayedItems.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-[#D8ECEA] bg-white px-4 py-3">
          <p className="text-xs text-[#6B7F7E]">Page {page}</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1 || loading || actionLoading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-lg border border-[#D8ECEA] px-3 py-2 text-xs font-medium text-[#526968] hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                displayedItems.length < limit || loading || actionLoading
              }
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-[#D8ECEA] px-3 py-2 text-xs font-medium text-[#526968] hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          INVENTORY ITEM MODAL
      ================================================= */}

      <InventoryItemModal
        isOpen={showItemModal}
        onClose={handleCloseModal}
        onSubmit={selectedItem ? handleUpdateItem : handleCreateItem}
        item={selectedItem}
        loading={actionLoading}
      />
    </div>
  );
}
