// import { useState } from "react";
// import { createShop } from "../../api/shopApi";

// const initialState = {
//   name: "",
//   ownerName: "",
//   email: "",
//   phone: "",
//   address: "",
//   city: "",
//   state: "",
//   gstNumber: "",
//   subscriptionPlan: "Monthly",
//   subscriptionAmount: "",
//   planName: "Basic",
// };

// const PLAN_TIERS = ["Free", "Basic", "Pro", "Premium"];

// const textFields = [
//   { name: "name", label: "Shop Name", placeholder: "Fresh Laundry" },
//   { name: "ownerName", label: "Owner Name", placeholder: "Rahul Sharma" },
//   { name: "email", label: "Email", placeholder: "rahul@gmail.com", type: "email" },
//   { name: "phone", label: "Phone", placeholder: "99XXXXXXXX" },
//   { name: "address", label: "Address", placeholder: "Sector 62", fullWidth: true },
//   { name: "city", label: "City", placeholder: "Noida" },
//   { name: "state", label: "State", placeholder: "Uttar Pradesh" },
//   { name: "gstNumber", label: "GST Number (optional)", placeholder: "09ABCDE1234F1Z5", required: false },
//   { name: "subscriptionAmount", label: "Subscription Amount", placeholder: "999", type: "number" },
// ];

// export default function CreateShopModal({ isOpen, onClose, onShopCreated }) {
//   const [form, setForm] = useState(initialState);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [credentials, setCredentials] = useState(null); // { email, password } once created
//   const [copied, setCopied] = useState(false);

//   if (!isOpen) return null;

//   const resetAndClose = () => {
//     setForm(initialState);
//     setError("");
//     setCredentials(null);
//     setCopied(false);
//     onClose();
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const data = await createShop(form);
//       setCredentials({
//         email: data.admin?.email,
//         password: data.admin?.temporaryPassword,
//         shopCode: data.shop?.shopCode,
//           slug: data.shop?.slug,
//       });
//       onShopCreated?.(data.shop);
//     } catch (err) {
//       setError(
//         err.response?.data?.message || err.message || "Something went wrong"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCopy = async () => {
//     const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
//     try {
//       await navigator.clipboard.writeText(text);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 1800);
//     } catch {
//       setError("Could not copy to clipboard");
//     }
//   };

//   return (
//     <div className="shop-modal-overlay" onClick={resetAndClose}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

//         .shop-modal-overlay {
//           --bg-dark: #05282A;
//           --panel-dark: #0B3B3E;
//           --teal-primary: #028090;
//           --seafoam: #00A896;
//           --mint: #02C39A;
//           --bg-light: #FFFFFF;
//           --card-tint: #EEF7F6;
//           --card-border: #D8ECEA;
//           --text-dark: #0F2C2E;
//           --text-muted: #5A7A79;

//           position: fixed;
//           inset: 0;
//           background: rgba(5, 40, 42, 0.55);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           z-index: 1000;
//           font-family: 'Inter', sans-serif;
//           padding: 20px;
//         }

//         .shop-modal-card {
//           width: 100%;
//           max-width: 600px;
//           max-height: 90vh;
//           overflow-y: auto;
//           background: var(--bg-light);
//           border-radius: 16px;
//           padding: 32px;
//           box-shadow: 0 20px 50px rgba(5, 40, 42, 0.25);
//         }

//         .shop-modal-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           margin-bottom: 24px;
//         }

//         .shop-modal-header h2 {
//           font-family: 'Libre Baskerville', serif;
//           color: var(--text-dark);
//           font-size: 24px;
//           margin: 0 0 4px;
//         }

//         .shop-modal-header p {
//           color: var(--text-muted);
//           font-size: 13px;
//           margin: 0;
//         }

//         .close-btn {
//           background: var(--card-tint);
//           border: 1px solid var(--card-border);
//           color: var(--text-dark);
//           border-radius: 8px;
//           width: 32px;
//           height: 32px;
//           font-size: 16px;
//           cursor: pointer;
//           line-height: 1;
//           flex-shrink: 0;
//         }

//         .shop-form-grid {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 16px;
//         }

//         .shop-form-grid .full-width {
//           grid-column: 1 / -1;
//         }

//         .form-field label {
//           display: block;
//           font-size: 13px;
//           font-weight: 500;
//           color: var(--text-dark);
//           margin-bottom: 6px;
//         }

