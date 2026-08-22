import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  X,
  AlertCircle,
} from "lucide-react";

import {
  createSupplierPayment,
  getPayments,
} from "../../../api/paymentApi";

// NOTE: adjust these two import paths/names if your actual
// supplier / purchase API files export different function names.
import { getSuppliers } from "../../../api/supplierApi";
import { getPurchases } from "../../../api/purchaseApi";

import SupplierPaymentSummary from "../../../components/supplier/SupplierPaymentSummary";
import SupplierPaymentTable from "../../../components/supplier/SupplierPaymentTable";
import SupplierPaymentModal from "../../../components/supplier/SupplierPaymentModal";


// =====================================================
// FONTS (Libre Baskerville for headings, Inter for body)
// =====================================================

const FontImports = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
    .font-heading { font-family: 'Libre Baskerville', serif; }
    .font-body { font-family: 'Inter', sans-serif; }
  `}</style>
);


// =====================================================
// HELPERS
// =====================================================

const extractArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  if (Array.isArray(data?.payments)) {
    return data.payments;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
};


// =====================================================
// COMPONENT
// =====================================================

export default function SupplierPayments() {
  // ===================================================
  // DATA
  // ===================================================

  const [payments, setPayments] = useState([]);

  // Suppliers + outstanding purchases: used both for the
  // "Record Payment" modal dropdowns AND for the
  // "Outstanding Due" summary card (which is calculated
  // from Purchase.dueAmount, NOT from Payment.status,
  // since every recorded payment is immediately "Paid").
  const [suppliers, setSuppliers] = useState([]);
  const [outstandingPurchases, setOutstandingPurchases] = useState([]);
  const [modalDataLoading, setModalDataLoading] = useState(false);

  // ===================================================
  // MODAL
  // ===================================================

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState(false);

  // ===================================================
  // ERROR / SUCCESS
  // ===================================================

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ===================================================
  // PAGINATION
  // ===================================================

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // ===================================================
  // FETCH SUPPLIER PAYMENTS
  // ===================================================
  //
  // This page lists ALL supplier-type payments, so it uses
  // the generic getPayments() endpoint with paymentType=
  // SUPPLIER, NOT getSupplierPayments(supplierId) (that one
  // is for a single supplier's history).
  // =====================================================

  const fetchSupplierPayments = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
          paymentType: "SUPPLIER",
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (status) {
          params.status = status;
        }

        if (dateFrom) {
          params.startDate = dateFrom;
        }

        if (dateTo) {
          params.endDate = dateTo;
        }

        const response = await getPayments(params);

        const list = extractArray(response);

        setPayments(list);
      } catch (err) {
        console.error(
          "Fetch supplier payments error:",
          err
        );

        setError(
          err?.message ||
            err?.response?.data?.message ||
            "Failed to fetch supplier payments."
        );

        setPayments([]);
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      limit,
      search,
      status,
      dateFrom,
      dateTo,
    ]
  );


  // ===================================================
  // INITIAL / FILTER LOAD
  // ===================================================

  useEffect(() => {
    fetchSupplierPayments();
  }, [fetchSupplierPayments]);


  // ===================================================
  // LOAD SUPPLIERS (once, for the modal dropdown)
  // ===================================================

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await getSuppliers({ limit: 200 });

        setSuppliers(extractArray(response));
      } catch (err) {
        console.error("Fetch suppliers error:", err);
      }
    };

    loadSuppliers();
  }, []);


  // ===================================================
  // LOAD OUTSTANDING PURCHASES
  // (Purchase.status = PENDING or PARTIAL, dueAmount > 0)
  //
  // Used for:
  //   1. The modal's "Select Purchase" dropdown
  //   2. The "Outstanding Due" summary card
  //
  // Loaded on mount AND refreshed whenever the modal opens
  // or a payment is successfully recorded, so due amounts
  // are always current.
  // =====================================================

  const loadOutstandingPurchases = useCallback(async () => {
    try {
      setModalDataLoading(true);

      // Fetch purchases that still have a balance.
      // If your getPurchases() doesn't support a "status"
      // filter, drop it and filter client-side instead.
      const [pendingRes, partialRes] = await Promise.all([
        getPurchases({ status: "PENDING", limit: 200 }),
        getPurchases({ status: "PARTIAL", limit: 200 }),
      ]);

      const combined = [
        ...extractArray(pendingRes),
        ...extractArray(partialRes),
      ].filter((purchase) => Number(purchase.dueAmount || 0) > 0);

      setOutstandingPurchases(combined);
    } catch (err) {
      console.error("Fetch purchases error:", err);

      setOutstandingPurchases([]);
    } finally {
      setModalDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOutstandingPurchases();
  }, [loadOutstandingPurchases]);


  // ===================================================
  // SUCCESS MESSAGE AUTO HIDE
  // ===================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);


  // ===================================================
  // CREATE SUPPLIER PAYMENT
  // ===================================================
  //
  // Calls createSupplierPayment() (POST /payments/supplier),
  // NOT the generic createPayment(). The supplier-specific
  // endpoint validates against the purchase's due amount and
  // updates Purchase.paidAmount / dueAmount / status.
  // =====================================================

  const handleCreatePayment = async (
    paymentData
  ) => {
    try {
      setActionLoading(true);
      setError("");

      await createSupplierPayment(paymentData);

      setSuccess(
        "Supplier payment recorded successfully."
      );

      setShowPaymentModal(false);

      await fetchSupplierPayments();

      // Refresh outstanding purchases so the "Outstanding
      // Due" card and the modal's purchase list both reflect
      // the new due amount immediately.
      await loadOutstandingPurchases();
    } catch (err) {
      console.error(
        "Create supplier payment error:",
        err
      );

      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to record supplier payment.";

      setError(message);

      /*
       * Throw again so SupplierPaymentModal can
       * also handle its own loading/error state
       * if required.
       */
      throw err;
    } finally {
      setActionLoading(false);
    }
  };


  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    await fetchSupplierPayments();
    await loadOutstandingPurchases();
  };


  // ===================================================
  // RESET FILTERS
  // ===================================================

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setError("");
  };


  // ===================================================
  // OPEN PAYMENT MODAL
  // ===================================================

  const handleOpenPaymentModal = () => {
    setError("");
    setShowPaymentModal(true);

    // Pull fresh outstanding-purchase data every time
    // the modal is opened.
    loadOutstandingPurchases();
  };


  // ===================================================
  // CLOSE PAYMENT MODAL
  // ===================================================

  const handleClosePaymentModal = () => {
    if (actionLoading) {
      return;
    }

    setShowPaymentModal(false);
  };


  // ===================================================
  // OUTSTANDING DUE (sum of dueAmount across all
  // PENDING / PARTIAL purchases — independent of Payment
  // records/pagination, since payments never carry a
  // "Pending" status in this system)
  // ===================================================

  const outstandingDue = useMemo(() => {
    return outstandingPurchases.reduce(
      (total, purchase) => total + Number(purchase.dueAmount || 0),
      0
    );
  }, [outstandingPurchases]);


  // ===================================================
  // SUMMARY DATA
  // ===================================================
  //
  // NOTE: totalPaid / failed / refunded below are computed
  // only from the currently loaded page of `payments`
  // (10 rows at a time). If you need these totals across
  // ALL supplier payments (not just the current page), swap
  // this for a dedicated summary endpoint (e.g.
  // getPaymentDashboard) instead of summing the paginated
  // list.
  // =====================================================

  const summary = useMemo(() => {
    let totalPaid = 0;
    let failed = 0;
    let refunded = 0;

    payments.forEach((payment) => {
      const amount =
        Number(payment.amount) || 0;

      const refundAmount =
        Number(payment.refundAmount) || 0;

      if (payment.status === "Paid") {
        totalPaid += amount;
      }

      if (payment.status === "Failed") {
        failed += amount;
      }

      if (payment.status === "Refunded") {
        refunded += refundAmount || amount;
      }
    });

    return {
      totalPaid,
      pending: outstandingDue,
      failed,
      refunded,
      count: payments.length,
    };
  }, [payments, outstandingDue]);


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="font-body min-h-full space-y-6 bg-[#F7FAF9] p-3 sm:p-6 lg:p-8">

      <FontImports />

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="font-heading text-xl font-bold text-[#0F2C2E] sm:text-2xl lg:text-3xl">
            Supplier Payments
          </h1>

          <p className="mt-1 text-sm text-[#51787C]">
            Manage payments made to suppliers
            against purchases.
          </p>
        </div>


        <div className="flex flex-wrap items-center gap-2">

          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              loading || actionLoading
            }
            className="flex items-center gap-2 rounded-xl border border-[#D8ECEA] bg-white px-4 py-2.5 text-sm font-medium text-[#51787C] transition hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>


          {/* RECORD PAYMENT */}

          <button
            type="button"
            onClick={handleOpenPaymentModal}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#028090] to-[#00A896] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={17} />

            Record Payment
          </button>

        </div>
      </div>


      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-[#02C39A]/30 bg-[#02C39A]/10 px-4 py-3 text-sm text-[#0B3B3E]">

          <div className="flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-[#02C39A]" />

            {success}

          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="rounded-lg p-1 hover:bg-[#02C39A]/20"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

          <div className="flex items-start gap-2">

            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>

          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <SupplierPaymentSummary
        payments={payments}
        summary={summary}
        loading={loading}
      />


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="rounded-2xl border border-[#D8ECEA] bg-white p-4 sm:p-5">

        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-heading font-semibold text-[#0F2C2E]">
              Payment Filters
            </h2>

            <p className="mt-1 text-xs text-[#51787C]">
              Search and filter supplier payments.
            </p>
          </div>


          <button
            type="button"
            onClick={resetFilters}
            className="text-left text-xs font-medium text-[#028090] hover:underline sm:text-right"
          >
            Reset Filters
          </button>

        </div>


        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* SEARCH */}

          <div className="relative sm:col-span-2 lg:col-span-2">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search supplier / payment..."
              className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] py-2.5 pl-10 pr-3 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white"
            />

          </div>


          {/* STATUS */}

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
          >
            <option value="">
              All Status
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Failed">
              Failed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

            <option value="Refunded">
              Refunded
            </option>
          </select>


          {/* DATE */}

          <div className="grid grid-cols-2 gap-2">

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              title="From date"
              className="min-w-0 rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-2 py-2.5 text-xs text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              title="To date"
              className="min-w-0 rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-2 py-2.5 text-xs text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
            />

          </div>

        </div>
      </div>


      {/* =================================================
          PAYMENT TABLE
      ================================================= */}

      <div className="overflow-x-auto rounded-2xl">
        <SupplierPaymentTable
          payments={payments}
          loading={loading || actionLoading}
        />
      </div>


      {/* =================================================
          PAGINATION
      ================================================= */}

      {!loading &&
        payments.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#D8ECEA] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs text-[#51787C]">
              Page {page}
            </p>


            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={
                  page === 1 ||
                  loading ||
                  actionLoading
                }
                onClick={() =>
                  setPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                className="rounded-lg border border-[#D8ECEA] px-3 py-2 text-xs font-medium text-[#51787C] transition hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>


              <button
                type="button"
                disabled={
                  payments.length < limit ||
                  loading ||
                  actionLoading
                }
                onClick={() =>
                  setPage((prev) => prev + 1)
                }
                className="rounded-lg border border-[#D8ECEA] px-3 py-2 text-xs font-medium text-[#51787C] transition hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>
        )}


      {/* =================================================
          SUPPLIER PAYMENT MODAL
      ================================================= */}

      <SupplierPaymentModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        onSubmit={handleCreatePayment}
        loading={actionLoading || modalDataLoading}
        suppliers={suppliers}
        purchases={outstandingPurchases}
      />

    </div>
  );
}