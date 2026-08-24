import { useEffect, useState } from "react";
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm = {
  name: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstNumber: "",
  notes: "",
  status: "Active",
};

// =====================================================
// COMPONENT
// =====================================================

export default function SupplierModal({
  isOpen,
  onClose,
  onSubmit,
  supplier = null,
  loading = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  // ===================================================
  // EDIT / ADD
  // ===================================================

  useEffect(() => {
    if (!isOpen) return;

    if (supplier) {
      setForm({
        name: supplier.name || "",
        companyName: supplier.companyName || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || supplier.mobile || "",
        email: supplier.email || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        pincode: supplier.pincode || "",
        gstNumber: supplier.gstNumber || "",
        notes: supplier.notes || "",
        status: supplier.status || "Active",
      });
    } else {
      setForm(initialForm);
    }

    setError("");
  }, [isOpen, supplier]);

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

    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      companyName: form.companyName.trim() || null,
      contactPerson: form.contactPerson.trim() || null,
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      pincode: form.pincode.trim() || null,
      gstNumber: form.gstNumber.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.message || "Failed to save supplier.");
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
  // NO MODAL
  // ===================================================

  if (!isOpen) return null;

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="font-body fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .font-heading { font-family: 'Libre Baskerville', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-[#D8ECEA] bg-[#F7FAF9] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E6F7F5]">
              <Building2 size={21} className="text-[#028090]" />
            </div>

            <div>
              <h2 className="font-heading text-base font-bold text-[#0F2C2E] sm:text-lg">
                {supplier ? "Edit Supplier" : "Add Supplier"}
              </h2>

              <p className="text-xs text-[#51787C]">
                {supplier
                  ? "Update supplier information."
                  : "Add a new supplier to your inventory."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl p-2 text-[#51787C] hover:bg-[#EAF4F3]"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6">
          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* SUPPLIER NAME */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Supplier Name *
              </label>

              <div className="relative">
                <User
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            {/* COMPANY */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Company Name
              </label>

              <div className="relative">
                <Building2
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Company name"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            {/* CONTACT PERSON */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Contact Person
              </label>

              <input
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                placeholder="Contact person"
                disabled={loading}
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              />
            </div>

            {/* PHONE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Phone *
              </label>

              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            {/* EMAIL */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="supplier@example.com"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            {/* GST */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                GST Number
              </label>

              <input
                name="gstNumber"
                value={form.gstNumber}
                onChange={handleChange}
                placeholder="GST number"
                disabled={loading}
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm uppercase outline-none focus:border-[#028090] focus:bg-white"
              />
            </div>

            {/* ADDRESS */}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Address
              </label>

              <div className="relative">
                <MapPin
                  size={17}
                  className="absolute left-3 top-3 text-[#028090]"
                />

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Supplier address"
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            {/* CITY */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                City
              </label>

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                disabled={loading}
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              />
            </div>

            {/* STATE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                State
              </label>

              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
                disabled={loading}
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              />
            </div>

            {/* PINCODE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Pincode
              </label>

              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="Pincode"
                disabled={loading}
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              />
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
                className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
              >
                <option value="Active">Active</option>

                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* NOTES */}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Notes
              </label>

              <div className="relative">
                <FileText
                  size={17}
                  className="absolute left-3 top-3 text-[#028090]"
                />

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional notes..."
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#D8ECEA] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-[#D8ECEA] px-5 py-3 text-sm font-semibold text-[#51787C] hover:bg-[#EEF7F6] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#028090] to-[#00A896] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Building2 size={17} />

                  {supplier ? "Update Supplier" : "Add Supplier"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
