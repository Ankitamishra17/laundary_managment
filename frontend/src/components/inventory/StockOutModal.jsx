import { useEffect, useState } from "react";
import {
  X,
  Package,
  Hash,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const initialForm = {
  inventoryItemId: "",
  quantity: "",
  reason: "",
};

const STOCK_OUT_REASONS = [
  "Used for Laundry",
  "Damaged",
  "Expired",
  "Lost",
  "Other",
];

const inputBase =
  "w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] py-2.5 pl-11 pr-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/15 disabled:cursor-not-allowed disabled:opacity-70";

const iconWrapBase =
  "absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-[#028090]/10 text-[#028090]";

function FieldIcon({ icon: Icon }) {
  return (
    <span className={iconWrapBase}>
      <Icon size={14} />
    </span>
  );
}

export default function StockOutModal({
  isOpen,
  onClose,
  items = [],
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
        reason: "",
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

  const currentStock = Number(selectedInventoryItem?.currentStock || 0);

  const quantity = Number(form.quantity || 0);

  const remainingStock = currentStock - quantity;

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

    if (!form.inventoryItemId) {
      setError("Please select an inventory item.");
      return;
    }

    if (!form.quantity || quantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (quantity > currentStock) {
      setError(
        `Only ${currentStock} ${selectedInventoryItem?.unit || ""} is available.`,
      );
      return;
    }

    if (!form.reason) {
      setError("Please select a reason.");
      return;
    }

    try {
      await onSubmit({
        inventoryItemId: Number(form.inventoryItemId),
        quantity: Number(form.quantity),
        reason: form.reason,
      });

      setForm(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to record stock out.",
      );
    }
  };

  const isNearMin =
    selectedInventoryItem &&
    quantity > 0 &&
    remainingStock >= 0 &&
    remainingStock <= Number(selectedInventoryItem.minStock);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#05282A]/60 sm:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="flex w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl font-['Inter']">
        {/* Header (sticky, decorative) */}
        <div className="relative shrink-0 overflow-hidden bg-[#05282A] px-5 sm:px-6 py-5">
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#0B3B3E] opacity-60 pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-['Libre_Baskerville'] text-lg sm:text-xl text-white truncate">
                Stock Out
              </h2>

              <p className="mt-1 text-xs text-white/60">
                Remove stock from your inventory.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="shrink-0 rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form (scrollable body) */}
        <form
          id="stock-out-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-5 p-5 sm:p-6"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Inventory Item */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Inventory Item <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <FieldIcon icon={Package} />

              <select
                name="inventoryItemId"
                value={form.inventoryItemId}
                onChange={handleChange}
                disabled={Boolean(selectedItem) || loading}
                className={`${inputBase} appearance-none`}
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

          {/* Current / Remaining Stock */}
          {selectedInventoryItem && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">
                <p className="text-xs text-[#5A7A79]">Current Stock</p>

                <p className="mt-1 text-lg font-semibold text-[#028090]">
                  {currentStock} {selectedInventoryItem.unit}
                </p>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  remainingStock <= Number(selectedInventoryItem.minStock)
                    ? "border-amber-100 bg-amber-50"
                    : "border-[#D8ECEA] bg-[#EEF7F6]"
                }`}
              >
                <p className="text-xs text-[#5A7A79]">Remaining Stock</p>

                <p
                  className={`mt-1 text-lg font-semibold ${
                    remainingStock < 0
                      ? "text-red-600"
                      : remainingStock <= Number(selectedInventoryItem.minStock)
                        ? "text-amber-600"
                        : "text-[#028090]"
                  }`}
                >
                  {Math.max(remainingStock, 0)} {selectedInventoryItem.unit}
                </p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Quantity <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <FieldIcon icon={Hash} />

              <input
                type="number"
                name="quantity"
                min="0.01"
                step="0.01"
                max={currentStock || undefined}
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                disabled={loading}
                className={inputBase}
              />
            </div>

            {selectedInventoryItem && (
              <p className="mt-1.5 text-xs text-[#5A7A79]">
                Available: {currentStock} {selectedInventoryItem.unit}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Reason <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <FieldIcon icon={FileText} />

              <select
                name="reason"
                value={form.reason}
                onChange={handleChange}
                disabled={loading}
                className={`${inputBase} appearance-none`}
              >
                <option value="">Select reason</option>

                {STOCK_OUT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Low stock warning */}
          {isNearMin && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                This stock-out will bring the item to or below its minimum stock
                level.
              </span>
            </div>
          )}
        </form>

        {/* Footer (sticky, always reachable) */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-[#D8ECEA] bg-white/95 backdrop-blur px-5 sm:px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8ECEA] px-5 py-2.5 text-sm font-medium text-[#5A7A79] transition hover:bg-[#EEF7F6] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="stock-out-form"
            disabled={loading}
            className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#028090] to-[#00A896] px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving..." : "Confirm Stock Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
