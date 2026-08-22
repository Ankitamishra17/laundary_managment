import React, { useEffect, useState } from "react";
import {
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock3,
  RotateCcw,
  CalendarDays,
  TrendingUp,
  Users,
  Building2,
  BriefcaseBusiness,
  RefreshCw,
  AlertCircle,
  IndianRupee,
  ArrowRight,
} from "lucide-react";

import { getPaymentSummary, getPayments } from "../../api/paymentApi";

import PaymentStats from "../../components/payments/PaymentStats";
import PaymentMethodBadge from "../../components/payments/PaymentMethodBadge";
import PaymentStatusBadge from "../../components/payments/PaymentStatusBadge";

const PaymentDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentPayments, setRecentPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, paymentsResponse] = await Promise.all([
        getPaymentSummary(),
        getPayments({
          limit: 10,
        }),
      ]);

      if (statsResponse?.success) {
        setStats(statsResponse.data || {});
      }

      if (paymentsResponse?.success) {
        setRecentPayments(paymentsResponse.data || []);
      }
    } catch (error) {
      console.error("Payment dashboard error:", error);

      setError(error?.message || "Unable to load payment dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPartyName = (payment) => {
    if (payment.customer?.name) {
      return payment.customer.name;
    }

    if (payment.supplier?.name) {
      return payment.supplier.name;
    }

    if (payment.employee?.name) {
      return payment.employee.name;
    }

    if (payment.paymentType === "CUSTOMER") {
      return `Customer #${payment.customerId || "N/A"}`;
    }

    if (payment.paymentType === "SUPPLIER") {
      return `Supplier #${payment.supplierId || "N/A"}`;
    }

    if (payment.paymentType === "SALARY") {
      return `Employee #${payment.employeeId || "N/A"}`;
    }

    return "N/A";
  };

  const getTypeIcon = (type) => {
    if (type === "CUSTOMER") {
      return Users;
    }

    if (type === "SUPPLIER") {
      return Building2;
    }

    return BriefcaseBusiness;
  };

  const getTypeStyle = (type) => {
    if (type === "CUSTOMER") {
      return "bg-blue-50 text-blue-700";
    }

    if (type === "SUPPLIER") {
      return "bg-orange-50 text-orange-700";
    }

    return "bg-purple-50 text-purple-700";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-full space-y-6 bg-gray-50 p-4 sm:p-5 lg:p-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <CreditCard size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Payment Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Overview of all financial transactions in your laundry business.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 lg:self-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div>
            <p className="text-sm font-medium">Unable to load dashboard</p>

            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* =================================================
          MAIN STATS
      ================================================= */}

      <PaymentStats stats={stats} loading={loading} />

      {/* =================================================
          CASH FLOW
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* RECEIVED */}

        <CashFlowCard
          title="Money Received"
          amount={stats.totalReceived}
          subtitle="Customer payments"
          icon={ArrowDownToLine}
          iconClass="bg-green-50 text-green-600"
          amountClass="text-green-600"
        />

        {/* PAID */}

        <CashFlowCard
          title="Money Paid"
          amount={stats.totalPaid}
          subtitle="Supplier + salary payments"
          icon={ArrowUpFromLine}
          iconClass="bg-orange-50 text-orange-600"
          amountClass="text-orange-600"
        />

        {/* NET */}

        <CashFlowCard
          title="Net Cash Flow"
          amount={
            Number(stats.totalReceived || 0) - Number(stats.totalPaid || 0)
          }
          subtitle="Received - Paid"
          icon={TrendingUp}
          iconClass="bg-indigo-50 text-indigo-600"
          amountClass="text-indigo-600"
        />
      </div>

      {/* =================================================
          QUICK BREAKDOWN
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* CUSTOMER */}

        <CategoryCard
          title="Customer Payments"
          description="Money received from customers"
          count={stats.customerPaymentCount || 0}
          amount={stats.customerPaymentAmount || 0}
          icon={Users}
          iconClass="bg-blue-50 text-blue-600"
        />

        {/* SUPPLIER */}

        <CategoryCard
          title="Supplier Payments"
          description="Money paid to suppliers"
          count={stats.supplierPaymentCount || 0}
          amount={stats.supplierPaymentAmount || 0}
          icon={Building2}
          iconClass="bg-orange-50 text-orange-600"
        />

        {/* SALARY */}

        <CategoryCard
          title="Salary Payments"
          description="Employee salary payments"
          count={stats.salaryPaymentCount || 0}
          amount={stats.salaryPaymentAmount || 0}
          icon={BriefcaseBusiness}
          iconClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* =================================================
          TWO COLUMN SECTION
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* PAYMENT METHODS */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Payment Methods
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Payment collection by method
              </p>
            </div>

            <CreditCard size={20} className="text-gray-400" />
          </div>

          <div className="mt-5 space-y-3">
            <MethodRow
              method="Cash"
              count={stats.cashCount}
              amount={stats.cashAmount}
            />

            <MethodRow
              method="UPI"
              count={stats.upiCount}
              amount={stats.upiAmount}
            />

            <MethodRow
              method="Card"
              count={stats.cardCount}
              amount={stats.cardAmount}
            />

            <MethodRow
              method="Bank_Transfer"
              count={stats.bankTransferCount}
              amount={stats.bankTransferAmount}
            />

            <MethodRow
              method="Cheque"
              count={stats.chequeCount}
              amount={stats.chequeAmount}
            />
          </div>
        </section>

        {/* STATUS */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Payment Status
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Current transaction status
              </p>
            </div>

            <Clock3 size={20} className="text-gray-400" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatusCard
              title="Paid"
              count={stats.paidCount}
              amount={stats.paidAmount}
              className="bg-green-50 text-green-700"
            />

            <StatusCard
              title="Pending"
              count={stats.pendingCount}
              amount={stats.pendingAmount}
              className="bg-yellow-50 text-yellow-700"
            />

            <StatusCard
              title="Failed"
              count={stats.failedCount}
              amount={stats.failedAmount}
              className="bg-red-50 text-red-700"
            />

            <StatusCard
              title="Refunded"
              count={stats.refundedCount}
              amount={stats.refundedAmount}
              className="bg-purple-50 text-purple-700"
            />
          </div>
        </section>
      </div>

      {/* =================================================
          RECENT TRANSACTIONS
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Recent Transactions
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Latest payment activity
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            View All
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <TableHead>Payment</TableHead>

                <TableHead>Type</TableHead>

                <TableHead>Party</TableHead>

                <TableHead>Amount</TableHead>

                <TableHead>Method</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Date</TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment) => {
                  const TypeIcon = getTypeIcon(payment.paymentType);

                  return (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* PAYMENT */}

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {payment.paymentNumber || `PAY-${payment.id}`}
                        </p>

                        {payment.transactionId && (
                          <p className="mt-1 max-w-[140px] truncate text-xs text-gray-500">
                            {payment.transactionId}
                          </p>
                        )}
                      </td>

                      {/* TYPE */}

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getTypeStyle(
                            payment.paymentType,
                          )}`}
                        >
                          <TypeIcon size={13} />

                          {payment.paymentType}
                        </span>
                      </td>

                      {/* PARTY */}

                      <td className="px-4 py-4">
                        <p className="max-w-[180px] truncate text-sm font-medium text-gray-800">
                          {getPartyName(payment)}
                        </p>
                      </td>

                      {/* AMOUNT */}

                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-gray-900">
                          {formatAmount(payment.amount)}
                        </p>
                      </td>

                      {/* METHOD */}

                      <td className="px-4 py-4">
                        <PaymentMethodBadge method={payment.paymentMethod} />
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">
                        <PaymentStatusBadge status={payment.status} />
                      </td>

                      {/* DATE */}

                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">
                          {formatDate(payment.paymentDate)}
                        </p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <CreditCard size={28} className="mx-auto text-gray-300" />

                    <p className="mt-3 text-sm font-medium text-gray-600">
                      No transactions found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Payment transactions will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

// =====================================================
// CASH FLOW CARD
// =====================================================

const CashFlowCard = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  iconClass,
  amountClass,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className={`mt-2 text-2xl font-bold ${amountClass}`}>
            ₹
            {Number(amount || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
        {subtitle}
      </p>
    </div>
  );
};

// =====================================================
// CATEGORY CARD
// =====================================================

const CategoryCard = ({
  title,
  description,
  count,
  amount,
  icon: Icon,
  iconClass,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500">Transactions</p>

          <p className="mt-1 text-lg font-bold text-gray-900">{count || 0}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Amount</p>

          <p className="mt-1 text-lg font-bold text-gray-900">
            ₹{Number(amount || 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// METHOD ROW
// =====================================================

const MethodRow = ({ method, count = 0, amount = 0 }) => {
  const label = method === "Bank_Transfer" ? "Bank Transfer" : method;

  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <CreditCard size={17} className="text-gray-500" />

        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>

          <p className="mt-0.5 text-xs text-gray-500">
            {count || 0} transactions
          </p>
        </div>
      </div>

      <p className="text-sm font-bold text-gray-900">
        ₹{Number(amount || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

// =====================================================
// STATUS CARD
// =====================================================

const StatusCard = ({ title, count = 0, amount = 0, className }) => {
  return (
    <div className={`rounded-xl p-4 ${className}`}>
      <p className="text-sm font-semibold">{title}</p>

      <p className="mt-2 text-lg font-bold">
        ₹{Number(amount || 0).toLocaleString("en-IN")}
      </p>

      <p className="mt-1 text-xs opacity-75">{count || 0} transactions</p>
    </div>
  );
};

// =====================================================
// TABLE HEAD
// =====================================================

const TableHead = ({ children }) => {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
};

export default PaymentDashboard;