//         .form-field input,
//         .form-field select {
//           width: 100%;
//           padding: 10px 12px;
//           border-radius: 8px;
//           border: 1px solid var(--card-border);
//           background: var(--card-tint);
//           font-family: 'Inter', sans-serif;
//           font-size: 14px;
//           color: var(--text-dark);
//           outline: none;
//           box-sizing: border-box;
//           transition: border-color 0.15s ease;
//         }

//         .form-field input:focus,
//         .form-field select:focus {
//           border-color: var(--teal-primary);
//           box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.12);
//         }

//         .submit-btn {
//           margin-top: 22px;
//           width: 100%;
//           padding: 13px;
//           border: none;
//           border-radius: 10px;
//           background: linear-gradient(135deg, var(--teal-primary), var(--seafoam));
//           color: white;
//           font-family: 'Inter', sans-serif;
//           font-weight: 600;
//           font-size: 15px;
//           cursor: pointer;
//         }

//         .submit-btn:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }

//         .alert-error {
//           margin-top: 14px;
//           padding: 10px 14px;
//           border-radius: 8px;
//           font-size: 13px;
//           background: #FDECEC;
//           color: #B3261E;
//         }

//         /* Success / credentials popup state */
//         .success-icon {
//           width: 52px;
//           height: 52px;
//           border-radius: 50%;
//           background: linear-gradient(135deg, var(--teal-primary), var(--mint));
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: white;
//           font-size: 26px;
//           margin: 0 auto 16px;
//         }

//         .success-title {
//           font-family: 'Libre Baskerville', serif;
//           color: var(--text-dark);
//           font-size: 22px;
//           text-align: center;
//           margin: 0 0 4px;
//         }

//         .success-subtitle {
//           text-align: center;
//           color: var(--text-muted);
//           font-size: 13px;
//           margin: 0 0 22px;
//         }

//         .credentials-box {
//           background: var(--card-tint);
//           border: 1px solid var(--card-border);
//           border-radius: 12px;
//           padding: 20px;
//         }

//         .credential-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           padding: 10px 0;
//         }

//         .credential-row + .credential-row {
//           border-top: 1px solid var(--card-border);
//         }

//         .credential-row .cred-label {
//           font-size: 12px;
//           color: var(--text-muted);
//           text-transform: uppercase;
//           letter-spacing: 0.03em;
//         }

//         .credential-row .cred-value {
//           font-family: 'Inter', monospace;
//           font-size: 14px;
//           font-weight: 600;
//           color: var(--text-dark);
//         }

//         .shop-code-pill {
//           display: inline-block;
//           margin-bottom: 14px;
//           background: rgba(2, 195, 154, 0.12);
//           color: var(--teal-primary);
//           font-weight: 600;
//           font-size: 12px;
//           padding: 4px 10px;
//           border-radius: 999px;
//         }

//         .copy-btn {
//           margin-top: 18px;
//           width: 100%;
//           padding: 12px;
//           border: none;
//           border-radius: 10px;
//           background: var(--panel-dark);
//           color: white;
//           font-family: 'Inter', sans-serif;
//           font-weight: 600;
//           font-size: 14px;
//           cursor: pointer;
//           transition: background 0.15s ease;
//         }

//         .copy-btn.copied {
//           background: var(--teal-primary);
//         }

//         .done-btn {
//           margin-top: 10px;
//           width: 100%;
//           padding: 12px;
//           border-radius: 10px;
//           border: 1px solid var(--card-border);
//           background: transparent;
//           color: var(--text-dark);
//           font-family: 'Inter', sans-serif;
//           font-weight: 500;
//           font-size: 14px;
//           cursor: pointer;
//         }
//       `}</style>

//       <div className="shop-modal-card" onClick={(e) => e.stopPropagation()}>
//         {!credentials ? (
//           <>
//             <div className="shop-modal-header">
//               <div>
//                 <h2>Create Shop</h2>
//                 <p>Add a new laundry shop to the platform</p>
//               </div>
//               <button className="close-btn" onClick={resetAndClose} aria-label="Close">
//                 ✕
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="shop-form-grid">
//                 {textFields.map((field) => (
//                   <div
//                     className={`form-field ${field.fullWidth ? "full-width" : ""}`}
//                     key={field.name}
//                   >
//                     <label htmlFor={field.name}>{field.label}</label>
//                     <input
//                       id={field.name}
//                       name={field.name}
//                       type={field.type || "text"}
//                       placeholder={field.placeholder}
//                       value={form[field.name]}
//                       onChange={handleChange}
//                       required={field.required !== false}
//                     />
//                   </div>
//                 ))}

