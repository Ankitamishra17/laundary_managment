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

/** Mobile card view — shown below sm instead of ServiceTable. */
const ServiceCard = ({ service, onView, onEdit, onDelete, onToggleStatus }) => (
  <div
    className="rounded-2xl border p-4"
    style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div
          className="font-medium truncate"
          style={{ color: colors.textDark }}
        >
          {service.serviceName}
        </div>
        <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
          {service.category}
        </div>
      </div>
      <button
        onClick={() => onToggleStatus(service)}
        className="flex-shrink-0"
        aria-label="Toggle status"
      >
        <StatusBadge status={service.status} clickable />
      </button>
    </div>

    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
      <div>
        <div style={{ color: colors.textMuted }}>Price</div>
        <div className="font-medium mt-0.5" style={{ color: colors.textDark }}>
          ₹{service.price}
        </div>
      </div>
      <div>
        <div style={{ color: colors.textMuted }}>Type</div>
        <div className="font-medium mt-0.5" style={{ color: colors.textDark }}>
          {service.pricingType}
        </div>
      </div>
      <div>
        <div style={{ color: colors.textMuted }}>Time</div>
        <div className="font-medium mt-0.5" style={{ color: colors.textDark }}>
          {service.estimatedTime}
        </div>
      </div>
    </div>

    <div
      className="flex items-center gap-2 mt-4 pt-3"
      style={{ borderTop: `1px solid ${colors.cardBorder}` }}
    >
      <button
        onClick={() => onView(service)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
        style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
      >
        <Eye size={13} /> View
      </button>
      <button
        onClick={() => onEdit(service)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
        style={{
          backgroundColor: `${colors.primaryTeal}1A`,
          color: colors.primaryTeal,
        }}
      >
        <Pencil size={13} /> Edit
      </button>
      <button
        onClick={() => onDelete(service)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
        style={{ backgroundColor: `${colors.danger}1A`, color: colors.danger }}
      >
        <Trash2 size={13} /> Delete
      </button>
    </div>
  </div>
);

export default ServiceCard;
