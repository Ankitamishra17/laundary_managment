import React from "react";

const colors = {
  primaryTeal: "#028090",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const categoryOptions = [
  "Washing",
  "Ironing",
  "Dry Cleaning",
  "Premium",
  "Household",
];
const pricingTypeOptions = ["Per Kg", "Per Item", "Per Set"];
const timeOptions = ["Same Day", "1 Day", "2 Days", "3 Days", "5 Days"];

const inputClass = "sf-input w-full rounded-xl border px-4 py-2.5 text-sm";
const labelClass = "block text-xs font-medium mb-1.5";

/**
 * Shared field set used by both AddServiceModal and EditServiceModal
 * so the form only has to be built (and styled) once.
 */
const ServiceFormFields = ({ formData, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <style>{`
      .sf-input { transition: border-color 0.15s ease, box-shadow 0.15s ease; border-color: ${colors.cardBorder}; }
      .sf-input:focus { outline: none; border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.14); }
    `}</style>

    <div className="sm:col-span-2">
      <label className={labelClass} style={{ color: colors.textDark }}>
        Service Name *
      </label>
      <input
        required
        value={formData.serviceName}
        onChange={(e) => onChange("serviceName", e.target.value)}
        placeholder="e.g. Wash & Iron"
        className={inputClass}
        style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
      />
    </div>

    <div>
      <label className={labelClass} style={{ color: colors.textDark }}>
        Category *
      </label>
      <select
        required
        value={formData.category}
        onChange={(e) => onChange("category", e.target.value)}
        className={inputClass}
        style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
      >
        <option value="" disabled>
          Select category
        </option>
        {categoryOptions.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className={labelClass} style={{ color: colors.textDark }}>
        Pricing Type *
      </label>
      <select
        required
        value={formData.pricingType}
        onChange={(e) => onChange("pricingType", e.target.value)}
        className={inputClass}
        style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
      >
        <option value="" disabled>
          Select type
        </option>
        {pricingTypeOptions.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className={labelClass} style={{ color: colors.textDark }}>
        Price (₹) *
      </label>
      <input
        required
        type="number"
        min="0"
        step="0.01"
        value={formData.price}
        onChange={(e) => onChange("price", e.target.value)}
        placeholder="e.g. 50"
        className={inputClass}
        style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
      />
    </div>

    <div>
      <label className={labelClass} style={{ color: colors.textDark }}>
        Estimated Time *
      </label>
      <select
        required
        value={formData.estimatedTime}
        onChange={(e) => onChange("estimatedTime", e.target.value)}
        className={inputClass}
        style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
      >
        <option value="" disabled>
          Select time
        </option>
        {timeOptions.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>

    <div className="sm:col-span-2">
      <label className={labelClass} style={{ color: colors.textDark }}>
        Description
      </label>
      <textarea
        rows={3}
        value={formData.description}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="Short description of this service"
        className={`${inputClass} resize-none`}
        style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
      />
    </div>

    <div className="sm:col-span-2">
      <label className={labelClass} style={{ color: colors.textDark }}>
        Status
      </label>
      <div className="flex items-center gap-6 mt-1">
        {["Active", "Inactive"].map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 text-sm cursor-pointer"
            style={{ color: colors.textDark }}
          >
            <input
              type="radio"
              name="status"
              value={opt}
              checked={formData.status === opt}
              onChange={() => onChange("status", opt)}
              style={{ accentColor: colors.primaryTeal }}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  </div>
);

export default ServiceFormFields;
