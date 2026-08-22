import React from "react";
import { Check, X } from "lucide-react";
import { ORDER_JOURNEY, journeyIndex } from "../../utils/orderStatus";

const colors = {
  mint: "#02C39A",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const journeyLabels = {
  pending: "Placed",
  picked_up: "Picked up",
  processing: "Processing",
  ready_for_delivery: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

export default function OrderTimeline({ status }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "#FBE9E8" }}>
        <X size={15} color="#E0645C" />
        <span className="text-sm font-medium" style={{ color: "#E0645C" }}>This order was cancelled</span>
      </div>
    );
  }

  const current = journeyIndex(status);

  return (
    <div className="flex items-center">
      {ORDER_JOURNEY.map((step, i) => {
        const done = i <= current;
        const isLast = i === ORDER_JOURNEY.length - 1;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: done ? colors.mint : colors.cardTint,
                  color: done ? "#FFFFFF" : colors.textMuted,
                  boxShadow: done ? "0 0 0 4px rgba(2,195,154,0.15)" : "none",
                }}
              >
                {done ? <Check size={13} /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
              </div>
              <span
                className="text-[10px] whitespace-nowrap"
                style={{ color: done ? colors.textDark : colors.textMuted, fontWeight: done ? 600 : 400 }}
              >
                {journeyLabels[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className="flex-1 h-0.5 mx-1.5 mb-5"
                style={{ backgroundColor: i < current ? colors.mint : colors.cardBorder }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
