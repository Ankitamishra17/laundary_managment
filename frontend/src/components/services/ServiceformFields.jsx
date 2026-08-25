import React from "react";

const colors = {
  primaryTeal: "#028090",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};


// Common categories — suggestions only, the shop admin can type any
// custom category (the backend stores it as free text).

// Combined categories from both Ankita and Amisha branches
const categoryOptions = [
  "Washing",
  "Ironing",
  "Dry Cleaning",
  "Premium",
  "Household",
  "Steam Iron",
  "Wash & Fold",
  "Wash & Iron",
  "Stain Removal",
  "Shoe Cleaning",
  "Carpet Cleaning",
  "Blanket Cleaning",
  "Curtain Cleaning",
  "Express Laundry",
  "Others",
];

// Combined pricing types from both branches
const pricingTypeOptions = ["Per Kg", "Per Item", "Per Set", "Per Piece", "Per Pair", "Fixed"];

const timeOptions = ["Same Day", "1 Day", "2 Days", "3 Days", "5 Days"];

const inputClass = "sf-input w-full rounded-xl border px-4 py-2.5 text-sm";

const labelClass = "block text-xs font-medium mb-1.5";

/**
 * Shared field set used by both AddServiceModal and EditServiceModal
 * so the form only has to be built and styled once.
 */
const ServiceFormFields = ({ formData, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <style>{`
      .sf-input {
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
        border-color: ${colors.cardBorder};
      }

      .sf-input:focus {
        outline: none;
        border-color: ${colors.primaryTeal};
        box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.14);
      }
    `}</style>

    {/* Service Name */}
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
        style={{
          backgroundColor: colors.cardTint,
          color: colors.textDark,
        }}
      />
    </div>

    {/* Category */}
    <div>
      <label className={labelClass} style={{ color: colors.textDark }}>
        Category *
      </label>

      <input
        required
        list="sf-category-suggestions"
        value={formData.category}
        onChange={(e) => onChange("category", e.target.value)}
        placeholder="e.g. Dry Cleaning"
        className={inputClass}
        style={{
          backgroundColor: colors.cardTint,
          color: colors.textDark,
        }}
      />

      <datalist id="sf-category-suggestions">
        {categoryOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>

    {/* Pricing Type */}
    <div>
      <label className={labelClass} style={{ color: colors.textDark }}>
        Unit (pricing) *
      </label>

      <select
        required
        value={formData.pricingType}
        onChange={(e) => onChange("pricingType", e.target.value)}
        className={inputClass}
        style={{
          backgroundColor: colors.cardTint,
          color: colors.textDark,
        }}
      >
        <option value="" disabled>
          Select type
        </option>

        {pricingTypeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>

    {/* Price */}
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
        style={{
          backgroundColor: colors.cardTint,
          color: colors.textDark,
        }}
      />
    </div>

    {/* Processing Time */}
    <div>
      <label className={labelClass} style={{ color: colors.textDark }}>
        Processing time *
      </label>

      <select
        required
        value={formData.estimatedTime}
        onChange={(e) => onChange("estimatedTime", e.target.value)}
        className={inputClass}
        style={{
          backgroundColor: colors.cardTint,
          color: colors.textDark,
        }}
      >
        <option value="" disabled>
          Select time
        </option>

        {timeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>

    {/* Description */}
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
        style={{
          backgroundColor: colors.cardTint,
          color: colors.textDark,
        }}
      />
    </div>

    {/* Status */}
    <div className="sm:col-span-2">
      <label className={labelClass} style={{ color: colors.textDark }}>
        Status
      </label>

      <div className="flex items-center gap-6 mt-1">
        {["Active", "Inactive"].map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-sm cursor-pointer"
            style={{
              color: colors.textDark,
            }}
          >
            <input
              type="radio"
              name="status"
              value={option}
              checked={formData.status === option}
              onChange={() => onChange("status", option)}
              style={{
                accentColor: colors.primaryTeal,
              }}
            />

            {option}
          </label>
        ))}
      </div>
    </div>
  </div>
);

export default ServiceFormFields;
