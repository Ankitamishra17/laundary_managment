import { useEffect, useState } from "react";
import { updateShop } from "../../api/shopApi";

const fieldList = [
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

export default function EditShopModal({ isOpen, shop, onClose, onShopUpdated }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name || "",
        ownerName: shop.ownerName || "",
        email: shop.email || "",
        phone: shop.phone || "",
        address: shop.address || "",
        city: shop.city || "",
        state: shop.state || "",
        gstNumber: shop.gstNumber || "",
        subscriptionPlan: shop.subscriptionPlan || "Monthly",
        subscriptionAmount: shop.subscriptionAmount || "",
      });
      setError("");
    }
  }, [shop]);

  if (!isOpen || !form) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await updateShop(shop.id, form);
      onShopUpdated?.(data.shop || { ...shop, ...form });
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
    <div className="shop-modal-overlay" onClick={onClose}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

        .shop-modal-overlay {
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
      `}</style>

      <div className="shop-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="shop-modal-header">
          <div>
            <h2>Edit Shop</h2>
            <p>Update details for {shop?.name}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="shop-form-grid">
            {fieldList.map((field) => (
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
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}