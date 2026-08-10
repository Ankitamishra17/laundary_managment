import React from "react";
import { ChevronDown } from "lucide-react";

const colors = {
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const categoryOptions = ["All Categories", "Washing", "Dry Clean", "Ironing", "Others"];
const statusOptions = ["All Status", "Active", "Inactive"];

const SelectField = ({ value, onChange, options }) => (
  <div className="relative flex-shrink-0">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none rounded-xl border pl-4 pr-9 py-2.5 text-sm w-full sm:w-40 cursor-pointer"
      style={{ backgroundColor: colors.cardTint, borderColor: colors.cardBorder, color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: colors.textMuted }} />
  </div>
);

const ServiceFilters = ({ category, onCategoryChange, status, onStatusChange }) => (
  <div className="flex gap-3">
    <SelectField value={category} onChange={onCategoryChange} options={categoryOptions} />
    <SelectField value={status} onChange={onStatusChange} options={statusOptions} />
  </div>
);

export default ServiceFilters;