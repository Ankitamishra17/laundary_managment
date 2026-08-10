import { Package, AlertTriangle, ShoppingCart, ArrowDown } from "lucide-react";

export default function LowStockTable({ items = [], onRestock }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <Package size={26} className="text-green-500" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-gray-700">
          No Low Stock Items
        </h3>

        <p className="mt-1 text-sm text-gray-400">
          Great! All your inventory items have sufficient stock.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-[#05282A]">Low Stock Items</h2>

          <p className="mt-1 text-xs text-gray-400">
            Items that have reached or fallen below their minimum stock.
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
          <AlertTriangle size={18} className="text-orange-500" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Item
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Category
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current Stock
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Minimum Stock
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Stock Level
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Alert
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                  className="border-b border-gray-50 transition hover:bg-gray-50/70"
                >
                  {/* Item */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isOutOfStock ? "bg-red-50" : "bg-orange-50"
                        }`}
                      >
                        <Package
                          size={17}
                          className={
                            isOutOfStock ? "text-red-500" : "text-orange-500"
                          }
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {item.name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          Unit: {item.unit || "-"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {item.category || "-"}
                    </span>
                  </td>

                  {/* Current Stock */}
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        isOutOfStock ? "text-red-600" : "text-orange-500"
                      }`}
                    >
                      {current}
                    </span>

                    <span className="ml-1 text-xs text-gray-400">
                      {item.unit || ""}
                    </span>
                  </td>

                  {/* Minimum Stock */}
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm text-gray-600">{minimum}</span>

                    <span className="ml-1 text-xs text-gray-400">
                      {item.unit || ""}
                    </span>
                  </td>

                  {/* Stock Level */}
                  <td className="min-w-[180px] px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            isOutOfStock
                              ? "bg-red-500"
                              : severity === "critical"
                                ? "bg-orange-500"
                                : "bg-yellow-400"
                          }`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <span className="w-10 text-right text-xs text-gray-400">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </td>

                  {/* Alert */}
                  <td className="px-5 py-4">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                        <AlertTriangle size={12} />
                        Out of Stock
                      </span>
                    ) : severity === "critical" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                        <ArrowDown size={12} />
                        Critical
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-600">
                        <AlertTriangle size={12} />
                        Low Stock
                      </span>
                    )}
                  </td>

                  {/* Restock */}
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onRestock?.(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#028090] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#026D7A]"
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
      <div className="border-t border-gray-100 px-5 py-3">
        <p className="text-xs text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-600">{items.length}</span>{" "}
          low stock item{items.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
