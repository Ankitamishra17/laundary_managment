import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";

const colors = {
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  primaryTeal: "#028090",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  danger: "#E0645C",
};

const IconBtn = ({ icon: Icon, color, label, onClick }) => (
  <button
    onClick={onClick}
    className="st-icon-btn w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
    style={{ color }}
    aria-label={label}
    title={label}
  >
    <Icon size={15} />
  </button>
);

/** Desktop table view — hidden below sm, use ServiceCard for mobile. */
const ServiceTable = ({
  services,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => (
  <div
    className="hidden sm:block overflow-x-auto rounded-2xl border"
    style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
  >
    <style>{`
      .st-row:hover { background-color: ${colors.cardTint}; }
      .st-icon-btn:hover { background-color: ${colors.cardTint}; }
    `}</style>
    <table className="w-full text-sm min-w-[760px]">
      <thead>
        <tr
          style={{
            color: colors.textMuted,
            borderBottom: `1px solid ${colors.cardBorder}`,
          }}
          className="text-left"
        >
          <th className="font-medium px-5 py-3">Service Name</th>
          <th className="font-medium px-5 py-3">Category</th>
          <th className="font-medium px-5 py-3">Price</th>
          <th className="font-medium px-5 py-3">Type</th>
          <th className="font-medium px-5 py-3">Time</th>
          <th className="font-medium px-5 py-3">Status</th>
          <th className="font-medium px-5 py-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {services.map((s) => (
          <tr
            key={s._id || s.id}
            className="st-row transition-colors"
            style={{ borderTop: `1px solid ${colors.cardBorder}` }}
          >
            <td
              className="px-5 py-3.5 font-medium"
              style={{ color: colors.textDark }}
            >
              {s.serviceName}
            </td>
            <td className="px-5 py-3.5" style={{ color: colors.textMuted }}>
              {s.category}
            </td>
            <td className="px-5 py-3.5" style={{ color: colors.textDark }}>
              ₹{s.price}
            </td>
            <td className="px-5 py-3.5" style={{ color: colors.textMuted }}>
              {s.pricingType}
            </td>
            <td className="px-5 py-3.5" style={{ color: colors.textMuted }}>
              {s.estimatedTime}
            </td>
            <td className="px-5 py-3.5">
              <button
                onClick={() => onToggleStatus(s)}
                aria-label="Toggle status"
              >
                <StatusBadge status={s.status} clickable />
              </button>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex items-center justify-end gap-1">
                <IconBtn
                  icon={Eye}
                  color={colors.textMuted}
                  label="View"
                  onClick={() => onView(s)}
                />
                <IconBtn
                  icon={Pencil}
                  color={colors.primaryTeal}
                  label="Edit"
                  onClick={() => onEdit(s)}
                />
                <IconBtn
                  icon={Trash2}
                  color={colors.danger}
                  label="Delete"
                  onClick={() => onDelete(s)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ServiceTable;
