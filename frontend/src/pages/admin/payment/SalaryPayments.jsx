import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Plus, RefreshCw, AlertCircle, BriefcaseBusiness } from "lucide-react";

// =====================================================
// API
// =====================================================

import {
  getPayments,
  updatePayment,
  cancelPayment,
} from "../../../api/paymentApi";

// =====================================================
// COMPONENTS
// =====================================================

import PaymentStats from "../../../components/payments/PaymentStats";
import PaymentFilters from "../../../components/payments/PaymentFilters";
import PaymentTable from "../../../components/payments/PaymentTable";
import PaymentDetailsModal from "../../../components/payments/PaymentDetailsModal";
import PaymentForm from "../../../components/payments/PaymentForm";

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
  danger: "#E0645C",
};

// =====================================================
// COMPONENT
// =====================================================

const SalaryPayments = () => {
  // ===================================================
  // STATE
  // ===================================================

  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [showDetails, setShowDetails] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);

  // ===================================================
  // FILTERS
  // ===================================================

  const [filters, setFilters] = useState({
    search: "",
    paymentType: "SALARY",
    paymentMethod: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  // ===================================================
  // SERVER STATS
  // ===================================================

  const [serverStats, setServerStats] = useState(null);

  // ===================================================
  // FETCH SALARY PAYMENTS
  // ===================================================

  const fetchSalaryPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPayments({
        search: filters.search || undefined,

        paymentType: "SALARY",

        paymentMethod: filters.paymentMethod || undefined,

        status: filters.status || undefined,

        startDate: filters.startDate || undefined,

        endDate: filters.endDate || undefined,

        page: 1,
        limit: 100,
      });

      console.log("Salary payments response:", response);

      if (response?.success) {
        const data = Array.isArray(response.data) ? response.data : [];

        setPayments(data);

        setServerStats(response.stats || null);
      } else {
        setPayments([]);

        setServerStats(null);

        setError(response?.message || "Unable to load salary payments.");
      }
    } catch (err) {
      console.error("Fetch salary payments error:", err);

      setPayments([]);

      setServerStats(null);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load salary payments.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.paymentMethod,
    filters.status,
    filters.startDate,
    filters.endDate,
  ]);

  // ===================================================
  // INITIAL LOAD / FILTER CHANGE
  // ===================================================

  useEffect(() => {
    fetchSalaryPayments();
  }, [fetchSalaryPayments]);

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    if (serverStats) {
      return {
        totalPayments: Number(serverStats.totalPayments ?? 0),

        totalReceived: Number(serverStats.totalReceived ?? 0),

        totalPaid: Number(serverStats.totalPaid ?? 0),

        pendingAmount: Number(serverStats.pendingAmount ?? 0),

        pendingCount: Number(serverStats.pendingCount ?? 0),

        refundedAmount: Number(serverStats.refundedAmount ?? 0),

        refundedCount: Number(serverStats.refundedCount ?? 0),

        todayAmount: Number(serverStats.todayAmount ?? 0),

        todayCount: Number(serverStats.todayCount ?? 0),

        monthlyAmount: Number(serverStats.monthlyAmount ?? 0),

        monthlyCount: Number(serverStats.monthlyCount ?? 0),

        failedAmount: Number(serverStats.failedAmount ?? 0),

        failedCount: Number(serverStats.failedCount ?? 0),
      };
    }

    // -------------------------------------------------
    // FALLBACK
    // -------------------------------------------------

    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalPayments = 0;
    let totalPaid = 0;

    let pendingAmount = 0;
    let pendingCount = 0;

    let refundedAmount = 0;
    let refundedCount = 0;

    let todayAmount = 0;
    let todayCount = 0;

    let monthlyAmount = 0;
    let monthlyCount = 0;

    let failedAmount = 0;
    let failedCount = 0;

    payments.forEach((payment) => {
      const amount = Number(payment.amount || 0);

      const status = String(payment.status || "").toLowerCase();

      const paymentDate = payment.paymentDate
        ? new Date(payment.paymentDate)
        : null;

      totalPayments += 1;

      if (status === "paid") {
        totalPaid += amount;
      }

      if (status === "pending") {
        pendingAmount += amount;
        pendingCount += 1;
      }

      if (status === "refunded") {
        refundedAmount += Number(payment.refundAmount || amount);

        refundedCount += 1;
      }

      if (status === "failed") {
        failedAmount += amount;
        failedCount += 1;
      }

      if (
        paymentDate &&
        !Number.isNaN(paymentDate.getTime()) &&
        paymentDate >= todayStart
      ) {
        todayAmount += amount;
        todayCount += 1;
      }

      if (
        paymentDate &&
        !Number.isNaN(paymentDate.getTime()) &&
        paymentDate >= monthStart
      ) {
        monthlyAmount += amount;
        monthlyCount += 1;
      }
    });

    return {
      totalPayments,

      // Salary payments are outgoing.
      totalReceived: 0,

      totalPaid,

      pendingAmount,
      pendingCount,

      refundedAmount,
      refundedCount,

      todayAmount,
      todayCount,

      monthlyAmount,
      monthlyCount,

      failedAmount,
      failedCount,
    };
  }, [payments, serverStats]);

  // ===================================================
  // PAYMENT CREATED SUCCESSFULLY
  // ===================================================

  const handlePaymentSuccess = async (response) => {
    console.log("Salary payment created successfully:", response);

    setError("");

    // Refresh table + stats.
    await fetchSalaryPayments();
  };

  // ===================================================
  // VIEW
  // ===================================================

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  // ===================================================
  // EDIT
  // ===================================================

  const handleEditPayment = (payment) => {
    /*
      PaymentForm is currently a CREATE form.

      Salary payments are already recorded as PAID,
      therefore don't open the create form for edit.
      Update functionality is kept separately below.
    */

    setSelectedPayment(payment);

    setError("Salary payment editing is not available from the create form.");
  };

  // ===================================================
  // CANCEL
  // ===================================================

  const handleDeletePayment = async (payment) => {
    if (!payment?.id) {
      setError("Payment ID is missing.");
      return;
    }

    const paymentNumber = payment.paymentNumber || `PAY-${payment.id}`;

    const confirmed = window.confirm(
      `Are you sure you want to cancel salary payment ${paymentNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await cancelPayment(payment.id);

      console.log("Cancel salary payment response:", response);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to cancel salary payment.",
        );
      }

      await fetchSalaryPayments();
    } catch (err) {
      console.error("Cancel salary payment error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to cancel salary payment.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // UPDATE
  // ===================================================

  const handleUpdatePayment = async (paymentData) => {
    if (!selectedPayment?.id) {
      setError("Payment ID is missing.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        paymentMethod: paymentData.paymentMethod,

        transactionId: paymentData.transactionId?.trim() || null,

        referenceNumber: paymentData.referenceNumber?.trim() || null,

        paymentDate: paymentData.paymentDate || new Date().toISOString(),

        description: paymentData.description?.trim() || null,

        remarks: paymentData.remarks?.trim() || null,
      };

      const response = await updatePayment(selectedPayment.id, payload);

      console.log("Update salary payment response:", response);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to update salary payment.",
        );
      }

      setSelectedPayment(null);

      await fetchSalaryPayments();
    } catch (err) {
      console.error("Update salary payment error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update salary payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===================================================
  // CREATE FORM
  // ===================================================

  const handleOpenCreateForm = () => {
    setSelectedPayment(null);
    setError("");
    setShowForm(true);
  };

  // ===================================================
  // CLOSE FORM
  // ===================================================

  const handleCloseForm = () => {
    if (submitting) {
      return;
    }

    setShowForm(false);
    setSelectedPayment(null);
  };

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const handleClearFilters = () => {
    setFilters({
      search: "",
      paymentType: "SALARY",
      paymentMethod: "",
      status: "",
      startDate: "",
      endDate: "",
    });
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    setError("");
    await fetchSalaryPayments();
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="min-h-full space-y-5 p-4 sm:p-5 lg:p-6"
      style={{
        backgroundColor: colors.cardTint,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .sp-refresh-btn:hover { background-color: ${colors.cardTint}; }
        .sp-record-btn { background: linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint}); transition: filter 0.15s ease; }
        .sp-record-btn:hover { filter: brightness(1.06); }
        .sp-record-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${colors.seafoam}1A`,
              color: colors.seafoam,
            }}
          >
            <BriefcaseBusiness size={22} />
          </div>

          <div>
            <h1
              className="text-xl sm:text-2xl"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Salary Payments
            </h1>

            <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
              Manage employee salary and payroll payments.
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="sp-refresh-btn inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            style={{
              borderColor: colors.cardBorder,
              backgroundColor: colors.bgLight,
              color: colors.textDark,
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenCreateForm}
            disabled={submitting}
            className="sp-record-btn inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-md sm:flex-none"
          >
            <Plus size={17} />
            Record Salary Payment
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-xl border p-4"
          style={{
            borderColor: `${colors.danger}4D`,
            backgroundColor: `${colors.danger}0D`,
            color: colors.danger,
          }}
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="text-sm font-medium">Something went wrong</p>

            <p className="mt-1 text-xs">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-xs font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STATS */}
      <PaymentStats stats={stats} loading={loading} />

      {/* FILTERS */}
      <PaymentFilters
        filters={filters}
        setFilters={setFilters}
        onClear={handleClearFilters}
      />

      {/* TABLE */}
      <PaymentTable
        payments={payments}
        loading={loading}
        onView={handleViewPayment}
        onEdit={handleEditPayment}
        onDelete={handleDeletePayment}
      />

      {/* DETAILS */}
      <PaymentDetailsModal
        payment={selectedPayment}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedPayment(null);
        }}
      />

      {/* CREATE SALARY PAYMENT */}
      <PaymentForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default SalaryPayments;
