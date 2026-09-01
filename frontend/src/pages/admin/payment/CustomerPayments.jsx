import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Eye,
  IndianRupee,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { getPayments } from "../../../api/paymentApi";

const CustomerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    method: "ALL",
    fromDate: "",
    toDate: "",
  });

  // =====================================================
  // FETCH CUSTOMER PAYMENTS
  // =====================================================

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const response = await getPayments();

      if (response.success) {
        setPayments(response.data || []);
      }
    } catch (error) {
      console.error("Customer Payments Error:", error);

      setError(error.message || "Failed to load customer payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const search = filters.search.toLowerCase();

      const customerName =
        payment.customer?.name ||
        payment.customer?.customerName ||
        payment.customerName ||
        "";

      const searchableText = `
        ${payment.paymentNumber || ""}
        ${payment.transactionId || ""}
        ${payment.referenceNumber || ""}
        ${customerName}
        ${payment.description || ""}
        ${payment.orderId || ""}
      `.toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      const matchesStatus =
        filters.status === "ALL" || payment.status === filters.status;

      const matchesMethod =
        filters.method === "ALL" || payment.paymentMethod === filters.method;

      const paymentDate = payment.paymentDate
        ? new Date(payment.paymentDate)
        : null;

      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;

      const toDate = filters.toDate
        ? new Date(`${filters.toDate}T23:59:59`)
        : null;

      const matchesFromDate =
        !fromDate || (paymentDate && paymentDate >= fromDate);

      const matchesToDate = !toDate || (paymentDate && paymentDate <= toDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [payments, filters]);

  // =====================================================
  // STATS
  // =====================================================

  const stats = useMemo(() => {
    const paid = filteredPayments.filter(
      (payment) => payment.status === "Paid",
    );

    const pending = filteredPayments.filter(
      (payment) => payment.status === "Pending",
    );

    const refunded = filteredPayments.filter(
      (payment) => payment.status === "Refunded",
    );

    const totalReceived = paid.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const pendingAmount = pending.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const refundedAmount = refunded.reduce(
      (sum, payment) =>
        sum + Number(payment.refundAmount || payment.amount || 0),
      0,
    );

    return {
      total: filteredPayments.length,
      paid: paid.length,
      pending: pending.length,
      refunded: refunded.length,
      totalReceived,
      pendingAmount,
      refundedAmount,
    };
  }, [filteredPayments]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setFilters({
      search: "",
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
      maximumFractionDigits: 2,
    })}`;
  };

  // =====================================================
  // CUSTOMER NAME
  // =====================================================

  const getCustomerName = (payment) => {
    return (
      payment.customer?.name ||
      payment.customer?.customerName ||
      payment.customerName ||
      `Customer #${payment.customerId || "-"}`
    );
  };

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const getStatusClass = (status) => {
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
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f5fbfb]">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto mb-3 animate-spin text-teal-600"
          />

          <p className="text-sm text-gray-500">Loading customer payments...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f5fbfb] p-4 md:p-6 lg:p-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#123b3d] md:text-3xl">
            Customer Payments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage and track payments received from customers.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>

              <h2 className="mt-2 text-2xl font-semibold text-[#123b3d]">
                {stats.total}
              </h2>
            </div>

            <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
              <CreditCard size={22} />
            </div>
          </div>
        </div>

        {/* Received */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Received</p>

              <h2 className="mt-2 text-2xl font-semibold text-green-600">
                {formatCurrency(stats.totalReceived)}
              </h2>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <IndianRupee size={22} />
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {stats.paid} paid payments
          </p>
        </div>

        {/* Pending */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>

              <h2 className="mt-2 text-2xl font-semibold text-orange-500">
                {formatCurrency(stats.pendingAmount)}
              </h2>
            </div>

            <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
              <CreditCard size={22} />
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {stats.pending} pending payments
          </p>
        </div>

        {/* Refund */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Refunded</p>

              <h2 className="mt-2 text-2xl font-semibold text-purple-600">
                {formatCurrency(stats.refundedAmount)}
              </h2>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <IndianRupee size={22} />
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {stats.refunded} refunded payments
          </p>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#123b3d]">Payment Filters</h2>

            <p className="text-xs text-gray-400">
              Find customer payments quickly.
            </p>
          </div>

          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
          >
            <X size={15} />
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          {/* Search */}

          <div className="relative lg:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search customer, payment..."
              value={filters.search}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Status */}

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value,
              })
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
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
            onChange={(e) =>
              setFilters({
                ...filters,
                method: e.target.value,
              })
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
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
              onChange={(e) =>
                setFilters({
                  ...filters,
                  fromDate: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-2 text-sm outline-none focus:border-teal-500"
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
              onChange={(e) =>
                setFilters({
                  ...filters,
                  toDate: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600">
              <Users size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-[#123b3d]">
                Customer Payment Transactions
              </h2>

              <p className="text-xs text-gray-400">
                {filteredPayments.length} payments found
              </p>
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={42} className="mx-auto mb-3 text-gray-300" />

            <p className="font-medium text-gray-600">
              No customer payments found
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Try changing your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full">
              <thead className="bg-[#f5fbfb]">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Payment</th>

                  <th className="px-5 py-3">Customer</th>

                  <th className="px-5 py-3">Order</th>

                  <th className="px-5 py-3">Amount</th>

                  <th className="px-5 py-3">Method</th>

                  <th className="px-5 py-3">Status</th>

                  <th className="px-5 py-3">Date</th>

                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="text-sm hover:bg-gray-50">
                    {/* Payment */}

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {payment.paymentNumber || `#${payment.id}`}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {payment.transactionId || "No transaction ID"}
                      </p>
                    </td>

                    {/* Customer */}

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-700">
                        {getCustomerName(payment)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        ID: {payment.customerId || "-"}
                      </p>
                    </td>

                    {/* Order */}

                    <td className="px-5 py-4 text-gray-600">
                      {payment.orderId ? `#${payment.orderId}` : "-"}
                    </td>

                    {/* Amount */}

                    <td className="px-5 py-4 font-semibold text-[#123b3d]">
                      {formatCurrency(payment.amount)}
                    </td>

                    {/* Method */}

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {payment.paymentMethod?.replace("_", " ") || "-"}
                      </span>
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          payment.status,
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    {/* Date */}

                    <td className="px-5 py-4 text-gray-500">
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString(
                            "en-IN",
                          )
                        : "-"}
                    </td>

                    {/* View */}

                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="rounded-lg border border-teal-200 p-2 text-teal-600 hover:bg-teal-50"
                        title="View Details"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-semibold text-[#123b3d]">
                  Payment Details
                </h2>

                <p className="text-xs text-gray-400">
                  {selectedPayment.paymentNumber ||
                    `Payment #${selectedPayment.id}`}
                </p>
              </div>

              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Detail
                label="Customer"
                value={getCustomerName(selectedPayment)}
              />

              <Detail
                label="Customer ID"
                value={selectedPayment.customerId || "-"}
              />

              <Detail
                label="Order ID"
                value={
                  selectedPayment.orderId ? `#${selectedPayment.orderId}` : "-"
                }
              />

              <Detail
                label="Amount"
                value={formatCurrency(selectedPayment.amount)}
              />

              <Detail
                label="Payment Method"
                value={selectedPayment.paymentMethod?.replace("_", " ") || "-"}
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
                label="Payment Date"
                value={
                  selectedPayment.paymentDate
                    ? new Date(selectedPayment.paymentDate).toLocaleString(
                        "en-IN",
                      )
                    : "-"
                }
              />

              <Detail
                label="Refund Amount"
                value={formatCurrency(selectedPayment.refundAmount)}
              />

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
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// DETAIL COMPONENT
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

export default CustomerPayments;
