import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FileText,
  Loader2,
  ArrowLeft,
  Search,
  Receipt,
  Download,
  AlertCircle,
} from "lucide-react";
import { getMyInvoices, getInvoiceById } from "../../api/invoiceApi";
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
// INVOICE DETAIL VIEW
// ============================================================
function InvoiceDetailView({ invoiceId, onBack }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInvoiceById(invoiceId);
        if (res.success) setInvoice(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load invoice.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center rounded-3xl border p-8 sm:p-10"
        style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "#FBE9E8" }}>
          <AlertCircle size={24} color="#E0645C" />
        </div>
        <h2 className="mt-5 text-xl"
          style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          Invoice not found
        </h2>
        <button
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <ArrowLeft size={15} /> Back to invoices
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 transition-colors"
        style={{ color: colors.primaryTeal }}
      >
        <ArrowLeft size={14} /> All invoices
      </button>
      <InvoicePreview invoice={invoice} />
    </div>
  );
}

// ============================================================
// INVOICE LIST
// ============================================================
function InvoiceList({ invoices, loading, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl border"
        style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${colors.mint}1F` }}>
          <Receipt size={24} color={colors.mint} />
        </div>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          No invoices yet. Invoices are generated when your orders are confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((inv) => {
        const status = getStatusBadge(inv.paymentStatus);
        const dueBalance = Number(inv.total) - Number(inv.amountPaid || 0);

        return (
          <button
            key={inv.id}
            onClick={() => onSelect(inv.id)}
            className="w-full text-left rounded-2xl border p-5 transition-all hover:shadow-md cursor-pointer"
            style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${colors.primaryTeal}15` }}>
                  <FileText size={18} color={colors.primaryTeal} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: colors.textDark }}>
                    {inv.invoiceNumber}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                    {formatDate(inv.issuedDate)}
                    {inv.shop?.name ? ` · ${inv.shop.name}` : ""}
                    {inv.order ? ` · Order #${inv.order.id}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pl-14 sm:pl-0">
                <div className="text-right">
                  <div className="text-base font-bold" style={{ color: colors.textDark }}>
                    {formatINR(inv.total)}
                  </div>
                  {inv.paymentStatus === "Partial" && (
                    <div className="text-[11px] mt-0.5" style={{ color: "#9A6A12" }}>
                      Due: {formatINR(dueBalance)}
                    </div>
                  )}
                </div>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
                <Download size={16} style={{ color: colors.textMuted }} className="flex-shrink-0" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function MyInvoices() {
  const { id } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(id || null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getMyInvoices();
      if (res.success) setInvoices(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Sync URL param
  useEffect(() => {
    if (id) setSelectedId(id);
  }, [id]);

  // Filtered invoices
  const filtered = invoices.filter((inv) => {
    if (filter !== "all" && inv.paymentStatus !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.shop?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // If viewing a detail
  if (selectedId) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');`}</style>
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl"
            style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
            Invoice Details
          </h2>
        </div>
        <InvoiceDetailView invoiceId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  // Summary stats
  const totalPaid = invoices.filter((i) => i.paymentStatus === "Paid").reduce((s, i) => s + Number(i.total || 0), 0);
  const totalUnpaid = invoices.filter((i) => i.paymentStatus !== "Paid" && i.paymentStatus !== "Cancelled").reduce((s, i) => s + (Number(i.total) - Number(i.amountPaid || 0)), 0);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl"
          style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          My Invoices
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          View and download invoices for your orders.
        </p>
      </div>

      {/* Summary Cards */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl p-5 border" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primaryTeal}15` }}>
              <FileText size={18} color={colors.primaryTeal} />
            </div>
            <p className="text-2xl font-semibold mt-3" style={{ color: colors.textDark }}>{invoices.length}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Total Invoices</p>
          </div>
          <div className="rounded-2xl p-5 border" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#DFF7F1" }}>
              <span className="text-lg">✅</span>
            </div>
            <p className="text-2xl font-semibold mt-3" style={{ color: "#0B6E63" }}>{formatINR(totalPaid)}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Total Paid</p>
          </div>
          <div className="rounded-2xl p-5 border" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FBE9E8" }}>
              <span className="text-lg">⏳</span>
            </div>
            <p className="text-2xl font-semibold mt-3" style={{ color: "#B3261E" }}>{formatINR(totalUnpaid)}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Amount Due</p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      {!loading && invoices.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-[#028090]"
              style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight, color: colors.textDark }}
            />
          </div>
          <div className="flex gap-2">
            {["all", "Unpaid", "Partial", "Paid"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: filter === f ? colors.primaryTeal : colors.cardTint,
                  color: filter === f ? "#FFF" : colors.textMuted,
                  border: `1px solid ${filter === f ? colors.primaryTeal : colors.cardBorder}`,
                }}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invoice List */}
      <InvoiceList
        invoices={filtered}
        loading={loading}
        onSelect={(id) => setSelectedId(id)}
      />
    </div>
  );
}
