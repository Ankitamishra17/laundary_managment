import { useEffect, useState } from "react";
import { renewSubscription } from "../../api/subscriptionApi";

export default function RenewSubscriptionModal({ isOpen, subscription, onClose, onRenewed }) {
  const [form, setForm] = useState({ plan: "Monthly", amount: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (subscription) {
      setForm({
        plan: subscription.plan || "Monthly",
        amount: subscription.amount || "",
      });
      setError("");
    }
  }, [subscription]);

  if (!isOpen || !subscription) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await renewSubscription(subscription.id, form);
      onRenewed?.(data.subscription || data.data);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="renew-modal-overlay" onClick={onClose}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

        .renew-modal-overlay {
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

        .renew-modal-card {
          width: 100%;
          max-width: 420px;
          background: var(--bg-light);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 20px 50px rgba(5, 40, 42, 0.25);
        }

        .renew-modal-card h2 {
          font-family: 'Libre Baskerville', serif;
          color: var(--text-dark);
          font-size: 20px;
          margin: 0 0 4px;
        }

        .renew-modal-card p.subtitle {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0 0 20px;
        }

        .form-field { margin-bottom: 16px; }

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

        .btn-row {
          display: flex;
          gap: 10px;
          margin-top: 22px;
        }

        .btn-row button {
          flex: 1;
          padding: 11px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .cancel-btn {
          border: 1px solid var(--card-border);
          background: var(--card-tint);
          color: var(--text-dark);
        }

        .confirm-btn {
          border: none;
          background: linear-gradient(135deg, var(--teal-primary), var(--seafoam));
          color: white;
        }

        .confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .alert-error {
          margin-bottom: 14px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          background: #FDECEC;
          color: #B3261E;
        }
      `}</style>

      <div className="renew-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Renew Subscription</h2>
        <p className="subtitle">
          {subscription.shop?.name || "Shop"} — extend the current plan
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="plan">Plan</label>
            <select id="plan" name="plan" value={form.plan} onChange={handleChange} required>
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
              value={form.amount}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="btn-row">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="confirm-btn" disabled={loading}>
              {loading ? "Renewing..." : "Renew"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}