//                 <div className="form-field">
//                   <label htmlFor="planName">Plan Tier</label>
//                   <select
//                     id="planName"
//                     name="planName"
//                     value={form.planName}
//                     onChange={handleChange}
//                   >
//                     {PLAN_TIERS.map((p) => (
//                       <option key={p} value={p}>
//                         {p}
//                       </option>
//                     ))}
//                   </select>
//                   <small style={{ color: "#5A7A79", fontSize: 11 }}>
//                     Free: 2 emp · Basic: 5 emp · Pro: 15 emp · Premium: unlimited
//                   </small>
//                 </div>

//                 <div className="form-field">
//                   <label htmlFor="subscriptionPlan">Billing Cycle</label>
//                   <select
//                     id="subscriptionPlan"
//                     name="subscriptionPlan"
//                     value={form.subscriptionPlan}
//                     onChange={handleChange}
//                     required
//                   >
//                     <option value="Monthly">Monthly</option>
//                     <option value="Yearly">Yearly</option>
//                   </select>
//                 </div>
//               </div>

//               {error && <div className="alert-error">{error}</div>}

//               <button type="submit" className="submit-btn" disabled={loading}>
//                 {loading ? "Creating Shop..." : "Create Shop"}
//               </button>
//             </form>
//           </>
//         ) : (
//           <>
//             <div className="success-icon">✓</div>
//             <h2 className="success-title">Shop Created</h2>
//             <p className="success-subtitle">
//               Share these login details with the shop admin
//             </p>

//             <div style={{ textAlign: "center" }}>
//               <span className="shop-code-pill">{credentials.shopCode}</span>
//             </div>

//             <div className="credentials-box">
//               <div className="credential-row">
//                 <span className="cred-label">Email</span>
//                 <span className="cred-value">{credentials.email}</span>
//               </div>
//               <div className="credential-row">
//                 <span className="cred-label">Password</span>
//                 <span className="cred-value">{credentials.password}</span>
//               </div>
//             </div>

//             <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
//               {copied ? "Copied ✓" : "Copy"}
//             </button>

//             <button className="done-btn" onClick={resetAndClose}>
//               Done
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

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
  planName: "Basic",
};

const PLAN_TIERS = ["Free", "Basic", "Pro", "Premium"];

const textFields = [
  {
    name: "name",
    label: "Shop Name",
    placeholder: "Fresh Laundry",
  },
  {
    name: "ownerName",
    label: "Owner Name",
    placeholder: "Rahul Sharma",
  },
  {
    name: "email",
    label: "Email",
    placeholder: "rahul@gmail.com",
    type: "email",
  },
  {
    name: "phone",
    label: "Phone",
    placeholder: "99XXXXXXXX",
  },
  {
    name: "address",
    label: "Address",
    placeholder: "Sector 62",
    fullWidth: true,
  },
  {
    name: "city",
    label: "City",
    placeholder: "Noida",
  },
  {
    name: "state",
    label: "State",
    placeholder: "Uttar Pradesh",
  },
  {
    name: "gstNumber",
    label: "GST Number (Optional)",
    placeholder: "09ABCDE1234F1Z5",
    required: false,
  },
  {
    name: "subscriptionAmount",
    label: "Subscription Amount",
    placeholder: "999",
    type: "number",
  },
];

