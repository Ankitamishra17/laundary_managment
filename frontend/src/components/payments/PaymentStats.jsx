import React from "react";
import {
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock3,
  RotateCcw,
  CalendarDays,
  CalendarRange,
  XCircle,
} from "lucide-react";

const PaymentStats = ({ stats = {}, loading = false }) => {
  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const cards = [
    {
      title: "Total Payments",
      value: stats.totalPayments || 0,
      subtitle: "Total transactions",
      icon: CreditCard,
      iconClass: "bg-indigo-50 text-indigo-600",
      valueType: "number",
    },

    {
      title: "Total Received",
      value: formatAmount(stats.totalReceived),
      subtitle: "Customer payments",
      icon: ArrowDownToLine,
      iconClass: "bg-green-50 text-green-600",
    },

    {
      title: "Total Paid",
      value: formatAmount(stats.totalPaid),
      subtitle: "Supplier & salary",
      icon: ArrowUpFromLine,
      iconClass: "bg-orange-50 text-orange-600",
    },

    {
      title: "Pending",
      value: formatAmount(stats.pendingAmount),
      subtitle: `${stats.pendingCount || 0} pending payments`,
      icon: Clock3,
      iconClass: "bg-yellow-50 text-yellow-600",
    },

    {
      title: "Refunded",
      value: formatAmount(stats.refundedAmount),
      subtitle: `${stats.refundedCount || 0} refunds`,
      icon: RotateCcw,
      iconClass: "bg-purple-50 text-purple-600",
    },

    {
      title: "Today's Payments",
      value: formatAmount(stats.todayAmount),
      subtitle: `${stats.todayCount || 0} transactions today`,
      icon: CalendarDays,
      iconClass: "bg-blue-50 text-blue-600",
    },

    {
      title: "This Month",
      value: formatAmount(stats.monthlyAmount),
      subtitle: `${stats.monthlyCount || 0} transactions`,
      icon: CalendarRange,
      iconClass: "bg-cyan-50 text-cyan-600",
    },

    {
      title: "Failed Payments",
      value: formatAmount(stats.failedAmount),
      subtitle: `${stats.failedCount || 0} failed transactions`,
      icon: XCircle,
      iconClass: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            {loading ? (
              <StatsSkeleton />
            ) : (
              <>
                {/* Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                      {card.title}
                    </p>

                    <h3 className="mt-2 truncate text-xl font-bold text-gray-900 sm:text-2xl">
                      {card.value}
                    </h3>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
                  >
                    <Icon size={21} />
                  </div>
                </div>

                {/* Bottom */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="truncate text-xs text-gray-500">
                    {card.subtitle}
                  </p>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =====================================================
// SKELETON
// =====================================================

const StatsSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <div className="h-4 w-24 rounded bg-gray-200" />

          <div className="mt-3 h-7 w-32 rounded bg-gray-200" />
        </div>

        <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200" />
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="h-3 w-28 rounded bg-gray-200" />
      </div>
    </div>
  );
};

export default PaymentStats;
