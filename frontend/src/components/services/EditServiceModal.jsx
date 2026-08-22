import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import ModalShell from "./ModalShell";
import ServiceFormFields from "./ServiceFormFields";
import { updateService } from "../../api/serviceApi";

const colors = {
  primaryTeal: "#028090",
  mint: "#02C39A",
  cardTint: "#EEF7F6",
  textMuted: "#5C7A78",
};

/**
 * Props:
 *  service     object - the service being edited (prefills the form)
 *  onClose     fn      - close the modal without saving
 *  onSuccess   fn       - called after a successful update (parent closes modal + refetches)
 *  showToast   fn(message, type) - surfaces success/error feedback
 */
const EditServiceModal = ({ service, onClose, onSuccess, showToast }) => {
  const [formData, setFormData] = useState({
    serviceName: service?.serviceName || "",
    category: service?.category || "",
    pricingType: service?.pricingType || "",
    price: service?.price ?? "",
    estimatedTime: service?.estimatedTime || "",
    description: service?.description || "",
    status: service?.status || "Active",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateService(service._id || service.id, { ...formData, price: Number(formData.price) });
      showToast("Service updated successfully.", "success");
      onSuccess();
    } catch (err) {
      showToast(err?.response?.data?.message || "Couldn't update service.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Edit Service" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ServiceFormFields formData={formData} onChange={handleChange} />
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: colors.textMuted, backgroundColor: colors.cardTint }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md"
            style={{ background: `linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint})`, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Update Service
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default EditServiceModal;