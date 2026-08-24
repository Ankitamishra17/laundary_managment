import {
  Eye,
  Pencil,
  Trash2,
  Package,
  CalendarDays,
  IndianRupee,
} from "lucide-react";

export default function PurchaseTable({
  purchases = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
}) {
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTotalAmount = (purchase) => {
    if (purchase.totalAmount != null) {
      return Number(purchase.totalAmount);
    }

    if (purchase.total != null) {
      return Number(purchase.total);
    }

    if (purchase.items?.length) {
      return purchase.items.reduce((total, item) => {
        return total + Number(item.amount || 0);
      }, 0);
    }

    return 0;
  };

  const getDueAmount = (purchase) => {
    // Prefer the backend's own dueAmount when present — it's the source of truth.
    if (purchase.dueAmount != null) {
      return Number(purchase.dueAmount);
    }

    const total = getTotalAmount(purchase);
    const paid = Number(purchase.paidAmount || 0);

    return Math.max(0, total - paid);
  };

  const getPaymentStatus = (purchase) => {
    const total = getTotalAmount(purchase);
    const paid = Number(purchase.paidAmount || 0);

    if (paid <= 0) {
      return {
        label: "Unpaid",
        className: "bg-red-50 text-red-600",
      };
    }

    if (paid >= total && total > 0) {
      return {
        label: "Paid",
        className: "bg-green-50 text-green-600",
      };
    }

    return {
      label: "Partial",
      className: "bg-yellow-50 text-yellow-600",
    };
  };

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#D8ECEA] bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D8ECEA] border-t-[#028090]" />
      </div>
    );
  }

  // Empty state
  if (!purchases.length) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[#D8ECEA] bg-white px-5 text-center">
        <div className="mb-3 rounded-full bg-[#EEF7F6] p-4 text-[#028090]">
          <Package size={28} />
        </div>

        <h3 className="text-base font-semibold text-[#0F2C2E]">
          No purchases found
        </h3>

        <p className="mt-1 text-sm text-[#6B7F7E]">
          Purchase records will appear here after you add a purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8ECEA] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D8ECEA] px-5 py-4">
        <div>
          <h3 className="font-semibold text-[#0F2C2E]">Purchase History</h3>

          <p className="mt-1 text-xs text-[#6B7F7E]">
            {purchases.length} purchase
            {purchases.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="bg-[#EEF7F6]">
            <tr className="text-left text-[#0F2C2E]">
              <th className="px-5 py-3 font-medium">Purchase No.</th>

              <th className="px-5 py-3 font-medium">Date</th>

              <th className="px-5 py-3 font-medium">Supplier</th>

              <th className="px-5 py-3 font-medium">Items</th>

              <th className="px-5 py-3 font-medium">Total</th>

              <th className="px-5 py-3 font-medium">Due</th>

              <th className="px-5 py-3 font-medium">Payment</th>

              <th className="px-5 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7F0EF]">
            {purchases.map((purchase) => {
              const total = getTotalAmount(purchase);
              const due = getDueAmount(purchase);
              const payment = getPaymentStatus(purchase);

              return (
                <tr key={purchase.id} className="transition hover:bg-[#FAFCFC]">
                  {/* Purchase Number */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#0F2C2E]">
                      {purchase.purchaseNumber ||
                        purchase.invoiceNumber ||
                        `PUR-${purchase.id}`}
                    </div>

                    <div className="mt-1 text-xs text-[#8A9A99]">
                      ID: #{purchase.id}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-[#526968]">
                      <CalendarDays size={15} className="text-[#028090]" />

                      {formatDate(purchase.purchaseDate || purchase.createdAt)}
                    </div>
                  </td>

                  {/* Supplier */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#0F2C2E]">
                      {purchase.supplier?.name || purchase.supplierName || "-"}
                    </div>

                    {purchase.supplier?.phone && (
                      <div className="mt-1 text-xs text-[#8A9A99]">
                        {purchase.supplier.phone}
                      </div>
                    )}
                  </td>

                  {/* Items */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-[#028090]" />

                      <span className="font-medium text-[#0F2C2E]">
                        {purchase.items?.length || 0}
                      </span>

                      <span className="text-[#8A9A99]">
                        item
                        {purchase.items?.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 font-semibold text-[#028090]">
                      <IndianRupee size={14} />

                      {total.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </td>

                  {/* Due */}
                  <td className="px-5 py-4">
                    <div
                      className={`flex items-center gap-1 font-semibold ${
                        due > 0 ? "text-[#E0645C]" : "text-[#02C39A]"
                      }`}
                    >
                      <IndianRupee size={14} />

                      {due.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </td>

                  {/* Payment */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${payment.className}`}
                    >
                      {payment.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onView?.(purchase)}
                        title="View Purchase"
                        className="rounded-lg p-2 text-[#028090] transition hover:bg-[#EEF7F6]"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit?.(purchase)}
                        title="Edit Purchase"
                        className="rounded-lg p-2 text-[#526968] transition hover:bg-gray-100"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete?.(purchase)}
                        title="Delete Purchase"
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
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
}
