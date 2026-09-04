import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Building2,
  BriefcaseBusiness,
} from "lucide-react";

import { getPayments } from "../../../api/paymentApi";

const AllTransactions = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    type: "ALL",
    status: "ALL",
    method: "ALL",
    fromDate: "",
    toDate: "",
  });

  // =====================================================
  // FETCH ALL PAYMENTS
  // GET /api/payments
  // =====================================================

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPayments({
        limit: 100,
      });

      if (response?.success) {
        setPayments(Array.isArray(response.data) ? response.data : []);
      } else {
        setPayments([]);
        setError(response?.message || "Failed to load transactions.");
      }
    } catch (err) {
      console.error("All Transactions Error:", err);

      setPayments([]);

      setError(err?.message || err?.error || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // =====================================================
  // FILTER TRANSACTIONS
  // =====================================================

  const filteredPayments = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return payments.filter((payment) => {
      const partyName =
        payment.customer?.name ||
        payment.customer?.customerName ||
        payment.supplier?.name ||
        payment.supplier?.supplierName ||
        payment.employee?.name ||
        payment.employee?.employeeName ||
        payment.customerName ||
        payment.supplierName ||
        payment.employeeName ||
        "";

      const searchableText = [
        payment.paymentNumber,
        payment.transactionId,
        payment.referenceNumber,
        partyName,
        payment.description,
        payment.remarks,
        payment.orderId,
        payment.purchaseId,
        payment.payrollId,
        payment.customerId,
        payment.supplierId,
        payment.employeeId,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      const matchesType =
        filters.type === "ALL" || payment.paymentType === filters.type;

      const matchesStatus =
        filters.status === "ALL" || payment.status === filters.status;

      const matchesMethod =
        filters.method === "ALL" || payment.paymentMethod === filters.method;

      let matchesFromDate = true;
      let matchesToDate = true;

      if (payment.paymentDate) {
        const paymentDate = new Date(payment.paymentDate);

        if (!Number.isNaN(paymentDate.getTime())) {
          if (filters.fromDate) {
            const fromDate = new Date(`${filters.fromDate}T00:00:00`);

            matchesFromDate = paymentDate >= fromDate;
          }

          if (filters.toDate) {
            const toDate = new Date(`${filters.toDate}T23:59:59`);

            matchesToDate = paymentDate <= toDate;
          }
        }
      } else {
        if (filters.fromDate || filters.toDate) {
          return false;
        }
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesMethod &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [payments, filters]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const stats = useMemo(() => {
    const paid = filteredPayments.filter(
      (payment) => payment.status === "Paid",
    );

    const pending = filteredPayments.filter(
      (payment) => payment.status === "Pending",
    );

    const refunded = filteredPayments.filter(
      (payment) =>
        payment.status === "Refunded" || Number(payment.refundAmount || 0) > 0,
    );

    const customerPayments = paid.filter(
      (payment) => payment.paymentType === "CUSTOMER",
    );

    const supplierPayments = paid.filter(
      (payment) => payment.paymentType === "SUPPLIER",
    );

    const salaryPayments = paid.filter(
      (payment) => payment.paymentType === "SALARY",
    );

    const customerReceived = customerPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const supplierPaid = supplierPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const salaryPaid = salaryPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const pendingAmount = pending.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const refundAmount = refunded.reduce(
      (sum, payment) => sum + Number(payment.refundAmount || 0),
      0,
    );

    return {
      total: filteredPayments.length,

      received: customerReceived,
      supplierPaid,
      salaryPaid,
      pendingAmount,
      refundAmount,

      customerCount: customerPayments.length,
      supplierCount: supplierPayments.length,
      salaryCount: salaryPayments.length,

      pendingCount: pending.length,
      refundedCount: refunded.length,
    };
  }, [filteredPayments]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "ALL",
      status: "ALL",
      method: "ALL",
      fromDate: "",
      toDate: "",
    });
  };

  // =====================================================
  // CURRENCY
  // =====================================================

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // =====================================================
  // PARTY NAME
  // =====================================================

  const getPartyName = (payment) => {
    if (payment.paymentType === "CUSTOMER") {
      return (
        payment.customer?.name ||
        payment.customer?.customerName ||
        payment.customerName ||
        `Customer #${payment.customerId || "-"}`
      );
    }

    if (payment.paymentType === "SUPPLIER") {
      return (
        payment.supplier?.name ||
        payment.supplier?.supplierName ||
        payment.supplierName ||
        `Supplier #${payment.supplierId || "-"}`
      );
    }

    if (payment.paymentType === "SALARY") {
      return (
        payment.employee?.name ||
        payment.employee?.employeeName ||
        payment.employeeName ||
        `Employee #${payment.employeeId || "-"}`
      );
    }

    return "-";
  };

  // =====================================================
  // PARTY ID
  // =====================================================

  const getPartyId = (payment) => {
    if (payment.paymentType === "CUSTOMER") {
      return payment.customerId || "-";
    }

    if (payment.paymentType === "SUPPLIER") {
      return payment.supplierId || "-";
    }

    if (payment.paymentType === "SALARY") {
      return payment.employeeId || "-";
    }

    return "-";
  };

  // =====================================================
  // TYPE ICON
  // =====================================================

  const getTypeIcon = (type) => {
    switch (type) {
      case "CUSTOMER":
        return Users;

      case "SUPPLIER":
        return Building2;

      case "SALARY":
        return BriefcaseBusiness;

      default:
        return CreditCard;
    }
  };

  // =====================================================
  // TYPE STYLE
  // =====================================================

  const getTypeStyle = (type) => {
    switch (type) {
      case "CUSTOMER":
        return "bg-blue-50 text-blue-700";

      case "SUPPLIER":
        return "bg-orange-50 text-orange-700";

      case "SALARY":
        return "bg-purple-50 text-purple-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";

      case "Pending":
        return "bg-orange-100 text-orange-700";

      case "Refunded":
        return "bg-purple-100 text-purple-700";

      case "Cancelled":
        return "bg-gray-100 text-gray-700";

      case "Failed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // =====================================================
  // PAYMENT METHOD
  // =====================================================

  const formatPaymentMethod = (method) => {
    if (!method) {
      return "-";
    }

    return method.replace(/_/g, " ");
  };

  // =====================================================
  // REFERENCE
  // =====================================================

  const getReference = (payment) => {
    if (payment.orderId) {
      return `Order #${payment.orderId}`;
    }

    if (payment.purchaseId) {
      return `Purchase #${payment.purchaseId}`;
    }

    if (payment.payrollId) {
      return `Payroll #${payment.payrollId}`;
    }

    return "-";
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // =====================================================
  // DATE + TIME
  // =====================================================

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f5fbfb]">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto mb-3 animate-spin text-teal-600"
          />

          <p className="text-sm text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f5fbfb] p-4 md:p-6 lg:p-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#123b3d] md:text-3xl">
            All Transactions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Complete record of customer, supplier and salary payments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-4 rounded p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Transactions"
          value={stats.total}
          icon={CreditCard}
          iconClass="bg-teal-50 text-teal-600"
        />

        <StatCard
          title="Customer Received"
          value={formatCurrency(stats.received)}
          subtitle={`${stats.customerCount} payments`}
          icon={ArrowDownLeft}
          iconClass="bg-green-50 text-green-600"
        />

        <StatCard
          title="Supplier Paid"
          value={formatCurrency(stats.supplierPaid)}
          subtitle={`${stats.supplierCount} payments`}
          icon={ArrowUpRight}
          iconClass="bg-orange-50 text-orange-600"
        />

        <StatCard
          title="Salary Paid"
          value={formatCurrency(stats.salaryPaid)}
          subtitle={`${stats.salaryCount} payments`}
          icon={ArrowUpRight}
          iconClass="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Pending"
          value={formatCurrency(stats.pendingAmount)}
          subtitle={`${stats.pendingCount} payments`}
          icon={CreditCard}
          iconClass="bg-yellow-50 text-yellow-600"
        />
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#123b3d]">
              Transaction Filters
            </h2>

            <p className="text-xs text-gray-400">
              Filter all payment transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-red-500 transition hover:text-red-600"
          >
            <X size={15} />
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          {/* Search */}

          <div className="relative lg:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search payment, customer..."
              value={filters.search}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  search: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Type */}

          <select
            value={filters.type}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                type: event.target.value,
              }))
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="ALL">All Types</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="SALARY">Salary</option>
          </select>

          {/* Status */}

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                status: event.target.value,
              }))
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="ALL">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>

          {/* Method */}

          <select
            value={filters.method}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                method: event.target.value,
              }))
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="ALL">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank_Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>

          {/* From Date */}

          <div className="relative">
            <CalendarDays
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  fromDate: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* To Date */}

          <div className="relative">
            <CalendarDays
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={filters.toDate}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  toDate: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          TRANSACTION TABLE
      ===================================================== */}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600">
              <CreditCard size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-[#123b3d]">Transactions</h2>

              <p className="text-xs text-gray-400">
                {filteredPayments.length} transactions found
              </p>
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={42} className="mx-auto mb-3 text-gray-300" />

            <p className="font-medium text-gray-600">No transactions found</p>

            <p className="mt-1 text-sm text-gray-400">
              Try changing your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-[#f5fbfb]">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Payment</th>

                  <th className="px-5 py-3">Type</th>

                  <th className="px-5 py-3">Party</th>

                  <th className="px-5 py-3">Reference</th>

                  <th className="px-5 py-3">Amount</th>

                  <th className="px-5 py-3">Method</th>

                  <th className="px-5 py-3">Status</th>

                  <th className="px-5 py-3">Date</th>

                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => {
                  const TypeIcon = getTypeIcon(payment.paymentType);

                  return (
                    <tr
                      key={payment.id}
                      className="text-sm transition hover:bg-gray-50"
                    >
                      {/* Payment */}

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {payment.paymentNumber || `PAY-${payment.id}`}
                        </p>

                        <p className="mt-1 max-w-[150px] truncate text-xs text-gray-400">
                          {payment.transactionId || "No transaction ID"}
                        </p>
                      </td>

                      {/* Type */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getTypeStyle(
                            payment.paymentType,
                          )}`}
                        >
                          <TypeIcon size={13} />

                          {payment.paymentType || "-"}
                        </span>
                      </td>

                      {/* Party */}

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-700">
                          {getPartyName(payment)}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          ID: {getPartyId(payment)}
                        </p>
                      </td>

                      {/* Reference */}

                      <td className="px-5 py-4">
                        <p className="text-gray-700">{getReference(payment)}</p>
                      </td>

                      {/* Amount */}

                      <td className="px-5 py-4 font-semibold text-[#123b3d]">
                        {formatCurrency(payment.amount)}
                      </td>

                      {/* Method */}

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {formatPaymentMethod(payment.paymentMethod)}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                            payment.status,
                          )}`}
                        >
                          {payment.status || "-"}
                        </span>
                      </td>

                      {/* Date */}

                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(payment.paymentDate)}
                      </td>

                      {/* Action */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(payment)}
                          className="rounded-lg border border-teal-200 p-2 text-teal-600 transition hover:bg-teal-50"
                          title="View Details"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}

            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-semibold text-[#123b3d]">
                  Transaction Details
                </h2>

                <p className="text-xs text-gray-400">
                  {selectedPayment.paymentNumber ||
                    `Payment #${selectedPayment.id}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Details */}

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Detail
                label="Payment Number"
                value={selectedPayment.paymentNumber || "-"}
              />

              <Detail
                label="Payment Type"
                value={selectedPayment.paymentType || "-"}
              />

              <Detail label="Party" value={getPartyName(selectedPayment)} />

              <Detail label="Party ID" value={getPartyId(selectedPayment)} />

              <Detail
                label="Amount"
                value={formatCurrency(selectedPayment.amount)}
              />

              <Detail
                label="Payment Method"
                value={formatPaymentMethod(selectedPayment.paymentMethod)}
              />

              <Detail label="Status" value={selectedPayment.status || "-"} />

              <Detail
                label="Transaction ID"
                value={selectedPayment.transactionId || "-"}
              />

              <Detail
                label="Reference Number"
                value={selectedPayment.referenceNumber || "-"}
              />

              <Detail
                label="Customer ID"
                value={selectedPayment.customerId || "-"}
              />

              <Detail
                label="Supplier ID"
                value={selectedPayment.supplierId || "-"}
              />

              <Detail
                label="Employee ID"
                value={selectedPayment.employeeId || "-"}
              />

              <Detail
                label="Order ID"
                value={
                  selectedPayment.orderId ? `#${selectedPayment.orderId}` : "-"
                }
              />

              <Detail
                label="Purchase ID"
                value={
                  selectedPayment.purchaseId
                    ? `#${selectedPayment.purchaseId}`
                    : "-"
                }
              />

              <Detail
                label="Payroll ID"
                value={
                  selectedPayment.payrollId
                    ? `#${selectedPayment.payrollId}`
                    : "-"
                }
              />

              <Detail
                label="Payment Date"
                value={formatDateTime(selectedPayment.paymentDate)}
              />

              <Detail
                label="Refund Amount"
                value={formatCurrency(selectedPayment.refundAmount)}
              />

              <Detail
                label="Refund Date"
                value={formatDateTime(selectedPayment.refundDate)}
              />

              <div className="sm:col-span-2">
                <Detail
                  label="Refund Reason"
                  value={selectedPayment.refundReason || "-"}
                />
              </div>

              <div className="sm:col-span-2">
                <Detail
                  label="Description"
                  value={selectedPayment.description || "-"}
                />
              </div>

              <div className="sm:col-span-2">
                <Detail
                  label="Remarks"
                  value={selectedPayment.remarks || "-"}
                />
              </div>
            </div>

            {/* Footer */}

            <div className="flex justify-end border-t border-gray-100 p-5">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg bg-[#123b3d] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0d3032]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({ title, value, subtitle, icon: Icon, iconClass }) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{title}</p>

          <p className="mt-2 text-xl font-semibold text-[#123b3d]">{value}</p>

          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

// =====================================================
// DETAIL
// =====================================================

const Detail = ({ label, value }) => {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-400">{label}</p>

      <p className="mt-1 break-words text-sm font-medium text-gray-700">
        {value}
      </p>
    </div>
  );
};

export default AllTransactions;
