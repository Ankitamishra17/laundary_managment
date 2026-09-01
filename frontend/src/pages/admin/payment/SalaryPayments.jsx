import React, { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, AlertCircle, BriefcaseBusiness } from "lucide-react";

import {
  getPayments,
  createEmployeePayment,
  updatePayment,
  cancelPayment,
} from "../../../api/paymentApi";

import PaymentStats from "../../../components/payments/PaymentStats";
import PaymentFilters from "../../../components/payments/PaymentFilters";
import PaymentTable from "../../../components/payments/PaymentTable";
import PaymentDetailsModal from "../../../components/payments/PaymentDetailsModal";
import PaymentForm from "../../../components/payments/PaymentForm";

// IMPORTANT:
// Change this import path if your employee API file has a different name.
import { getEmployees } from "../../../api/employeeApi";

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

  const fetchSalaryPayments = useCallback(async () => {
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
          setStats((prev) => ({
            ...prev,
            ...response.stats,
          }));
        }
      } else {
        setPayments(response?.data || []);

        if (response?.message) {
          setError(response.message);
        }
      }
    } catch (err) {
      console.error("Fetch salary payments error:", err);

      setPayments([]);

      setError(
        err?.message ||
          err?.response?.data?.message ||
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

  // =====================================================
  // FETCH EMPLOYEES
  // =====================================================

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await getEmployees();

      if (response?.success) {
        setEmployees(response.data || []);
      } else {
        setEmployees(response?.data || []);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);

      setEmployees([]);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to load employees.",
      );
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // =====================================================
  // LOAD SALARY PAYMENTS
  // =====================================================

  useEffect(() => {
    fetchSalaryPayments();
  }, [fetchSalaryPayments]);

  // =====================================================
  // CREATE SALARY PAYMENT
  // =====================================================

  const handleCreatePayment = async (paymentData) => {
    try {
      setSubmitting(true);
      setError("");

      // -------------------------------------------------
      // IMPORTANT VALIDATION
      // -------------------------------------------------

      if (!paymentData?.employeeId) {
        setError("Please select an employee.");
        return;
      }

      if (!paymentData?.payrollId) {
        setError("Please select a payroll record.");
        return;
      }

      if (!paymentData?.amount || Number(paymentData.amount) <= 0) {
        setError("Please enter a valid payment amount.");
        return;
      }

      if (!paymentData?.paymentMethod) {
        setError("Please select a payment method.");
        return;
      }

      // -------------------------------------------------
      // SALARY PAYMENT PAYLOAD
      // -------------------------------------------------

      const payload = {
        employeeId: Number(paymentData.employeeId),
        payrollId: Number(paymentData.payrollId),
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,

        transactionId: paymentData.transactionId?.trim() || null,

        referenceNumber: paymentData.referenceNumber?.trim() || null,

        paymentDate: paymentData.paymentDate || new Date().toISOString(),

        description: paymentData.description?.trim() || null,

        remarks: paymentData.remarks?.trim() || null,
      };

      console.log("Salary payment payload:", payload);

      const response = await createEmployeePayment(payload);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to create salary payment.",
        );
      }

      // -------------------------------------------------
      // CLOSE FORM
      // -------------------------------------------------

      setShowForm(false);
      setSelectedPayment(null);

      // -------------------------------------------------
      // REFRESH DATA
      // -------------------------------------------------

      await fetchSalaryPayments();
    } catch (err) {
      console.error("Create salary payment error:", err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to create salary payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // UPDATE PAYMENT
  // =====================================================

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

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update payment.");
      }

      setShowForm(false);
      setSelectedPayment(null);

      await fetchSalaryPayments();
    } catch (err) {
      console.error("Update salary payment error:", err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to update salary payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // CANCEL PAYMENT
  // =====================================================

  const handleDeletePayment = async (payment) => {
    if (!payment?.id) return;

    const paymentNumber = payment.paymentNumber || `PAY-${payment.id}`;

    const confirmed = window.confirm(
      `Are you sure you want to cancel salary payment ${paymentNumber}?`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");

      const response = await cancelPayment(payment.id);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to cancel salary payment.",
        );
      }

      await fetchSalaryPayments();
    } catch (err) {
      console.error("Cancel salary payment error:", err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to cancel salary payment.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VIEW PAYMENT
  // =====================================================

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  // =====================================================
  // EDIT PAYMENT
  // =====================================================

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setShowForm(true);
  };

  // =====================================================
  // OPEN CREATE FORM
  // =====================================================

  const handleOpenCreateForm = () => {
    setSelectedPayment(null);
    setError("");
    setShowForm(true);

    // Refresh employees whenever form opens
    fetchEmployees();
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const handleCloseForm = () => {
    if (submitting) return;

    setShowForm(false);
    setSelectedPayment(null);
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

  const handleRefresh = async () => {
    await Promise.all([fetchSalaryPayments(), fetchEmployees()]);
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
          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* CREATE */}

          <button
            type="button"
            onClick={handleOpenCreateForm}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
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

                  employeeId:
                    selectedPayment.employeeId ||
                    selectedPayment.employee?.id ||
                    "",

                  payrollId:
                    selectedPayment.payrollId ||
                    selectedPayment.payroll?.id ||
                    "",

                  amount: selectedPayment.amount || "",
                }
              : {
                  paymentType: "SALARY",
                  employeeId: "",
                  payrollId: "",
                  amount: "",
                  paymentMethod: "",
                  transactionId: "",
                  referenceNumber: "",
                  paymentDate: "",
                  description: "",
                  remarks: "",
                }
          }
          customers={customers}
          suppliers={suppliers}
          employees={employees}
          loading={submitting}
          onClose={handleCloseForm}
          onSubmit={selectedPayment ? handleUpdatePayment : handleCreatePayment}
        />
      )}
    </div>
  );
};

export default SalaryPayments;
