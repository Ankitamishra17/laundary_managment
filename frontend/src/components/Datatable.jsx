import React from "react";
import { ArrowRight, Inbox } from "lucide-react";

/**
 * DataTable — one reusable table used across every role (Admin / Staff / Customer).
 * Each module passes its own `columns` + `data`; the table itself never
 * hardcodes what a "row" means, so it doesn't need to be rebuilt per module.
 *
 * Props:
 *  - columns: [{ key, label, render?(row) => JSX, width? }]
 *  - data: array of row objects (must contain a unique `id` field)
 *  - title: table heading
 *  - onRowAction?(row): called when a row's action button is clicked
 *  - actionLabel: text on the per-row action button (default "View")
 *  - onViewAll?(): shown as a footer link if provided
 *  - emptyMessage: shown when data is empty
 */
export default function DataTable({
  columns,
  data = [],
  title,
  onRowAction,
  actionLabel = "View",
  onViewAll,
  emptyMessage = "Nothing to show yet.",
}) {
  return (
    <div className="bg-card-tint/40 bg-white border border-card-border rounded-xl shadow-card p-5">
      {title && (
        <h2 className="font-display text-[15px] text-text-dark mb-4">{title}</h2>
      )}

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-text-muted">
          <Inbox size={28} className="mb-2 opacity-60" />
          <p className="text-xs">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted border-b border-card-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left font-medium py-2 pr-3"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </th>
                ))}
                {onRowAction && (
                  <th className="text-left font-medium py-2">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-card-tint last:border-0"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-2.5 pr-3 text-text-dark">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {onRowAction && (
                    <td className="py-2.5">
                      <button
                        onClick={() => onRowAction(row)}
                        className="text-teal-primary border border-teal-primary/25 rounded-md px-2.5 py-1 text-[11px] font-medium hover:bg-card-tint transition-colors"
                      >
                        {actionLabel}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {onViewAll && data.length > 0 && (
        <button
          onClick={onViewAll}
          className="mt-4 text-xs font-medium text-teal-primary flex items-center gap-1 hover:gap-2 transition-all"
        >
          View All <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}