export default function CreateShopModal({
  isOpen,
  onClose,
  onShopCreated,
}) {
  const [form, setForm] = useState(initialState);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [credentials, setCredentials] = useState(null);

  const [copied, setCopied] = useState(false);

  // ============================================================
  // DO NOT RENDER WHEN MODAL IS CLOSED
  // ============================================================

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // RESET AND CLOSE
  // ============================================================

  const resetAndClose = () => {
    setForm(initialState);
    setError("");
    setCredentials(null);
    setCopied(false);
    setLoading(false);

    onClose?.();
  };

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // CREATE SHOP
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await createShop(form);

      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to create shop."
        );
      }

      // ========================================================
      // SAVE SHOP + ADMIN DETAILS
      // ========================================================

      const adminEmail = data.admin?.email || "";
      const adminPassword = data.admin?.temporaryPassword || "";

      setCredentials({
        email: adminEmail,
        password: adminPassword,
        shopCode: data.shop?.shopCode || "",
        shopName: data.shop?.name || "",
        slug: data.shop?.slug || "",
      });

      // Refresh parent shop list
      onShopCreated?.(data.shop);
    } catch (err) {
      console.error("Create Shop Error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong while creating the shop.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CUSTOMER SHOP WEBSITE URL
  //
  // IMPORTANT:
  //
  // This is ONLY:
  //
  // http://localhost:5173/laundry-shop
  //
  // NOT:
  //
  // http://localhost:5173/laundry-shop/signup
  // ============================================================

  const getShopUrl = () => {
    if (!credentials?.slug) {
      return "";
    }

    return `${window.location.origin}/${credentials.slug}`;
  };

  const shopUrl = credentials ? getShopUrl() : "";

  // ============================================================
  // COPY ALL DETAILS
  // ============================================================

  const handleCopy = async () => {
    if (!credentials) {
      return;
    }

    const customerWebsite = getShopUrl();

    const text = `Shop Name: ${credentials.shopName}
Shop Code: ${credentials.shopCode}

Admin Login Details
Email: ${credentials.email}
Temporary Password: ${credentials.password}

Customer Website:
${customerWebsite}`;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error("Clipboard Error:", err);

      setError("Could not copy to clipboard.");
    }
  };

  return (
    <div
      className="shop-modal-overlay"
      onClick={resetAndClose}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

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

          box-shadow:
            0 20px 50px rgba(5, 40, 42, 0.25);
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

          margin: 0 0 6px;
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

          width: 34px;
          height: 34px;

          font-size: 18px;

          cursor: pointer;

          line-height: 1;

          flex-shrink: 0;
        }

        .close-btn:hover {
          background: #e3f1ef;
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

          font-weight: 600;

          color: var(--text-dark);

          margin-bottom: 6px;
        }

        .form-field input,
        .form-field select {
          width: 100%;

          padding: 11px 12px;

          border-radius: 8px;

          border: 1px solid var(--card-border);

          background: var(--card-tint);

          font-family: 'Inter', sans-serif;

          font-size: 14px;

          color: var(--text-dark);

          outline: none;

          box-sizing: border-box;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .form-field input:focus,
        .form-field select:focus {
          border-color: var(--teal-primary);

          box-shadow:
            0 0 0 3px rgba(2, 128, 144, 0.12);
        }

        .plan-note {
          display: block;

          color: var(--text-muted);

          font-size: 11px;

          margin-top: 6px;

          line-height: 1.5;
        }

        .submit-btn {
          margin-top: 22px;

          width: 100%;

          padding: 13px;

          border: none;

          border-radius: 10px;

          background:
            linear-gradient(
              135deg,
              var(--teal-primary),
              var(--seafoam)
            );

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

        /* ======================================================
           SUCCESS
        ====================================================== */

        .success-icon {
          width: 54px;
          height: 54px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              var(--teal-primary),
              var(--mint)
            );

          display: flex;

          align-items: center;
          justify-content: center;

          color: white;

          font-size: 27px;

          margin: 0 auto 16px;
        }

        .success-title {
          font-family: 'Libre Baskerville', serif;

          color: var(--text-dark);

          font-size: 22px;

          text-align: center;

          margin: 0 0 6px;
        }

        .success-subtitle {
          text-align: center;

          color: var(--text-muted);

          font-size: 13px;

          margin: 0 0 22px;

          line-height: 1.5;
        }

        .shop-code-wrapper {
          text-align: center;

          margin-bottom: 16px;
        }

        .shop-code-pill {
          display: inline-block;

          background: rgba(2, 195, 154, 0.12);

          color: var(--teal-primary);

          font-weight: 700;

          font-size: 12px;

          padding: 6px 12px;

          border-radius: 999px;
        }

        .credentials-box {
          background: var(--card-tint);

          border: 1px solid var(--card-border);

          border-radius: 12px;

          padding: 8px 20px;
        }

        .credential-row {
          display: flex;

          justify-content: space-between;

          align-items: flex-start;

          gap: 20px;

          padding: 13px 0;
        }

        .credential-row + .credential-row {
          border-top: 1px solid var(--card-border);
        }

        .cred-label {
          font-size: 11px;

          color: var(--text-muted);

          text-transform: uppercase;

          letter-spacing: 0.04em;

          flex-shrink: 0;

          padding-top: 2px;
        }

        .cred-value {
          font-family: 'Inter', monospace;

          font-size: 13px;

          font-weight: 600;

          color: var(--text-dark);

          text-align: right;

          word-break: break-all;
        }

        .signup-url {
          color: var(--teal-primary);

          text-decoration: none;
        }

        .signup-url:hover {
          text-decoration: underline;
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

        .copy-btn:hover {
          background: var(--teal-primary);
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

        .done-btn:hover {
          background: var(--card-tint);
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 600px) {
          .shop-modal-overlay {
            padding: 12px;
          }

          .shop-modal-card {
            padding: 22px 18px;
          }

          .shop-form-grid {
            grid-template-columns: 1fr;
          }

          .shop-form-grid .full-width {
            grid-column: auto;
          }

          .credential-row {
            flex-direction: column;

            gap: 5px;
          }

          .cred-value {
            text-align: left;
          }
        }
      `}</style>

      <div
        className="shop-modal-card"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ======================================================
            CREATE SHOP FORM
        ====================================================== */}

        {!credentials ? (
          <>
            <div className="shop-modal-header">
              <div>
                <h2>Create Shop</h2>

                <p>
                  Add a new laundry shop to the platform
                </p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={resetAndClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="shop-form-grid">

                {textFields.map((field) => (
                  <div
                    className={`form-field ${
                      field.fullWidth
                        ? "full-width"
                        : ""
                    }`}
                    key={field.name}
                  >

                    <label htmlFor={field.name}>
                      {field.label}
                    </label>

                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={form[field.name]}
                      onChange={handleChange}
                      required={
                        field.required !== false
                      }
                      min={
                        field.name ===
                        "subscriptionAmount"
                          ? "0"
                          : undefined
                      }
                    />

                  </div>
                ))}

                {/* PLAN TIER */}

                <div className="form-field">

                  <label htmlFor="planName">
                    Plan Tier
                  </label>

                  <select
                    id="planName"
                    name="planName"
                    value={form.planName}
                    onChange={handleChange}
                  >

                    {PLAN_TIERS.map((plan) => (
                      <option
                        key={plan}
                        value={plan}
                      >
                        {plan}
                      </option>
                    ))}

                  </select>

                  <small className="plan-note">
                    Free: 2 employees · Basic: 5
                    employees · Pro: 15 employees ·
                    Premium: Unlimited
                  </small>

                </div>

                {/* BILLING CYCLE */}

                <div className="form-field">

                  <label htmlFor="subscriptionPlan">
                    Billing Cycle
                  </label>

                  <select
                    id="subscriptionPlan"
                    name="subscriptionPlan"
                    value={form.subscriptionPlan}
                    onChange={handleChange}
                    required
                  >

                    <option value="Monthly">
                      Monthly
                    </option>

                    <option value="Yearly">
                      Yearly
                    </option>

                  </select>

                </div>

              </div>

              {error && (
                <div className="alert-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading
                  ? "Creating Shop..."
                  : "Create Shop"}
              </button>

            </form>
          </>
        ) : (

          /* ====================================================
             SUCCESS / CREDENTIALS
          ==================================================== */

          <>
            <div className="success-icon">
              ✓
            </div>

            <h2 className="success-title">
              Shop Created Successfully
            </h2>

            <p className="success-subtitle">
              Save these admin credentials and share
              the customer website with your customers.
            </p>

            {/* SHOP CODE */}

            <div className="shop-code-wrapper">

              <span className="shop-code-pill">
                {credentials.shopCode}
              </span>

            </div>

            {/* DETAILS */}

            <div className="credentials-box">

              {/* SHOP NAME */}

              <div className="credential-row">

                <span className="cred-label">
                  Shop Name
                </span>

                <span className="cred-value">
                  {credentials.shopName}
                </span>

              </div>

              {/* ADMIN EMAIL */}

              <div className="credential-row">

                <span className="cred-label">
                  Admin Email
                </span>

                <span className="cred-value">
                  {credentials.email}
                </span>

              </div>

              {/* TEMP PASSWORD */}

              <div className="credential-row">

                <span className="cred-label">
                  Temporary Password
                </span>

                <span className="cred-value">
                  {credentials.password}
                </span>

              </div>

              {/* CUSTOMER WEBSITE */}

              <div className="credential-row">

                <span className="cred-label">
                  Customer Website
                </span>

                <a
                  href={shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cred-value signup-url"
                >
                  {shopUrl ||
                    "Shop URL not available"}
                </a>

              </div>

            </div>

            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}

            {/* COPY */}

            <button
              type="button"
              className={`copy-btn ${
                copied ? "copied" : ""
              }`}
              onClick={handleCopy}
            >
              {copied
                ? "Copied ✓"
                : "Copy All Details"}
            </button>

            {/* DONE */}

            <button
              type="button"
              className="done-btn"
              onClick={resetAndClose}
            >
              Done
            </button>

          </>
        )}

      </div>
    </div>
  );
}