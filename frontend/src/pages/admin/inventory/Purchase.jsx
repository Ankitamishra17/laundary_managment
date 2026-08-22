import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import {
  getPurchases,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseById,
} from "../../../api/purchaseApi";

import { getSuppliers } from "../../../api/supplierApi";
import { getInventoryItems } from "../../../api/inventoryApi";

import PurchaseSummary from "../../../components/purchase/PurchaseSummary";
import PurchaseTable from "../../../components/purchase/PurchaseTable";
import PurchaseModal from "../../../components/purchase/PurchaseModal";
import PurchaseViewModal from "../../../components/purchase/PurchaseViewModal";

const Purchase = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingPurchase, setEditingPurchase] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // =====================================================
  // HELPER: EXTRACT ARRAY FROM API RESPONSE
  // =====================================================

  const getArrayFromResponse = useCallback((response, keys = []) => {
    if (Array.isArray(response)) {
      return response;
    }

    for (const key of keys) {
      if (Array.isArray(response?.[key])) {
        return response[key];
      }

      if (Array.isArray(response?.data?.[key])) {
        return response.data[key];
      }
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }, []);

  // =====================================================
  // LOAD PURCHASES
  // =====================================================

  const loadPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchases();

      console.log("Purchase response:", response);

      const purchaseList = getArrayFromResponse(response, ["purchases"]);

      setPurchases(purchaseList);
    } catch (error) {
      console.error("Failed to load purchases:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load purchases.";

      setError(message);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, [getArrayFromResponse]);

  // =====================================================
  // LOAD SUPPLIERS + INVENTORY ITEMS
  // =====================================================

  const loadPurchaseFormData = useCallback(async () => {
    try {
      const [supplierResponse, inventoryResponse] = await Promise.all([
        getSuppliers(),
        getInventoryItems(),
      ]);

      console.log("Supplier Response:", supplierResponse);
      console.log("Inventory Response:", inventoryResponse);

      // -------------------------------
      // SUPPLIERS
      // -------------------------------

      const supplierList = getArrayFromResponse(supplierResponse, [
        "suppliers",
      ]);

      setSuppliers(supplierList);

      // -------------------------------
      // INVENTORY ITEMS
      // -------------------------------

      const inventoryList = getArrayFromResponse(inventoryResponse, [
        "items",
        "inventoryItems",
        "inventory",
      ]);

      setInventoryItems(inventoryList);
    } catch (error) {
      console.error("Failed to load purchase form data:", error);

      setSuppliers([]);
      setInventoryItems([]);

      toast.error(
        error?.response?.data?.message ||
          "Failed to load suppliers or inventory items.",
      );
    }
  }, [getArrayFromResponse]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([loadPurchases(), loadPurchaseFormData()]);
    };

    loadInitialData();
  }, [loadPurchases, loadPurchaseFormData]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    try {
      await Promise.all([loadPurchases(), loadPurchaseFormData()]);

      toast.success("Purchase data refreshed successfully");
    } catch (error) {
      console.error("Refresh error:", error);
    }
  };

  // =====================================================
  // ADD PURCHASE
  // =====================================================

  const handleAddPurchase = async () => {
    try {
      setEditingPurchase(null);

      // Latest supplier and inventory data load first
      await loadPurchaseFormData();

      // Then open modal
      setShowPurchaseModal(true);
    } catch (error) {
      console.error("Failed to open purchase modal:", error);

      // Modal can still open if old data exists
      setShowPurchaseModal(true);
    }
  };

  // =====================================================
  // EDIT PURCHASE
  // =====================================================

  const handleEditPurchase = async (purchase) => {
    try {
      setEditingPurchase(purchase);

      // Latest supplier and inventory data
      await loadPurchaseFormData();

      setShowPurchaseModal(true);
    } catch (error) {
      console.error("Failed to open edit modal:", error);

      setShowPurchaseModal(true);
    }
  };

  // =====================================================
  // VIEW PURCHASE
  // =====================================================

  const handleViewPurchase = async (purchase) => {
    try {
      // First show available data
      setSelectedPurchase(purchase);
      setShowViewModal(true);

      // Then fetch complete details
      if (!purchase?.id) return;

      const response = await getPurchaseById(purchase.id);

      console.log("Single purchase response:", response);

      const purchaseData =
        response?.data?.purchase ||
        response?.data ||
        response?.purchase ||
        response;

      if (purchaseData) {
        setSelectedPurchase(purchaseData);
      }
    } catch (error) {
      console.error("Failed to load purchase details:", error);

      toast.error(
        error?.response?.data?.message || "Failed to load purchase details.",
      );
    }
  };

  // =====================================================
  // CLOSE PURCHASE MODAL
  // =====================================================

  const handleClosePurchaseModal = () => {
    // Saving ke time modal close nahi hoga
    if (modalLoading) return;

    setShowPurchaseModal(false);
    setEditingPurchase(null);
  };

  // =====================================================
  // CLOSE VIEW MODAL
  // =====================================================

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedPurchase(null);
  };

  // =====================================================
  // CREATE / UPDATE PURCHASE
  // =====================================================

  const handleSubmitPurchase = async (formData) => {
    try {
      setModalLoading(true);

      console.log("Purchase form data:", formData);

      let response;

      // ---------------------------------
      // UPDATE PURCHASE
      // ---------------------------------

      if (editingPurchase?.id) {
        response = await updatePurchase(editingPurchase.id, formData);

        toast.success("Purchase updated successfully");
      }

      // ---------------------------------
      // CREATE PURCHASE
      // ---------------------------------
      else {
        response = await createPurchase(formData);

        toast.success("Purchase saved successfully");
      }

      console.log("Purchase save response:", response);

      // ---------------------------------
      // CLOSE MODAL AFTER SUCCESS
      // ---------------------------------

      setShowPurchaseModal(false);
      setEditingPurchase(null);

      // ---------------------------------
      // REFRESH PURCHASE HISTORY
      // New purchase automatically table me show hoga
      // ---------------------------------

      await loadPurchases();

      // ---------------------------------
      // REFRESH SUPPLIERS + INVENTORY
      // Stock change ke liye
      // ---------------------------------

      await loadPurchaseFormData();

      return response;
    } catch (error) {
      console.error("Purchase save error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save purchase.";

      toast.error(message);

      // IMPORTANT:
      // Error PurchaseModal ko throw karenge
      // taaki modal close na ho
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  // =====================================================
  // DELETE PURCHASE
  // =====================================================

  const handleDeletePurchase = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this purchase?",
    );

    if (!confirmed) return;

    try {
      await deletePurchase(id);

      toast.success("Purchase deleted successfully");

      // Delete ke baad latest purchase history
      await loadPurchases();

      // Inventory refresh
      await loadPurchaseFormData();
    } catch (error) {
      console.error("Delete purchase error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete purchase.",
      );
    }
  };

  // =====================================================
  // SEARCH PURCHASES
  // =====================================================

  const filteredPurchases = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return purchases;
    }

    return purchases.filter((purchase) => {
      const purchaseNumber = String(
        purchase.purchaseNumber || "",
      ).toLowerCase();

      const invoiceNumber = String(purchase.invoiceNumber || "").toLowerCase();

      const supplierName = String(
        purchase.supplier?.name ||
          purchase.supplierName ||
          purchase.supplier?.supplierName ||
          "",
      ).toLowerCase();

      const status = String(purchase.status || "").toLowerCase();

      return (
        purchaseNumber.includes(searchText) ||
        invoiceNumber.includes(searchText) ||
        supplierName.includes(searchText) ||
        status.includes(searchText)
      );
    });
  }, [purchases, search]);

  // =====================================================
  // SUMMARY DATA
  // =====================================================

  const summary = useMemo(() => {
    const totalPurchases = purchases.length;

    const totalAmount = purchases.reduce((sum, purchase) => {
      const amount = Number(
        purchase.totalAmount ?? purchase.total ?? purchase.amount ?? 0,
      );

      return sum + amount;
    }, 0);

    const paidAmount = purchases.reduce((sum, purchase) => {
      return sum + Number(purchase.paidAmount || 0);
    }, 0);

    const pendingAmount = purchases.reduce((sum, purchase) => {
      const purchaseTotal = Number(
        purchase.totalAmount ?? purchase.total ?? purchase.amount ?? 0,
      );

      const paid = Number(purchase.paidAmount || 0);

      return sum + Math.max(0, purchaseTotal - paid);
    }, 0);

    const totalItems = purchases.reduce((sum, purchase) => {
      if (Array.isArray(purchase.items)) {
        return sum + purchase.items.length;
      }

      return sum;
    }, 0);

    return {
      totalPurchases,
      totalAmount,
      paidAmount,
      pendingAmount,
      totalItems,
    };
  }, [purchases]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="p-4 md:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold text-[#0F2C2E]"
            style={{ fontFamily: "'Libre Baskerville', serif" }}
          >
            Purchase Management
          </h1>

          <p className="mt-1 text-sm text-[#51787C]">
            Manage purchases and view complete purchase history.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddPurchase}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#028090] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0B3B3E] sm:w-auto"
        >
          <Plus size={18} />
          Add Purchase
        </button>
      </div>

      {/* ================================================
          SUMMARY
      ================================================= */}

      <PurchaseSummary summary={summary} purchases={purchases} />

      {/* ================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-5 mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* ================================================
          PURCHASE HISTORY
      ================================================= */}

      <div className="mt-6 rounded-xl border border-[#D8ECEA] bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex flex-col gap-4 border-b border-[#D8ECEA] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              className="text-base sm:text-lg font-semibold text-[#0F2C2E]"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Purchase History
            </h2>

            <p className="text-sm text-[#51787C]">
              {filteredPurchases.length} purchase record
              {filteredPurchases.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* SEARCH */}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#51787C]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search purchases..."
                className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] py-2 pl-10 pr-4 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/20 sm:w-64"
              />
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D8ECEA] px-4 py-2 text-sm font-medium text-[#0F2C2E] transition hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin text-[#028090]" />
              ) : (
                <RefreshCw size={18} />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* TABLE */}

        <div className="p-4">
          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2 size={30} className="animate-spin text-[#028090]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <PurchaseTable
                purchases={filteredPurchases}
                onView={handleViewPurchase}
                onEdit={handleEditPurchase}
                onDelete={handleDeletePurchase}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================================================
          ADD / EDIT PURCHASE MODAL
      ================================================= */}

      <PurchaseModal
        isOpen={showPurchaseModal}
        purchase={editingPurchase}
        suppliers={suppliers}
        inventoryItems={inventoryItems}
        loading={modalLoading}
        onClose={handleClosePurchaseModal}
        onSubmit={handleSubmitPurchase}
      />

      {/* ================================================
          VIEW PURCHASE MODAL
      ================================================= */}

      <PurchaseViewModal
        isOpen={showViewModal}
        purchase={selectedPurchase}
        onClose={handleCloseViewModal}
      />
    </div>
  );
};

export default Purchase;
