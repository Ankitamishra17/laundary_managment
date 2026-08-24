import React from "react";
import {
  CheckCircle2,
  Clock3,
  XCircle,
  Ban,
  RotateCcw,
} from "lucide-react";

const PaymentStatusBadge = ({ status }) => {
  const config = {
    Paid: {
      label: "Paid",
      icon: CheckCircle2,
      className:
        "bg-green-50 text-green-700 border-green-200",
    },

    Pending: {
      label: "Pending",
      icon: Clock3,
      className:
        "bg-yellow-50 text-yellow-700 border-yellow-200",
    },

    Failed: {
      label: "Failed",
      icon: XCircle,
      className:
        "bg-red-50 text-red-700 border-red-200",
    },

    Cancelled: {
      label: "Cancelled",
      icon: Ban,
      className:
        "bg-gray-100 text-gray-600 border-gray-200",
    },

    Refunded: {
      label: "Refunded",
      icon: RotateCcw,
      className:
        "bg-purple-50 text-purple-700 border-purple-200",
    },
  };

  const current = config[status] || {
    label: status || "Unknown",
    icon: Clock3,
    className:
      "bg-gray-50 text-gray-600 border-gray-200",
  };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${current.className}`}
    >
      <Icon size={13} />
      {current.label}
    </span>
  );
};

export default PaymentStatusBadge;
