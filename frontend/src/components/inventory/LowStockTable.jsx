import { AlertTriangle, Package, Eye, XCircle } from "lucide-react";

// =====================================================
// COMPONENT
// =====================================================

export default function LowStockTable({ items = [], loading = false, onView }) {
  // ===================================================
  // DON'T SHOW SECTION IF THERE ARE NO LOW STOCK ITEMS
  // ===================================================

  if (!loading && (!items || items.length === 0)) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Package size={19} className="text-green-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-green-800">
              Stock levels are healthy
            </h3>

            <p className="mt-0.5 text-xs text-green-700">
              No inventory items are currently below their minimum stock level.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
        <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-amber-100" />

          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-amber-100" />
            <div className="h-3 w-48 animate-pulse rounded bg-amber-100" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <tbody>
              {[1, 2, 3].map((item) => (
                <tr
                  key={item}
                  className="animate-pulse border-b border-gray-100"
                >
                  {[1, 2, 3, 4, 5].map((cell) => (
                    <td key={cell} className="px-5 py-4">
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
  // UI
  // ===================================================

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      {/* HEADER */}

      <div className="flex flex-col gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-amber-900">
              Low Stock Alerts
            </h2>

            <p className="mt-0.5 text-xs text-amber-700">
              {items.length} item
              {items.length !== 1 ? "s" : ""} need attention.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
          <AlertTriangle size={13} />
          {items.length} Low Stock
        </span>
      </div>

      {/* TABLE */}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-[#D8ECEA] bg-[#FAFCFC]">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Item
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Category
              </th>

              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Current
              </th>

              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Minimum
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Alert
              </th>

              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[#526968]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const current = Number(item.currentStock) || 0;

              const minimum = Number(item.minStock) || 0;

              const isOutOfStock = current <= 0;

              const shortage = Math.max(minimum - current, 0);

              return (
                <tr
                  key={item.id}
                  className="border-b border-[#EDF3F2] transition hover:bg-[#FFFCF5]"
                >
                  {/* ITEM */}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isOutOfStock ? "bg-red-50" : "bg-amber-50"
                        }`}
                      >
                        {isOutOfStock ? (
                          <XCircle size={17} className="text-red-500" />
                        ) : (
                          <Package size={17} className="text-amber-600" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#0F2C2E]">
                          {item.name}
                        </p>

                        <p className="text-xs text-[#718382]">#{item.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* CATEGORY */}

                  <td className="px-5 py-4">
                    <span className="text-xs font-medium text-[#526968]">
                      {item.category || "-"}
                    </span>
                  </td>

                  {/* CURRENT */}

                  <td className="px-5 py-4 text-right">
                    <span
                      className={`text-sm font-bold ${
                        isOutOfStock ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {current}
                    </span>

                    <span className="ml-1 text-xs text-[#718382]">
                      {item.unit}
                    </span>
                  </td>

                  {/* MINIMUM */}

                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-semibold text-[#526968]">
                      {minimum}
                    </span>

                    <span className="ml-1 text-xs text-[#718382]">
                      {item.unit}
                    </span>
                  </td>

                  {/* ALERT */}

                  <td className="px-5 py-4">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                        <XCircle size={13} />
                        Out of Stock
                      </span>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                          <AlertTriangle size={13} />
                          Low Stock
                        </span>

                        <p className="mt-1 text-[11px] text-[#718382]">
                          Need {shortage} {item.unit} more
                        </p>
                      </div>
                    )}
                  </td>

                  {/* ACTION */}

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onView?.(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8ECEA] px-3 py-2 text-xs font-semibold text-[#028090] transition hover:bg-[#EEF7F6]"
                    >
                      <Eye size={14} />
                      View
                    </button>
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
