import {
  Eye,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from "lucide-react";

// =====================================================
// STOCK STATUS
// =====================================================

const getStockStatus = (item) => {
  const current = Number(item.currentStock) || 0;

  const minimum = Number(item.minStock) || 0;

  if (current <= 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-50 text-red-700",
      dot: "bg-red-500",
      icon: XCircle,
    };
  }

  if (current <= minimum) {
    return {
      label: "Low Stock",
      className: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      icon: AlertTriangle,
    };
  }

  return {
    label: "Available",
    className: "bg-green-50 text-green-700",
    dot: "bg-green-500",
    icon: CheckCircle2,
  };
};

// =====================================================
// COMPONENT
// =====================================================

export default function InventoryTable({
  items = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
}) {
  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#D8ECEA] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-[#D8ECEA] bg-[#EEF7F6]">
                {[
                  "Item",
                  "Category",
                  "Unit",
                  "Current Stock",
                  "Min Stock",
                  "Stock Status",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4, 5].map((item) => (
                <tr
                  key={item}
                  className="animate-pulse border-b border-[#EDF3F2]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
                    <td key={cell} className="px-5 py-5">
                      <div className="h-4 w-20 rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ===================================================
  // EMPTY
  // ===================================================

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-[#D8ECEA] bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF7F6]">
          <Package size={26} className="text-[#028090]" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-[#0F2C2E]">
          No inventory items found
        </h3>

        <p className="mt-1 text-sm text-[#718382]">
          Add an inventory item to start managing stock.
        </p>
      </div>
    );
  }

  // ===================================================
  // TABLE
  // ===================================================

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8ECEA] bg-white shadow-sm">
      <div className="border-b border-[#D8ECEA] px-5 py-4">
        <h2 className="font-semibold text-[#0F2C2E]">Inventory Items</h2>

        <p className="mt-1 text-xs text-[#718382]">
          Current inventory stock and minimum stock levels.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          {/* HEADER */}

          <thead>
            <tr className="border-b border-[#D8ECEA] bg-[#EEF7F6]">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Item
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Category
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Unit
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Current Stock
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Min Stock
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Stock Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Status
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Actions
              </th>
            </tr>
          </thead>

          {/* BODY */}

          <tbody>
            {items.map((item) => {
              const stockStatus = getStockStatus(item);

              const StockIcon = stockStatus.icon;

              const currentStock = Number(item.currentStock) || 0;

              const minStock = Number(item.minStock) || 0;

              const isActive = item.status === "Active";

              return (
                <tr
                  key={item.id}
                  className="border-b border-[#EDF3F2] transition hover:bg-[#FAFCFC]"
                >
                  {/* ITEM */}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F7F5]">
                        <Package size={18} className="text-[#028090]" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F2C2E]">
                          {item.name}
                        </p>

                        <p className="text-xs text-[#718382]">ID: #{item.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* CATEGORY */}

                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-[#526968]">
                      {item.category || "-"}
                    </span>
                  </td>

                  {/* UNIT */}

                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-[#526968]">
                      {item.unit || "-"}
                    </span>
                  </td>

                  {/* CURRENT STOCK */}

                  <td className="px-5 py-4 text-right">
                    <span
                      className={`text-sm font-bold ${
                        currentStock <= 0
                          ? "text-red-600"
                          : currentStock <= minStock
                            ? "text-amber-600"
                            : "text-[#0F2C2E]"
                      }`}
                    >
                      {currentStock}
                    </span>

                    <span className="ml-1 text-xs text-[#718382]">
                      {item.unit}
                    </span>
                  </td>

                  {/* MIN STOCK */}

                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-medium text-[#526968]">
                      {minStock}
                    </span>

                    <span className="ml-1 text-xs text-[#718382]">
                      {item.unit}
                    </span>
                  </td>

                  {/* STOCK STATUS */}

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${stockStatus.className}`}
                    >
                      <StockIcon size={13} />

                      {stockStatus.label}
                    </span>
                  </td>

                  {/* ACTIVE STATUS */}

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />

                      {item.status || "Inactive"}
                    </span>
                  </td>

                  {/* ACTIONS */}

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onView?.(item)}
                        title="View"
                        className="rounded-lg p-2 text-[#028090] transition hover:bg-[#E6F7F5]"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit?.(item)}
                        title="Edit"
                        className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                      >
                        <Edit size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete?.(item)}
                        title="Deactivate"
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
