import React from "react";
import {
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  User,
  Building2,
  Briefcase,
} from "lucide-react";

import PaymentMethodBadge from "./PaymentMethodBadge";
import PaymentStatusBadge from "./PaymentStatusBadge";

const PaymentTable = ({
  payments = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
}) => {
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

  const getPaymentType = (type) => {
    switch (type) {
      case "CUSTOMER":
        return {
          label: "Customer",
          icon: User,
          className: "bg-blue-50 text-blue-700",
        };

      case "SUPPLIER":
        return {
          label: "Supplier",
          icon: Building2,
          className: "bg-orange-50 text-orange-700",
        };

      case "SALARY":
        return {
          label: "Salary",
          icon: Briefcase,
          className: "bg-purple-50 text-purple-700",
        };

      default:
        return {
          label: type || "Unknown",
          icon: MoreVertical,
          className: "bg-gray-100 text-gray-600",
        };
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />

            <p className="text-sm text-gray-500">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // EMPTY
  // =====================================================

  if (!payments.length) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <MoreVertical size={22} />
          </div>

          <h3 className="text-sm font-semibold text-gray-800">
            No payments found
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            No payment transactions match your current filters.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // TABLE
  // =====================================================

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* =================================================
          TABLE HEADER
      ================================================= */}

      <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Payment Transactions
          </h3>

          <p className="text-xs text-gray-500">
            {payments.length} transaction
            {payments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* =================================================
          RESPONSIVE TABLE
      ================================================= */}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <TableHead>Payment</TableHead>

              <TableHead>Type</TableHead>

              <TableHead>Party</TableHead>

              <TableHead>Amount</TableHead>

              <TableHead>Method</TableHead>

              <TableHead>Status</TableHead>

              <TableHead>Date</TableHead>

              <TableHead align="right">Actions</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => {
              const paymentType = getPaymentType(payment.paymentType);

              const TypeIcon = paymentType.icon;

              return (
                <tr key={payment.id} className="transition hover:bg-gray-50">
                  {/* =================================================
                      PAYMENT
                  ================================================= */}

                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {payment.paymentNumber || `PAY-${payment.id}`}
                      </p>

                      {payment.transactionId && (
                        <p className="mt-1 max-w-[150px] truncate text-xs text-gray-500">
                          TXN: {payment.transactionId}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* =================================================
                      TYPE
                  ================================================= */}

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${paymentType.className}`}
                    >
                      <TypeIcon size={13} />

                      {paymentType.label}
                    </span>
                  </td>

                  {/* =================================================
                      PARTY
                  ================================================= */}

                  <td className="px-4 py-4">
                    <PartyInfo payment={payment} />
                  </td>

                  {/* =================================================
                      AMOUNT
                  ================================================= */}

                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {formatAmount(payment.amount)}
                      </p>

                      {Number(payment.refundAmount) > 0 && (
                        <p className="mt-1 text-xs text-purple-600">
                          Refund: {formatAmount(payment.refundAmount)}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* =================================================
                      PAYMENT METHOD
                  ================================================= */}

                  <td className="px-4 py-4">
                    <PaymentMethodBadge method={payment.paymentMethod} />
                  </td>

                  {/* =================================================
                      STATUS
                  ================================================= */}

                  <td className="px-4 py-4">
                    <PaymentStatusBadge status={payment.status} />
                  </td>

                  {/* =================================================
                      DATE
                  ================================================= */}

                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-gray-700">
                        {formatDate(payment.paymentDate)}
                      </p>

                      {payment.referenceNumber && (
                        <p className="mt-1 text-xs text-gray-500">
                          Ref: {payment.referenceNumber}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* VIEW */}

                      <ActionButton
                        title="View payment"
                        onClick={() => onView?.(payment)}
                      >
                        <Eye size={17} />
                      </ActionButton>

                      {/* EDIT */}

                      <ActionButton
                        title="Edit payment"
                        onClick={() => onEdit?.(payment)}
                      >
                        <Pencil size={16} />
                      </ActionButton>

                      {/* DELETE */}

                      <ActionButton
                        title="Delete payment"
                        danger
                        onClick={() => onDelete?.(payment)}
                      >
                        <Trash2 size={16} />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =====================================================
// PARTY INFO
// =====================================================

const PartyInfo = ({ payment }) => {
  // If backend returns populated customer
  if (payment.customer) {
    return (
      <div>
        <p className="max-w-[180px] truncate text-sm font-medium text-gray-800">
          {payment.customer.name}
        </p>

        {payment.customer.phone && (
          <p className="mt-1 text-xs text-gray-500">{payment.customer.phone}</p>
        )}
      </div>
    );
  }

  // Supplier
  if (payment.supplier) {
    return (
      <div>
        <p className="max-w-[180px] truncate text-sm font-medium text-gray-800">
          {payment.supplier.name}
        </p>

        {payment.supplier.phone && (
          <p className="mt-1 text-xs text-gray-500">{payment.supplier.phone}</p>
        )}
      </div>
    );
  }

  // Employee
  if (payment.employee) {
    return (
      <div>
        <p className="max-w-[180px] truncate text-sm font-medium text-gray-800">
          {payment.employee.name}
        </p>

        {payment.employee.employeeCode && (
          <p className="mt-1 text-xs text-gray-500">
            {payment.employee.employeeCode}
          </p>
        )}
      </div>
    );
  }

  // Fallback IDs
  if (payment.paymentType === "CUSTOMER") {
    return (
      <div>
        <p className="text-sm font-medium text-gray-800">Customer</p>

        <p className="mt-1 text-xs text-gray-500">
          ID: {payment.customerId || "N/A"}
        </p>
      </div>
    );
  }

  if (payment.paymentType === "SUPPLIER") {
    return (
      <div>
        <p className="text-sm font-medium text-gray-800">Supplier</p>

        <p className="mt-1 text-xs text-gray-500">
          ID: {payment.supplierId || "N/A"}
        </p>
      </div>
    );
  }

  if (payment.paymentType === "SALARY") {
    return (
      <div>
        <p className="text-sm font-medium text-gray-800">Employee</p>

        <p className="mt-1 text-xs text-gray-500">
          ID: {payment.employeeId || "N/A"}
        </p>
      </div>
    );
  }

  return <span className="text-sm text-gray-400">N/A</span>;
};

// =====================================================
// TABLE HEAD
// =====================================================

const TableHead = ({ children, align = "left" }) => {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
};

// =====================================================
// ACTION BUTTON
// =====================================================

const ActionButton = ({ children, onClick, title, danger = false }) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        danger
          ? "text-red-500 hover:bg-red-50 hover:text-red-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
};

export default PaymentTable;
