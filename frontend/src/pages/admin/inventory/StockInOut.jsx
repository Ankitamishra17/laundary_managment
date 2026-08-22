import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  RefreshCw,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { getInventoryItems } from "../../../api/inventoryApi";

import {
  getInventoryTransactions,
  createStockIn,
  createStockOut,
} from "../../../api/inventoryTransactionApi";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  dark: "#05282A",
  primary: "#028090",
  accent: "#02C39A",

  bg: "#F7FBFA",
  light: "#EEF7F6",
  border: "#D8ECEA",

  text: "#244846",
  muted: "#5C7A78",

  success: "#16A34A",
  successBg: "#F0FDF4",

  danger: "#DC2626",
  dangerBg: "#FEF2F2",

  warning: "#D97706",
  warningBg: "#FFF7ED",
};

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm = {
  inventoryItemId: "",
  quantity: "",
  reason: "Opening Stock",
  notes: "",
};

// =====================================================
// COMPONENT
// =====================================================

export default function StockInOut() {
  // ===================================================
  // MODE
  // ===================================================

  const [mode, setMode] = useState("IN");

  // ===================================================
  // STATE
  // ===================================================

  const [items, setItems] = useState([]);

  const [transactions, setTransactions] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ===================================================
  // FETCH DATA
  // ===================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [itemsResponse, transactionsResponse] = await Promise.all([
        getInventoryItems(),
        getInventoryTransactions(),
      ]);

      // ===============================================
      // INVENTORY ITEMS
      // ===============================================

      const itemData = itemsResponse?.data;

      let inventoryItems = [];

      if (Array.isArray(itemData)) {
        inventoryItems = itemData;
      } else if (Array.isArray(itemData?.data)) {
        inventoryItems = itemData.data;
      } else if (Array.isArray(itemData?.items)) {
        inventoryItems = itemData.items;
      }

      setItems(inventoryItems);

      // ===============================================
      // TRANSACTIONS
      // ===============================================

      const transactionData = transactionsResponse?.data;

      let transactionList = [];

      if (Array.isArray(transactionData)) {
        transactionList = transactionData;
      } else if (Array.isArray(transactionData?.data)) {
        transactionList = transactionData.data;
      } else if (Array.isArray(transactionData?.transactions)) {
        transactionList = transactionData.transactions;
      }

      // Newest first
      transactionList.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setTransactions(transactionList);
    } catch (err) {
      console.error("Inventory transaction fetch error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load inventory data.",
      );

      setItems([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  // SELECTED ITEM
  // ===================================================

  const selectedItem = useMemo(() => {
    return items.find(
      (item) => String(item.id) === String(form.inventoryItemId),
    );
  }, [items, form.inventoryItemId]);

  // ===================================================
  // FILTER ITEMS
  // ===================================================

  const filteredItems = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return items;
    }

    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(text) ||
        item.category?.toLowerCase().includes(text),
    );
  }, [items, search]);

  // ===================================================
  // CURRENT STOCK
  // ===================================================

  const currentStock = Number(selectedItem?.currentStock || 0);

  // ===================================================
  // ENTERED QUANTITY
  // ===================================================

  const enteredQuantity = Number(form.quantity || 0);

  // ===================================================
  // PREVIEW STOCK
  // ===================================================

  const previewStock =
    mode === "IN"
      ? currentStock + enteredQuantity
      : currentStock - enteredQuantity;

  // ===================================================
  // SUMMARY
  // ===================================================

  const summary = useMemo(() => {
    const stockInTransactions = transactions.filter(
      (transaction) => transaction.type === "IN",
    );

    const stockOutTransactions = transactions.filter(
      (transaction) => transaction.type === "OUT",
    );

    const totalStockIn = stockInTransactions.reduce(
      (total, transaction) => total + Number(transaction.quantity || 0),
      0,
    );

    const totalStockOut = stockOutTransactions.reduce(
      (total, transaction) => total + Number(transaction.quantity || 0),
      0,
    );

    const today = new Date();

    const todayTransactions = transactions.filter((transaction) => {
      if (!transaction.createdAt) {
        return false;
      }

      const date = new Date(transaction.createdAt);

      return date.toDateString() === today.toDateString();
    });

    return {
      stockInCount: stockInTransactions.length,

      stockOutCount: stockOutTransactions.length,

      totalStockIn,

      totalStockOut,

      todayCount: todayTransactions.length,
    };
  }, [transactions]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ===================================================
  // ITEM CHANGE
  // ===================================================

  const handleItemChange = (e) => {
    setForm((previous) => ({
      ...previous,

      inventoryItemId: e.target.value,

      quantity: "",
    }));

    setError("");
    setSuccess("");
  };

  // ===================================================
  // MODE CHANGE
  // ===================================================

  const handleModeChange = (newMode) => {
    setMode(newMode);

    setError("");
    setSuccess("");

    setForm({
      ...initialForm,

      reason: newMode === "IN" ? "Opening Stock" : "Laundry Usage",
    });
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ===============================================
    // ITEM
    // ===============================================

    if (!form.inventoryItemId) {
      setError("Please select an inventory item.");

      return;
    }

    // ===============================================
    // QUANTITY
    // ===============================================

    const quantity = Number(form.quantity);

    if (!form.quantity || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than 0.");

      return;
    }

    // ===============================================
    // STOCK OUT VALIDATION
    // ===============================================

    if (mode === "OUT" && quantity > currentStock) {
      setError(
        `Insufficient stock. Available stock is ${currentStock} ${selectedItem?.unit || ""}.`,
      );

      return;
    }

    // ===============================================
    // REASON
    // ===============================================

    if (!form.reason.trim()) {
      setError("Please select a reason.");

      return;
    }

    try {
      setSubmitting(true);

      // =============================================
      // PAYLOAD
      // =============================================

      const payload = {
        inventoryItemId: Number(form.inventoryItemId),

        quantity,

        reason: form.reason.trim(),

        notes: form.notes.trim() || null,
      };

      console.log(`Stock ${mode} Payload:`, payload);

      // =============================================
      // API
      // =============================================

      if (mode === "IN") {
        await createStockIn(payload);
      } else {
        await createStockOut(payload);
      }

      // =============================================
      // SUCCESS
      // =============================================

      setSuccess(
        mode === "IN"
          ? "Stock added successfully."
          : "Stock removed successfully.",
      );

      // =============================================
      // RESET FORM
      // =============================================

      setForm({
        ...initialForm,

        reason: mode === "IN" ? "Opening Stock" : "Laundry Usage",
      });

      // =============================================
      // REFRESH
      // =============================================

      await fetchData();
    } catch (err) {
      console.error(`Stock ${mode} error:`, err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${mode === "IN" ? "add" : "remove"} stock.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===================================================
  // RESET
  // ===================================================

  const handleReset = () => {
    setForm({
      ...initialForm,

      reason: mode === "IN" ? "Opening Stock" : "Laundry Usage",
    });

    setError("");
    setSuccess("");
  };

  // ===================================================
  // DATE
  // ===================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ===================================================
  // TIME
  // ===================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===================================================
  // CURRENCY
  // ===================================================

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ===================================================
  // HISTORY FILTER
  // ===================================================

  const filteredTransactions = useMemo(() => {
    const text = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      // Show selected mode only
      if (transaction.type !== mode) {
        return false;
      }

      if (!text) {
        return true;
      }

      const itemName = transaction.inventoryItem?.name || "";

      const reason = transaction.reason || "";

      return (
        itemName.toLowerCase().includes(text) ||
        reason.toLowerCase().includes(text)
      );
    });
  }, [transactions, mode, search]);

  // ===================================================
  // RENDER
  // ===================================================

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
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              backgroundColor:
                mode === "IN" ? COLORS.successBg : COLORS.dangerBg,
            }}
          >
            {mode === "IN" ? (
              <ArrowDownToLine
                size={24}
                style={{
                  color: COLORS.success,
                }}
              />
            ) : (
              <ArrowUpFromLine
                size={24}
                style={{
                  color: COLORS.danger,
                }}
              />
            )}
          </div>

          <div>
            <h1
              className="text-2xl font-semibold sm:text-3xl"
              style={{
                color: COLORS.dark,

                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Stock Management
            </h1>

            <p
              className="mt-1 text-sm"
              style={{
                color: COLORS.muted,
              }}
            >
              Manage inventory stock in and stock out.
            </p>
          </div>
        </div>

        {/* REFRESH */}

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
          style={{
            borderColor: COLORS.border,

            color: COLORS.primary,
          }}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* =================================================
          MODE TOGGLE
      ================================================= */}

      <div
        className="mb-6 inline-flex rounded-xl border bg-white p-1"
        style={{
          borderColor: COLORS.border,
        }}
      >
        <button
          type="button"
          onClick={() => handleModeChange("IN")}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition"
          style={{
            backgroundColor: mode === "IN" ? COLORS.success : "transparent",

            color: mode === "IN" ? "#FFFFFF" : COLORS.muted,
          }}
        >
          <ArrowDownToLine size={17} />
          Stock In
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("OUT")}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition"
          style={{
            backgroundColor: mode === "OUT" ? COLORS.danger : "transparent",

            color: mode === "OUT" ? "#FFFFFF" : COLORS.muted,
          }}
        >
          <ArrowUpFromLine size={17} />
          Stock Out
        </button>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div
          className="mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{
            backgroundColor: COLORS.dangerBg,

            borderColor: "#FECACA",

            color: COLORS.danger,
          }}
        >
          <XCircle size={17} />

          {error}
        </div>
      )}

      {success && (
        <div
          className="mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{
            backgroundColor: COLORS.successBg,

            borderColor: "#BBF7D0",

            color: COLORS.success,
          }}
        >
          <CheckCircle2 size={17} />

          {success}
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* STOCK IN */}

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: COLORS.border,
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
                Stock In
              </p>

              <p
                className="mt-2 text-2xl font-semibold"
                style={{
                  color: COLORS.success,
                }}
              >
                {summary.totalStockIn}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: COLORS.muted,
                }}
              >
                {summary.stockInCount} transactions
              </p>
            </div>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: COLORS.successBg,
              }}
            >
              <TrendingUp
                size={20}
                style={{
                  color: COLORS.success,
                }}
              />
            </div>
          </div>
        </div>

        {/* STOCK OUT */}

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: COLORS.border,
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
                Stock Out
              </p>

              <p
                className="mt-2 text-2xl font-semibold"
                style={{
                  color: COLORS.danger,
                }}
              >
                {summary.totalStockOut}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: COLORS.muted,
                }}
              >
                {summary.stockOutCount} transactions
              </p>
            </div>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: COLORS.dangerBg,
              }}
            >
              <TrendingDown
                size={20}
                style={{
                  color: COLORS.danger,
                }}
              />
            </div>
          </div>
        </div>

        {/* CURRENT ITEMS */}

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: COLORS.border,
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
                Inventory Items
              </p>

              <p
                className="mt-2 text-2xl font-semibold"
                style={{
                  color: COLORS.dark,
                }}
              >
                {items.length}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: COLORS.muted,
                }}
              >
                Active items
              </p>
            </div>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: COLORS.light,
              }}
            >
              <Package
                size={20}
                style={{
                  color: COLORS.primary,
                }}
              />
            </div>
          </div>
        </div>

        {/* TODAY */}

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: COLORS.border,
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
                Today's Transactions
              </p>

              <p
                className="mt-2 text-2xl font-semibold"
                style={{
                  color: COLORS.primary,
                }}
              >
                {summary.todayCount}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: COLORS.muted,
                }}
              >
                Stock movements
              </p>
            </div>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: COLORS.light,
              }}
            >
              <CheckCircle2
                size={20}
                style={{
                  color: COLORS.primary,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        {/* =================================================
            FORM
        ================================================= */}

        <div
          className="rounded-2xl border bg-white p-5"
          style={{
            borderColor: COLORS.border,
          }}
        >
          {/* FORM HEADER */}

          <div className="mb-6">
            <div className="flex items-center gap-2">
              {mode === "IN" ? (
                <ArrowDownToLine
                  size={20}
                  style={{
                    color: COLORS.success,
                  }}
                />
              ) : (
                <ArrowUpFromLine
                  size={20}
                  style={{
                    color: COLORS.danger,
                  }}
                />
              )}

              <h2
                className="text-lg font-semibold"
                style={{
                  color: COLORS.dark,
                }}
              >
                {mode === "IN" ? "Add Stock" : "Remove Stock"}
              </h2>
            </div>

            <p
              className="mt-1 text-xs"
              style={{
                color: COLORS.muted,
              }}
            >
              {mode === "IN"
                ? "Add quantity to inventory."
                : "Remove quantity from inventory."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* =============================================
                INVENTORY ITEM
            ============================================= */}

            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{
                  color: COLORS.text,
                }}
              >
                Inventory Item <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Package
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{
                    color: COLORS.muted,
                  }}
                />

                <select
                  name="inventoryItemId"
                  value={form.inventoryItemId}
                  onChange={handleItemChange}
                  disabled={loading || submitting}
                  className="w-full rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none"
                  style={{
                    backgroundColor: COLORS.bg,

                    border: `1px solid ${COLORS.border}`,

                    color: COLORS.text,
                  }}
                >
                  <option value="">Select inventory item</option>

                  {filteredItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {" — "}
                      {item.currentStock} {item.unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* =============================================
                CURRENT STOCK
            ============================================= */}

            {selectedItem && (
              <div
                className="rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: COLORS.light,

                  borderColor: COLORS.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs"
                      style={{
                        color: COLORS.muted,
                      }}
                    >
                      Current Stock
                    </p>

                    <p
                      className="mt-1 text-lg font-semibold"
                      style={{
                        color: COLORS.primary,
                      }}
                    >
                      {currentStock} {selectedItem.unit}
                    </p>
                  </div>

                  <Package
                    size={23}
                    style={{
                      color: COLORS.primary,
                    }}
                  />
                </div>
              </div>
            )}

            {/* =============================================
                QUANTITY
            ============================================= */}

            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{
                  color: COLORS.text,
                }}
              >
                Quantity <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                name="quantity"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                disabled={loading || submitting || !selectedItem}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: COLORS.bg,

                  border: `1px solid ${COLORS.border}`,

                  color: COLORS.text,
                }}
              />

              {selectedItem && (
                <p
                  className="mt-1 text-xs"
                  style={{
                    color: COLORS.muted,
                  }}
                >
                  Unit: {selectedItem.unit}
                </p>
              )}
            </div>

            {/* =============================================
                PREVIEW
            ============================================= */}

            {selectedItem && form.quantity && enteredQuantity > 0 && (
              <div
                className="rounded-xl border px-4 py-3"
                style={{
                  backgroundColor:
                    mode === "IN"
                      ? COLORS.successBg
                      : enteredQuantity > currentStock
                        ? COLORS.dangerBg
                        : COLORS.light,

                  borderColor:
                    mode === "IN"
                      ? "#BBF7D0"
                      : enteredQuantity > currentStock
                        ? "#FECACA"
                        : COLORS.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm"
                    style={{
                      color: COLORS.muted,
                    }}
                  >
                    {mode === "IN" ? "New Stock" : "Remaining Stock"}
                  </span>

                  <span
                    className="text-lg font-semibold"
                    style={{
                      color:
                        mode === "IN"
                          ? COLORS.success
                          : previewStock < 0
                            ? COLORS.danger
                            : COLORS.primary,
                    }}
                  >
                    {Math.max(previewStock, 0).toFixed(2)} {selectedItem.unit}
                  </span>
                </div>
              </div>
            )}

            {/* =============================================
                REASON
            ============================================= */}

            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{
                  color: COLORS.text,
                }}
              >
                Reason <span className="text-red-500">*</span>
              </label>

              {mode === "IN" ? (
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  disabled={loading || submitting}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    backgroundColor: COLORS.bg,

                    border: `1px solid ${COLORS.border}`,

                    color: COLORS.text,
                  }}
                >
                  <option value="Opening Stock">Opening Stock</option>

                  <option value="Manual Addition">Manual Addition</option>

                  <option value="Customer Return">Customer Return</option>

                  <option value="Supplier Return">Supplier Return</option>

                  <option value="Stock Adjustment">Stock Adjustment</option>

                  <option value="Received">Received</option>

                  <option value="Other">Other</option>
                </select>
              ) : (
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  disabled={loading || submitting}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    backgroundColor: COLORS.bg,

                    border: `1px solid ${COLORS.border}`,

                    color: COLORS.text,
                  }}
                >
                  <option value="Laundry Usage">Laundry Usage</option>

                  <option value="Damaged">Damaged</option>

                  <option value="Expired">Expired</option>

                  <option value="Wastage">Wastage</option>

                  <option value="Internal Usage">Internal Usage</option>

                  <option value="Manual Adjustment">Manual Adjustment</option>

                  <option value="Other">Other</option>
                </select>
              )}
            </div>

            {/* =============================================
                NOTES
            ============================================= */}

            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{
                  color: COLORS.text,
                }}
              >
                Notes
              </label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional information..."
                disabled={loading || submitting}
                className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: COLORS.bg,

                  border: `1px solid ${COLORS.border}`,

                  color: COLORS.text,
                }}
              />
            </div>

            {/* =============================================
                BUTTONS
            ============================================= */}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
                style={{
                  borderColor: COLORS.border,

                  color: COLORS.text,
                }}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={loading || submitting || !selectedItem}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor:
                    mode === "IN" ? COLORS.success : COLORS.danger,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {mode === "IN" ? (
                      <ArrowDownToLine size={17} />
                    ) : (
                      <ArrowUpFromLine size={17} />
                    )}

                    {mode === "IN" ? "Add Stock" : "Remove Stock"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* =================================================
            HISTORY
        ================================================= */}

        <div
          className="overflow-hidden rounded-2xl border bg-white"
          style={{
            borderColor: COLORS.border,
          }}
        >
          {/* HEADER */}

          <div className="border-b px-5 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  className="font-semibold"
                  style={{
                    color: COLORS.dark,
                  }}
                >
                  {mode === "IN" ? "Stock In History" : "Stock Out History"}
                </h2>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color: COLORS.muted,
                  }}
                >
                  {mode === "IN"
                    ? "Recent stock additions."
                    : "Recent stock removals."}
                </p>
              </div>

              {/* SEARCH */}

              <div
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 sm:w-72"
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

          {/* TABLE */}

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin"
                style={{
                  color: COLORS.primary,
                }}
              />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div
              className="flex min-h-[350px] flex-col items-center justify-center px-5 text-center"
              style={{
                color: COLORS.muted,
              }}
            >
              <div
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    mode === "IN" ? COLORS.successBg : COLORS.dangerBg,
                }}
              >
                {mode === "IN" ? (
                  <ArrowDownToLine
                    size={24}
                    style={{
                      color: COLORS.success,
                    }}
                  />
                ) : (
                  <ArrowUpFromLine
                    size={24}
                    style={{
                      color: COLORS.danger,
                    }}
                  />
                )}
              </div>

              <p className="font-medium">
                No {mode === "IN" ? "stock in" : "stock out"} transactions
                found.
              </p>

              <p className="mt-1 text-xs">
                Transactions will appear here after stock movement.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead
                  style={{
                    backgroundColor: COLORS.light,
                  }}
                >
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Date
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Item
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Quantity
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Stock
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Rate
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Amount
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Reason
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.slice(0, 30).map((transaction) => {
                    const isIn = transaction.type === "IN";

                    return (
                      <tr
                        key={transaction.id}
                        className="border-t transition hover:bg-gray-50"
                        style={{
                          borderColor: COLORS.border,
                        }}
                      >
                        {/* DATE */}

                        <td
                          className="whitespace-nowrap px-4 py-3"
                          style={{
                            color: COLORS.muted,
                          }}
                        >
                          <div>{formatDate(transaction.createdAt)}</div>

                          <div className="text-[11px]">
                            {formatTime(transaction.createdAt)}
                          </div>
                        </td>

                        {/* ITEM */}

                        <td
                          className="whitespace-nowrap px-4 py-3"
                          style={{
                            color: COLORS.dark,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{
                                backgroundColor: isIn
                                  ? COLORS.successBg
                                  : COLORS.dangerBg,
                              }}
                            >
                              <Package
                                size={15}
                                style={{
                                  color: isIn ? COLORS.success : COLORS.danger,
                                }}
                              />
                            </div>

                            <div>
                              <p className="font-medium">
                                {transaction.inventoryItem?.name || "-"}
                              </p>

                              <p
                                className="text-[11px]"
                                style={{
                                  color: COLORS.muted,
                                }}
                              >
                                {transaction.inventoryItem?.unit || ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* QUANTITY */}

                        <td
                          className="whitespace-nowrap px-4 py-3 font-semibold"
                          style={{
                            color: isIn ? COLORS.success : COLORS.danger,
                          }}
                        >
                          {isIn ? "+" : "-"} {transaction.quantity}{" "}
                          {transaction.inventoryItem?.unit || ""}
                        </td>

                        {/* STOCK */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            style={{
                              color: COLORS.muted,
                            }}
                          >
                            {transaction.previousStock}
                          </span>

                          <span className="mx-1">→</span>

                          <span
                            className="font-semibold"
                            style={{
                              color: isIn ? COLORS.success : COLORS.danger,
                            }}
                          >
                            {transaction.newStock}
                          </span>
                        </td>

                        {/* RATE */}

                        <td
                          className="whitespace-nowrap px-4 py-3"
                          style={{
                            color: COLORS.text,
                          }}
                        >
                          {transaction.rate != null
                            ? `₹${formatCurrency(transaction.rate)}`
                            : "-"}
                        </td>

                        {/* AMOUNT */}

                        <td
                          className="whitespace-nowrap px-4 py-3 font-medium"
                          style={{
                            color: COLORS.text,
                          }}
                        >
                          {transaction.totalAmount != null
                            ? `₹${formatCurrency(transaction.totalAmount)}`
                            : "-"}
                        </td>

                        {/* REASON */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: isIn
                                ? COLORS.successBg
                                : COLORS.dangerBg,

                              color: isIn ? COLORS.success : COLORS.danger,
                            }}
                          >
                            {transaction.reason ||
                              (isIn ? "Stock In" : "Stock Out")}
                          </span>
                        </td>

                        {/* NOTES */}

                        <td
                          className="max-w-[220px] truncate px-4 py-3"
                          style={{
                            color: COLORS.muted,
                          }}
                          title={transaction.notes || ""}
                        >
                          {transaction.notes || "-"}
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
    </div>
  );
}
