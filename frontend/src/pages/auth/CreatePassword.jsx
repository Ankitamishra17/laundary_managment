import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WashingMachine, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { createPassword } from "../../api/authApi";

export default function CreatePassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleShow(field) {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function validate() {
    if (!form.currentPassword) return "Enter your current password.";
    if (form.newPassword.length < 6)
      return "New password must be at least 6 characters.";
    if (form.newPassword === form.currentPassword)
      return "New password must be different from your current password.";
    if (form.newPassword !== form.confirmPassword)
      return "New password and confirmation don't match.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    try {
      await createPassword(form);

      toast.success("Password created successfully. Please login again.");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      key: "currentPassword",
      showKey: "current",
      label: "Current Password",
      placeholder: "Your temporary password",
    },
    {
      key: "newPassword",
      showKey: "next",
      label: "New Password",
      placeholder: "At least 6 characters",
    },
    {
      key: "confirmPassword",
      showKey: "confirm",
      label: "Confirm Password",
      placeholder: "Re-enter new password",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand panel */}
      <div
        className="relative flex flex-col justify-between px-8 py-10 sm:px-12 sm:py-12 lg:w-[44%] lg:min-h-screen overflow-hidden text-white"
        style={{ backgroundColor: "#05282A" }}
      >
        <div
          className="absolute -top-20 -right-16 w-64 h-64 rounded-full"
          style={{ backgroundColor: "#0B3B3E", opacity: 0.6 }}
        />

        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#02C39A" }}
          >
            <WashingMachine size={20} style={{ color: "#05282A" }} />
          </div>
          <div className="leading-tight">
            <p
              style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18 }}
            >
              Laundry
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                letterSpacing: "0.03em",
                color: "rgba(255,255,255,0.5)",
                marginTop: -2,
              }}
            >
              Management System
            </p>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col justify-center items-center gap-6 py-10 lg:py-0 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "rgba(2,195,154,0.15)",
              border: "1px solid rgba(2,195,154,0.3)",
            }}
          >
            <ShieldCheck size={28} style={{ color: "#02C39A" }} />
          </div>
          <h1
            className="text-3xl sm:text-4xl max-w-xs leading-snug"
            style={{ fontFamily: "'Libre Baskerville', serif" }}
          >
            Let's secure your account.
          </h1>
          <p
            className="font-body text-sm max-w-xs"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            This is your first sign-in. Set a permanent password to continue to
            your dashboard.
          </p>
        </div>

        <p
          className="relative text-xs text-center lg:text-left"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          One platform for owners, staff, and customers.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2
              style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: 24,
                color: "#0F2C2E",
              }}
            >
              Create Your Password
            </h2>
            <p className="font-body text-sm mt-1" style={{ color: "#51787C" }}>
              Choose a password only you know.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, showKey, label, placeholder }) => (
              <div key={key}>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#0F2C2E",
                  }}
                >
                  {label}
                </label>
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{
                    border: "1px solid #D8ECEA",
                    backgroundColor: "#EEF7F6",
                  }}
                >
                  <Lock
                    size={16}
                    style={{ color: "#51787C" }}
                    className="shrink-0"
                  />
                  <input
                    type={show[showKey] ? "text" : "password"}
                    required
                    value={form[key]}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="bg-transparent outline-none text-sm w-full"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: "#0F2C2E",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(showKey)}
                    aria-label={
                      show[showKey]
                        ? `Hide ${label.toLowerCase()}`
                        : `Show ${label.toLowerCase()}`
                    }
                    className="shrink-0"
                  >
                    {show[showKey] ? (
                      <EyeOff size={16} style={{ color: "#51787C" }} />
                    ) : (
                      <Eye size={16} style={{ color: "#51787C" }} />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <p
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: "#dc2626",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fee2e2",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 font-medium text-white transition-colors disabled:opacity-60"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: "#028090",
              }}
              onMouseEnter={(e) =>
                !loading && (e.currentTarget.style.backgroundColor = "#0B3B3E")
              }
              onMouseLeave={(e) =>
                !loading && (e.currentTarget.style.backgroundColor = "#028090")
              }
            >
              {loading ? "Saving…" : "Save Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
