import { useEffect, useState } from "react";
import { createSubscription } from "../../api/subscriptionApi";
import { getShops } from "../../api/shopApi";

const initialState = {
  shopId: "",
  plan: "Monthly",
  amount: "",
  startDate: new Date().toISOString().slice(0, 10),
  paymentMethod: "Cash",
};

export default function CreateSubscriptionModal({
  isOpen,
  onClose,
  onCreated,
}) {
  const [shops, setShops] = useState([]);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      getShops()
        .then((data) => setShops(data.shops || data.data || []))
        .catch(() => setShops([]));
      setForm(initialState);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await createSubscription(form);
      onCreated?.(data.subscription || data.data);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sub-modal-overlay" onClick={onClose}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

        .sub-modal-overlay {
          --teal-primary: #028090;
          --seafoam: #00A896;
          --mint: #02C39A;
          --bg-light: #FFFFFF;
          --card-tint: #EEF7F6;
          --card-border: #D8ECEA;
          --text-dark: #0F2C2E;
          --text-muted: #5A7A79;

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

        .sub-modal-card {
          width: 100%;
          max-width: 520px;
          background: var(--bg-light);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 50px rgba(5, 40, 42, 0.25);
        }

        .sub-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .sub-modal-header h2 {
          font-family: 'Libre Baskerville', serif;
          color: var(--text-dark);
          font-size: 22px;
          margin: 0 0 4px;
        }

        .sub-modal-header p {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0;
        }

        .close-btn {
          background: var(--card-tint);
          border: 1px solid var(--card-border);
          color: var(--text-dark);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          font-size: 16px;
          cursor: pointer;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-field.full { grid-column: 1 / -1; }

        .form-field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-dark);
          margin-bottom: 6px;
        }

        .form-field input,
        .form-field select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--card-border);
          background: var(--card-tint);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--text-dark);
          outline: none;
          box-sizing: border-box;
        }

        .form-field input:focus,
        .form-field select:focus {
          border-color: var(--teal-primary);
          box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.12);
        }

        .submit-btn {
          margin-top: 22px;
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--teal-primary), var(--seafoam));
          color: white;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
        }

        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .alert-error {
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          background: #FDECEC;
          color: #B3261E;
        }
      `}</style>

      <div className="sub-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal-header">
          <div>
            <h2>New Subscription</h2>
            <p>Start a subscription for a shop</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="shopId">Shop</label>
              <select
                id="shopId"
                name="shopId"
                value={form.shopId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select a shop
                </option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.shopCode} — {shop.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="plan">Plan</label>
              <select
                id="plan"
                name="plan"
                value={form.plan}
                onChange={handleChange}
                required
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                name="amount"
                type="number"
                placeholder="999"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Subscription"}
          </button>
        </form>
      </div>
    </div>
  );
}
