import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const SupplierModal = ({
  isOpen,
  supplier,
  loading,
  onClose,
  onSubmit,
}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-semibold">
            {supplier ? "Edit Supplier" : "Add Supplier"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Supplier Name *
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter supplier name"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Phone *
            </label>

            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter phone number"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              GST Number
            </label>

            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              placeholder="Enter GST number"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Address
            </label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              placeholder="Enter address"
              className="w-full resize-none rounded-lg border px-3 py-2.5 outline-none focus:border-teal-600"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            Active Supplier
          </label>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-600 px-5 py-2 text-white disabled:opacity-50"
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