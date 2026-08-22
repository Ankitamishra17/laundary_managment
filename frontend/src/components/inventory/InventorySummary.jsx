import { Package, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

const formatNumber = (value) => {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
};

export default function InventorySummary({
  items = [],
  summary = {},
  loading = false,
}) {
  const totalItems = Number(summary.totalItems) || items.length;

  const lowStock =
    Number(summary.lowStock) ||
    items.filter(
      (item) => Number(item.currentStock || 0) <= Number(item.minStock || 0),
    ).length;

  const outOfStock =
    Number(summary.outOfStock) ||
    items.filter((item) => Number(item.currentStock || 0) <= 0).length;

  const activeItems =
    Number(summary.activeItems) ||
    items.filter((item) => item.status === "Active").length;

  const cards = [
    {
      title: "Total Items",
      value: totalItems,
      description: "Inventory items",
      icon: Package,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      title: "Active Items",
      value: activeItems,
      description: "Currently active",
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Low Stock",
      value: lowStock,
      description: "Below minimum level",
      icon: AlertTriangle,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Out of Stock",
      value: outOfStock,
      description: "Items with zero stock",
      icon: XCircle,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-[#D8ECEA] bg-white p-5"
          >
            <div className="h-11 w-11 rounded-xl bg-gray-200" />

            <div className="mt-5 h-7 w-20 rounded bg-gray-200" />

            <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border border-[#D8ECEA] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon size={21} className={card.iconColor} />
              </div>

              <span className="text-xs font-medium text-[#718382]">
                {card.title}
              </span>
            </div>

            <h3 className="mt-5 text-2xl font-bold text-[#0F2C2E]">
              {formatNumber(card.value)}
            </h3>

            <p className="mt-1 text-xs text-[#718382]">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
