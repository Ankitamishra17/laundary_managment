import React, { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Phone, Mail } from "lucide-react";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../../api/supplierApi";

import SupplierModal from "../../../components/supplier/SupplierModal";

const Suppliers = () => {
  // ==========================================
  // STATES
  // ==========================================

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // ==========================================
  // GET SUPPLIERS
  // ==========================================

  const loadSuppliers = async () => {
    try {
      setLoading(true);

      const response = await getSuppliers();

      setSuppliers(response?.data || []);
    } catch (error) {
      console.error("Failed to load suppliers:", error);

      alert(error?.response?.data?.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleCloseModal = () => {
    if (modalLoading) return;

    setShowModal(false);
    setEditingSupplier(null);
  };

  // ==========================================
  // CREATE / UPDATE SUPPLIER
  // ==========================================

  const handleSubmit = async (formData) => {
    try {
      setModalLoading(true);

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);

        alert("Supplier updated successfully.");
      } else {
        await createSupplier(formData);

        alert("Supplier created successfully.");
      }

      // Close modal
      setShowModal(false);
      setEditingSupplier(null);

      // Refresh supplier list
      await loadSuppliers();
    } catch (error) {
      console.error("Supplier save error:", error);

      // Important:
      // Throw error so SupplierModal can show its own error
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  // ==========================================
  // DELETE SUPPLIER
  // ==========================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this supplier?",
    );

    if (!confirmDelete) return;

    try {
      await deleteSupplier(id);

      alert("Supplier deleted successfully.");

      await loadSuppliers();
    } catch (error) {
      console.error("Delete supplier error:", error);

      alert(error?.response?.data?.message || "Failed to delete supplier.");
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchText = search.toLowerCase().trim();

    return (
      supplier.name?.toLowerCase().includes(searchText) ||
      supplier.phone?.toLowerCase().includes(searchText) ||
      supplier.email?.toLowerCase().includes(searchText) ||
      supplier.gstNumber?.toLowerCase().includes(searchText)
    );
  });

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="p-6">
      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#0F2C2E" }}>
            Suppliers
          </h1>

          <p className="text-sm mt-1" style={{ color: "#5C7A78" }}>
            Manage your laundry inventory suppliers.
          </p>
        </div>

        {/* ADD SUPPLIER */}

        <button
          type="button"
          onClick={handleAddSupplier}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(95deg, #028090, #02C39A)",
          }}
        >
          <Plus size={17} />
          Add Supplier
        </button>
      </div>

      {/* ================= SEARCH ================= */}

      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5"
        style={{
          backgroundColor: "#EEF7F6",
          border: "1px solid #D8ECEA",
        }}
      >
        <Search size={18} style={{ color: "#5C7A78" }} />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search supplier..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {/* ================= LOADING ================= */}

      {loading ? (
        <div className="text-center py-10">Loading suppliers...</div>
      ) : filteredSuppliers.length === 0 ? (
        /* ================= EMPTY ================= */

        <div
          className="text-center py-12 rounded-2xl"
          style={{
            backgroundColor: "#EEF7F6",
            border: "1px solid #D8ECEA",
          }}
        >
          <p className="font-medium" style={{ color: "#0F2C2E" }}>
            No suppliers found
          </p>

          <p className="text-sm mt-1" style={{ color: "#5C7A78" }}>
            Add your first supplier to get started.
          </p>
        </div>
      ) : (
        /* ================= TABLE ================= */

        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            border: "1px solid #D8ECEA",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: "#EEF7F6",
                    color: "#0F2C2E",
                  }}
                >
                  <th className="text-left px-5 py-4">Supplier</th>

                  <th className="text-left px-5 py-4">Contact</th>

                  <th className="text-left px-5 py-4">GST Number</th>

                  <th className="text-left px-5 py-4">Status</th>

                  <th className="text-right px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-t"
                    style={{
                      borderColor: "#D8ECEA",
                    }}
                  >
                    {/* SUPPLIER */}

                    <td className="px-5 py-4">
                      <div
                        className="font-semibold"
                        style={{ color: "#0F2C2E" }}
                      >
                        {supplier.name}
                      </div>

                      {supplier.address && (
                        <div
                          className="text-xs mt-1"
                          style={{
                            color: "#5C7A78",
                          }}
                        >
                          {supplier.address}
                        </div>
                      )}
                    </td>

                    {/* CONTACT */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Phone
                          size={14}
                          style={{
                            color: "#028090",
                          }}
                        />

                        {supplier.phone}
                      </div>

                      {supplier.email && (
                        <div
                          className="flex items-center gap-2 mt-1 text-xs"
                          style={{
                            color: "#5C7A78",
                          }}
                        >
                          <Mail size={13} />

                          {supplier.email}
                        </div>
                      )}
                    </td>

                    {/* GST */}

                    <td className="px-5 py-4">{supplier.gstNumber || "-"}</td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: supplier.isActive
                            ? "#E6F8F2"
                            : "#FDECEC",

                          color: supplier.isActive ? "#028090" : "#DC2626",
                        }}
                      >
                        {supplier.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                          title="Edit supplier"
                        >
                          <Edit
                            size={16}
                            style={{
                              color: "#028090",
                            }}
                          />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() => handleDelete(supplier.id)}
                          className="p-2 rounded-lg hover:bg-red-50"
                          title="Delete supplier"
                        >
                          <Trash2
                            size={16}
                            style={{
                              color: "#DC2626",
                            }}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SUPPLIER MODAL ================= */}

      {showModal && (
        <SupplierModal
          isOpen={showModal}
          supplier={editingSupplier}
          loading={modalLoading}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default Suppliers;
