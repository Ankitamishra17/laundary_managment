import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Package,
  RefreshCw,
  Search,
  ArrowDown,
  Loader2,
  ShoppingCart,
} from "lucide-react";

import { getLowStockItems } from "../../../api/inventoryApi";

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
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH LOW STOCK ITEMS
  // ==========================================

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getLowStockItems();

      setItems(response?.data || []);
    } catch (err) {
      console.error("Low stock error:", err);

      setError(
        err?.response?.data?.message || "Failed to load low stock items.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredItems = items.filter((item) => {
    const searchText = search.toLowerCase();

    return (
      item.name?.toLowerCase().includes(searchText) ||
      item.category?.toLowerCase().includes(searchText)
    );
  });

  // ==========================================
  // STOCK STATUS
  // ==========================================

  const getStockPercentage = (item) => {
    const current = Number(item.currentStock || 0);
    const minimum = Number(item.minStock || 0);

    if (minimum <= 0) return 100;

    return Math.min((current / minimum) * 100, 100);
  };

  const getSeverity = (item) => {
    const current = Number(item.currentStock || 0);
    const minimum = Number(item.minStock || 0);

    if (current === 0) {
      return "out";
    }

    if (current <= minimum * 0.5) {
      return "critical";
    }

    return "low";
  };

  // ==========================================
  // SUMMARY
  // ==========================================

  const outOfStockCount = items.filter(
    (item) => Number(item.currentStock || 0) === 0,
  ).length;

  const criticalCount = items.filter((item) => {
    const current = Number(item.currentStock || 0);
    const minimum = Number(item.minStock || 0);

    return current > 0 && current <= minimum * 0.5;
  }).length;

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ======================================
          HEADER
      ======================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: COLORS.dangerBg,
              }}
            >
              <AlertTriangle size={21} style={{ color: COLORS.danger }} />
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

              <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
                Inventory items that need restocking.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLowStockItems}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
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

      {/* ======================================
          ERROR
      ======================================= */}

      {error && (
        <div
          className="mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: COLORS.dangerBg,
            color: COLORS.danger,
            border: "1px solid #FECACA",
          }}
        >
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      {/* ======================================
          SUMMARY CARDS
      ======================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
              <p className="text-sm" style={{ color: COLORS.muted }}>
                Low Stock Items
              </p>

              <h2
                className="text-2xl font-semibold mt-2"
                style={{ color: COLORS.danger }}
              >
                {items.length}
              </h2>
            </div>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: COLORS.dangerBg,
              }}
            >
              <AlertTriangle size={20} style={{ color: COLORS.danger }} />
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
              <p className="text-sm" style={{ color: COLORS.muted }}>
                Out of Stock
              </p>

              <h2
                className="text-2xl font-semibold mt-2"
                style={{ color: COLORS.danger }}
              >
                {outOfStockCount}
              </h2>
            </div>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "#FEE2E2",
              }}
            >
              <Package size={20} style={{ color: COLORS.danger }} />
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
              <p className="text-sm" style={{ color: COLORS.muted }}>
                Critical Stock
              </p>

              <h2
                className="text-2xl font-semibold mt-2"
                style={{ color: COLORS.warning }}
              >
                {criticalCount}
              </h2>
            </div>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: COLORS.warningBg,
              }}
            >
              <ArrowDown size={20} style={{ color: COLORS.warning }} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================
          MAIN CARD
      ======================================= */}

      <div
        className="rounded-2xl"
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {/* CARD HEADER */}

        <div className="p-5 sm:p-6 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: COLORS.text }}
              >
                Items Requiring Attention
              </h2>

              <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                Restock these items before they run out.
              </p>
            </div>

            {/* SEARCH */}

            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 w-full lg:w-72"
              style={{
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Search size={16} style={{ color: COLORS.muted }} />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* ======================================
            LOADING
        ======================================= */}

        {loading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="animate-spin mx-auto"
              style={{ color: COLORS.primary }}
            />

            <p className="text-sm mt-3" style={{ color: COLORS.muted }}>
              Loading low stock items...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* ======================================
              EMPTY
          ======================================= */

          <div className="py-16 text-center px-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{
                backgroundColor: "#E7F8F3",
              }}
            >
              <Package size={25} style={{ color: COLORS.primary }} />
            </div>

            <h3 className="font-semibold mt-4" style={{ color: COLORS.text }}>
              No low stock items
            </h3>

            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
              Great! Your inventory is sufficiently stocked.
            </p>
          </div>
        ) : (
          /* ======================================
              TABLE
          ======================================= */

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F8FCFB",
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <th className="text-left py-3 px-5">Item</th>

                  <th className="text-left py-3 px-3">Category</th>

                  <th className="text-right py-3 px-3">Current Stock</th>

                  <th className="text-right py-3 px-3">Minimum Stock</th>

                  <th className="text-left py-3 px-3">Stock Level</th>

                  <th className="text-left py-3 px-3">Status</th>

                  <th className="text-right py-3 px-5">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const current = Number(item.currentStock || 0);

                  const minimum = Number(item.minStock || 0);

                  const percentage = getStockPercentage(item);

                  const severity = getSeverity(item);

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      {/* ITEM */}

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
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
                              className="text-xs mt-0.5"
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
                        className="py-4 px-3"
                        style={{
                          color: COLORS.muted,
                        }}
                      >
                        {item.category || "-"}
                      </td>

                      {/* CURRENT */}

                      <td className="py-4 px-3 text-right">
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
                          className="text-xs ml-1"
                          style={{
                            color: COLORS.muted,
                          }}
                        >
                          {item.unit || ""}
                        </span>
                      </td>

                      {/* MINIMUM */}

                      <td
                        className="py-4 px-3 text-right"
                        style={{
                          color: COLORS.muted,
                        }}
                      >
                        {minimum} {item.unit || ""}
                      </td>

                      {/* PROGRESS */}

                      <td className="py-4 px-3 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 rounded-full flex-1 overflow-hidden"
                            style={{
                              backgroundColor: "#E5EEEE",
                            }}
                          >
                            <div
                              className="h-full rounded-full"
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

                      <td className="py-4 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
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

                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            // Later navigate to Stock In page
                            window.location.href = "/admin/inventory/stock";
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
                          style={{
                            backgroundColor: COLORS.primary,
                          }}
                        >
                          <ShoppingCart size={14} />
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
    </div>
  );
}
