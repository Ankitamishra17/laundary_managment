import { useState } from "react";
import { deleteShop } from "../../api/shopApi";

export default function DeleteShopModal({ isOpen, shop, onClose, onShopDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !shop) return null;

  const handleDelete = async () => {
    setError("");
    setLoading(true);
    try {
      await deleteShop(shop.id);
      onShopDeleted?.(shop.id);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

        .delete-modal-overlay {
          --text-dark: #0F2C2E;
          --text-muted: #5A7A79;
          --card-border: #D8ECEA;
          --card-tint: #EEF7F6;

          position: fixed;
          inset: 0;
          background: rgba(5, 40, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          font-family: 'Inter', sans-serif;
          padding: 20px;
        }

        .delete-modal-card {
          width: 100%;
          max-width: 420px;
          background: #FFFFFF;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 20px 50px rgba(5, 40, 42, 0.25);
          text-align: center;
        }

        .delete-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #FDECEC;
          color: #B3261E;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin: 0 auto 16px;
        }

        .delete-modal-card h2 {
          font-family: 'Libre Baskerville', serif;
          color: var(--text-dark);
          font-size: 20px;
          margin: 0 0 8px;
        }

        .delete-modal-card p {
          color: var(--text-muted);
          font-size: 14px;
          margin: 0 0 22px;
          line-height: 1.5;
        }

        .delete-modal-card strong {
          color: var(--text-dark);
        }

        .btn-row {
          display: flex;
          gap: 10px;
        }

        .btn-row button {
          flex: 1;
          padding: 11px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .cancel-btn {
          border: 1px solid var(--card-border);
          background: var(--card-tint);
          color: var(--text-dark);
        }

        .confirm-delete-btn {
          border: none;
          background: #B3261E;
          color: white;
        }

        .confirm-delete-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert-error {
          margin-bottom: 14px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          background: #FDECEC;
          color: #B3261E;
        }
      `}</style>

      <div className="delete-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="delete-icon">!</div>
        <h2>Delete Shop</h2>
        <p>
          Are you sure you want to delete <strong>{shop.name}</strong> (
          {shop.shopCode})? This action cannot be undone.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <div className="btn-row">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="confirm-delete-btn"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}