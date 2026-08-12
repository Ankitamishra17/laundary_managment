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
  ShieldAlert,
} from "lucide-react";

const initialForm = {
  inventoryItemId: "",
  quantity: "",
  supplierId: "",
  rate: "",
  reason: "",
  notes: "",
};

const inputBase =
  "w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] py-2.5 pl-11 pr-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/15 disabled:cursor-not-allowed disabled:opacity-70";

const iconWrapBase =
  "absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-[#028090]/10 text-[#028090]";

function FieldIcon({ icon: Icon, top }) {
  return (
    <span
      className={top ? `${iconWrapBase} !top-3 !translate-y-0` : iconWrapBase}
    >
      <Icon size={14} />
    </span>
  );
}

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#05282A]/60 sm:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="flex w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl font-['Inter']">
        {/* =========================
            HEADER (sticky, decorative)
        ========================== */}

        <div className="relative shrink-0 overflow-hidden bg-[#05282A] px-5 sm:px-6 py-5">
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#0B3B3E] opacity-60 pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-['Libre_Baskerville'] text-lg sm:text-xl text-white truncate">
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
              className="shrink-0 rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* =========================
            FORM (scrollable body)
        ========================== */}

        <form
          id="stock-in-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-5 p-5 sm:p-6"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* INVENTORY ITEM */}
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

          {/* CURRENT STOCK */}
          {selectedInventoryItem && (
            <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#5A7A79]">Current Stock</p>

                  <p className="mt-1 text-lg font-semibold text-[#028090]">
                    {selectedInventoryItem.currentStock}{" "}
                    {selectedInventoryItem.unit}
                  </p>
                </div>

                <Package size={22} className="text-[#028090]" />
              </div>
            </div>
          )}

          {/* SUPPLIER */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Supplier
            </label>

            <div className="relative">
              <FieldIcon icon={Truck} />

              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                disabled={loading}
                className={`${inputBase} appearance-none`}
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

            <p className="mt-1 text-xs text-[#5A7A79]">
              Select the supplier from whom you purchased this stock.
            </p>
          </div>

          {/* QUANTITY + RATE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 20"
                  disabled={loading}
                  className={inputBase}
                />
              </div>

              {selectedInventoryItem && (
                <p className="mt-1 text-xs text-[#5A7A79]">
                  Unit: {selectedInventoryItem.unit}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Rate per Unit <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FieldIcon icon={IndianRupee} />

                <input
                  type="number"
                  name="rate"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={handleChange}
                  placeholder="e.g. 120"
                  disabled={loading}
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* TOTAL AMOUNT */}
          {quantity > 0 && rate >= 0 && (
            <div className="flex items-center justify-between rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3">
              <div className="flex items-center gap-2">
                <Calculator size={17} className="text-[#028090]" />
                <span className="text-sm text-[#0F2C2E]">Total Amount</span>
              </div>

              <span className="text-lg font-semibold text-[#028090]">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* REASON */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Reason
            </label>

            <div className="relative">
              <FieldIcon icon={FileText} top />

              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Purchased stock"
                disabled={loading}
                className={`${inputBase} resize-none`}
              />
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Notes
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes..."
              disabled={loading}
              className="w-full resize-none rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/15 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>
        </form>

        {/* =========================
            FOOTER (sticky, always reachable)
        ========================== */}

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
            form="stock-in-form"
            disabled={loading}
            className="flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#028090] to-[#00A896] px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving..." : "Confirm Stock In"}
          </button>
        </div>
      </div>
    </div>
  );
}
