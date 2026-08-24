import React, { useEffect, useState } from "react";
import { Plus, RefreshCw, AlertCircle, BriefcaseBusiness } from "lucide-react";

import {
  getPayments,
  createPayment,
  updatePayment,
 
} from "../../../api/paymentApi";

import PaymentStats from "../../../components/payments/PaymentStats";
import PaymentFilters from "../../../components/payments/PaymentFilters";
import PaymentTable from "../../../components/payments/PaymentTable";
import PaymentDetailsModal from "../../../components/payments/PaymentDetailsModal";
import PaymentForm from "../../../components/payments/PaymentForm";

const SalaryPayments = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [payments, setPayments] = useState([]);

  const [stats, setStats] = useState({
    totalPayments: 0,
    totalReceived: 0,
    totalPaid: 0,
    pendingAmount: 0,
    pendingCount: 0,
    refundedAmount: 0,
    refundedCount: 0,
    todayAmount: 0,
    todayCount: 0,
    monthlyAmount: 0,
    monthlyCount: 0,
    failedAmount: 0,
    failedCount: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    paymentType: "SALARY",
    paymentMethod: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);

  // =====================================================
  // FETCH SALARY PAYMENTS
  // =====================================================

  const fetchSalaryPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPayments({
        ...filters,
        paymentType: "SALARY",
      });

      if (response?.success) {
        setPayments(response.data || []);

        if (response.stats) {
          setStats(response.stats);
        }
      } else {
        setPayments(response?.data || []);
      }
    } catch (err) {
      console.error("Fetch salary payments error:", err);

      setError(err?.message || "Unable to load salary payments.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    fetchSalaryPayments();
  }, [
    filters.search,
    filters.paymentMethod,
    filters.status,
    filters.startDate,
    filters.endDate,
  ]);

  // =====================================================
  // CREATE SALARY PAYMENT
  // =====================================================

  const handleCreatePayment = async (paymentData) => {
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        ...paymentData,
        paymentType: "SALARY",
      };

      await createPayment(payload);

      setShowForm(false);
      setSelectedPayment(null);

      await fetchSalaryPayments();
    } catch (err) {
      console.error("Create salary payment error:", err);

      setError(err?.message || "Unable to create salary payment.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // UPDATE
  // =====================================================

  const handleUpdatePayment = async (paymentData) => {
    if (!selectedPayment?.id) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        ...paymentData,
        paymentType: "SALARY",
      };

      await updatePayment(selectedPayment.id, payload);

      setShowForm(false);
      setSelectedPayment(null);

      await fetchSalaryPayments();
    } catch (err) {
      console.error("Update salary payment error:", err);

      setError(err?.message || "Unable to update salary payment.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDeletePayment = async (payment) => {
    if (!payment?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete salary payment ${
        payment.paymentNumber || `PAY-${payment.id}`
      }?`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");

      await deletePayment(payment.id);

      await fetchSalaryPayments();
    } catch (err) {
      console.error("Delete salary payment error:", err);

      setError(err?.message || "Unable to delete salary payment.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VIEW
  // =====================================================

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setShowForm(true);
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

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

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    fetchSalaryPayments();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-full space-y-5 bg-gray-50 p-4 sm:p-5 lg:p-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <BriefcaseBusiness size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Salary Payments
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage employee salary and payroll payments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedPayment(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            <Plus size={17} />
            Record Salary Payment
          </button>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
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

      {/* =================================================
          STATS
      ================================================= */}

      <PaymentStats stats={stats} loading={loading} />

      {/* =================================================
          FILTERS
      ================================================= */}

      <PaymentFilters
        filters={filters}
        setFilters={setFilters}
        onClear={handleClearFilters}
      />

      {/* =================================================
          TABLE
      ================================================= */}

      <PaymentTable
        payments={payments}
        loading={loading}
        onView={handleViewPayment}
        onEdit={handleEditPayment}
        onDelete={handleDeletePayment}
      />

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      <PaymentDetailsModal
        payment={selectedPayment}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedPayment(null);
        }}
      />

      {/* =================================================
          PAYMENT FORM
      ================================================= */}

      {showForm && (
        <PaymentForm
          initialData={
            selectedPayment
              ? {
                  ...selectedPayment,
                  paymentType: "SALARY",
                }
              : {
                  paymentType: "SALARY",
                }
          }
          customers={customers}
          suppliers={suppliers}
          employees={employees}
          loading={submitting}
          onClose={() => {
            setShowForm(false);
            setSelectedPayment(null);
          }}
          onSubmit={selectedPayment ? handleUpdatePayment : handleCreatePayment}
        />
      )}
    </div>
  );
};

export default SalaryPayments;
