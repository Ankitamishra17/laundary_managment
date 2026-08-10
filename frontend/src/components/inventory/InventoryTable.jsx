import {
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function InventoryTable({
  items = [],
  onEdit,
  onDelete,
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
        <Package
          size={42}
          className="mx-auto mb-3 text-gray-300"
        />

        <h3 className="text-base font-semibold text-gray-600">
          No Inventory Items
        </h3>

        <p className="mt-1 text-sm text-gray-400">
          Add your first inventory item to start managing stock.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-[#05282A]">
          Inventory Items
        </h2>

        <p className="mt-1 text-xs text-gray-400">
          Manage your laundry supplies and current stock.
        </p>
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

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current Stock
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Minimum Stock
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const currentStock = Number(
                item.currentStock || 0
              );

              const minStock = Number(
                item.minStock || 0
              );

              const isOutOfStock = currentStock <= 0;

              const isLowStock =
                currentStock > 0 &&
                currentStock <= minStock;

              return (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 transition hover:bg-gray-50/70"
                >

                  {/* Item */}
                  <td className="px-5 py-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF8F6]">
                        <Package
                          size={18}
                          className="text-[#028090]"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {item.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          ID: #{item.id}
                        </p>
                      </div>

                    </div>

                  </td>

                  {/* Category */}
                  <td className="px-5 py-4">

                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {item.category}
                    </span>

                  </td>

                  {/* Current Stock */}
                  <td className="px-5 py-4">

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isOutOfStock
                            ? "text-red-600"
                            : isLowStock
                            ? "text-orange-500"
                            : "text-[#028090]"
                        }`}
                      >
                        {currentStock} {item.unit}
                      </p>

                      {isOutOfStock && (
                        <p className="mt-0.5 text-[11px] text-red-400">
                          Out of stock
                        </p>
                      )}

                      {isLowStock && (
                        <p className="mt-0.5 text-[11px] text-orange-400">
                          Low stock
                        </p>
                      )}
                    </div>

                  </td>

                  {/* Minimum Stock */}
                  <td className="px-5 py-4">

                    <span className="text-sm text-gray-600">
                      {minStock} {item.unit}
                    </span>

                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">

                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                        <AlertTriangle size={13} />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                        <AlertTriangle size={13} />
                        Low Stock
                      </span>
                    ) : item.status === "Active" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                        <CheckCircle size={13} />
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                        {item.status || "Inactive"}
                      </span>
                    )}

                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">

                    <div className="flex justify-end gap-2">

                      <button
                        type="button"
                        onClick={() => onEdit?.(item)}
                        title="Edit item"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#EAF8F6] hover:text-[#028090]"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete?.(item)}
                        title="Delete item"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">

        <p className="text-xs text-gray-400">
          Showing{" "}
          <span className="font-medium text-gray-600">
            {items.length}
          </span>{" "}
          inventory items
        </p>

      </div>
    </div>
  );
}