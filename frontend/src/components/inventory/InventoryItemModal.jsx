import { useEffect, useState } from "react";
import {
  X,
  Package,
  Tag,
  Ruler,
  Boxes,
  Loader2,
  ShieldAlert,
} from "lucide-react";

const initialForm = {
  name: "",
  category: "",
  unit: "",
  currentStock: 0,
  minStock: 0,
  status: "Active",
};

const categories = [
  "Chemicals",
  "Packaging",
  "Accessories",
  "Cleaning Supplies",
  "Consumables",
  "Other",
];

const units = ["Piece", "Kg", "Litre", "Bottle", "Box", "Packet"];

const inputBase =
  "w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] py-2.5 pl-11 pr-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/15";

const iconWrapBase =
  "absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-[#028090]/10 text-[#028090]";

function FieldIcon({ icon: Icon }) {
  return (
    <span className={iconWrapBase}>
      <Icon size={14} />
    </span>
  );
}

export default function InventoryItemModal({
  isOpen,
  onClose,
  onSubmit,
  item = null,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const isEdit = Boolean(item);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        category: item.category || "",
        unit: item.unit || "",
        currentStock: item.currentStock ?? 0,
        minStock: item.minStock ?? 0,
        status: item.status || "Active",
      });
    } else {
      setForm(initialForm);
    }
    setError("");
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!form.category) {
      setError("Please select a category.");
      return;
    }
    if (!form.unit) {
      setError("Please select a unit.");
      return;
    }
    if (Number(form.minStock) < 0) {
      setError("Minimum stock cannot be negative.");
      return;
    }
    if (Number(form.currentStock) < 0) {
      setError("Current stock cannot be negative.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        currentStock: Number(form.currentStock) || 0,
        minStock: Number(form.minStock) || 0,
      });
      setForm(initialForm);
    } catch (err) {
      console.error("Inventory item save error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save inventory item.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#05282A]/60 sm:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="flex w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl font-['Inter']">
        {/* ======================================
            HEADER (sticky, decorative)
        ====================================== */}
        <div className="relative shrink-0 overflow-hidden bg-[#05282A] px-5 sm:px-6 py-5">
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#0B3B3E] opacity-60 pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-['Libre_Baskerville'] text-lg sm:text-xl text-white truncate">
                {isEdit ? "Edit Inventory Item" : "Add Inventory Item"}
              </h2>
              <p className="mt-1 text-xs text-white/60">
                {isEdit
                  ? "Update inventory item information."
                  : "Add a new item to your laundry inventory."}
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

        {/* ======================================
            FORM (scrollable body)
        ====================================== */}
        <form
          id="inventory-item-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-5 p-5 sm:p-6"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ITEM NAME */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Item Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FieldIcon icon={Package} />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Laundry Detergent"
                className={inputBase}
              />
            </div>
          </div>

          {/* CATEGORY + UNIT */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FieldIcon icon={Tag} />
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={`${inputBase} appearance-none`}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Unit <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FieldIcon icon={Ruler} />
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className={`${inputBase} appearance-none`}
                >
                  <option value="">Select unit</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STOCK */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Opening Stock
              </label>
              <div className="relative">
                <FieldIcon icon={Boxes} />
                <input
                  type="number"
                  name="currentStock"
                  min="0"
                  value={form.currentStock}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>
              <p className="mt-1 text-xs text-[#5A7A79]">
                Usually keep this 0 and use Stock In for purchases.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Minimum Stock
              </label>
              <div className="relative">
                <FieldIcon icon={Boxes} />
                <input
                  type="number"
                  name="minStock"
                  min="0"
                  value={form.minStock}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                  className={inputBase}
                />
              </div>
              <p className="mt-1 text-xs text-[#5A7A79]">
                Alert appears when stock reaches this level.
              </p>
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-2.5 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/15"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>

        {/* ======================================
            FOOTER (sticky, always reachable)
        ====================================== */}
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
            form="inventory-item-form"
            disabled={loading}
            className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#028090] to-[#00A896] px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
