import { Package, AlertTriangle, ShoppingCart, ArrowDown } from "lucide-react";

export default function LowStockTable({ items = [], onRestock }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-[#D8ECEA] bg-white p-12 text-center shadow-sm font-['Inter']">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#02C39A]/10">
          <Package size={26} className="text-[#00A896]" />
        </div>

        <h3 className="mt-4 font-['Libre_Baskerville'] text-base text-[#05282A]">
          No Low Stock Items
        </h3>

        <p className="mt-1 text-sm text-[#5A7A79]">
          Great! All your inventory items have sufficient stock.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8ECEA] bg-white shadow-sm font-['Inter']">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D8ECEA] px-5 py-4">
        <div>
          <h2 className="font-['Libre_Baskerville'] text-[#05282A]">
            Low Stock Items
          </h2>

          <p className="mt-1 text-xs text-[#5A7A79]">
            Items that have reached or fallen below their minimum stock.
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
          <AlertTriangle size={18} className="text-amber-500" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] sm:min-w-[850px]">
          <thead>
            <tr className="border-b border-[#D8ECEA] bg-[#EEF7F6]">
              <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Item
              </th>

              <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Category
              </th>

              <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Current Stock
              </th>

              <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Minimum Stock
              </th>

              <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Stock Level
              </th>

              <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Alert
              </th>

              <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const current = Number(item.currentStock || 0);

              const minimum = Number(item.minStock || 0);

              const isOutOfStock = current <= 0;

              const percentage =
                minimum > 0 ? Math.min((current / minimum) * 100, 100) : 0;

              const severity = isOutOfStock
                ? "out"
                : current <= minimum * 0.5
                  ? "critical"
                  : "low";

              return (
                <tr
                  key={item.id}
                  className="border-b border-[#EEF7F6] transition hover:bg-[#EEF7F6]/60"
                >
                  {/* Item */}
                  <td className="px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isOutOfStock ? "bg-red-50" : "bg-amber-50"
                        }`}
                      >
                        <Package
                          size={17}
                          className={
                            isOutOfStock ? "text-red-500" : "text-amber-500"
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F2C2E] truncate">
                          {item.name}
                        </p>

                        <p className="mt-0.5 text-xs text-[#5A7A79]">
                          Unit: {item.unit || "-"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 sm:px-5 py-4">
                    <span className="whitespace-nowrap rounded-md bg-[#EEF7F6] px-2.5 py-1 text-xs font-medium text-[#0F2C2E]">
                      {item.category || "-"}
                    </span>
                  </td>

                  {/* Current Stock */}
                  <td className="px-4 sm:px-5 py-4 text-right whitespace-nowrap">
                    <span
                      className={`text-sm font-semibold ${
                        isOutOfStock ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {current}
                    </span>

                    <span className="ml-1 text-xs text-[#5A7A79]">
                      {item.unit || ""}
                    </span>
                  </td>

                  {/* Minimum Stock */}
                  <td className="px-4 sm:px-5 py-4 text-right whitespace-nowrap">
                    <span className="text-sm text-[#0F2C2E]">{minimum}</span>

                    <span className="ml-1 text-xs text-[#5A7A79]">
                      {item.unit || ""}
                    </span>
                  </td>

                  {/* Stock Level */}
                  <td className="min-w-[160px] sm:min-w-[180px] px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF7F6]">
                        <div
                          className={`h-full rounded-full ${
                            isOutOfStock
                              ? "bg-red-500"
                              : severity === "critical"
                                ? "bg-amber-500"
                                : "bg-yellow-400"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <span className="w-10 shrink-0 text-right text-xs text-[#5A7A79]">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </td>

                  {/* Alert */}
                  <td className="px-4 sm:px-5 py-4">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                        <AlertTriangle size={12} />
                        Out of Stock
                      </span>
                    ) : severity === "critical" ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                        <ArrowDown size={12} />
                        Critical
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-600">
                        <AlertTriangle size={12} />
                        Low Stock
                      </span>
                    )}
                  </td>

                  {/* Restock */}
                  <td className="px-4 sm:px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onRestock?.(item)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-br from-[#028090] to-[#00A896] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      <ShoppingCart size={14} />
                      Restock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-[#D8ECEA] px-4 sm:px-5 py-3">
        <p className="text-xs text-[#5A7A79]">
          Showing{" "}
          <span className="font-semibold text-[#0F2C2E]">{items.length}</span>{" "}
          low stock item{items.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
