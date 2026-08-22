import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import ModalShell from "./ModalShell";
import ServiceFormFields from "./ServiceFormFields";
import { createService } from "../../api/serviceApi";

const colors = {
  primaryTeal: "#028090",
  mint: "#02C39A",
  cardTint: "#EEF7F6",
  textMuted: "#5C7A78",
};

const emptyForm = {
  serviceName: "",
  category: "",
  pricingType: "",
  price: "",
  estimatedTime: "",
  description: "",
  status: "Active",
};

/**
 * Props:
 *  onClose     fn  - close the modal without saving
 *  onSuccess   fn  - called after a successful create (parent closes modal + refetches)
 *  showToast   fn(message, type) - surfaces success/error feedback
 */
const AddServiceModal = ({ onClose, onSuccess, showToast }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("FORM DATA:", formData);

    try {
      console.log("Before API");

      const response = await createService({
        ...formData,
        price: Number(formData.price),
      });


      
      console.log("After API");
      console.log(response);

      // First close modal and refresh list
      onSuccess();

      // Then show success message
      showToast("Service added successfully.", "success");

    } catch (err) {
      showToast(
          err?.response?.data?.message || "Couldn't add service.",
          "error",
        );
      // console.log("ERROR:", err);
      // console.log("Response:", err.response);
      // console.log("Data:", err.response?.data);
    }
  };


  return (
    <ModalShell title="Add New Service" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ServiceFormFields formData={formData} onChange={handleChange} />
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{
              color: colors.textMuted,
              backgroundColor: colors.cardTint,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md"
            style={{
              background: `linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint})`,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Save Service
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default AddServiceModal;
