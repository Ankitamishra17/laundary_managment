import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { X, Loader2 } from "lucide-react";
import { addAddress, updateAddress } from "../../api/customerApi";

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  error: "#E0645C",
  errorBg: "#FBE9E8",
};

const EMPTY_FORM = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export default function AddAddressModal({
  open,
  onClose,
  onSuccess,
  editAddress = null,
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isEditing = !!editAddress;

  // Populate form when editing
  useEffect(() => {
    if (editAddress) {
      setForm({
        label: editAddress.label || "Home",
        fullName: editAddress.fullName || "",
        phone: editAddress.phone || "",
        addressLine1: editAddress.addressLine1 || "",
        addressLine2: editAddress.addressLine2 || "",
        landmark: editAddress.landmark || "",
        city: editAddress.city || "",
        state: editAddress.state || "",
        postalCode: editAddress.postalCode || "",
        country: editAddress.country || "India",
        isDefault: editAddress.isDefault || false,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editAddress, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!form.addressLine1.trim()) newErrors.addressLine1 = "Address line 1 is required.";
    if (!form.city.trim()) newErrors.city = "City is required.";
    if (!form.state.trim()) newErrors.state = "State is required.";
    if (!form.postalCode.trim()) newErrors.postalCode = "Postal code is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const res = isEditing
        ? await updateAddress(editAddress.id, form)
        : await addAddress(form);

      if (res.success) {
        toast.success(isEditing ? "Address updated successfully" : "Address added successfully");
        setForm(EMPTY_FORM);
        setErrors({});
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || `Failed to ${isEditing ? "update" : "add"} address.`
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (field) => ({
    backgroundColor: colors.cardTint,
    borderColor: errors[field] ? colors.error : colors.cardBorder,
    color: colors.textDark,
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-5">
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        style={{ backgroundColor: colors.bgLight }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 sm:p-6 border-b"
          style={{ borderColor: colors.cardBorder }}
        >
          <div>
            <h2
              className="text-xl sm:text-2xl"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              {isEditing ? "Edit Address" : "Add New Address"}
            </h2>
            <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
              {isEditing ? "Update your saved address details." : "Save an address for quick checkout."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Label */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                Label
              </label>
              <select
                name="label"
                value={form.label}
                onChange={handleChange}
                className="w-full rounded-xl border px-4 py-2.5 text-sm appearance-none"
                style={fieldStyle("label")}
              >
                <option>Home</option>
                <option>Office</option>
                <option>Other</option>
              </select>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                Full Name *
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={fieldStyle("fullName")}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs" style={{ color: colors.error }}>{errors.fullName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                Phone *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={fieldStyle("phone")}
              />
              {errors.phone && (
                <p className="mt-1 text-xs" style={{ color: colors.error }}>{errors.phone}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                City *
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Mumbai"
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={fieldStyle("city")}
              />
              {errors.city && (
                <p className="mt-1 text-xs" style={{ color: colors.error }}>{errors.city}</p>
              )}
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
              Address Line 1 *
            </label>
            <input
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="Flat / house no, street, area"
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
              style={fieldStyle("addressLine1")}
            />
            {errors.addressLine1 && (
              <p className="mt-1 text-xs" style={{ color: colors.error }}>{errors.addressLine1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
              Address Line 2
            </label>
            <input
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Apartment, suite, etc. (optional)"
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
              style={fieldStyle("addressLine2")}
            />
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
              Landmark
            </label>
            <input
              name="landmark"
              value={form.landmark}
              onChange={handleChange}
              placeholder="Near XYZ mall (optional)"
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
              style={fieldStyle("landmark")}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* State */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                State *
              </label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Maharashtra"
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={fieldStyle("state")}
              />
              {errors.state && (
                <p className="mt-1 text-xs" style={{ color: colors.error }}>{errors.state}</p>
              )}
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                Postal Code *
              </label>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                placeholder="400001"
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={fieldStyle("postalCode")}
              />
              {errors.postalCode && (
                <p className="mt-1 text-xs" style={{ color: colors.error }}>{errors.postalCode}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                Country
              </label>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={fieldStyle("country")}
              />
            </div>
          </div>

          {/* Default checkbox */}
          <label
            className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors"
            style={{
              backgroundColor: form.isDefault ? `${colors.mint}0D` : colors.bgLight,
              borderColor: form.isDefault ? colors.mint : colors.cardBorder,
            }}
          >
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
              className="rounded"
              style={{ accentColor: colors.primaryTeal }}
            />
            <span className="text-sm" style={{ color: colors.textDark }}>
              Set as Default Address
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors"
              style={{ borderColor: colors.cardBorder, color: colors.textMuted }}
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving...
                </>
              ) : (
                isEditing ? "Update Address" : "Save Address"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}