import { useEffect, useState } from "react";
import { X, Package, Layers, Gauge, Loader2 } from "lucide-react";

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm = {
  name: "",
  category: "",
  unit: "Piece",
  minStock: "",
  status: "Active",
};

// =====================================================
// COMPONENT
// =====================================================

export default function InventoryItemModal({
  isOpen,
  onClose,
  onSubmit,
  item = null,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");

  // ===================================================
  // INITIALIZE
  // ===================================================

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      setForm({
        name: item.name || "",
        category: item.category || "",
        unit: item.unit || "Piece",
        minStock: item.minStock ?? "",
        status: item.status || "Active",
      });
    } else {
      setForm(initialForm);
    }

    setError("");
  }, [isOpen, item]);

  // ===================================================
  // CHANGE
  // ===================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!form.name.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (form.minStock === "") {
      setError("Minimum stock is required.");
      return;
    }

    const minStock = Number(form.minStock);

    if (Number.isNaN(minStock) || minStock < 0) {
      setError("Minimum stock must be 0 or greater.");
      return;
    }

    // -----------------------------------------------
    // PAYLOAD
    // -----------------------------------------------

    const payload = {
      name: form.name.trim(),

      category: form.category.trim(),

      unit: form.unit,

      minStock,

      status: form.status,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Failed to save inventory item.",
      );
    }
  };

  // ===================================================
  // CLOSE
  // ===================================================

  const handleClose = () => {
    if (loading) return;

    setForm(initialForm);

    setError("");

    onClose();
  };

  // ===================================================
  // DON'T RENDER
  // ===================================================

  if (!isOpen) {
    return null;
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-[#D8ECEA] bg-[#F7FAF9] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E6F7F5]">
              <Package size={21} className="text-[#028090]" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0F2C2E]">
                {item ? "Edit Inventory Item" : "Add Inventory Item"}
              </h2>

              <p className="text-xs text-[#718382]">
                {item
                  ? "Update inventory item details."
                  : "Add a new item to your inventory."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl p-2 text-[#6B7F7E] transition hover:bg-[#EAF4F3] hover:text-[#0F2C2E] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* ITEM NAME */}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Item Name <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Package
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Detergent"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white disabled:opacity-60"
                />
              </div>
            </div>

            {/* CATEGORY */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Category <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Layers
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Chemicals"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white disabled:opacity-60"
                />
              </div>
            </div>

            {/* UNIT */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Unit <span className="text-red-500">*</span>
              </label>

              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white disabled:opacity-60"
              >
                <option value="Kg">Kg</option>

                <option value="Litre">Litre</option>

                <option value="Piece">Piece</option>

                <option value="Box">Box</option>

                <option value="Pack">Pack</option>
              </select>
            </div>

            {/* MIN STOCK */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Minimum Stock <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Gauge
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <input
                  type="number"
                  name="minStock"
                  value={form.minStock}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g. 10"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white disabled:opacity-60"
                />
              </div>

              <p className="mt-1.5 text-xs text-[#718382]">
                Alert will be generated when current stock reaches this level.
              </p>
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
                disabled={loading}
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white disabled:opacity-60"
              >
                <option value="Active">Active</option>

                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* STOCK INFORMATION */}

          <div className="mt-5 rounded-xl border border-[#D8ECEA] bg-[#F7FAF9] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E6F7F5]">
                <Package size={17} className="text-[#028090]" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#0F2C2E]">
                  Stock is managed separately
                </p>

                <p className="mt-1 text-xs leading-5 text-[#718382]">
                  Current stock should not be manually changed here. Purchases
                  create Stock IN transactions, while usage, wastage or other
                  removals create Stock OUT transactions.
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#D8ECEA] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-[#D8ECEA] bg-white px-5 py-3 text-sm font-semibold text-[#526968] transition hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#028090] to-[#00A896] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Package size={17} />

                  {item ? "Update Item" : "Add Item"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
