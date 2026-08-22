import { Wallet, CreditCard, Clock3, RotateCcw, Receipt } from "lucide-react";

// =====================================================
// FORMAT CURRENCY
// =====================================================

const formatCurrency = (value) => {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

// =====================================================
// COMPONENT
// =====================================================

export default function SupplierPaymentSummary({
  payments = [],
  summary = {},
  loading = false,
}) {
  // ===================================================
  // SUMMARY VALUES
  // ===================================================

  const totalPaid = Number(summary.totalPaid) || 0;

  const pending = Number(summary.pending) || 0;

  const failed = Number(summary.failed) || 0;

  const refunded = Number(summary.refunded) || 0;

  const count = Number(summary.count) || payments.length || 0;

  // ===================================================
  // CARDS
  // ===================================================

  const cards = [
    {
      title: "Total Paid",
      value: totalPaid,
      icon: Wallet,
      description: "Total amount paid to suppliers",
      iconBg: "bg-[#02C39A]/10",
      iconColor: "text-[#00A896]",
    },

    {
      title: "Outstanding Due",
      value: pending,
      icon: Clock3,
      description: "Unpaid balance across supplier purchases",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },

    {
      title: "Failed",
      value: failed,
      icon: CreditCard,
      description: "Failed supplier payments",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },

    {
      title: "Refunded",
      value: refunded,
      icon: RotateCcw,
      description: "Refunded supplier payments",
      iconBg: "bg-[#028090]/10",
      iconColor: "text-[#028090]",
    },

    {
      title: "Transactions",
      value: count,
      icon: Receipt,
      description: "Supplier payment transactions",
      iconBg: "bg-[#0B3B3E]/10",
      iconColor: "text-[#0B3B3E]",
      isCount: true,
    },
  ];

  // ===================================================
  // LOADING SKELETON
  // ===================================================

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-[#D8ECEA] bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-gray-200" />

              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>

            <div className="mt-5 h-7 w-28 rounded bg-gray-200" />

            <div className="mt-3 h-3 w-36 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="font-body grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .font-heading { font-family: 'Libre Baskerville', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border border-[#D8ECEA] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            {/* TOP */}

            <div className="flex items-center justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon size={21} className={card.iconColor} />
              </div>

              <span className="text-xs font-medium text-[#51787C]">
                {card.title}
              </span>
            </div>

            {/* VALUE */}

            <div className="mt-5">
              <h3 className="font-heading text-xl font-bold text-[#0F2C2E] sm:text-2xl">
                {card.isCount ? card.value : formatCurrency(card.value)}
              </h3>
            </div>

            {/* DESCRIPTION */}

            <p className="mt-2 text-xs text-[#51787C]">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
