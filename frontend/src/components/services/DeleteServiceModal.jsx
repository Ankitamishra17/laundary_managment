import React, { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import ModalShell from "./ModalShell";
import { deleteService } from "../../api/serviceApi";

const colors = {
  danger: "#E0645C",
  cardTint: "#EEF7F6",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

/**
 * Props:
 *  service     object - the service to delete
 *  onClose     fn      - close the modal without deleting
 *  onSuccess   fn       - called after a successful delete (parent closes modal + refetches)
 *  showToast   fn(message, type) - surfaces success/error feedback
 */
const DeleteServiceModal = ({ service, onClose, onSuccess, showToast }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteService(service._id || service.id);
      showToast("Service deleted.", "success");
      onSuccess();
    } catch (err) {
      showToast(err?.response?.data?.message || "Couldn't delete service.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Delete Service" onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center gap-2 py-2">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: `${colors.danger}1F` }}>
          <AlertTriangle size={22} color={colors.danger} />
        </div>
        <p className="text-sm" style={{ color: colors.textDark }}>Are you sure you want to delete</p>
        <p className="text-lg" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>{service?.name}</p>
        <p className="text-xs mt-1" style={{ color: colors.textMuted }}>This action cannot be undone.</p>
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ color: colors.textMuted, backgroundColor: colors.cardTint }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: colors.danger, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          Delete
        </button>
      </div>
    </ModalShell>
  );
};

export default DeleteServiceModal;