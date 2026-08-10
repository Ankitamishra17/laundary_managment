import React from "react";
import { Search } from "lucide-react";

const colors = {
  primaryTeal: "#028090",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const ServiceSearch = ({ value, onChange, placeholder = "Search service..." }) => (
  <div
    className="ss-input flex items-center gap-2 rounded-xl px-3 py-2.5 border w-full sm:w-64 flex-shrink-0"
    style={{ backgroundColor: colors.cardTint, borderColor: colors.cardBorder }}
  >
    <style>{`
      .ss-input { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
      .ss-input:focus-within { border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.14); }
    `}</style>
    <Search size={15} style={{ color: colors.textMuted }} className="flex-shrink-0" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-transparent text-sm outline-none w-full"
      style={{ color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
    />
  </div>
);

export default ServiceSearch;