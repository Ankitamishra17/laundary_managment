import { useEffect, useState } from "react";
import { X, Package, Tag, Ruler, Boxes, Loader2 } from "lucide-react";

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

  // ==========================================
  // SET FORM FOR ADD / EDIT
  // ==========================================

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

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // SUBMIT
  // ==========================================

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

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* ======================================
            HEADER
        ====================================== */}

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
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* ======================================
            FORM
        ====================================== */}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Error */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ======================================
              ITEM NAME
          ====================================== */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Item Name <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Package
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Laundry Detergent"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white"
              />
            </div>
          </div>

          {/* ======================================
              CATEGORY + UNIT
          ====================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Tag
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white"
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

            {/* Unit */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Unit <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Ruler
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white"
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

          {/* ======================================
              STOCK
          ====================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Current Stock */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Opening Stock
              </label>

              <div className="relative">
                <Boxes
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="currentStock"
                  min="0"
                  value={form.currentStock}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>

              <p className="mt-1 text-xs text-gray-400">
                Usually keep this 0 and use Stock In for purchases.
              </p>
            </div>

            {/* Minimum Stock */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Minimum Stock
              </label>

              <div className="relative">
                <Boxes
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  name="minStock"
                  min="0"
                  value={form.minStock}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>

              <p className="mt-1 text-xs text-gray-400">
                Alert appears when stock reaches this level.
              </p>
            </div>
          </div>

          {/* ======================================
              STATUS
          ====================================== */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#028090] focus:bg-white"
            >
              <option value="Active">Active</option>

              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* ======================================
              BUTTONS
          ====================================== */}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#028090" }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}

              {loading ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
