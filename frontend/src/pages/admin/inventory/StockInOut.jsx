import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { getInventoryItems } from "../../../api/inventoryApi";

import {
  getInventoryTransactions,
  createStockIn,
  createStockOut,
} from "../../../api/inventoryTransactionApi";

import { getSuppliers } from "../../../api/supplierApi";

const COLORS = {
  dark: "#05282A",
  primary: "#028090",
  accent: "#02C39A",
  bg: "#F7FBFA",
  light: "#EEF7F6",
  border: "#D8ECEA",
  text: "#244846",
  muted: "#5C7A78",
};

const initialForm = {
  inventoryItemId: "",
  supplierId: "",
  quantity: "",
  rate: "",
  reason: "",
  notes: "",
};

export default function StockInOut() {
  const [activeTab, setActiveTab] = useState("stock-in");

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        itemsResponse,
        suppliersResponse,
        transactionsResponse,
      ] = await Promise.all([
        getInventoryItems(),
        getSuppliers(),
        getInventoryTransactions(),
      ]);

      setItems(itemsResponse?.data || []);
      setSuppliers(suppliersResponse?.data || []);
      setTransactions(transactionsResponse?.data || []);
    } catch (err) {
      console.error("Inventory fetch error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load inventory data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // CHANGE TAB
  // =====================================================

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    setForm({
      ...initialForm,
      reason:
        tab === "stock-in"
          ? "Purchase"
          : "Laundry Usage",
    });

    setError("");
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // =====================================================
  // SELECTED ITEM
  // =====================================================

  const selectedItem = items.find(
    (item) =>
      String(item.id) === String(form.inventoryItemId)
  );

  // =====================================================
  // SUBMIT STOCK
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // -----------------------------
    // Item validation
    // -----------------------------

    if (!form.inventoryItemId) {
      setError("Please select an inventory item.");
      return;
    }

    // -----------------------------
    // Quantity validation
    // -----------------------------

    if (
      !form.quantity ||
      Number(form.quantity) <= 0
    ) {
      setError("Quantity must be greater than 0.");
      return;
    }

    // -----------------------------
    // Stock IN validation
    // -----------------------------

    if (activeTab === "stock-in") {
      if (
        form.rate === "" ||
        Number(form.rate) < 0
      ) {
        setError(
          "Please enter a valid purchase rate."
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      // =================================================
      // STOCK IN
      // =================================================

      if (activeTab === "stock-in") {
        const payload = {
          inventoryItemId: Number(
            form.inventoryItemId
          ),

          supplierId: form.supplierId
            ? Number(form.supplierId)
            : null,

          quantity: Number(form.quantity),

          rate:
            form.rate !== ""
              ? Number(form.rate)
              : null,

          reason:
            form.reason.trim() || "Purchase",

          notes:
            form.notes.trim() || null,
        };

        console.log(
          "Stock IN Payload:",
          payload
        );

        await createStockIn(payload);
      }

      // =================================================
      // STOCK OUT
      // =================================================

      else {
        const payload = {
          inventoryItemId: Number(
            form.inventoryItemId
          ),

          quantity: Number(form.quantity),

          reason:
            form.reason.trim() ||
            "Laundry Usage",

          notes:
            form.notes.trim() || null,
        };

        console.log(
          "Stock OUT Payload:",
          payload
        );

        await createStockOut(payload);
      }

      // =================================================
      // SUCCESS
      // =================================================

      setForm({
        ...initialForm,
        reason:
          activeTab === "stock-in"
            ? "Purchase"
            : "Laundry Usage",
      });

      await fetchData();
    } catch (err) {
      console.error(
        "Stock transaction error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to process stock transaction."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // TOTAL AMOUNT
  // =====================================================

  const totalAmount =
    Number(form.quantity || 0) *
    Number(form.rate || 0);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundColor: "#FFFFFF",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{
              color: COLORS.dark,
              fontFamily:
                "'Libre Baskerville', serif",
            }}
          >
            Stock In / Out
          </h1>

          <p
            className="mt-1 text-sm"
            style={{
              color: COLORS.muted,
            }}
          >
            Add or remove stock from your inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
          style={{
            borderColor: COLORS.border,
            color: COLORS.primary,
          }}
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

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
          {/* Tabs */}

          <div
            className="mb-6 grid grid-cols-2 rounded-xl p-1"
            style={{
              backgroundColor: COLORS.light,
            }}
          >
            <button
              type="button"
              onClick={() =>
                handleTabChange("stock-in")
              }
              className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition"
              style={{
                backgroundColor:
                  activeTab === "stock-in"
                    ? "#FFFFFF"
                    : "transparent",

                color:
                  activeTab === "stock-in"
                    ? COLORS.primary
                    : COLORS.muted,

                boxShadow:
                  activeTab === "stock-in"
                    ? "0 1px 3px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              <ArrowDownToLine size={17} />

              Stock In
            </button>

            <button
              type="button"
              onClick={() =>
                handleTabChange("stock-out")
              }
              className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition"
              style={{
                backgroundColor:
                  activeTab === "stock-out"
                    ? "#FFFFFF"
                    : "transparent",

                color:
                  activeTab === "stock-out"
                    ? "#DC2626"
                    : COLORS.muted,

                boxShadow:
                  activeTab === "stock-out"
                    ? "0 1px 3px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              <ArrowUpFromLine size={17} />

              Stock Out
            </button>
          </div>

          {/* Form title */}

          <div className="mb-5">
            <h2
              className="text-lg font-semibold"
              style={{
                color: COLORS.dark,
              }}
            >
              {activeTab === "stock-in"
                ? "Add Stock"
                : "Remove Stock"}
            </h2>

            <p
              className="mt-1 text-xs"
              style={{
                color: COLORS.muted,
              }}
            >
              {activeTab === "stock-in"
                ? "Record purchased inventory."
                : "Record inventory used or removed."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* =================================================
                INVENTORY ITEM
            ================================================= */}

            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{
                  color: COLORS.text,
                }}
              >
                Inventory Item{" "}
                <span className="text-red-500">
                  *
                </span>
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
                  onChange={handleChange}
                  disabled={
                    loading || submitting
                  }
                  className="w-full rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none"
                  style={{
                    backgroundColor: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.text,
                  }}
                >
                  <option value="">
                    Select inventory item
                  </option>

                  {items.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} —{" "}
                      {item.currentStock}{" "}
                      {item.unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* =================================================
                CURRENT STOCK
            ================================================= */}

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
                      {selectedItem.currentStock}{" "}
                      {selectedItem.unit}
                    </p>
                  </div>

                  <Package
                    size={22}
                    style={{
                      color: COLORS.primary,
                    }}
                  />
                </div>
              </div>
            )}

            {/* =================================================
                SUPPLIER - STOCK IN ONLY
            ================================================= */}

            {activeTab === "stock-in" && (
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  style={{
                    color: COLORS.text,
                  }}
                >
                  Supplier
                </label>

                <select
                  name="supplierId"
                  value={form.supplierId}
                  onChange={handleChange}
                  disabled={
                    loading || submitting
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    backgroundColor: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.text,
                  }}
                >
                  <option value="">
                    Select supplier
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </select>

                {suppliers.length === 0 &&
                  !loading && (
                    <p className="mt-1 text-xs text-red-500">
                      No suppliers found. Please
                      create a supplier first.
                    </p>
                  )}
              </div>
            )}

            {/* =================================================
                QUANTITY
            ================================================= */}

            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{
                  color: COLORS.text,
                }}
              >
                Quantity{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="number"
                name="quantity"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                disabled={
                  loading || submitting
                }
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

            {/* =================================================
                RATE - STOCK IN ONLY
            ================================================= */}

            {activeTab === "stock-in" && (
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  style={{
                    color: COLORS.text,
                  }}
                >
                  Rate per Unit{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{
                      color: COLORS.muted,
                    }}
                  >
                    ₹
                  </span>

                  <input
                    type="number"
                    name="rate"
                    min="0"
                    step="0.01"
                    value={form.rate}
                    onChange={handleChange}
                    placeholder="Enter purchase rate"
                    disabled={
                      loading || submitting
                    }
                    className="w-full rounded-xl py-2.5 pl-8 pr-3 text-sm outline-none"
                    style={{
                      backgroundColor: COLORS.bg,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                    }}
                  />
                </div>
              </div>
            )}

            {/* =================================================
                TOTAL AMOUNT
            ================================================= */}

            {activeTab === "stock-in" &&
              form.quantity &&
              form.rate !== "" && (
                <div
                  className="flex items-center justify-between rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: COLORS.light,
                    borderColor: COLORS.border,
                  }}
                >
                  <span
                    className="text-sm"
                    style={{
                      color: COLORS.muted,
                    }}
                  >
                    Total Amount
                  </span>

                  <span
                    className="text-lg font-semibold"
                    style={{
                      color: COLORS.primary,
                    }}
                  >
                    ₹
                    {totalAmount.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>
              )}

            {/* =================================================
                REASON
            ================================================= */}

            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                style={{
                  color: COLORS.text,
                }}
              >
                Reason
              </label>

              <input
                type="text"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder={
                  activeTab === "stock-in"
                    ? "e.g. Purchase"
                    : "e.g. Laundry Usage"
                }
                disabled={
                  loading || submitting
                }
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                }}
              />
            </div>

            {/* =================================================
                NOTES
            ================================================= */}

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
                placeholder={
                  activeTab === "stock-in"
                    ? "Additional purchase notes..."
                    : "Additional usage notes..."
                }
                disabled={
                  loading || submitting
                }
                className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                }}
              />
            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={
                loading ||
                submitting ||
                items.length === 0
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor:
                  activeTab === "stock-in"
                    ? COLORS.primary
                    : "#DC2626",
              }}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Processing...
                </>
              ) : activeTab === "stock-in" ? (
                <>
                  <ArrowDownToLine size={17} />

                  Add Stock
                </>
              ) : (
                <>
                  <ArrowUpFromLine size={17} />

                  Remove Stock
                </>
              )}
            </button>
          </form>
        </div>

        {/* =================================================
            TRANSACTION HISTORY
        ================================================= */}

        <div
          className="overflow-hidden rounded-2xl border bg-white"
          style={{
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2
                className="font-semibold"
                style={{
                  color: COLORS.dark,
                }}
              >
                Recent Stock Activity
              </h2>

              <p
                className="mt-1 text-xs"
                style={{
                  color: COLORS.muted,
                }}
              >
                Latest inventory movements
              </p>
            </div>

            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: COLORS.light,
                color: COLORS.primary,
              }}
            >
              {transactions.length} Transactions
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin"
                style={{
                  color: COLORS.primary,
                }}
              />
            </div>
          ) : transactions.length === 0 ? (
            <div
              className="flex min-h-[300px] items-center justify-center text-sm"
              style={{
                color: COLORS.muted,
              }}
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
                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Date
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Item
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Type
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Supplier
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Quantity
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Stock
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {transactions
                    .slice(0, 15)
                    .map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-t hover:bg-gray-50"
                        style={{
                          borderColor:
                            COLORS.border,
                        }}
                      >
                        {/* Date */}

                        <td
                          className="whitespace-nowrap px-4 py-3"
                          style={{
                            color: COLORS.muted,
                          }}
                        >
                          {formatDate(
                            transaction.createdAt
                          )}
                        </td>

                        {/* Item */}

                        <td
                          className="whitespace-nowrap px-4 py-3 font-medium"
                          style={{
                            color: COLORS.dark,
                          }}
                        >
                          {transaction
                            .inventoryItem
                            ?.name || "-"}
                        </td>

                        {/* Type */}

                        <td className="whitespace-nowrap px-4 py-3">
                          {transaction.type ===
                          "IN" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                              <ArrowDownToLine
                                size={13}
                              />
                              Stock In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                              <ArrowUpFromLine
                                size={13}
                              />
                              Stock Out
                            </span>
                          )}
                        </td>

                        {/* Supplier */}

                        <td
                          className="whitespace-nowrap px-4 py-3"
                          style={{
                            color: COLORS.muted,
                          }}
                        >
                          {transaction.supplier
                            ?.name || "-"}
                        </td>

                        {/* Quantity */}

                        <td
                          className="whitespace-nowrap px-4 py-3 font-medium"
                          style={{
                            color: COLORS.dark,
                          }}
                        >
                          {transaction.quantity}{" "}
                          {transaction
                            .inventoryItem
                            ?.unit || ""}
                        </td>

                        {/* Stock */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            style={{
                              color:
                                transaction.type ===
                                "IN"
                                  ? "#16A34A"
                                  : "#DC2626",
                            }}
                          >
                            {transaction.previousStock}
                          </span>

                          {" → "}

                          <span
                            className="font-medium"
                            style={{
                              color:
                                COLORS.dark,
                            }}
                          >
                            {transaction.newStock}
                          </span>
                        </td>

                        {/* Notes */}

                        <td
                          className="max-w-[220px] truncate px-4 py-3"
                          style={{
                            color: COLORS.muted,
                          }}
                          title={
                            transaction.notes ||
                            ""
                          }
                        >
                          {transaction.notes || "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}