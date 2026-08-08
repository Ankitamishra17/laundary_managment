import React from "react";
import ModalShell from "./ModalShell";
import StatusBadge from "./StatusBadge";

const colors = {
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
    <span className="text-sm" style={{ color: colors.textMuted }}>{label}</span>
    <span className="text-sm font-medium text-right" style={{ color: colors.textDark }}>{value}</span>
  </div>
);

/** Bonus: read-only "Service Details" view, per the (Optional) view spec. */
const ViewServiceModal = ({ service, onClose }) => {
  if (!service) return null;
  return (
    <ModalShell title="Service Details" onClose={onClose} maxWidth="max-w-md">
      <Row label="Service Name" value={service.name} />
      <Row label="Category" value={service.category} />
      <Row label="Pricing Type" value={service.pricingType} />
      <Row label="Price" value={`₹${service.price}`} />
      <Row label="Estimated Time" value={service.estimatedTime} />
      <Row label="Status" value={<StatusBadge status={service.status} />} />
      {service.description && (
        <div className="py-3" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
          <span className="text-sm block mb-1" style={{ color: colors.textMuted }}>Description</span>
          <p className="text-sm leading-relaxed" style={{ color: colors.textDark }}>{service.description}</p>
        </div>
      )}
      <Row label="Created Date" value={formatDate(service.createdAt)} />
      <Row label="Last Updated" value={formatDate(service.updatedAt)} />
    </ModalShell>
  );
};

export default ViewServiceModal;