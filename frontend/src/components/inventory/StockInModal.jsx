import { useEffect, useMemo, useState } from "react";
import {
  X,
  PackagePlus,
  Loader2,
  Truck,
  IndianRupee,
  FileText,
  Package,
  ArrowRight,
} from "lucide-react";

// =====================================================
// STOCK IN REASONS
// Purchase is not included because Purchase module
// should automatically add stock.
// =====================================================

const STOCK_IN_REASONS = [
  "Opening Stock",
  "Stock Received Without Purchase",
  "Return Received",
  "Other",
];

const initialForm = {
  inventoryItemId: "",
  supplierId: "",
  quantity: "",
  rate: "",
  reason: "Opening Stock",
  notes: "",
};

export default function StockInModal({
  isOpen,
  onClose,
  onSubmit,
  items = [],
  suppliers = [],
  loading = false,
}) {
  // =====================================================
  // STATE
  // =====================================================

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  // =====================================================
  // RESET WHEN MODAL OPENS
  // =====================================================

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setError("");
    }
  }, [isOpen]);

  // =====================================================
  // SELECTED ITEM
  // =====================================================

  const selectedItem = useMemo(() => {
    return items.find(
      (item) => String(item.id) === String(form.inventoryItemId),
    );
  }, [items, form.inventoryItemId]);

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const currentStock = Number(selectedItem?.currentStock ?? 0);

  const quantity = Number(form.quantity || 0);

  const rate = form.rate === "" ? 0 : Number(form.rate || 0);

  const newStock = currentStock + quantity;

  const totalAmount = quantity > 0 && rate > 0 ? quantity * rate : 0;

  // =====================================================
  // HANDLE CHANGE
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
  // HANDLE CLOSE
  // =====================================================

  const handleClose = () => {
    if (loading) return;

    setForm(initialForm);
    setError("");

    onClose();
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!form.inventoryItemId) {
      setError("Please select an inventory item.");
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (form.rate !== "" && Number(form.rate) < 0) {
      setError("Rate cannot be negative.");
      return;
    }

    if (!form.reason) {
      setError("Please select a stock in reason.");
      return;
    }

    // -----------------------------------------------
    // PAYLOAD
    // Match your backend stockIn controller
    // -----------------------------------------------

    const payload = {
      inventoryItemId: Number(form.inventoryItemId),

      quantity: Number(form.quantity),

      supplierId: form.supplierId ? Number(form.supplierId) : null,

      rate: form.rate === "" ? null : Number(form.rate),

      reason: form.reason,

      notes: form.notes.trim() || null,
    };

    try {
      await onSubmit(payload);

      // Parent component should:
      // 1. Call API
      // 2. Refresh inventory/transactions
      // 3. Close modal

      setForm(initialForm);
      setError("");
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to add stock.",
      );
    }
  };

  // =====================================================
  // DON'T RENDER WHEN CLOSED
  // =====================================================

  if (!isOpen) return null;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* =============================================
            HEADER
        ============================================== */}

        <div className="flex items-center justify-between border-b border-[#D8ECEA] bg-[#F7FAF9] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <PackagePlus size={21} className="text-green-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0F2C2E]">Stock In</h2>

              <p className="text-xs text-[#718382]">
                Add manual stock to your inventory.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl p-2 text-[#6B7F7E] transition hover:bg-[#EAF4F3] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* =============================================
            FORM
        ============================================== */}

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6">
          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* =========================================
                INVENTORY ITEM
            ========================================== */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Inventory Item *
              </label>

              <select
                name="inventoryItemId"
                value={form.inventoryItemId}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/10"
              >
                <option value="">Select inventory item</option>

                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {" — "}
                    Current: {item.currentStock ?? 0} {item.unit || ""}
                  </option>
                ))}
              </select>
            </div>

            {/* =========================================
                STOCK PREVIEW
            ========================================== */}

            {selectedItem && (
              <div className="rounded-xl border border-[#D8ECEA] bg-[#F7FAF9] p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* CURRENT */}

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                      <Package size={19} className="text-[#028090]" />
                    </div>

                    <div>
                      <p className="text-xs text-[#718382]">Current Stock</p>

                      <p className="mt-1 text-lg font-bold text-[#0F2C2E]">
                        {currentStock} {selectedItem.unit || ""}
                      </p>
                    </div>
                  </div>

                  {/* NEW */}

                  {quantity > 0 && (
                    <>
                      <ArrowRight size={18} className="text-[#718382]" />

                      <div className="text-right">
                        <p className="text-xs text-[#718382]">New Stock</p>

                        <p className="mt-1 text-lg font-bold text-green-600">
                          {newStock} {selectedItem.unit || ""}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* =========================================
                SUPPLIER
            ========================================== */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Supplier
                <span className="ml-1 text-xs font-normal text-[#718382]">
                  (Optional)
                </span>
              </label>

              <div className="relative">
                <Truck
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <select
                  name="supplierId"
                  value={form.supplierId}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/10"
                >
                  <option value="">No supplier / Manual stock</option>

                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name ||
                        supplier.companyName ||
                        `Supplier #${supplier.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* =========================================
                QUANTITY + RATE
            ========================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* QUANTITY */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                  Quantity *
                </label>

                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="Enter quantity"
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/10"
                />

                {selectedItem?.unit && (
                  <p className="mt-1.5 text-xs text-[#718382]">
                    Unit: {selectedItem.unit}
                  </p>
                )}
              </div>

              {/* RATE */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                  Rate / Unit
                  <span className="ml-1 text-xs font-normal text-[#718382]">
                    (Optional)
                  </span>
                </label>

                <div className="relative">
                  <IndianRupee
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                  />

                  <input
                    type="number"
                    name="rate"
                    value={form.rate}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-9 py-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/10"
                  />
                </div>
              </div>
            </div>

            {/* =========================================
                TOTAL AMOUNT
            ========================================== */}

            {quantity > 0 && form.rate !== "" && rate >= 0 && (
              <div className="rounded-xl bg-[#E6F7F5] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#526968]">
                    Estimated Total Value
                  </span>

                  <span className="text-lg font-bold text-[#028090]">
                    ₹
                    {totalAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* =========================================
                REASON
            ========================================== */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Stock In Reason *
              </label>

              <select
                name="reason"
                value={form.reason}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/10"
              >
                {STOCK_IN_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-xs text-[#718382]">
                Purchases should be added through the Purchase module.
              </p>
            </div>

            {/* =========================================
                NOTES
            ========================================== */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Notes
                <span className="ml-1 text-xs font-normal text-[#718382]">
                  (Optional)
                </span>
              </label>

              <div className="relative">
                <FileText
                  size={17}
                  className="absolute left-3 top-3 text-[#028090]"
                />

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter additional notes..."
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/10"
                />
              </div>
            </div>
          </div>

          {/* =============================================
              FOOTER
          ============================================== */}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#D8ECEA] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-[#D8ECEA] px-5 py-3 text-sm font-semibold text-[#526968] transition hover:bg-[#EEF7F6] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#028090] to-[#00A896] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Adding Stock...
                </>
              ) : (
                <>
                  <PackagePlus size={17} />
                  Add Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
