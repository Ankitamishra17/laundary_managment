import { sendEmail } from "./nodemailerEmail.js";

/**
 * Format a number as INR currency.
 */
function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a date string to a readable format.
 */
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

/**
 * Build the invoice rows HTML for the email.
 */
function buildItemRows(items) {
  if (!items || items.length === 0) {
    return `
      <tr>
        <td colspan="4" style="padding: 16px; text-align: center; color: #5C7A78; font-size: 13px;">
          No items
        </td>
      </tr>`;
  }

  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #D8ECEA; font-size: 13px; color: #0F2C2E; font-weight: 500;">
          ${item.itemLabel ? `${item.itemLabel} <span style="color: #5C7A78; font-weight: 400;">· ${item.name}</span>` : item.name}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #D8ECEA; font-size: 13px; color: #5C7A78; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #D8ECEA; font-size: 13px; color: #5C7A78; text-align: right;">
          ${formatINR(item.price)}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #D8ECEA; font-size: 13px; color: #0F2C2E; text-align: right; font-weight: 600;">
          ${formatINR(item.lineTotal)}
        </td>
      </tr>`
    )
    .join("");
}

/**
 * Send an invoice email to a customer.
 *
 * @param {Object} invoice — the Invoice record (with items, shop, customer info)
 * @param {Object} options — { frontendUrl } optional link back to the app
 */
export async function sendInvoiceEmail(invoice, options = {}) {
  const {
    invoiceNumber,
    customerName,
    customerEmail,
    customerPhone,
    shopName,
    shopAddress,
    shopPhone,
    shopGstNumber,
    items,
    deliveryCharge,
    subtotal,
    taxRate,
    taxAmount,
    discount,
    total,
    amountPaid,
    paymentStatus,
    issuedDate,
    dueDate,
    orderId,
  } = invoice;

  // Fallback to customer email
  const toEmail = customerEmail;
  if (!toEmail) {
    console.log(`[INVOICE EMAIL] No email for invoice ${invoiceNumber} — skipping.`);
    return null;
  }

  // Build the link back to the invoice in the app
  const baseUrl = options.frontendUrl || process.env.CLIENT_URL || "http://localhost:5173";
  const invoiceLink = `${baseUrl}/customer/invoices/${invoice.id}`;

  // Status badge color
  const statusColors = {
    Paid: { bg: "#DFF7F1", color: "#0B6E63" },
    Unpaid: { bg: "#FBE9E8", color: "#B3261E" },
    Partial: { bg: "#FBF0DC", color: "#9A6A12" },
    Cancelled: { bg: "#F3E8F9", color: "#6B21A8" },
  };
  const statusStyle = statusColors[paymentStatus] || statusColors.Unpaid;

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 0; color: #0F2C2E; background: #FFFFFF;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #05282A 0%, #028090 100%); padding: 32px 40px; border-radius: 16px 16px 0 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 style="margin: 0; font-size: 14px; color: #A3C9C7; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
              ${shopName || "Laundry"}
            </h1>
            <h2 style="margin: 6px 0 0 0; font-size: 28px; color: #FFFFFF; font-weight: 700; letter-spacing: 1px;">
              INVOICE
            </h2>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 700; color: #FFFFFF;">${invoiceNumber}</div>
            <div style="margin-top: 6px; display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${statusStyle.bg}; color: ${statusStyle.color};">
              ${paymentStatus}
            </div>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div style="padding: 32px 40px; border: 1px solid #D8ECEA; border-top: none; border-radius: 0 0 16px 16px;">

        <!-- Greeting -->
        <p style="font-size: 15px; color: #0F2C2E; margin: 0 0 4px 0; font-weight: 600;">
          Hi ${customerName || "Customer"},
        </p>
        <p style="font-size: 13px; color: #5C7A78; margin: 0 0 28px 0; line-height: 1.6;">
          Here's your invoice from <strong>${shopName || "your laundry"}</strong> for order #${orderId || "—"}. Please review the details below.
        </p>

        <!-- Info Grid -->
        <div style="display: flex; gap: 16px; margin-bottom: 28px;">
          <!-- Bill To -->
          <div style="flex: 1; background: #EEF7F6; border-radius: 12px; padding: 18px;">
            <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #5C7A78; font-weight: 700; margin-bottom: 10px;">
              BILL TO
            </div>
            <div style="font-size: 14px; font-weight: 600; color: #0F2C2E; margin-bottom: 4px;">${customerName || "Customer"}</div>
            ${customerPhone ? `<div style="font-size: 12px; color: #5C7A78;">${customerPhone}</div>` : ""}
          </div>
          <!-- Invoice Details -->
          <div style="flex: 1; background: #EEF7F6; border-radius: 12px; padding: 18px;">
            <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #5C7A78; font-weight: 700; margin-bottom: 10px;">
              INVOICE DETAILS
            </div>
            <div style="font-size: 12px; color: #0F2C2E; line-height: 1.8;">
              <div><span style="color: #5C7A78;">Issued:</span> <strong>${formatDate(issuedDate)}</strong></div>
              ${dueDate ? `<div><span style="color: #5C7A78;">Due:</span> <strong>${formatDate(dueDate)}</strong></div>` : ""}
              ${shopGstNumber ? `<div><span style="color: #5C7A78;">GSTIN:</span> <strong>${shopGstNumber}</strong></div>` : ""}
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #D8ECEA;">
          <thead>
            <tr style="background: #05282A;">
              <th style="padding: 12px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #FFFFFF; text-align: left; font-weight: 600;">
                Item / Service
              </th>
              <th style="padding: 12px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #FFFFFF; text-align: center; font-weight: 600;">
                Qty
              </th>
              <th style="padding: 12px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #FFFFFF; text-align: right; font-weight: 600;">
                Price
              </th>
              <th style="padding: 12px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #FFFFFF; text-align: right; font-weight: 600;">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRows(items)}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 28px;">
          <div style="width: 280px; background: #EEF7F6; border-radius: 12px; padding: 18px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #5C7A78; margin-bottom: 8px;">
              <span>Subtotal</span>
              <span>${formatINR(subtotal)}</span>
            </div>
            ${Number(taxRate) > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #5C7A78; margin-bottom: 8px;">
              <span>GST (${taxRate}%)</span>
              <span>${formatINR(taxAmount)}</span>
            </div>` : ""}
            ${Number(discount) > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #0B6E63; margin-bottom: 8px;">
              <span>Discount</span>
              <span>-${formatINR(discount)}</span>
            </div>` : ""}
            ${Number(deliveryCharge) > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #5C7A78; margin-bottom: 8px;">
              <span>Delivery Charge</span>
              <span>${formatINR(deliveryCharge)}</span>
            </div>` : ""}
            <div style="display: flex; justify-content: space-between; padding-top: 12px; margin-top: 8px; border-top: 2px solid #028090;">
              <span style="font-size: 18px; font-weight: 700; color: #0F2C2E;">Total</span>
              <span style="font-size: 18px; font-weight: 700; color: #0F2C2E;">${formatINR(total)}</span>
            </div>
            ${Number(amountPaid) > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #0B6E63; margin-top: 8px;">
              <span>Amount Paid</span>
              <span style="font-weight: 600;">${formatINR(amountPaid)}</span>
            </div>` : ""}
            ${Number(total) - Number(amountPaid || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #B3261E; margin-top: 4px;">
              <span>Balance Due</span>
              <span style="font-weight: 700;">${formatINR(Number(total) - Number(amountPaid || 0))}</span>
            </div>` : ""}
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${invoiceLink}"
             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #028090, #00A896); color: #FFFFFF; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 600; letter-spacing: 0.3px;">
            View &amp; Download Invoice →
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #D8ECEA;">
          <p style="font-size: 12px; color: #5C7A78; margin: 0;">
            Thank you for your business! · ${shopName || "Laundry Management System"}
            ${shopAddress ? `<br/>${shopAddress}` : ""}
            ${shopPhone ? `<br/>${shopPhone}` : ""}
          </p>
        </div>

      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: toEmail,
      subject: `Invoice ${invoiceNumber} — ${shopName || "Laundry"}`,
      html,
    });
    console.log(`[INVOICE EMAIL] Sent invoice ${invoiceNumber} to ${toEmail}`);
    return true;
  } catch (emailError) {
    console.error(`[INVOICE EMAIL] Failed to send invoice ${invoiceNumber}:`, emailError.message);
    return null;
  }
}
