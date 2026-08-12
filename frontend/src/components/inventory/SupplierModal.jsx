import { useEffect, useState } from "react";
import {
  X,
  UserRound,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  ShieldAlert,
} from "lucide-react";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  gstNumber: "",
  isActive: true,
};

const inputBase =
  "w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] py-2.5 pl-11 pr-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/15";

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
          "Failed to save supplier.",
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
        {/* Header (sticky, decorative) */}
        <div className="relative shrink-0 overflow-hidden bg-[#05282A] px-5 sm:px-6 py-5">
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#0B3B3E] opacity-60 pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-['Libre_Baskerville'] text-lg sm:text-xl text-white truncate">
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
              className="shrink-0 rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form (scrollable body) */}
        <form
          id="supplier-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-5 p-5 sm:p-6"
        >
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Supplier Name <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <FieldIcon icon={UserRound} />

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter supplier name"
                className={inputBase}
              />
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Phone <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FieldIcon icon={Phone} />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={inputBase}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Email
              </label>

              <div className="relative">
                <FieldIcon icon={Mail} />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="supplier@example.com"
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* GST */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              GST Number
            </label>

            <div className="relative">
              <FieldIcon icon={FileText} />

              <input
                type="text"
                name="gstNumber"
                value={form.gstNumber}
                onChange={handleChange}
                placeholder="Enter GST number"
                className={`${inputBase} uppercase`}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
              Address
            </label>

            <div className="relative">
              <FieldIcon icon={MapPin} top />

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                placeholder="Enter supplier address"
                className={`${inputBase} resize-none`}
              />
            </div>
          </div>

          {/* Active status - only useful during edit */}
          {isEdit && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4 accent-[#028090]"
              />

              <div>
                <p className="text-sm font-medium text-[#0F2C2E]">
                  Active Supplier
                </p>
                <p className="text-xs text-[#5A7A79]">
                  Allow this supplier to be used for purchases
                </p>
              </div>
            </label>
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
            form="supplier-form"
            disabled={loading}
            className="flex min-w-[130px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#028090] to-[#00A896] px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading
              ? "Saving..."
              : isEdit
                ? "Update Supplier"
                : "Add Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}
