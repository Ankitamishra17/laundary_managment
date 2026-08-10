import { useState } from "react";
import { createShop } from "../../api/shopApi";

const initialState = {
  name: "",
  ownerName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  gstNumber: "",
  subscriptionPlan: "Monthly",
  subscriptionAmount: "",
};

const textFields = [
  { name: "name", label: "Shop Name", placeholder: "Fresh Laundry" },
  { name: "ownerName", label: "Owner Name", placeholder: "Rahul Sharma" },
  { name: "email", label: "Email", placeholder: "rahul@gmail.com", type: "email" },
  { name: "phone", label: "Phone", placeholder: "9876543210" },
  { name: "address", label: "Address", placeholder: "Sector 62", fullWidth: true },
  { name: "city", label: "City", placeholder: "Noida" },
  { name: "state", label: "State", placeholder: "Uttar Pradesh" },
  { name: "gstNumber", label: "GST Number (optional)", placeholder: "09ABCDE1234F1Z5", required: false },
  { name: "subscriptionAmount", label: "Subscription Amount", placeholder: "999", type: "number" },
];

export default function CreateShopModal({ isOpen, onClose, onShopCreated }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState(null); // { email, password } once created
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setForm(initialState);
    setError("");
    setCredentials(null);
    setCopied(false);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await createShop(form);
      setCredentials({
        email: data.admin?.email,
        password: data.admin?.temporaryPassword,
        shopCode: data.shop?.shopCode,
      });
      onShopCreated?.(data.shop);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  return (
    <div className="shop-modal-overlay" onClick={resetAndClose}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

        .shop-modal-overlay {
          --bg-dark: #05282A;
          --panel-dark: #0B3B3E;
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

        .shop-modal-card {
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          background: var(--bg-light);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 50px rgba(5, 40, 42, 0.25);
        }

        .shop-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .shop-modal-header h2 {
          font-family: 'Libre Baskerville', serif;
          color: var(--text-dark);
          font-size: 24px;
          margin: 0 0 4px;
        }

        .shop-modal-header p {
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
          line-height: 1;
          flex-shrink: 0;
        }

        .shop-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .shop-form-grid .full-width {
          grid-column: 1 / -1;
        }

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
          transition: border-color 0.15s ease;
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
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert-error {
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          background: #FDECEC;
          color: #B3261E;
        }

        /* Success / credentials popup state */
        .success-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--teal-primary), var(--mint));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 26px;
          margin: 0 auto 16px;
        }

        .success-title {
          font-family: 'Libre Baskerville', serif;
          color: var(--text-dark);
          font-size: 22px;
          text-align: center;
          margin: 0 0 4px;
        }

        .success-subtitle {
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
          margin: 0 0 22px;
        }

        .credentials-box {
          background: var(--card-tint);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 20px;
        }

        .credential-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
        }

        .credential-row + .credential-row {
          border-top: 1px solid var(--card-border);
        }

        .credential-row .cred-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .credential-row .cred-value {
          font-family: 'Inter', monospace;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-dark);
        }

        .shop-code-pill {
          display: inline-block;
          margin-bottom: 14px;
          background: rgba(2, 195, 154, 0.12);
          color: var(--teal-primary);
          font-weight: 600;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .copy-btn {
          margin-top: 18px;
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: var(--panel-dark);
          color: white;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .copy-btn.copied {
          background: var(--teal-primary);
        }

        .done-btn {
          margin-top: 10px;
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--card-border);
          background: transparent;
          color: var(--text-dark);
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
        }
      `}</style>

      <div className="shop-modal-card" onClick={(e) => e.stopPropagation()}>
        {!credentials ? (
          <>
            <div className="shop-modal-header">
              <div>
                <h2>Create Shop</h2>
                <p>Add a new laundry shop to the platform</p>
              </div>
              <button className="close-btn" onClick={resetAndClose} aria-label="Close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="shop-form-grid">
                {textFields.map((field) => (
                  <div
                    className={`form-field ${field.fullWidth ? "full-width" : ""}`}
                    key={field.name}
                  >
                    <label htmlFor={field.name}>{field.label}</label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={form[field.name]}
                      onChange={handleChange}
                      required={field.required !== false}
                    />
                  </div>
                ))}

                <div className="form-field">
                  <label htmlFor="subscriptionPlan">Subscription Plan</label>
                  <select
                    id="subscriptionPlan"
                    name="subscriptionPlan"
                    value={form.subscriptionPlan}
                    onChange={handleChange}
                    required
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {error && <div className="alert-error">{error}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Creating Shop..." : "Create Shop"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="success-icon">✓</div>
            <h2 className="success-title">Shop Created</h2>
            <p className="success-subtitle">
              Share these login details with the shop admin
            </p>

            <div style={{ textAlign: "center" }}>
              <span className="shop-code-pill">{credentials.shopCode}</span>
            </div>

            <div className="credentials-box">
              <div className="credential-row">
                <span className="cred-label">Email</span>
                <span className="cred-value">{credentials.email}</span>
              </div>
              <div className="credential-row">
                <span className="cred-label">Password</span>
                <span className="cred-value">{credentials.password}</span>
              </div>
            </div>

            <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
              {copied ? "Copied ✓" : "Copy"}
            </button>

            <button className="done-btn" onClick={resetAndClose}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}