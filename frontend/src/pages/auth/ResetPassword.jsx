import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  WashingMachine,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { resetPassword } from "../../api/authApi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("passwordResetToken");

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ next: false, confirm: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleShow(field) {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function validate() {
    if (form.newPassword.length < 6)
      return "New password must be at least 6 characters.";
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
      await resetPassword(token, form.newPassword, form.confirmPassword);
      sessionStorage.removeItem("passwordResetToken");
      setDone(true);
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not reset your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const fields = [
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
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18 }}>Laundry</p>
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
            Almost there.
          </h1>
          <p
            className="font-body text-sm max-w-xs"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Set a strong password you'll remember — you'll use it the next time
            you sign in.
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
          {done ? (
            /* ------------------------- Success state ------------------------- */
            <div className="text-center py-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "#DFF7F1" }}
              >
                <CheckCircle2 size={32} style={{ color: "#02C39A" }} />
              </div>
              <h2
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 22,
                  color: "#0F2C2E",
                }}
              >
                Password Reset!
              </h2>
              <p className="font-body text-sm mt-2" style={{ color: "#51787C" }}>
                Your password has been updated. Redirecting you to the login
                page…
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium mt-6 transition-opacity hover:opacity-80"
                style={{ fontFamily: "'Inter', sans-serif", color: "#028090" }}
              >
                <ArrowLeft size={14} /> Go to login now
              </Link>
            </div>
          ) : !token ? (
            /* ------------------- No token — cannot reset ------------------- */
            <div className="text-center py-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "#FDECEC" }}
              >
                <AlertCircle size={32} style={{ color: "#B3261E" }} />
              </div>
              <h2
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: 22,
                  color: "#0F2C2E",
                }}
              >
                Link expired or missing
              </h2>
              <p className="font-body text-sm mt-2" style={{ color: "#51787C" }}>
                Please request a new reset code to continue.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 text-xs font-medium mt-6 transition-opacity hover:opacity-80"
                style={{ fontFamily: "'Inter', sans-serif", color: "#028090" }}
              >
                <ArrowLeft size={14} /> Request a new code
              </Link>
            </div>
          ) : (
            /* ----------------------- Reset password form ----------------------- */
            <>
              <div className="mb-8">
                <h2
                  style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: 24,
                    color: "#0F2C2E",
                  }}
                >
                  Reset Your Password
                </h2>
                <p className="font-body text-sm mt-1" style={{ color: "#51787C" }}>
                  Choose a password only you know.
                </p>
              </div>

              {error && (
                <div
                  className="mb-5 flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#B3261E",
                    backgroundColor: "#FDECEC",
                    border: "1px solid #F5C6C0",
                  }}
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(({ key, showKey, label, placeholder }) => (
                  <div key={key}>
                    <label
                      className="text-sm font-medium mb-1.5 block"
                      style={{ fontFamily: "'Inter', sans-serif", color: "#0F2C2E" }}
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
                      <Lock size={16} style={{ color: "#51787C" }} className="shrink-0" />
                      <input
                        type={show[showKey] ? "text" : "password"}
                        required
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                        placeholder={placeholder}
                        className="bg-transparent outline-none text-sm w-full"
                        style={{ fontFamily: "'Inter', sans-serif", color: "#0F2C2E" }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShow(showKey)}
                        aria-label={show[showKey] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium text-white transition-all disabled:opacity-60 hover:brightness-110 active:scale-[0.98]"
                  style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#028090" }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save New Password"
                  )}
                </button>
              </form>

              <div className="mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ fontFamily: "'Inter', sans-serif", color: "#51787C" }}
                >
                  <ArrowLeft size={14} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
