import { useEffect, useState } from "react";
import {
  X,
  Package,
  Truck,
  Hash,
  IndianRupee,
  FileText,
  Loader2,
  Calculator,
} from "lucide-react";

const initialForm = {
  inventoryItemId: "",
  quantity: "",
  supplierId: "",
  rate: "",
  reason: "",
  notes: "",
};

export default function StockInModal({
  isOpen,
  onClose,
  items = [],
  suppliers = [],
  onSubmit,
  loading = false,
  selectedItem = null,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (selectedItem) {
      setForm({
        inventoryItemId: String(selectedItem.id),
        quantity: "",
        supplierId: "",
        rate: "",
        reason: "",
        notes: "",
      });
    } else {
      setForm(initialForm);
    }

    setError("");
  }, [isOpen, selectedItem]);

  if (!isOpen) return null;

  const selectedInventoryItem = items.find(
    (item) => String(item.id) === String(form.inventoryItemId),
  );

  const quantity = Number(form.quantity || 0);
  const rate = Number(form.rate || 0);

  const totalAmount = quantity * rate;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // -----------------------------
    // Validation
    // -----------------------------

    if (!form.inventoryItemId) {
      setError("Please select an inventory item.");
      return;
    }

    if (!form.quantity || quantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (form.rate === "" || rate < 0) {
      setError("Please enter a valid purchase rate.");
      return;
    }

    try {
      await onSubmit({
        inventoryItemId: Number(form.inventoryItemId),

        supplierId: form.supplierId ? Number(form.supplierId) : null,

        quantity: Number(form.quantity),

        rate: Number(form.rate),

        reason: form.reason.trim() || "Purchase",

        notes: form.notes.trim() || null,
      });

      setForm(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to record stock in.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* =========================
            HEADER
        ========================== */}

        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ backgroundColor: "#05282A" }}
        >
          <div>
            <h2
              className="text-xl font-semibold text-white"
              style={{
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Stock In
            </h2>

            <p className="mt-1 text-xs text-white/60">
              Add purchased stock to your inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* =========================
            FORM
        ========================== */}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Error */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* =========================
              INVENTORY ITEM
          ========================== */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Inventory Item <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Package
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                name="inventoryItemId"
                value={form.inventoryItemId}
                onChange={handleChange}
                disabled={Boolean(selectedItem) || loading}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">Select inventory item</option>

                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.currentStock} {item.unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =========================
              CURRENT STOCK
          ========================== */}

          {selectedInventoryItem && (
            <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Current Stock</p>

                  <p className="mt-1 text-lg font-semibold text-[#028090]">
                    {selectedInventoryItem.currentStock}{" "}
                    {selectedInventoryItem.unit}
                  </p>
                </div>

                <Package size={22} className="text-[#028090]" />
              </div>
            </div>
          )}

          {/* =========================
              SUPPLIER
          ========================== */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Supplier
            </label>

            <div className="relative">
              <Truck
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              >
                <option value="">Select supplier</option>

                {suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No suppliers available
                  </option>
                )}
              </select>
            </div>

            <p className="mt-1 text-xs text-gray-400">
              Select the supplier from whom you purchased this stock.
            </p>
          </div>

          {/* =========================
              QUANTITY + RATE
          ========================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Quantity */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Quantity <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Hash
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="quantity"
                  min="0.01"
                  step="0.01"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 20"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>

              {selectedInventoryItem && (
                <p className="mt-1 text-xs text-gray-400">
                  Unit: {selectedInventoryItem.unit}
                </p>
              )}
            </div>

            {/* Rate */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Rate per Unit <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <IndianRupee
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="rate"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={handleChange}
                  placeholder="e.g. 120"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* =========================
              TOTAL AMOUNT
          ========================== */}

          {quantity > 0 && rate >= 0 && (
            <div className="flex items-center justify-between rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3">
              <div className="flex items-center gap-2">
                <Calculator size={17} className="text-[#028090]" />

                <span className="text-sm text-gray-600">Total Amount</span>
              </div>

              <span className="text-lg font-semibold text-[#028090]">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* =========================
              REASON
          ========================== */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Reason
            </label>

            <div className="relative">
              <FileText
                size={17}
                className="absolute left-3 top-3 text-gray-400"
              />

              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Purchased stock"
                disabled={loading}
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              />
            </div>
          </div>

          {/* =========================
              NOTES
          ========================== */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes..."
              disabled={loading}
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#028090] focus:bg-white"
            />
          </div>

          {/* =========================
              BUTTONS
          ========================== */}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-[#028090] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#026D7A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}

              {loading ? "Saving..." : "Confirm Stock In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
