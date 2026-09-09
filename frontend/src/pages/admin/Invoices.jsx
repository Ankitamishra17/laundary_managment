import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FileText,
  Loader2,
  ArrowLeft,
  Search,
  Receipt,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  CreditCard,
  RefreshCw,
  User,
  CalendarDays,
  X,
} from "lucide-react";
import {
  getAdminInvoices,
  getInvoiceById,
  getInvoiceStats,
  payInvoice,
} from "../../api/invoiceApi";
import InvoicePreview from "../../components/invoice/InvoicePreview";

const colors = {
  bgDark: "#05282A",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status) {
  const map = {
    Paid: { bg: "#DFF7F1", color: "#0B6E63", label: "Paid" },
    Unpaid: { bg: "#FBE9E8", color: "#B3261E", label: "Unpaid" },
    Partial: { bg: "#FBF0DC", color: "#9A6A12", label: "Partial" },
    Cancelled: { bg: "#F3E8F9", color: "#6B21A8", label: "Cancelled" },
    Pending: { bg: "#FBF0DC", color: "#9A6A12", label: "Pending" },
    Failed: { bg: "#FBE9E8", color: "#B3261E", label: "Failed" },
    Refunded: { bg: "#E8F0FE", color: "#1A73E8", label: "Refunded" },
  };
  return map[status] || map.Unpaid;
}

