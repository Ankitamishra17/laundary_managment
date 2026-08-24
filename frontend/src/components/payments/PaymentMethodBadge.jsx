import React from "react";
import {
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  FileCheck,
} from "lucide-react";

const PaymentMethodBadge = ({ method }) => {
  const config = {
    Cash: {
      label: "Cash",
      icon: Banknote,
      className: "bg-green-50 text-green-700 border-green-200",
    },

    UPI: {
      label: "UPI",
      icon: Smartphone,
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },

    Card: {
      label: "Card",
      icon: CreditCard,
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },

    Bank_Transfer: {
      label: "Bank Transfer",
      icon: Building2,
      className: "bg-orange-50 text-orange-700 border-orange-200",
    },

    Cheque: {
      label: "Cheque",
      icon: FileCheck,
      className: "bg-gray-50 text-gray-700 border-gray-200",
    },
  };

  const current = config[method] || {
    label: method || "Unknown",
    icon: CreditCard,
    className: "bg-gray-50 text-gray-600 border-gray-200",
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

export default PaymentMethodBadge;
