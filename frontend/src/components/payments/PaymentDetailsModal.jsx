import React from "react";
import {
  X,
  CreditCard,
  User,
  Building2,
  Briefcase,
  Calendar,
  Hash,
  IndianRupee,
  FileText,
  RefreshCcw,
  CircleCheck,
  CircleX,
  Clock3,
  Receipt,
} from "lucide-react";

const PaymentDetailsModal = ({ payment, isOpen, onClose }) => {
  if (!isOpen || !payment) return null;

  // =====================================================
  // HELPERS
  // =====================================================

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // PAYMENT TYPE
  // =====================================================

  const getPaymentType = () => {
    switch (payment.paymentType) {
      case "CUSTOMER":
        return {
          label: "Customer Payment",
          icon: User,
        };

      case "SUPPLIER":
        return {
          label: "Supplier Payment",
          icon: Building2,
        };

      case "SALARY":
        return {
          label: "Salary Payment",
          icon: Briefcase,
        };

      case "SUBSCRIPTION":
        return {
          label: "Subscription Payment",
          icon: CreditCard,
        };

      default:
        return {
          label: "Payment",
          icon: CreditCard,
        };
    }
  };

  const paymentType = getPaymentType();

  const TypeIcon = paymentType.icon;

  // =====================================================
  // STATUS
  // =====================================================

  const getStatus = () => {
    switch (payment.status) {
      case "Paid":
        return {
          label: "Paid",
          icon: CircleCheck,
          className: "bg-green-50 text-green-700 border-green-200",
        };

      case "Pending":
        return {
          label: "Pending",
          icon: Clock3,
          className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        };

      case "Failed":
        return {
          label: "Failed",
          icon: CircleX,
          className: "bg-red-50 text-red-700 border-red-200",
        };

      case "Cancelled":
        return {
          label: "Cancelled",
          icon: CircleX,
          className: "bg-gray-100 text-gray-600 border-gray-200",
        };

      case "Refunded":
        return {
          label: "Refunded",
          icon: RefreshCcw,
          className: "bg-purple-50 text-purple-700 border-purple-200",
        };

      default:
        return {
          label: payment.status || "Unknown",
          icon: Clock3,
          className: "bg-gray-100 text-gray-600 border-gray-200",
        };
    }
  };

  const status = getStatus();

  const StatusIcon = status.icon;

  // =====================================================
  // CLOSE ON BACKDROP
  // =====================================================

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TypeIcon size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">
                Payment Details
              </h2>

              <p className="truncate text-sm text-gray-500">
                {paymentType.label}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-gray-800
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {/* Amount + Status */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <IndianRupee size={16} />
                Amount
              </div>

              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(payment.amount)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 text-sm text-gray-500">Payment Status</div>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${status.className}`}
              >
                <StatusIcon size={15} />
                {status.label}
              </span>
            </div>
          </div>

          {/* =================================================
              BASIC PAYMENT INFORMATION
          ================================================= */}

          <SectionTitle
            icon={<Receipt size={18} />}
            title="Payment Information"
          />

          <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailItem
              icon={<Hash size={17} />}
              label="Payment Number"
              value={payment.paymentNumber}
            />

            <DetailItem
              icon={<CreditCard size={17} />}
              label="Payment Type"
              value={paymentType.label}
            />

            <DetailItem
              icon={<CreditCard size={17} />}
              label="Payment Method"
              value={payment.paymentMethod}
            />

            <DetailItem
              icon={<Calendar size={17} />}
              label="Payment Date"
              value={formatDateTime(payment.paymentDate)}
            />

            <DetailItem
              icon={<Hash size={17} />}
              label="Transaction ID"
              value={payment.transactionId}
            />

            <DetailItem
              icon={<Hash size={17} />}
              label="Reference Number"
              value={payment.referenceNumber}
            />
          </div>

          {/* =================================================
              CUSTOMER
          ================================================= */}

          {payment.paymentType === "CUSTOMER" && (
            <>
              <SectionTitle
                icon={<User size={18} />}
                title="Customer Information"
              />

              <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <DetailItem label="Customer ID" value={payment.customerId} />

                <DetailItem label="Order ID" value={payment.orderId} />
              </div>
            </>
          )}

          {/* =================================================
              SUPPLIER
          ================================================= */}

          {payment.paymentType === "SUPPLIER" && (
            <>
              <SectionTitle
                icon={<Building2 size={18} />}
                title="Supplier Information"
              />

              <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <DetailItem label="Supplier ID" value={payment.supplierId} />

                <DetailItem label="Purchase ID" value={payment.purchaseId} />
              </div>
            </>
          )}

          {/* =================================================
              EMPLOYEE
          ================================================= */}

          {payment.paymentType === "SALARY" && (
            <>
              <SectionTitle
                icon={<Briefcase size={18} />}
                title="Salary Information"
              />

              <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <DetailItem label="Employee ID" value={payment.employeeId} />

                <DetailItem label="Payroll ID" value={payment.payrollId} />
              </div>
            </>
          )}

          {/* =================================================
              SHOP
          ================================================= */}

          <SectionTitle
            icon={<Building2 size={18} />}
            title="Shop Information"
          />

          <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailItem label="Shop ID" value={payment.shopId} />

            <DetailItem label="Created By" value={payment.createdBy} />
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          {(payment.description || payment.remarks) && (
            <>
              <SectionTitle icon={<FileText size={18} />} title="Notes" />

              <div className="mb-6 space-y-4">
                {payment.description && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Description
                    </p>

                    <p className="rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                      {payment.description}
                    </p>
                  </div>
                )}

                {payment.remarks && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Remarks
                    </p>

                    <p className="rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                      {payment.remarks}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* =================================================
              REFUND
          ================================================= */}

          {(Number(payment.refundAmount) > 0 ||
            payment.refundDate ||
            payment.refundReason) && (
            <>
              <SectionTitle
                icon={<RefreshCcw size={18} />}
                title="Refund Information"
              />

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <DetailItem
                  label="Refund Amount"
                  value={formatAmount(payment.refundAmount)}
                />

                <DetailItem
                  label="Refund Date"
                  value={formatDateTime(payment.refundDate)}
                />

                {payment.refundReason && (
                  <div className="sm:col-span-2">
                    <DetailItem
                      label="Refund Reason"
                      value={payment.refundReason}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* =================================================
              SYSTEM INFORMATION
          ================================================= */}

          <div className="mt-6 border-t border-gray-200 pt-5">
            <div className="grid grid-cols-1 gap-4 text-xs text-gray-500 sm:grid-cols-2">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {formatDateTime(payment.createdAt)}
              </div>

              <div className="sm:text-right">
                <span className="font-medium">Last Updated:</span>{" "}
                {formatDateTime(payment.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              bg-gray-900
              px-5
              py-2.5
              text-sm
              font-medium
              text-white
              transition
              hover:bg-gray-800
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SECTION TITLE
// =====================================================

const SectionTitle = ({ icon, title }) => {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
      <span className="text-indigo-600">{icon}</span>

      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  );
};


// DETAIL ITEM

const DetailItem = ({ icon, label, value }) => {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
        {icon && <span className="text-gray-400">{icon}</span>}

        {label}
      </div>

      <p className="break-words text-sm font-medium text-gray-800">
        {value !== null && value !== undefined && value !== "" ? value : "N/A"}
      </p>
    </div>
  );
};

export default PaymentDetailsModal;
