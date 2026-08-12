import {
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function InventoryTable({ items = [], onEdit, onDelete }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-[#D8ECEA] bg-white p-12 text-center shadow-sm">
        <Package size={42} className="mx-auto mb-3 text-[#D8ECEA]" />

        <h3 className="font-['Libre_Baskerville'] text-base text-[#05282A]">
          No Inventory Items
        </h3>

        <p className="mt-1 text-sm text-[#5A7A79]">
          Add your first inventory item to start managing stock.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8ECEA] bg-white shadow-sm font-['Inter']">
      {/* Header */}
      <div className="border-b border-[#D8ECEA] px-5 py-4">
        <h2 className="font-['Libre_Baskerville'] text-[#05282A]">
          Inventory Items
        </h2>

        <p className="mt-1 text-xs text-[#5A7A79]">
          Manage your laundry supplies and current stock.
        </p>
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

              <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Current Stock
              </th>

              <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Minimum Stock
              </th>

              <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Status
              </th>

              <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#5A7A79]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const currentStock = Number(item.currentStock || 0);
              const minStock = Number(item.minStock || 0);

              const isOutOfStock = currentStock <= 0;

              const isLowStock = currentStock > 0 && currentStock <= minStock;

              return (
                <tr
                  key={item.id}
                  className="border-b border-[#EEF7F6] transition hover:bg-[#EEF7F6]/60"
                >
                  {/* Item */}
                  <td className="px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#028090]/10">
                        <Package size={18} className="text-[#028090]" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F2C2E] truncate">
                          {item.name}
                        </p>

                        <p className="text-xs text-[#5A7A79]">ID: #{item.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 sm:px-5 py-4">
                    <span className="whitespace-nowrap rounded-md bg-[#EEF7F6] px-2.5 py-1 text-xs font-medium text-[#0F2C2E]">
                      {item.category}
                    </span>
                  </td>

                  {/* Current Stock */}
                  <td className="px-4 sm:px-5 py-4">
                    <div>
                      <p
                        className={`whitespace-nowrap text-sm font-semibold ${
                          isOutOfStock
                            ? "text-red-600"
                            : isLowStock
                              ? "text-amber-600"
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
                        <p className="mt-0.5 text-[11px] text-amber-500">
                          Low stock
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Minimum Stock */}
                  <td className="px-4 sm:px-5 py-4">
                    <span className="whitespace-nowrap text-sm text-[#0F2C2E]">
                      {minStock} {item.unit}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 sm:px-5 py-4">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                        <AlertTriangle size={13} />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                        <AlertTriangle size={13} />
                        Low Stock
                      </span>
                    ) : item.status === "Active" ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#02C39A]/10 px-2.5 py-1 text-xs font-medium text-[#00A896]">
                        <CheckCircle size={13} />
                        Active
                      </span>
                    ) : (
                      <span className="whitespace-nowrap rounded-full bg-[#EEF7F6] px-2.5 py-1 text-xs font-medium text-[#5A7A79]">
                        {item.status || "Inactive"}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 sm:px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit?.(item)}
                        title="Edit item"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A7A79] transition hover:bg-[#028090]/10 hover:text-[#028090]"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete?.(item)}
                        title="Delete item"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A7A79] transition hover:bg-red-50 hover:text-red-600"
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
      <div className="flex items-center justify-between border-t border-[#D8ECEA] px-4 sm:px-5 py-3">
        <p className="text-xs text-[#5A7A79]">
          Showing{" "}
          <span className="font-medium text-[#0F2C2E]">{items.length}</span>{" "}
          inventory items
        </p>
      </div>
    </div>
  );
}
