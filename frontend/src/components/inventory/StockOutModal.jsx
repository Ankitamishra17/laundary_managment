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
    (item) =>
      String(item.id) === String(form.inventoryItemId)
  );

  const currentStock = Number(
    selectedInventoryItem?.currentStock || 0
  );

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
        `Only ${currentStock} ${
          selectedInventoryItem?.unit || ""
        } is available.`
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
          "Failed to record stock out."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
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
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* Inventory Item */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Inventory Item{" "}
              <span className="text-red-500">*</span>
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
                disabled={
                  Boolean(selectedItem) || loading
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">
                  Select inventory item
                </option>

                {items.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} — {item.currentStock}{" "}
                    {item.unit}
                  </option>
                ))}
              </select>

            </div>
          </div>

          {/* Current Stock */}
          {selectedInventoryItem && (
            <div className="grid grid-cols-2 gap-3">

              <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">

                <p className="text-xs text-gray-500">
                  Current Stock
                </p>

                <p className="mt-1 text-lg font-semibold text-[#028090]">
                  {currentStock}{" "}
                  {selectedInventoryItem.unit}
                </p>

              </div>

              <div
                className={`rounded-xl border p-4 ${
                  remainingStock <=
                  Number(selectedInventoryItem.minStock)
                    ? "border-orange-100 bg-orange-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >

                <p className="text-xs text-gray-500">
                  Remaining Stock
                </p>

                <p
                  className={`mt-1 text-lg font-semibold ${
                    remainingStock < 0
                      ? "text-red-600"
                      : remainingStock <=
                        Number(
                          selectedInventoryItem.minStock
                        )
                      ? "text-orange-600"
                      : "text-[#028090]"
                  }`}
                >
                  {Math.max(remainingStock, 0)}{" "}
                  {selectedInventoryItem.unit}
                </p>

              </div>

            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Quantity{" "}
              <span className="text-red-500">*</span>
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
                max={currentStock || undefined}
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              />

            </div>

            {selectedInventoryItem && (
              <p className="mt-1.5 text-xs text-gray-400">
                Available: {currentStock}{" "}
                {selectedInventoryItem.unit}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Reason{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative">

              <FileText
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                name="reason"
                value={form.reason}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              >
                <option value="">
                  Select reason
                </option>

                {STOCK_OUT_REASONS.map((reason) => (
                  <option
                    key={reason}
                    value={reason}
                  >
                    {reason}
                  </option>
                ))}
              </select>

            </div>
          </div>

          {/* Low stock warning */}
          {selectedInventoryItem &&
            quantity > 0 &&
            remainingStock >= 0 &&
            remainingStock <=
              Number(
                selectedInventoryItem.minStock
              ) && (
              <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700">

                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  This stock-out will bring the
                  item to or below its minimum
                  stock level.
                </span>

              </div>
            )}

          {/* Buttons */}
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
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#028090] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#026D7A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Saving..."
                : "Confirm Stock Out"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}