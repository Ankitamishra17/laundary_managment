import { useRef, useState } from "react";
import { Download, Printer, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Professional invoice preview component.
 * Supports real PDF download and browser print.
 *
 * Props:
 *   invoice  — the full invoice object from the API
 *   compact  — optional boolean, renders a smaller version in lists
 */

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

/**
 * Build a self-contained HTML string for the invoice.
 * All styles are inline — no external CSS needed.
 */
function buildInvoiceHTML(invoice) {
  let items = invoice.items || [];
  if (typeof items === "string") {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) items = [];
  const status = getStatusBadge(invoice.paymentStatus);

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #D8ECEA;font-size:13px;color:#0F2C2E;font-weight:500;">
          ${item.itemLabel ? `${item.itemLabel} <span style="color:#5C7A78;font-weight:400;">· ${item.name}</span>` : item.name}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #D8ECEA;font-size:13px;color:#5C7A78;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #D8ECEA;font-size:13px;color:#5C7A78;text-align:right;">
          ${formatINR(item.price)}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #D8ECEA;font-size:13px;color:#0F2C2E;text-align:right;font-weight:600;">
          ${formatINR(item.lineTotal)}
        </td>
      </tr>`
    )
    .join("");

  const taxRow =
    Number(invoice.taxRate) > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#5C7A78;margin-bottom:8px;">
           <span>GST (${invoice.taxRate}%)</span>
           <span>${formatINR(invoice.taxAmount)}</span>
         </div>`
      : "";

  const discountRow =
    Number(invoice.discount) > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#0B6E63;margin-bottom:8px;">
           <span>Discount</span>
           <span>-${formatINR(invoice.discount)}</span>
         </div>`
      : "";

  const deliveryRow =
    Number(invoice.deliveryCharge) > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#5C7A78;margin-bottom:8px;">
           <span>Delivery Charge</span>
           <span>${formatINR(invoice.deliveryCharge)}</span>
         </div>`
      : "";

  const paymentMethodRow = invoice.paymentMethod
    ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#5C7A78;margin-top:8px;">
         <span>Payment Method</span>
         <span style="font-weight:600;">${invoice.paymentMethod.replace(/_/g, " ")}</span>
       </div>`
    : "";

  const paidRow =
    Number(invoice.amountPaid) > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#0B6E63;margin-top:8px;">
           <span>Amount Paid</span>
           <span style="font-weight:600;">${formatINR(invoice.amountPaid)}</span>
         </div>
         ${
           Number(invoice.total) - Number(invoice.amountPaid) > 0
             ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#B3261E;margin-top:4px;">
                  <span>Balance Due</span>
                  <span style="font-weight:700;">${formatINR(Number(invoice.total) - Number(invoice.amountPaid))}</span>
                </div>`
             : ""
         }`
      : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber || ""}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; color: #0F2C2E; background: #fff; padding: 32px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header-bar { background: linear-gradient(135deg, #05282A 0%, #028090 100%); padding: 28px 36px; border-radius: 16px 16px 0 0; display: flex; justify-content: space-between; align-items: center; }
        .header-bar h1 { font-size: 14px; color: #A3C9C7; letter-spacing: 2px; text-transform: uppercase; font-weight: 500; margin-bottom: 4px; }
        .header-bar h2 { font-size: 26px; color: #FFFFFF; font-weight: 700; letter-spacing: 1px; }
        .inv-num { font-size: 16px; font-weight: 700; color: #FFF; text-align: right; }
        .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 6px; }
        .body { padding: 28px 36px; border: 1px solid #D8ECEA; border-top: none; border-radius: 0 0 16px 16px; }
        .greeting { font-size: 15px; color: #0F2C2E; font-weight: 600; margin-bottom: 4px; }
        .subtext { font-size: 13px; color: #5C7A78; line-height: 1.6; margin-bottom: 24px; }
        .info-grid { display: flex; gap: 16px; margin-bottom: 24px; }
        .info-box { flex: 1; background: #EEF7F6; border-radius: 12px; padding: 16px; }
        .info-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #5C7A78; font-weight: 700; margin-bottom: 8px; }
        .info-name { font-size: 14px; font-weight: 600; color: #0F2C2E; margin-bottom: 4px; }
        .info-detail { font-size: 12px; color: #5C7A78; line-height: 1.8; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #D8ECEA; }
        th { background: #05282A; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 12px 16px; text-align: left; font-weight: 600; }
        th:last-child { text-align: right; }
        th:nth-child(2), th:nth-child(3) { text-align: center; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
        .totals-box { width: 280px; background: #EEF7F6; border-radius: 12px; padding: 18px; }
        .totals-divider { display: flex; justify-content: space-between; padding-top: 12px; margin-top: 8px; border-top: 2px solid #028090; }
        .totals-total { font-size: 18px; font-weight: 700; color: #0F2C2E; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #D8ECEA; }
        .footer p { font-size: 11px; color: #5C7A78; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header-bar">
          <div>
            <h1>${invoice.shopName || "Laundry"}</h1>
            <h2>INVOICE</h2>
          </div>
          <div class="inv-num">
            <div>${invoice.invoiceNumber || ""}</div>
            <div class="badge" style="background:${status.bg};color:${status.color};">${status.label}</div>
          </div>
        </div>

        <!-- Body -->
        <div class="body">
          <p class="greeting">Hi ${invoice.customerName || "Customer"},</p>
          <p class="subtext">Here's your invoice from <strong>${invoice.shopName || "your laundry"}</strong> for order #${invoice.order?.id || invoice.orderId || "—"}. Please review the details below.</p>

          <!-- Info Grid -->
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Bill To</div>
              <div class="info-name">${invoice.customerName || "Customer"}</div>
              ${invoice.customerPhone ? `<div class="info-detail">${invoice.customerPhone}</div>` : ""}
              ${invoice.customerEmail ? `<div class="info-detail">${invoice.customerEmail}</div>` : ""}
              ${invoice.customerAddress ? `<div class="info-detail">${invoice.customerAddress}</div>` : ""}
            </div>
            <div class="info-box">
              <div class="info-label">Invoice Details</div>
              <div class="info-detail">
                <div><span style="color:#5C7A78;">Issued:</span> <strong>${formatDate(invoice.issuedDate)}</strong></div>
                ${invoice.dueDate ? `<div><span style="color:#5C7A78;">Due:</span> <strong>${formatDate(invoice.dueDate)}</strong></div>` : ""}
                ${invoice.order?.id ? `<div><span style="color:#5C7A78;">Order:</span> <strong>#${invoice.order.id}</strong></div>` : ""}
                ${invoice.paymentMethod ? `<div><span style="color:#5C7A78;">Method:</span> <strong>${invoice.paymentMethod.replace(/_/g, " ")}</strong></div>` : ""}
                ${invoice.shopGstNumber ? `<div><span style="color:#5C7A78;">GSTIN:</span> <strong>${invoice.shopGstNumber}</strong></div>` : ""}
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th>Item / Service</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#5C7A78;font-size:13px;">No items</td></tr>`}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals">
            <div class="totals-box">
              <div style="display:flex;justify-content:space-between;font-size:13px;color:#5C7A78;margin-bottom:8px;">
                <span>Subtotal</span>
                <span>${formatINR(invoice.subtotal)}</span>
              </div>
              ${taxRow}
              ${discountRow}
              ${deliveryRow}
              <div class="totals-divider">
                <span class="totals-total">Total</span>
                <span class="totals-total">${formatINR(invoice.total)}</span>
              </div>
              ${paymentMethodRow}
              ${paidRow}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for your business! · ${invoice.shopName || "Laundry Management System"}${invoice.shopAddress ? ` · ${invoice.shopAddress}` : ""}${invoice.shopPhone ? ` · ${invoice.shopPhone}` : ""}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default function InvoicePreview({ invoice, compact = false }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!invoice) return null;

  const status = getStatusBadge(invoice.paymentStatus);
  // items may come as a JSON string from MySQL — parse it safely
  let items = invoice.items || [];
  if (typeof items === "string") {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) items = [];

  // ============================================================
  // PDF DOWNLOAD — uses html2canvas + jsPDF for real PDF file
  // ============================================================
  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Invoice-${invoice.invoiceNumber || "download"}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      // Fallback: open print dialog
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  // ============================================================
  // PRINT — self-contained HTML with all inline styles
  // ============================================================
  const handlePrint = () => {
    setPrinting(true);
    try {
      const html = buildInvoiceHTML(invoice);
      const printWindow = window.open("", "_blank", "width=850,height=1100");
      if (!printWindow) {
        alert("Please allow popups for this site to print invoices.");
        setPrinting(false);
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      // Wait for fonts to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setPrinting(false);
        }, 500);
      };
    } catch (err) {
      console.error("Print failed:", err);
      setPrinting(false);
    }
  };

  // Compact card for list views
  if (compact) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primaryTeal}15` }}>
              <span className="text-sm font-bold" style={{ color: colors.primaryTeal }}>📄</span>
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: colors.textDark }}>{invoice.invoiceNumber}</div>
              <div className="text-xs" style={{ color: colors.textMuted }}>
                {formatDate(invoice.issuedDate)} · {invoice.customerName || "Customer"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
            <span className="text-base font-bold" style={{ color: colors.textDark }}>
              {formatINR(invoice.total)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full invoice preview
  return (
    <div>
      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-all hover:brightness-110 disabled:opacity-60"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {downloading ? "Generating PDF..." : "Download PDF"}
        </button>
        <button
          onClick={handlePrint}
          disabled={printing}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors disabled:opacity-60"
          style={{ borderColor: colors.cardBorder, color: colors.primaryTeal, backgroundColor: colors.bgLight }}
        >
          {printing ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
          {printing ? "Opening..." : "Print"}
        </button>
      </div>

      {/* Invoice Card — this is what gets captured as PDF */}
      <div
        ref={printRef}
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6" style={{ borderBottom: `3px solid ${colors.primaryTeal}` }}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl" style={{ fontFamily: "'Libre Baskerville', serif", color: colors.bgDark }}>
                {invoice.shopName || "Shop"}
              </h2>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                {invoice.shopAddress || ""}
                {invoice.shopPhone ? ` · ${invoice.shopPhone}` : ""}
              </p>
              {invoice.shopGstNumber && (
                <p className="text-xs mt-1 font-medium" style={{ color: colors.textDark }}>
                  GSTIN: {invoice.shopGstNumber}
                </p>
              )}
            </div>
            <div className="text-left sm:text-right">
              <h1 className="text-3xl" style={{ fontFamily: "'Libre Baskerville', serif", color: colors.primaryTeal }}>
                INVOICE
              </h1>
              <p className="text-sm font-bold mt-1" style={{ color: colors.textDark }}>
                {invoice.invoiceNumber}
              </p>
              <div className="mt-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="px-6 sm:px-8 py-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
            <h3 className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: colors.textMuted }}>
              Bill To
            </h3>
            <p className="text-sm font-semibold" style={{ color: colors.textDark }}>
              {invoice.customerName || "Customer"}
            </p>
            {invoice.customerEmail && (
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{invoice.customerEmail}</p>
            )}
            {invoice.customerPhone && (
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{invoice.customerPhone}</p>
            )}
            {invoice.customerAddress && (
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{invoice.customerAddress}</p>
            )}
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
            <h3 className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: colors.textMuted }}>
              Invoice Details
            </h3>
            <div className="space-y-1.5 text-xs" style={{ color: colors.textDark }}>
              <div className="flex justify-between">
                <span style={{ color: colors.textMuted }}>Issued</span>
                <span className="font-medium">{formatDate(invoice.issuedDate)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textMuted }}>Due Date</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              {invoice.order && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textMuted }}>Order</span>
                  <span className="font-medium">#{invoice.order.id}</span>
                </div>
              )}
              {invoice.paymentMethod && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textMuted }}>Method</span>
                  <span className="font-medium">{invoice.paymentMethod.replace(/_/g, " ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-6 sm:px-8 pb-6">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.cardBorder }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: colors.bgDark }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wide py-3 px-5 text-white">
                    Item / Service
                  </th>
                  <th className="text-center text-[11px] font-semibold uppercase tracking-wide py-3 px-3 text-white">
                    Qty
                  </th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wide py-3 px-5 text-white">
                    Unit Price
                  </th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wide py-3 px-5 text-white">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-b-0"
                    style={{ borderColor: colors.cardBorder }}
                  >
                    <td className="py-3 px-5">
                      <span className="font-medium" style={{ color: colors.textDark }}>
                        {item.itemLabel ? (
                          <>
                            {item.itemLabel}
                            <span className="text-xs font-normal ml-1" style={{ color: colors.textMuted }}>
                              · {item.name}
                            </span>
                          </>
                        ) : (
                          item.name
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center" style={{ color: colors.textMuted }}>
                      {item.quantity}
                    </td>
                    <td className="py-3 px-5 text-right" style={{ color: colors.textMuted }}>
                      {formatINR(item.price)}
                    </td>
                    <td className="py-3 px-5 text-right font-medium" style={{ color: colors.textDark }}>
                      {formatINR(item.lineTotal)}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs" style={{ color: colors.textMuted }}>
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 sm:px-8 pb-8">
          <div className="flex justify-end">
            <div className="w-full sm:w-80">
              <div className="rounded-xl border p-5" style={{ borderColor: colors.cardBorder, backgroundColor: `${colors.primaryTeal}05` }}>
                <div className="flex justify-between text-sm mb-2" style={{ color: colors.textMuted }}>
                  <span>Subtotal</span>
                  <span>{formatINR(invoice.subtotal)}</span>
                </div>
                {Number(invoice.taxRate) > 0 && (
                  <div className="flex justify-between text-sm mb-2" style={{ color: colors.textMuted }}>
                    <span>GST ({invoice.taxRate}%)</span>
                    <span>{formatINR(invoice.taxAmount)}</span>
                  </div>
                )}
                {Number(invoice.discount) > 0 && (
                  <div className="flex justify-between text-sm mb-2" style={{ color: "#0B6E63" }}>
                    <span>Discount</span>
                    <span>-{formatINR(invoice.discount)}</span>
                  </div>
                )}
                {Number(invoice.deliveryCharge) > 0 && (
                  <div className="flex justify-between text-sm mb-2" style={{ color: colors.textMuted }}>
                    <span>Delivery Charge</span>
                    <span>{formatINR(invoice.deliveryCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 mt-2 border-t-2" style={{ borderColor: colors.primaryTeal }}>
                  <span className="text-lg font-bold" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                    Total
                  </span>
                  <span className="text-lg font-bold" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                    {formatINR(invoice.total)}
                  </span>
                </div>
                {invoice.paymentMethod && (
                  <div className="flex justify-between text-sm mt-2" style={{ color: colors.textMuted }}>
                    <span>Payment Method</span>
                    <span className="font-medium">{invoice.paymentMethod.replace(/_/g, " ")}</span>
                  </div>
                )}
                {Number(invoice.amountPaid) > 0 && (
                  <>
                    <div className="flex justify-between text-sm mt-2" style={{ color: "#0B6E63" }}>
                      <span>Amount Paid</span>
                      <span className="font-medium">{formatINR(invoice.amountPaid)}</span>
                    </div>
                    {Number(invoice.total) - Number(invoice.amountPaid) > 0 && (
                      <div className="flex justify-between text-sm mt-1" style={{ color: "#B3261E" }}>
                        <span>Balance Due</span>
                        <span className="font-bold">{formatINR(Number(invoice.total) - Number(invoice.amountPaid))}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-6 sm:px-8 pb-6">
            <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
              <h4 className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: colors.textMuted }}>
                Notes
              </h4>
              <p className="text-xs" style={{ color: colors.textDark }}>{invoice.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 text-center" style={{ backgroundColor: colors.cardTint, borderTop: `1px solid ${colors.cardBorder}` }}>
          <p className="text-[11px]" style={{ color: colors.textMuted }}>
            Thank you for your business! · {invoice.shopName || "WashFlow"} · {invoice.shopAddress || ""}
          </p>
        </div>
      </div>
    </div>
  );
}
