import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  IndianRupee,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { getPaymentReport } from "../../../api/paymentApi";

const PaymentReports = () => {
    const [report, setReport] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    type: "ALL",
    status: "ALL",
    method: "ALL",
    fromDate: "",
    toDate: "",
  });

  // =====================================================
  // FETCH PAYMENTS
  // =====================================================

  const fetchReport = async () => {
    try {
      setLoading(true);

      const response = await getPaymentReport(filters);

      if (response.success) {
        setReport(response.data);
      }
    } catch (error) {
      console.error("Payment Reports Error:", error);

      setError(error.message || "Failed to load payment report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // =====================================================
  // FILTER PAYMENTS
  // =====================================================

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const search = filters.search.toLowerCase();

      const searchableText = `
        ${payment.paymentNumber || ""}
        ${payment.transactionId || ""}
        ${payment.referenceNumber || ""}
        ${payment.description || ""}
      `.toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      const matchesType =
        filters.type === "ALL" || payment.paymentType === filters.type;

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
        matchesType &&
        matchesStatus &&
        matchesMethod &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [payments, filters]);

  // =====================================================
  // REPORT STATISTICS
  // =====================================================

  const stats = useMemo(() => {
    const paid = filteredPayments.filter((p) => p.status === "Paid");

    const pending = filteredPayments.filter((p) => p.status === "Pending");

    const refunded = filteredPayments.filter((p) => p.status === "Refunded");

    const cancelled = filteredPayments.filter((p) => p.status === "Cancelled");

    const failed = filteredPayments.filter((p) => p.status === "Failed");

    const totalAmount = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pendingAmount = pending.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    const refundAmount = refunded.reduce(
      (sum, p) => sum + Number(p.refundAmount || p.amount || 0),
      0,
    );

    const customerPayments = paid.filter((p) => p.paymentType === "CUSTOMER");

    const supplierPayments = paid.filter((p) => p.paymentType === "SUPPLIER");

    const salaryPayments = paid.filter((p) => p.paymentType === "SALARY");

    const customerAmount = customerPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    const supplierAmount = supplierPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    const salaryAmount = salaryPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    return {
      totalTransactions: filteredPayments.length,

      totalAmount,

      pendingAmount,

      refundAmount,

      paidCount: paid.length,

      pendingCount: pending.length,

      refundedCount: refunded.length,

      cancelledCount: cancelled.length,

      failedCount: failed.length,

      customerAmount,

      supplierAmount,

      salaryAmount,

      customerCount: customerPayments.length,

      supplierCount: supplierPayments.length,

      salaryCount: salaryPayments.length,
    };
  }, [filteredPayments]);

  // =====================================================
  // PAYMENT METHOD REPORT
  // =====================================================

  const methodStats = useMemo(() => {
    const methods = ["Cash", "UPI", "Card", "Bank_Transfer", "Cheque"];

    return methods.map((method) => {
      const methodPayments = filteredPayments.filter(
        (payment) =>
          payment.paymentMethod === method && payment.status === "Paid",
      );

      const amount = methodPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      );

      return {
        method,
        count: methodPayments.length,
        amount,
      };
    });
  }, [filteredPayments]);

  // =====================================================
  // PAYMENT TYPE REPORT
  // =====================================================

  const typeStats = [
    {
      label: "Customer Payments",
      type: "CUSTOMER",
      count: stats.customerCount,
      amount: stats.customerAmount,
    },
    {
      label: "Supplier Payments",
      type: "SUPPLIER",
      count: stats.supplierCount,
      amount: stats.supplierAmount,
    },
    {
      label: "Salary Payments",
      type: "SALARY",
      count: stats.salaryCount,
      amount: stats.salaryAmount,
    },
  ];

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
  // EXPORT CSV
  // =====================================================

  const exportCSV = () => {
    if (!filteredPayments.length) {
      return;
    }

    const headers = [
      "Payment Number",
      "Payment Type",
      "Amount",
      "Payment Method",
      "Status",
      "Transaction ID",
      "Reference Number",
      "Payment Date",
    ];

    const rows = filteredPayments.map((payment) => [
      payment.paymentNumber || "",
      payment.paymentType || "",
      payment.amount || 0,
      payment.paymentMethod || "",
      payment.status || "",
      payment.transactionId || "",
      payment.referenceNumber || "",
      payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `payment-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  // =====================================================
  // FORMAT PAYMENT TYPE
  // =====================================================

  const formatPaymentType = (type) => {
    if (!type) return "-";

    return type
      .toLowerCase()
      .replace("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f5fbfb]">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-teal-600" />

          <p className="text-gray-600">Loading payment reports...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f5fbfb] p-4 md:p-6 lg:p-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#123b3d] md:text-3xl">
            Payment Reports
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Analyze customer, supplier and salary payments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchReport}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-4 py-2.5 text-sm font-medium text-teal-700 transition hover:bg-teal-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            disabled={!filteredPayments.length}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} />
            Export CSV
          </button>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#123b3d]">Filters</h2>

            <p className="text-xs text-gray-500">Filter your payment report.</p>
          </div>

          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
          >
            <X size={15} />
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Search */}

          <div className="relative xl:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search payment..."
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

          {/* Type */}

          <select
            value={filters.type}
            onChange={(e) =>
              setFilters({
                ...filters,
                type: e.target.value,
              })
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
          >
            <option value="ALL">All Types</option>

            <option value="CUSTOMER">Customer</option>

            <option value="SUPPLIER">Supplier</option>

            <option value="SALARY">Salary</option>
          </select>

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
          MAIN STATS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>

              <h3 className="mt-2 text-2xl font-semibold text-[#123b3d]">
                {stats.totalTransactions}
              </h3>
            </div>

            <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
              <CreditCard size={23} />
            </div>
          </div>
        </div>

        {/* Paid */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Received / Paid</p>

              <h3 className="mt-2 text-2xl font-semibold text-green-600">
                {formatCurrency(stats.totalAmount)}
              </h3>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <TrendingUp size={23} />
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {stats.paidCount} paid transactions
          </p>
        </div>

        {/* Pending */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Amount</p>

              <h3 className="mt-2 text-2xl font-semibold text-orange-500">
                {formatCurrency(stats.pendingAmount)}
              </h3>
            </div>

            <div className="rounded-xl bg-orange-50 p-3 text-orange-500">
              <Wallet size={23} />
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {stats.pendingCount} pending transactions
          </p>
        </div>

        {/* Refund */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Refunded Amount</p>

              <h3 className="mt-2 text-2xl font-semibold text-red-500">
                {formatCurrency(stats.refundAmount)}
              </h3>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-500">
              <TrendingDown size={23} />
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {stats.refundedCount} refunded transactions
          </p>
        </div>
      </div>

      {/* =================================================
          PAYMENT TYPE + METHOD
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Payment Type */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600">
              <Users size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-[#123b3d]">Payment By Type</h2>

              <p className="text-xs text-gray-500">Distribution of payments</p>
            </div>
          </div>

          <div className="space-y-4">
            {typeStats.map((item) => (
              <div key={item.type} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">{item.label}</p>

                    <p className="mt-1 text-xs text-gray-400">
                      {item.count} transactions
                    </p>
                  </div>

                  <p className="font-semibold text-[#123b3d]">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <BarChart3 size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-[#123b3d]">
                Payment By Method
              </h2>

              <p className="text-xs text-gray-500">
                Paid amount by payment method
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {methodStats.map((item) => {
              const percentage =
                stats.totalAmount > 0
                  ? (item.amount / stats.totalAmount) * 100
                  : 0;

              return (
                <div key={item.method}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {item.method.replace("_", " ")}
                    </span>

                    <span className="font-medium text-gray-800">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    {item.count} transactions
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =================================================
          STATUS SUMMARY
      ================================================= */}

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
            <IndianRupee size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-[#123b3d]">
              Payment Status Summary
            </h2>

            <p className="text-xs text-gray-500">Current transaction status</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-xs text-green-600">Paid</p>

            <p className="mt-1 text-xl font-semibold text-green-700">
              {stats.paidCount}
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-4">
            <p className="text-xs text-orange-600">Pending</p>

            <p className="mt-1 text-xl font-semibold text-orange-700">
              {stats.pendingCount}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-xs text-red-600">Failed</p>

            <p className="mt-1 text-xl font-semibold text-red-700">
              {stats.failedCount}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="text-xs text-gray-600">Cancelled</p>

            <p className="mt-1 text-xl font-semibold text-gray-700">
              {stats.cancelledCount}
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 p-4">
            <p className="text-xs text-purple-600">Refunded</p>

            <p className="mt-1 text-xl font-semibold text-purple-700">
              {stats.refundedCount}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          RECENT TRANSACTIONS
      ================================================= */}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[#123b3d]">
                Payment Transactions
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {filteredPayments.length} transactions found
              </p>
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={42} className="mx-auto mb-3 text-gray-300" />

            <p className="font-medium text-gray-600">No payments found</p>

            <p className="mt-1 text-sm text-gray-400">
              Try changing your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead className="bg-[#f5fbfb]">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Payment</th>

                  <th className="px-5 py-3">Type</th>

                  <th className="px-5 py-3">Amount</th>

                  <th className="px-5 py-3">Method</th>

                  <th className="px-5 py-3">Status</th>

                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredPayments.slice(0, 20).map((payment) => (
                  <tr key={payment.id} className="text-sm hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {payment.paymentNumber || `#${payment.id}`}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {payment.transactionId || "No transaction ID"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatPaymentType(payment.paymentType)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-[#123b3d]">
                      {formatCurrency(payment.amount)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {payment.paymentMethod?.replace("_", " ") || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          payment.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : payment.status === "Pending"
                              ? "bg-orange-100 text-orange-700"
                              : payment.status === "Refunded"
                                ? "bg-purple-100 text-purple-700"
                                : payment.status === "Cancelled"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-red-100 text-red-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString(
                            "en-IN",
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentReports;
