import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const colors = {
  bgDark: "#05282A",
  panelDark: "#0B3B3E",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#51787C",
  danger: "#E0645C",
  amber: "#B8791F",
};

const INITIAL_FILTERS = {
  search: "",
  type: "ALL",
  status: "ALL",
  method: "ALL",
  fromDate: "",
  toDate: "",
};

const inputClass =
  "pr-input w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition";

const PaymentReports = () => {
  const [report, setReport] = useState(null);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // =====================================================
  // NORMALIZE PAYMENT DATA
  // =====================================================

  const extractPayments = (response) => {
    /*
      Handles different possible API response structures:

      1. {
           success: true,
           data: [...]
         }

      2. {
           success: true,
           data: {
             payments: [...]
           }
         }

      3. {
           success: true,
           data: {
             data: [...]
           }
         }

      4. {
           success: true,
           data: {
             rows: [...]
           }
         }

      5. {
           success: true,
           payments: [...]
         }
    */

    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.payments)) {
      return response.payments;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data && Array.isArray(response.data.payments)) {
      return response.data.payments;
    }

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    if (response.data && Array.isArray(response.data.rows)) {
      return response.data.rows;
    }

    if (Array.isArray(response.rows)) {
      return response.rows;
    }

    return [];
  };

  // =====================================================
  // FETCH REPORT
  // =====================================================

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPaymentReport(filters);

      console.log("Payment Report API Response:", response);

      if (!response) {
        throw new Error("No response received from server.");
      }

      if (response.success === false) {
        throw new Error(response.message || "Failed to load payment report.");
      }

      // -----------------------------------------------
      // SAVE COMPLETE REPORT
      // -----------------------------------------------

      setReport(response.data || response);

      // -----------------------------------------------
      // EXTRACT PAYMENTS
      // -----------------------------------------------

      const paymentList = extractPayments(response);

      console.log("Extracted Payments:", paymentList);

      setPayments(paymentList);
    } catch (err) {
      console.error("Payment Reports Error:", err);

      setPayments([]);
      setReport(null);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load payment report.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // =====================================================
  // INITIAL FETCH + FILTER FETCH
  // =====================================================

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // =====================================================
  // SAFE VALUE HELPERS
  // =====================================================

  const normalizeStatus = (status) => {
    if (!status) return "";

    return String(status).trim().toLowerCase();
  };

  const normalizeType = (type) => {
    if (!type) return "";

    return String(type).trim().toUpperCase();
  };

  const normalizeMethod = (method) => {
    if (!method) return "";

    return String(method).trim().toLowerCase();
  };

  // =====================================================
  // GET PARTY NAME
  // =====================================================

  const getPartyName = useCallback((payment) => {
    const type = normalizeType(payment.paymentType);

    if (type === "CUSTOMER") {
      return (
        payment.customer?.name ||
        payment.customer?.fullName ||
        payment.customerName ||
        `Customer #${payment.customerId || "-"}`
      );
    }

    if (type === "SUPPLIER") {
      return (
        payment.supplier?.name ||
        payment.supplier?.companyName ||
        payment.supplierName ||
        `Supplier #${payment.supplierId || "-"}`
      );
    }

    if (type === "SALARY") {
      return (
        payment.employee?.name ||
        payment.employee?.fullName ||
        payment.employeeName ||
        `Employee #${payment.employeeId || "-"}`
      );
    }

    return "-";
  }, []);

  // =====================================================
  // FILTER PAYMENTS
  // =====================================================

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const search = filters.search.trim().toLowerCase();

      const partyName = getPartyName(payment);

      const searchableText = `
        ${payment.id || ""}
        ${payment.paymentNumber || ""}
        ${payment.transactionId || ""}
        ${payment.referenceNumber || ""}
        ${partyName}
        ${payment.description || ""}
        ${payment.remarks || ""}
        ${payment.orderId || ""}
        ${payment.purchaseId || ""}
        ${payment.payrollId || ""}
        ${payment.customerId || ""}
        ${payment.supplierId || ""}
        ${payment.employeeId || ""}
      `.toLowerCase();

      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      const matchesSearch = !search || searchableText.includes(search);

      // -----------------------------------------------
      // TYPE
      // -----------------------------------------------

      const matchesType =
        filters.type === "ALL" ||
        normalizeType(payment.paymentType) === normalizeType(filters.type);

      // -----------------------------------------------
      // STATUS
      // -----------------------------------------------

      const matchesStatus =
        filters.status === "ALL" ||
        normalizeStatus(payment.status) === normalizeStatus(filters.status);

      // -----------------------------------------------
      // METHOD
      // -----------------------------------------------

      const matchesMethod =
        filters.method === "ALL" ||
        normalizeMethod(payment.paymentMethod) ===
          normalizeMethod(filters.method);

      // -----------------------------------------------
      // PAYMENT DATE
      // -----------------------------------------------

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
            const toDate = new Date(`${filters.toDate}T23:59:59.999`);

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
  }, [payments, filters, getPartyName]);

  // =====================================================
  // REPORT STATISTICS
  // =====================================================

  const stats = useMemo(() => {
    const paid = filteredPayments.filter(
      (payment) => normalizeStatus(payment.status) === "paid",
    );

    const pending = filteredPayments.filter(
      (payment) => normalizeStatus(payment.status) === "pending",
    );

    const refunded = filteredPayments.filter(
      (payment) => normalizeStatus(payment.status) === "refunded",
    );

    const cancelled = filteredPayments.filter(
      (payment) => normalizeStatus(payment.status) === "cancelled",
    );

    const failed = filteredPayments.filter(
      (payment) => normalizeStatus(payment.status) === "failed",
    );

    // -----------------------------------------------
    // TOTAL PAID
    // -----------------------------------------------

    const totalAmount = paid.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    // -----------------------------------------------
    // PENDING
    // -----------------------------------------------

    const pendingAmount = pending.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    // -----------------------------------------------
    // REFUNDED
    // -----------------------------------------------

    const refundAmount = refunded.reduce(
      (sum, payment) =>
        sum + Number(payment.refundAmount ?? payment.amount ?? 0),
      0,
    );

    // -----------------------------------------------
    // CUSTOMER
    // -----------------------------------------------

    const customerPayments = paid.filter(
      (payment) => normalizeType(payment.paymentType) === "CUSTOMER",
    );

    const customerAmount = customerPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    // -----------------------------------------------
    // SUPPLIER
    // -----------------------------------------------

    const supplierPayments = paid.filter(
      (payment) => normalizeType(payment.paymentType) === "SUPPLIER",
    );

    const supplierAmount = supplierPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    // -----------------------------------------------
    // SALARY
    // -----------------------------------------------

    const salaryPayments = paid.filter(
      (payment) => normalizeType(payment.paymentType) === "SALARY",
    );

    const salaryAmount = salaryPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
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
          normalizeMethod(payment.paymentMethod) === normalizeMethod(method) &&
          normalizeStatus(payment.status) === "paid",
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
    setFilters(INITIAL_FILTERS);
  };

  // =====================================================
  // CSV VALUE
  // =====================================================

  const csvValue = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    return `"${String(value).replace(/"/g, '""')}"`;
  };

  // =====================================================
  // EXPORT CSV
  // =====================================================

  const exportCSV = () => {
    if (!filteredPayments.length) {
      setError("There are no transactions available to export.");
      return;
    }

    const headers = [
      "Payment Number",
      "Payment Type",
      "Party Name",
      "Customer ID",
      "Supplier ID",
      "Employee ID",
      "Order ID",
      "Purchase ID",
      "Payroll ID",
      "Amount",
      "Payment Method",
      "Status",
      "Transaction ID",
      "Reference Number",
      "Payment Date",
      "Refund Amount",
      "Description",
      "Remarks",
    ];

    const rows = filteredPayments.map((payment) => [
      payment.paymentNumber || `PAY-${payment.id || ""}`,

      payment.paymentType || "",

      getPartyName(payment),

      payment.customerId || "",

      payment.supplierId || "",

      payment.employeeId || "",

      payment.orderId || "",

      payment.purchaseId || "",

      payment.payrollId || "",

      payment.amount || 0,

      payment.paymentMethod
        ? String(payment.paymentMethod).replace("_", " ")
        : "",

      payment.status || "",

      payment.transactionId || "",

      payment.referenceNumber || "",

      payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleString("en-IN")
        : "",

      payment.refundAmount || 0,

      payment.description || "",

      payment.remarks || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvValue).join(","))
      .join("\r\n");

    // BOM makes Hindi/₹ and other Unicode work correctly in Excel
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `payment-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

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
    if (!type) {
      return "-";
    }

    return String(type)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusStyle = (status) => {
    switch (normalizeStatus(status)) {
      case "paid":
        return { backgroundColor: `${colors.mint}1F`, color: colors.primaryTeal };

      case "pending":
        return { backgroundColor: "#F2A93B1F", color: colors.amber };

      case "refunded":
        return { backgroundColor: `${colors.seafoam}1F`, color: colors.seafoam };

      case "cancelled":
        return { backgroundColor: `${colors.textMuted}1A`, color: colors.textMuted };

      case "failed":
        return { backgroundColor: `${colors.danger}1F`, color: colors.danger };

      default:
        return { backgroundColor: `${colors.textMuted}1A`, color: colors.textMuted };
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading && payments.length === 0) {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center"
        style={{ backgroundColor: colors.cardTint, fontFamily: "'Inter', sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" style={{ color: colors.primaryTeal }} />

          <p style={{ color: colors.textMuted }}>Loading payment reports...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{ backgroundColor: colors.cardTint, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .pr-input { border-color: ${colors.cardBorder}; background-color: ${colors.bgLight}; color: ${colors.textDark}; }
        .pr-input:focus { border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px ${colors.primaryTeal}26; }
        .pr-refresh-btn:hover { background-color: ${colors.cardTint}; }
        .pr-export-btn { background: linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint}); transition: filter 0.15s ease; }
        .pr-export-btn:hover { filter: brightness(1.06); }
        .pr-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pr-row:hover { background-color: ${colors.cardTint}; }
      `}</style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1
            className="text-2xl md:text-3xl"
            style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
          >
            Payment Reports
          </h1>

          <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
            Analyze customer, supplier and salary payments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="pr-refresh-btn inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            style={{ borderColor: `${colors.primaryTeal}4D`, backgroundColor: colors.bgLight, color: colors.primaryTeal }}
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!filteredPayments.length}
            className="pr-export-btn inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-md sm:flex-none"
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
        <div
          className="mb-6 flex items-start justify-between rounded-xl border p-4 text-sm"
          style={{ borderColor: `${colors.danger}4D`, backgroundColor: `${colors.danger}0D`, color: colors.danger }}
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-4 transition hover:opacity-70"
            style={{ color: colors.danger }}
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-6 rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold" style={{ color: colors.textDark }}>Filters</h2>

            <p className="text-xs" style={{ color: colors.textMuted }}>Filter your payment report.</p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm transition hover:opacity-80"
            style={{ color: colors.danger }}
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
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: colors.textMuted }}
            />

            <input
              type="text"
              placeholder="Search payment..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className={`${inputClass} pl-10 pr-3`}
            />
          </div>

          {/* Type */}

          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: e.target.value,
              }))
            }
            className={inputClass}
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
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
              }))
            }
            className={inputClass}
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
              setFilters((prev) => ({
                ...prev,
                method: e.target.value,
              }))
            }
            className={inputClass}
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
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: colors.textMuted }}
            />

            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  fromDate: e.target.value,
                }))
              }
              className={`${inputClass} pl-9 pr-2`}
            />
          </div>

          {/* To Date */}

          <div className="relative">
            <CalendarDays
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: colors.textMuted }}
            />

            <input
              type="date"
              value={filters.toDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  toDate: e.target.value,
                }))
              }
              className={`${inputClass} pl-9 pr-2`}
            />
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN STATS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}

        <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Transactions</p>

              <h3 className="mt-2 text-2xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                {stats.totalTransactions}
              </h3>
            </div>

            <div className="rounded-xl p-3" style={{ backgroundColor: `${colors.primaryTeal}1A`, color: colors.primaryTeal }}>
              <CreditCard size={23} />
            </div>
          </div>
        </div>

        {/* Paid */}

        <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Received / Paid</p>

              <h3 className="mt-2 text-2xl" style={{ color: colors.primaryTeal, fontFamily: "'Libre Baskerville', serif" }}>
                {formatCurrency(stats.totalAmount)}
              </h3>
            </div>

            <div className="rounded-xl p-3" style={{ backgroundColor: `${colors.mint}1F`, color: colors.primaryTeal }}>
              <TrendingUp size={23} />
            </div>
          </div>

          <p className="mt-2 text-xs" style={{ color: colors.textMuted }}>
            {stats.paidCount} paid transactions
          </p>
        </div>

        {/* Pending */}

        <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Pending Amount</p>

              <h3 className="mt-2 text-2xl" style={{ color: colors.amber, fontFamily: "'Libre Baskerville', serif" }}>
                {formatCurrency(stats.pendingAmount)}
              </h3>
            </div>

            <div className="rounded-xl p-3" style={{ backgroundColor: "#F2A93B1F", color: colors.amber }}>
              <Wallet size={23} />
            </div>
          </div>

          <p className="mt-2 text-xs" style={{ color: colors.textMuted }}>
            {stats.pendingCount} pending transactions
          </p>
        </div>

        {/* Refund */}

        <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Refunded Amount</p>

              <h3 className="mt-2 text-2xl" style={{ color: colors.seafoam, fontFamily: "'Libre Baskerville', serif" }}>
                {formatCurrency(stats.refundAmount)}
              </h3>
            </div>

            <div className="rounded-xl p-3" style={{ backgroundColor: `${colors.seafoam}1F`, color: colors.seafoam }}>
              <TrendingDown size={23} />
            </div>
          </div>

          <p className="mt-2 text-xs" style={{ color: colors.textMuted }}>
            {stats.refundedCount} refunded transactions
          </p>
        </div>
      </div>

      {/* =================================================
          PAYMENT TYPE + METHOD
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Payment Type */}

        <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl p-2.5" style={{ backgroundColor: `${colors.primaryTeal}1A`, color: colors.primaryTeal }}>
              <Users size={20} />
            </div>

            <div>
              <h2 className="font-semibold" style={{ color: colors.textDark }}>Payment By Type</h2>

              <p className="text-xs" style={{ color: colors.textMuted }}>Distribution of payments</p>
            </div>
          </div>

          <div className="space-y-4">
            {typeStats.map((item) => (
              <div key={item.type} className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: colors.textDark }}>{item.label}</p>

                    <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                      {item.count} transactions
                    </p>
                  </div>

                  <p className="font-semibold" style={{ color: colors.textDark }}>
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}

        <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl p-2.5" style={{ backgroundColor: `${colors.seafoam}1A`, color: colors.seafoam }}>
              <BarChart3 size={20} />
            </div>

            <div>
              <h2 className="font-semibold" style={{ color: colors.textDark }}>
                Payment By Method
              </h2>

              <p className="text-xs" style={{ color: colors.textMuted }}>
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
                    <span style={{ color: colors.textMuted }}>
                      {item.method.replace("_", " ")}
                    </span>

                    <span className="font-medium" style={{ color: colors.textDark }}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.cardTint }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: colors.primaryTeal,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
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

      <div className="mb-6 rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl p-2.5" style={{ backgroundColor: `${colors.mint}1A`, color: colors.mint }}>
            <IndianRupee size={20} />
          </div>

          <div>
            <h2 className="font-semibold" style={{ color: colors.textDark }}>
              Payment Status Summary
            </h2>

            <p className="text-xs" style={{ color: colors.textMuted }}>Current transaction status</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-xl p-4" style={{ backgroundColor: `${colors.mint}1F` }}>
            <p className="text-xs" style={{ color: colors.primaryTeal }}>Paid</p>

            <p className="mt-1 text-xl font-semibold" style={{ color: colors.primaryTeal }}>
              {stats.paidCount}
            </p>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: "#F2A93B1F" }}>
            <p className="text-xs" style={{ color: colors.amber }}>Pending</p>

            <p className="mt-1 text-xl font-semibold" style={{ color: colors.amber }}>
              {stats.pendingCount}
            </p>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: `${colors.danger}1A` }}>
            <p className="text-xs" style={{ color: colors.danger }}>Failed</p>

            <p className="mt-1 text-xl font-semibold" style={{ color: colors.danger }}>
              {stats.failedCount}
            </p>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: `${colors.textMuted}1A` }}>
            <p className="text-xs" style={{ color: colors.textMuted }}>Cancelled</p>

            <p className="mt-1 text-xl font-semibold" style={{ color: colors.textMuted }}>
              {stats.cancelledCount}
            </p>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: `${colors.seafoam}1F` }}>
            <p className="text-xs" style={{ color: colors.seafoam }}>Refunded</p>

            <p className="mt-1 text-xl font-semibold" style={{ color: colors.seafoam }}>
              {stats.refundedCount}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          TRANSACTIONS
      ================================================= */}

      <div className="rounded-2xl border shadow-sm" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        <div className="border-b p-5" style={{ borderColor: colors.cardBorder }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold" style={{ color: colors.textDark }}>
                Payment Transactions
              </h2>

              <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                {filteredPayments.length} transactions found
              </p>
            </div>

            {loading && (
              <RefreshCw size={18} className="animate-spin" style={{ color: colors.primaryTeal }} />
            )}
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={42} className="mx-auto mb-3" style={{ color: colors.cardBorder }} />

            <p className="font-medium" style={{ color: colors.textDark }}>No payments found</p>

            <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
              Try changing your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full">
              <thead style={{ backgroundColor: colors.cardTint }}>
                <tr className="text-left text-xs uppercase" style={{ color: colors.textMuted }}>
                  <th className="px-5 py-3">Payment</th>

                  <th className="px-5 py-3">Type</th>

                  <th className="px-5 py-3">Party</th>

                  <th className="px-5 py-3">Amount</th>

                  <th className="px-5 py-3">Method</th>

                  <th className="px-5 py-3">Status</th>

                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: colors.cardBorder }}>
                {filteredPayments.slice(0, 50).map((payment) => (
                  <tr key={payment.id} className="pr-row text-sm transition-colors" style={{ borderColor: colors.cardBorder }}>
                    {/* Payment */}

                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: colors.textDark }}>
                        {payment.paymentNumber || `PAY-${payment.id || "-"}`}
                      </p>

                      <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                        {payment.transactionId || "No transaction ID"}
                      </p>
                    </td>

                    {/* Type */}

                    <td className="px-5 py-4">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${colors.primaryTeal}1A`, color: colors.primaryTeal }}
                      >
                        {formatPaymentType(payment.paymentType)}
                      </span>
                    </td>

                    {/* Party */}

                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: colors.textDark }}>
                        {getPartyName(payment)}
                      </p>
                    </td>

                    {/* Amount */}

                    <td className="px-5 py-4 font-semibold" style={{ color: colors.textDark }}>
                      {formatCurrency(payment.amount)}
                    </td>

                    {/* Method */}

                    <td className="px-5 py-4" style={{ color: colors.textMuted }}>
                      {payment.paymentMethod
                        ? String(payment.paymentMethod).replace("_", " ")
                        : "-"}
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                        style={getStatusStyle(payment.status)}
                      >
                        {payment.status || "-"}
                      </span>
                    </td>

                    {/* Date */}

                    <td className="px-5 py-4" style={{ color: colors.textMuted }}>
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