// ============================================================
// PAY INVOICE MODAL
// ============================================================
function PayInvoiceModal({ invoice, onClose, onPaid }) {
  const [method, setMethod] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dueAmount = Number(invoice.total) - Number(invoice.amountPaid || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await payInvoice(invoice.id, {
        paymentMethod: method,
        amount: amount ? Number(amount) : dueAmount,
      });
      toast.success("Payment recorded successfully!");
      onPaid?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: colors.textDark }}>
              Record Payment
            </h2>
            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
              {invoice.invoiceNumber} · Due: {formatINR(dueAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.cardTint, border: `1px solid ${colors.cardBorder}` }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank_Transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
              Amount (leave empty to pay full due: {formatINR(dueAmount)})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              max={dueAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={formatINR(dueAmount)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold border"
              style={{ borderColor: colors.cardBorder, color: colors.textDark, backgroundColor: colors.bgLight }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              {submitting ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;

      const [invoicesRes, statsRes] = await Promise.all([
        getAdminInvoices(params),
        getInvoiceStats(),
      ]);
      setInvoices(invoicesRes?.data || []);
      setTotalPages(invoicesRes?.pagination?.totalPages || 1);
      setStats(statsRes?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, statusFilter]);

  // Live refresh
  useEffect(() => {
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [page, statusFilter, search]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  const handleViewDetail = async (invoice) => {
    setSelectedId(invoice.id);
    setLoadingDetail(true);
    try {
      const res = await getInvoiceById(invoice.id);
      if (res.success) setSelectedInvoice(res.data);
    } catch (err) {
      toast.error("Failed to load invoice details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePayDone = () => {
    load(true);
    if (selectedId) {
      getInvoiceById(selectedId).then((res) => {
        if (res.success) setSelectedInvoice(res.data);
      });
    }
  };

  // Detail View
  if (selectedId) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');`}</style>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => { setSelectedId(null); setSelectedInvoice(null); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium mb-3 transition-colors"
              style={{ color: colors.primaryTeal }}
            >
              <ArrowLeft size={14} /> All invoices
            </button>
            <h1 className="text-2xl" style={{ fontFamily: "'Libre Baskerville', serif", color: colors.textDark }}>
              Invoice Details
            </h1>
          </div>
          {selectedInvoice && selectedInvoice.paymentStatus !== "Paid" && selectedInvoice.paymentStatus !== "Cancelled" && (
            <button
              onClick={() => setPayTarget(selectedInvoice)}
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              <CreditCard size={15} /> Record Payment
            </button>
          )}
        </div>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
          </div>
        ) : selectedInvoice ? (
          <InvoicePreview invoice={selectedInvoice} />
        ) : (
          <div className="text-center py-20" style={{ color: colors.textMuted }}>Invoice not found</div>
        )}

        {payTarget && (
          <PayInvoiceModal
            invoice={payTarget}
            onClose={() => setPayTarget(null)}
            onPaid={handlePayDone}
          />
        )}
      </div>
    );
  }

  // Summary stats
  const paidCount = stats?.paidCount || 0;
  const unpaidCount = stats?.unpaidCount || 0;
  const partialCount = stats?.partialCount || 0;

  const summaryCards = [
    { title: "Total Invoices", value: stats?.totalInvoices ?? invoices.length, icon: FileText, color: colors.primaryTeal, bg: `${colors.primaryTeal}15` },
    { title: "Total Revenue", value: formatINR(stats?.totalAmount || 0), icon: IndianRupee, color: "#0B6E63", bg: "#DFF7F1" },
    { title: "Paid", value: `${paidCount}`, icon: CheckCircle2, color: "#0B6E63", bg: "#DFF7F1" },
    { title: "Unpaid", value: `${unpaidCount}`, icon: AlertCircle, color: "#B3261E", bg: "#FBE9E8" },
    { title: "Partial", value: `${partialCount}`, icon: Clock, color: "#9A6A12", bg: "#FBF0DC" },
    { title: "Amount Due", value: formatINR(stats?.totalUnpaid || 0), icon: IndianRupee, color: "#B3261E", bg: "#FBE9E8" },
  ];

  const selectStyle = {
    backgroundColor: colors.cardTint,
    color: colors.textDark,
    borderColor: colors.cardBorder,
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "10px",
    padding: "6px 10px",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "'Libre Baskerville', serif", color: colors.textDark }}>
            Invoices
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            Manage and track all customer invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0 transition hover:opacity-90"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl p-5 border" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg, color: card.color }}>
                <Icon size={21} />
              </div>
              <p className="text-2xl font-semibold mt-4 truncate" style={{ color: colors.textDark }}>
                {loading ? "—" : card.value}
              </p>
              <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-[#028090]"
            style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight, color: colors.textDark }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "Unpaid", "Partial", "Paid"].map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: statusFilter === f ? colors.primaryTeal : colors.cardTint,
                color: statusFilter === f ? "#FFF" : colors.textMuted,
                border: `1px solid ${statusFilter === f ? colors.primaryTeal : colors.cardBorder}`,
              }}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${colors.mint}1F` }}>
            <Receipt size={24} color={colors.mint} />
          </div>
          <p className="text-sm" style={{ color: colors.textMuted }}>No invoices found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border" style={{ borderColor: colors.cardBorder }}>
            <table className="w-full text-sm min-w-[800px]" style={{ backgroundColor: colors.bgLight }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Invoice</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Customer</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Order</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Issued</th>
                  <th className="text-right font-medium px-5 py-3 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Amount</th>
                  <th className="text-center font-medium px-5 py-3 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Status</th>
                  <th className="text-right font-medium px-5 py-3 text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const status = getStatusBadge(inv.paymentStatus);
                  return (
                    <tr
                      key={inv.id}
                      className="transition-colors cursor-pointer hover:bg-[#EEF7F6]"
                      style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                      onClick={() => handleViewDetail(inv)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={15} color={colors.primaryTeal} />
                          <span className="font-semibold" style={{ color: colors.textDark }}>{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5" style={{ color: colors.textDark }}>
                          <User size={13} style={{ color: colors.primaryTeal }} />
                          {inv.customer?.name || inv.customerName || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.cardTint, color: colors.primaryTeal }}>
                          {inv.order?.id ? `#${inv.order.id}` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.textMuted }}>
                          <CalendarDays size={12} /> {formatDate(inv.issuedDate)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold" style={{ color: colors.textDark }}>
                        {formatINR(inv.total)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Cancelled" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPayTarget(inv); }}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:brightness-110"
                              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
                            >
                              <CreditCard size={12} /> Pay
                            </button>
                          )}
                          <Download size={15} style={{ color: colors.textMuted }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {invoices.map((inv) => {
              const status = getStatusBadge(inv.paymentStatus);
              return (
                <button
                  key={inv.id}
                  onClick={() => handleViewDetail(inv)}
                  className="w-full text-left rounded-2xl border p-4 transition-all hover:shadow-md"
                  style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={15} color={colors.primaryTeal} />
                      <span className="text-sm font-bold" style={{ color: colors.textDark }}>{inv.invoiceNumber}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-xs mb-1" style={{ color: colors.textMuted }}>
                    <User size={11} className="inline mr-1" />
                    {inv.customer?.name || inv.customerName || "—"} · Order #{inv.order?.id || "—"}
                  </div>
                  <div className="text-xs mb-2" style={{ color: colors.textMuted }}>
                    <CalendarDays size={11} className="inline mr-1" /> {formatDate(inv.issuedDate)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold" style={{ color: colors.textDark }}>{formatINR(inv.total)}</span>
                    {inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Cancelled" && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-lg text-white"
                        style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}>
                        Pay Now
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-xs font-semibold border disabled:opacity-40"
                style={{ borderColor: colors.cardBorder, color: colors.textDark, backgroundColor: colors.bgLight }}
              >
                Prev
              </button>
              <span className="text-xs px-3" style={{ color: colors.textMuted }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg text-xs font-semibold border disabled:opacity-40"
                style={{ borderColor: colors.cardBorder, color: colors.textDark, backgroundColor: colors.bgLight }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Pay Modal */}
      {payTarget && (
        <PayInvoiceModal
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onPaid={handlePayDone}
        />
      )}
    </div>
  );
}
