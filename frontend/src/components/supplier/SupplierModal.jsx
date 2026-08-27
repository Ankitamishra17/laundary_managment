import React, { useEffect, useState } from "react";
import { X, Building2 } from "lucide-react";

const colors = {
  bgDark: "#05282A",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#51787C",
};

const inputClass =
  "sm-input w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition";
const labelClass = "mb-1.5 block text-sm font-medium";

const SupplierModal = ({ isOpen, supplier, loading, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    isActive: true,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        gstNumber: supplier.gstNumber || "",
        isActive: supplier.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        gstNumber: "",
        isActive: true,
      });
    }
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onSubmit(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .sm-input { border-color: ${colors.cardBorder}; background-color: ${colors.cardTint}; color: ${colors.textDark}; }
        .sm-input:focus { border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px ${colors.primaryTeal}26; }
        .sm-cancel-btn:hover { background-color: ${colors.cardTint}; }
        .sm-close-btn:hover { background-color: ${colors.cardTint}; color: ${colors.textDark}; }
        .sm-submit-btn { background: linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint}); transition: filter 0.15s ease; }
        .sm-submit-btn:hover { filter: brightness(1.06); }
        .sm-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: colors.bgLight }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sm:px-6 sticky top-0"
          style={{
            backgroundColor: colors.bgLight,
            borderBottom: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${colors.primaryTeal}1A`,
                color: colors.primaryTeal,
              }}
            >
              <Building2 size={19} />
            </div>
            <h2
              className="truncate text-lg sm:text-xl"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              {supplier ? "Edit Supplier" : "Add Supplier"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="sm-close-btn shrink-0 rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: colors.textMuted }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} style={{ color: colors.textDark }}>
                Supplier Name *
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter supplier name"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} style={{ color: colors.textDark }}>
                Phone *
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter phone number"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} style={{ color: colors.textDark }}>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} style={{ color: colors.textDark }}>
                GST Number
              </label>

              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="Enter GST number"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ color: colors.textDark }}>
              Address
            </label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              placeholder="Enter address"
              className={`${inputClass} resize-none`}
            />
          </div>

          <label
            className="flex items-center gap-2.5 cursor-pointer select-none rounded-xl border px-3.5 py-3 text-sm"
            style={{
              borderColor: colors.cardBorder,
              backgroundColor: colors.cardTint,
              color: colors.textDark,
            }}
          >
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded"
              style={{ accentColor: colors.primaryTeal }}
            />
            Active Supplier
          </label>

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="sm-cancel-btn w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              style={{
                borderColor: colors.cardBorder,
                color: colors.textMuted,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="sm-submit-btn w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md sm:w-auto"
            >
              {loading
                ? "Saving..."
                : supplier
                  ? "Update Supplier"
                  : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;
