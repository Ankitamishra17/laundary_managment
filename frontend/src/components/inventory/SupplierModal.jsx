import { useEffect, useState } from "react";
import { X, UserRound, Phone, Mail, MapPin, FileText, Loader2 } from "lucide-react";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  gstNumber: "",
  isActive: true,
};

export default function SupplierModal({
  isOpen,
  onClose,
  onSubmit,
  supplier = null,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const isEdit = Boolean(supplier);

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        gstNumber: supplier.gstNumber || "",
        isActive: supplier.isActive ?? true,
      });
    } else {
      setForm(initialForm);
    }

    setError("");
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (form.phone.trim().length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    try {
      await onSubmit(form);
      setForm(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save supplier."
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ backgroundColor: "#05282A" }}
        >
          <div>
            <h2
              className="text-xl font-semibold text-white"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              {isEdit ? "Edit Supplier" : "Add Supplier"}
            </h2>

            <p className="mt-1 text-xs text-white/60">
              {isEdit
                ? "Update supplier information"
                : "Add a new supplier to your inventory"}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Supplier Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Supplier Name <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <UserRound
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter supplier name"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#028090] focus:bg-white"
              />
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="supplier@example.com"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* GST */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              GST Number
            </label>

            <div className="relative">
              <FileText
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                name="gstNumber"
                value={form.gstNumber}
                onChange={handleChange}
                placeholder="Enter GST number"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm uppercase outline-none focus:border-[#028090] focus:bg-white"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Address
            </label>

            <div className="relative">
              <MapPin
                size={17}
                className="absolute left-3 top-3 text-gray-400"
              />

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                placeholder="Enter supplier address"
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              />
            </div>
          </div>

          {/* Active status - only useful during edit */}
          {isEdit && (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4 accent-[#028090]"
              />

              <div>
                <p className="text-sm font-medium text-gray-700">
                  Active Supplier
                </p>
                <p className="text-xs text-gray-400">
                  Allow this supplier to be used for purchases
                </p>
              </div>
            </label>
          )}

          {/* Buttons */}
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
              className="flex min-w-[130px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#028090" }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}

              {loading
                ? "Saving..."
                : isEdit
                ? "Update Supplier"
                : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}