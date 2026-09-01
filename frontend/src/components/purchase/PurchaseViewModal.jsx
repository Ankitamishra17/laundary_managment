import {
  X,
  Package,
  Building2,
  CalendarDays,
  FileText,
  CreditCard,
} from "lucide-react";

export default function PurchaseViewModal({
  isOpen,
  onClose,
  purchase = null,
}) {
  if (!isOpen || !purchase) return null;

  // =====================================================
  // HELPERS
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const items = purchase.items || [];

  const totalAmount =
    purchase.totalAmount != null
      ? Number(purchase.totalAmount)
      : items.reduce((total, item) => total + Number(item.amount || 0), 0);

  const paidAmount = Number(purchase.paidAmount || 0);

  const dueAmount = Math.max(totalAmount - paidAmount, 0);

  const getPaymentStatus = () => {
    if (paidAmount <= 0) {
      return {
        label: "Unpaid",
        className: "bg-rose-50 text-rose-600 border-rose-100",
      };
    }

    if (paidAmount >= totalAmount) {
      return {
        label: "Paid",
        className: "bg-[#02C39A]/10 text-[#02C39A] border-[#02C39A]/30",
      };
    }

    return {
      label: "Partial",
      className: "bg-amber-50 text-amber-600 border-amber-100",
    };
  };

  const paymentStatus = getPaymentStatus();

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-[#05282A]/60 sm:items-center sm:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex w-full max-h-[94vh] flex-col overflow-hidden rounded-t-2xl bg-white font-['Inter'] shadow-2xl sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="relative shrink-0 overflow-hidden bg-[#05282A] px-5 py-5 sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#0B3B3E] opacity-60" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 text-white">
                <Package size={21} />
              </div>

              <div>
                <h2 className="font-['Libre_Baskerville'] text-lg text-white sm:text-xl">
                  Purchase Details
                </h2>

                <p className="mt-1 text-xs text-white/60">
                  {purchase.purchaseNumber || `PUR-${purchase.id}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* =================================================
              PURCHASE INFORMATION
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* SUPPLIER */}

            <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-[#51787C]">
                <Building2 size={15} className="text-[#028090]" />
                Supplier
              </div>

              <p className="font-semibold text-[#0F2C2E]">
                {purchase.supplier?.name || purchase.supplierName || "-"}
              </p>

              {purchase.supplier?.phone && (
                <p className="mt-1 text-xs text-[#51787C]">
                  {purchase.supplier.phone}
                </p>
              )}
            </div>

            {/* DATE */}

            <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-[#51787C]">
                <CalendarDays size={15} className="text-[#028090]" />
                Purchase Date
              </div>

              <p className="font-semibold text-[#0F2C2E]">
                {formatDate(purchase.purchaseDate || purchase.createdAt)}
              </p>
            </div>

            {/* INVOICE */}

            <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-[#51787C]">
                <FileText size={15} className="text-[#028090]" />
                Invoice / Purchase No.
              </div>

              <p className="font-semibold text-[#0F2C2E]">
                {purchase.purchaseNumber || `PUR-${purchase.id}`}
              </p>
            </div>
          </div>

          {/* =================================================
              ITEMS
          ================================================= */}

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#D8ECEA]">
            <div className="flex items-center gap-2 border-b border-[#D8ECEA] bg-[#EEF7F6] px-5 py-4">
              <Package size={18} className="text-[#028090]" />

              <div>
                <h3 className="font-semibold text-[#0F2C2E]">
                  Purchased Items
                </h3>

                <p className="text-xs text-[#51787C]">
                  {items.length} item
                  {items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead className="border-b border-[#D8ECEA] bg-white">
                  <tr className="text-left text-xs text-[#51787C]">
                    <th className="px-5 py-3">Item</th>

                    <th className="px-5 py-3">Unit</th>

                    <th className="px-5 py-3 text-right">Quantity</th>

                    <th className="px-5 py-3 text-right">Rate</th>

                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D8ECEA]">
                  {items.length > 0 ? (
                    items.map((item, index) => {
                      const quantity = Number(item.quantity || 0);

                      const rate = Number(item.rate || 0);

                      const amount = Number(item.amount ?? quantity * rate);

                      return (
                        <tr
                          key={item.id || `${item.inventoryItemId}-${index}`}
                          className="hover:bg-[#EEF7F6]"
                        >
                          {/* ITEM */}

                          <td className="px-5 py-4">
                            <div className="font-medium text-[#0F2C2E]">
                              {item.inventoryItem?.name || item.itemName || "-"}
                            </div>
                          </td>

                          {/* UNIT */}

                          <td className="px-5 py-4 text-[#51787C]">
                            {item.inventoryItem?.unit || "-"}
                          </td>

                          {/* QUANTITY */}

                          <td className="px-5 py-4 text-right font-medium text-[#0F2C2E]">
                            {quantity}
                          </td>

                          {/* RATE */}

                          <td className="px-5 py-4 text-right text-[#51787C]">
                            ₹
                            {rate.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4 text-right font-semibold text-[#028090]">
                            ₹
                            {amount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-5 py-10 text-center text-sm text-[#51787C]"
                      >
                        No purchase items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================
              PAYMENT SUMMARY
          ================================================= */}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* PAYMENT STATUS */}

            <div className="rounded-2xl border border-[#D8ECEA] p-5">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-[#028090]" />

                <h3 className="font-semibold text-[#0F2C2E]">Payment Status</h3>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[#51787C]">Status</span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${paymentStatus.className}`}
                >
                  {paymentStatus.label}
                </span>
              </div>
            </div>

            {/* AMOUNTS */}

            <div className="rounded-2xl border border-[#D8ECEA] bg-[#EEF7F6] p-5">
              <div className="space-y-3">
                {/* TOTAL */}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#51787C]">Total Amount</span>

                  <span className="font-semibold text-[#0F2C2E]">
                    ₹
                    {totalAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* PAID */}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#51787C]">Paid Amount</span>

                  <span className="font-semibold text-[#02C39A]">
                    ₹
                    {paidAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="border-t border-[#D8ECEA] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#0F2C2E]">
                      Outstanding
                    </span>

                    <span className="text-lg font-bold text-[#028090]">
                      ₹
                      {dueAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              NOTES
          ================================================= */}

          {purchase.notes && (
            <div className="mt-6 rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#51787C]">
                Notes
              </p>

              <p className="text-sm leading-6 text-[#0F2C2E]">
                {purchase.notes}
              </p>
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex shrink-0 justify-end border-t border-[#D8ECEA] bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#05282A] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
