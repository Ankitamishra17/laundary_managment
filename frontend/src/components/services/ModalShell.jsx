import React from "react";
import { X } from "lucide-react";

const colors = {
  bgLight: "#FFFFFF",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

/**
 * Shared modal frame used by Add/Edit/Delete/View service modals.
 * Handles the overlay, header with title + close button, and scroll area.
 */
const ModalShell = ({ title, onClose, children, maxWidth = "max-w-lg" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
    <div
      className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl`}
      style={{ backgroundColor: colors.bgLight, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
      <div
        className="flex items-center justify-between px-6 py-5 sticky top-0 z-10"
        style={{ backgroundColor: colors.bgLight, borderBottom: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          {title}
        </h3>
        <button onClick={onClose} style={{ color: colors.textMuted }} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  </div>
);

export default ModalShell;