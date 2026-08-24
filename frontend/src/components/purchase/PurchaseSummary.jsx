import {
  ShoppingCart,
  IndianRupee,
  CreditCard,
  WalletCards,
} from "lucide-react";

export default function PurchaseSummary({
  purchases = [],
  loading = false,
}) {
  // =====================================================
  // CALCULATIONS
  // =====================================================

  const totalPurchases = purchases.length;

  const getPurchaseTotal = (purchase) => {
    if (purchase.totalAmount != null) {
      return Number(purchase.totalAmount);
    }

    if (purchase.items?.length) {
      return purchase.items.reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
    }

    return 0;
  };

  const totalAmount = purchases.reduce(
    (total, purchase) =>
      total + getPurchaseTotal(purchase),
    0
  );

  const totalPaid = purchases.reduce(
    (total, purchase) =>
      total + Number(purchase.paidAmount || 0),
    0
  );

  const totalOutstanding = Math.max(
    totalAmount - totalPaid,
    0
  );

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (amount) => {
    return `₹${Number(amount).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =====================================================
  // CARD DATA
  // =====================================================

  const cards = [
    {
      title: "Total Purchases",
      value: totalPurchases,
      subtitle: "Purchase records",
      icon: ShoppingCart,
      iconBg: "bg-[#E8F7F5]",
      iconColor: "text-[#028090]",
    },

    {
      title: "Purchase Amount",
      value: formatMoney(totalAmount),
      subtitle: "Total purchase value",
      icon: IndianRupee,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },

    {
      title: "Total Paid",
      value: formatMoney(totalPaid),
      subtitle: "Amount paid to suppliers",
      icon: CreditCard,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },

    {
      title: "Outstanding",
      value: formatMoney(totalOutstanding),
      subtitle: "Amount payable",
      icon: WalletCards,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-[125px] animate-pulse rounded-2xl border border-[#D8ECEA] bg-white"
          />
        ))}
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border border-[#D8ECEA] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">

              {/* TEXT */}

              <div className="min-w-0">

                <p className="text-xs font-medium text-[#6B7F7E]">
                  {card.title}
                </p>

                <p className="mt-2 truncate text-xl font-bold text-[#0F2C2E] sm:text-2xl">
                  {card.value}
                </p>

                <p className="mt-1 text-xs text-[#8A9A99]">
                  {card.subtitle}
                </p>

              </div>

              {/* ICON */}

              <div
                className={`shrink-0 rounded-xl p-3 ${card.iconBg} ${card.iconColor}`}
              >
                <Icon size={21} />
              </div>

            </div>
          </div>
        );
      })}

    </div>
  );
}