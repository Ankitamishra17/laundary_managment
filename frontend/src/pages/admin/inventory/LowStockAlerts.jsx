import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Package,
  RefreshCw,
  Search,
  ArrowDown,
  Loader2,
  XCircle,
  PackagePlus,
} from "lucide-react";

import { getLowStockItems } from "../../../api/inventoryApi";

import StockInModal from "../../../components/inventory/StockInModal";

const COLORS = {
  dark: "#05282A",
  primary: "#028090",
  mint: "#02C39A",
  bg: "#F4FAF9",
  card: "#FFFFFF",
  border: "#D8ECEA",
  text: "#0F2C2E",
  muted: "#64817F",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  warning: "#D97706",
  warningBg: "#FFF7ED",
};

export default function LowStockAlerts() {
  // =====================================================
  // STATE
  // =====================================================

  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [showStockIn, setShowStockIn] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  const [suppliers, setSuppliers] = useState([]);

  // =====================================================
  // FETCH LOW STOCK ITEMS
  // =====================================================

  const fetchLowStockItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getLowStockItems();

      /*
          Possible backend responses:

          1.
          {
            success: true,
            data: [...]
          }

          2.
          {
            success: true,
            items: [...]
          }

          3.
          [...]
        */

      const responseData = response?.data;

      let lowStockItems = [];

      if (Array.isArray(responseData)) {
        lowStockItems = responseData;
      } else if (Array.isArray(responseData?.data)) {
        lowStockItems = responseData.data;
      } else if (Array.isArray(responseData?.items)) {
        lowStockItems = responseData.items;
      } else if (Array.isArray(response?.items)) {
        lowStockItems = response.items;
      }

      setItems(lowStockItems);
    } catch (err) {
      console.error("Low stock error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load low stock items.",
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // FETCH SUPPLIERS
  // =====================================================

  const fetchSuppliers = useCallback(async () => {
    try {
      /*
          If your inventoryApi already has
          getSuppliers(), use that instead.

          Otherwise change this endpoint
          according to your supplier route.
        */

      const response = await fetch("/api/suppliers");

      if (!response.ok) {
        return;
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        setSuppliers(result);
      } else if (Array.isArray(result?.data)) {
        setSuppliers(result.data);
      } else if (Array.isArray(result?.suppliers)) {
        setSuppliers(result.suppliers);
      }
    } catch (err) {
      console.error("Supplier fetch error:", err);

      setSuppliers([]);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchLowStockItems();
    fetchSuppliers();
  }, [fetchLowStockItems, fetchSuppliers]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.name?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText)
      );
    });
  }, [items, search]);

  // =====================================================
  // STOCK PERCENTAGE
  // =====================================================

  const getStockPercentage = (item) => {
    const current = Number(item.currentStock) || 0;

    const minimum = Number(item.minStock) || 0;

    if (minimum <= 0) {
      return current > 0 ? 100 : 0;
    }

    return Math.min((current / minimum) * 100, 100);
  };

  // =====================================================
  // STOCK SEVERITY
  // =====================================================

  const getSeverity = (item) => {
    const current = Number(item.currentStock) || 0;

    const minimum = Number(item.minStock) || 0;

    if (current <= 0) {
      return "out";
    }

    if (current <= minimum * 0.5) {
      return "critical";
    }

    return "low";
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const outOfStockCount = items.filter(
    (item) => Number(item.currentStock) <= 0,
  ).length;

  const criticalCount = items.filter((item) => {
    const current = Number(item.currentStock) || 0;

    const minimum = Number(item.minStock) || 0;

    return current > 0 && current <= minimum * 0.5;
  }).length;

  // =====================================================
  // STOCK IN
  // =====================================================

  const handleStockIn = (item) => {
    setSelectedItem(item);
    setShowStockIn(true);
    setError("");
  };

  // =====================================================
  // SUBMIT STOCK IN
  // =====================================================

  const handleSubmitStockIn = async (stockData) => {
    try {
      setActionLoading(true);
      setError("");

      /*
          IMPORTANT:

          Use the SAME inventory transaction
          API that your backend route exposes.

          Example:
          POST /api/inventory/transactions
        */

      const response = await fetch("/api/inventory/transactions", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(stockData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to add stock.");
      }

      setShowStockIn(false);
      setSelectedItem(null);

      await fetchLowStockItems();
    } catch (err) {
      console.error("Stock in error:", err);

      setError(err?.message || "Failed to add stock.");

      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: COLORS.dangerBg,
              }}
            >
              <AlertTriangle
                size={21}
                style={{
                  color: COLORS.danger,
                }}
              />
            </div>

            <div>
              <h1
                className="text-2xl sm:text-3xl"
                style={{
                  color: COLORS.text,
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                Low Stock Alerts
              </h1>

              <p
                className="mt-1 text-sm"
                style={{
                  color: COLORS.muted,
                }}
              >
                Inventory items that need restocking.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLowStockItems}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{
            backgroundColor: COLORS.card,
            color: COLORS.primary,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.danger,
            border: "1px solid #FECACA",
          }}
        >
          <XCircle size={17} />

          {error}
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* LOW STOCK */}

        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm"
                style={{
                  color: COLORS.muted,
                }}
              >
                Low Stock Items
              </p>

              <h2
                className="mt-2 text-2xl font-semibold"
                style={{
                  color: COLORS.danger,
                }}
              >
                {items.length}
              </h2>
            </div>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: COLORS.dangerBg,
              }}
            >
              <AlertTriangle
                size={20}
                style={{
                  color: COLORS.danger,
                }}
              />
            </div>
          </div>
        </div>

        {/* OUT OF STOCK */}

        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm"
                style={{
                  color: COLORS.muted,
                }}
              >
                Out of Stock
              </p>

              <h2
                className="mt-2 text-2xl font-semibold"
                style={{
                  color: COLORS.danger,
                }}
              >
                {outOfStockCount}
              </h2>
            </div>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "#FEE2E2",
              }}
            >
              <Package
                size={20}
                style={{
                  color: COLORS.danger,
                }}
              />
            </div>
          </div>
        </div>

        {/* CRITICAL */}

        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm"
                style={{
                  color: COLORS.muted,
                }}
              >
                Critical Stock
              </p>

              <h2
                className="mt-2 text-2xl font-semibold"
                style={{
                  color: COLORS.warning,
                }}
              >
                {criticalCount}
              </h2>
            </div>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: COLORS.warningBg,
              }}
            >
              <ArrowDown
                size={20}
                style={{
                  color: COLORS.warning,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div
        className="rounded-2xl"
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {/* HEADER */}

        <div className="border-b p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                className="text-lg font-semibold"
                style={{
                  color: COLORS.text,
                }}
              >
                Items Requiring Attention
              </h2>

              <p
                className="mt-1 text-xs"
                style={{
                  color: COLORS.muted,
                }}
              >
                Restock these items before they run out.
              </p>
            </div>

            {/* SEARCH */}

            <div
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 lg:w-72"
              style={{
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Search
                size={16}
                style={{
                  color: COLORS.muted,
                }}
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="mx-auto animate-spin"
              style={{
                color: COLORS.primary,
              }}
            />

            <p
              className="mt-3 text-sm"
              style={{
                color: COLORS.muted,
              }}
            >
              Loading low stock items...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                backgroundColor: "#E7F8F3",
              }}
            >
              <Package
                size={25}
                style={{
                  color: COLORS.primary,
                }}
              />
            </div>

            <h3
              className="mt-4 font-semibold"
              style={{
                color: COLORS.text,
              }}
            >
              No low stock items
            </h3>

            <p
              className="mt-1 text-sm"
              style={{
                color: COLORS.muted,
              }}
            >
              Great! Your inventory is sufficiently stocked.
            </p>
          </div>
        ) : (
          /* =================================================
             TABLE
          ================================================= */

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F8FCFB",
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <th className="px-5 py-3 text-left">Item</th>

                  <th className="px-3 py-3 text-left">Category</th>

                  <th className="px-3 py-3 text-right">Current Stock</th>

                  <th className="px-3 py-3 text-right">Minimum Stock</th>

                  <th className="min-w-[180px] px-3 py-3 text-left">
                    Stock Level
                  </th>

                  <th className="px-3 py-3 text-left">Status</th>

                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const current = Number(item.currentStock) || 0;

                  const minimum = Number(item.minStock) || 0;

                  const percentage = getStockPercentage(item);

                  const severity = getSeverity(item);

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                      className="hover:bg-[#FAFCFC]"
                    >
                      {/* ITEM */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor:
                                severity === "out" ? "#FEE2E2" : "#FFF7ED",
                            }}
                          >
                            <Package
                              size={17}
                              style={{
                                color:
                                  severity === "out"
                                    ? COLORS.danger
                                    : COLORS.warning,
                              }}
                            />
                          </div>

                          <div>
                            <div
                              className="font-semibold"
                              style={{
                                color: COLORS.text,
                              }}
                            >
                              {item.name}
                            </div>

                            <div
                              className="mt-0.5 text-xs"
                              style={{
                                color: COLORS.muted,
                              }}
                            >
                              Unit: {item.unit || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td
                        className="px-3 py-4"
                        style={{
                          color: COLORS.muted,
                        }}
                      >
                        {item.category || "-"}
                      </td>

                      {/* CURRENT */}

                      <td className="px-3 py-4 text-right">
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              severity === "out"
                                ? COLORS.danger
                                : COLORS.warning,
                          }}
                        >
                          {current}
                        </span>

                        <span
                          className="ml-1 text-xs"
                          style={{
                            color: COLORS.muted,
                          }}
                        >
                          {item.unit || ""}
                        </span>
                      </td>

                      {/* MINIMUM */}

                      <td
                        className="px-3 py-4 text-right"
                        style={{
                          color: COLORS.muted,
                        }}
                      >
                        {minimum} {item.unit || ""}
                      </td>

                      {/* PROGRESS */}

                      <td className="min-w-[180px] px-3 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 flex-1 overflow-hidden rounded-full"
                            style={{
                              backgroundColor: "#E5EEEE",
                            }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor:
                                  severity === "out"
                                    ? COLORS.danger
                                    : COLORS.warning,
                              }}
                            />
                          </div>

                          <span
                            className="text-xs"
                            style={{
                              color: COLORS.muted,
                            }}
                          >
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-3 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor:
                              severity === "out" ? "#FEE2E2" : COLORS.warningBg,

                            color:
                              severity === "out"
                                ? COLORS.danger
                                : COLORS.warning,
                          }}
                        >
                          <AlertTriangle size={12} />

                          {severity === "out"
                            ? "Out of Stock"
                            : severity === "critical"
                              ? "Critical"
                              : "Low Stock"}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleStockIn(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                          style={{
                            backgroundColor: COLORS.primary,
                          }}
                        >
                          <PackagePlus size={14} />
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          STOCK IN MODAL
      ================================================= */}

      <StockInModal
        isOpen={showStockIn}
        onClose={() => {
          if (actionLoading) return;

          setShowStockIn(false);
          setSelectedItem(null);
        }}
        onSubmit={handleSubmitStockIn}
        items={selectedItem ? [selectedItem] : []}
        suppliers={suppliers}
        loading={actionLoading}
      />
    </div>
  );
}
