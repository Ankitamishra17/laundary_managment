import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  WashingMachine,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { forgotPassword, verifyResetOtp } from "../../api/authApi";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (!res?.success) {
        setError("Could not send the reset code. Please try again.");
        return;
      }
      setStep("otp");
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not send the reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (!res?.success) {
        setError("Could not resend the code. Please try again.");
        return;
      }
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await verifyResetOtp(email, otp);
      if (!res?.success || !res.token) {
        setError("That code didn't work. Please try again.");
        return;
      }
      // Carry the short-lived reset token into the reset step without putting
      // it in the URL. Cleared once the new password is saved.
      sessionStorage.setItem("passwordResetToken", res.token);
      navigate("/reset-password");
    } catch (err) {
      setError(err.response?.data?.message || "That code didn't work. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            {step === "email" ? (
              <Mail size={28} style={{ color: "#02C39A" }} />
            ) : (
              <KeyRound size={28} style={{ color: "#02C39A" }} />
            )}
          </div>
          <h1
            className="text-3xl sm:text-4xl max-w-xs leading-snug"
            style={{ fontFamily: "'Libre Baskerville', serif" }}
          >
            {step === "email" ? "Let's get you back in." : "Check your inbox."}
          </h1>
          <p
            className="font-body text-sm max-w-xs"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {step === "email"
              ? "Enter your registered email and we'll send you a one-time code to reset your password."
              : "We've sent a 6-digit code to your email. Enter it below to set a new password."}
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
              {step === "email" ? "Forgot Password" : "Verify Your Code"}
            </h2>
            <p className="font-body text-sm mt-1" style={{ color: "#51787C" }}>
              {step === "email"
                ? "We'll email you a one-time code."
                : `A 6-digit code was sent to ${email || "your email"}.`}
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

          {step === "email" ? (
            /* ------------------------- Step 1: email ------------------------- */
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  style={{ fontFamily: "'Inter', sans-serif", color: "#0F2C2E" }}
                >
                  Registered Email
                </label>
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{
                    border: "1px solid #D8ECEA",
                    backgroundColor: "#EEF7F6",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <Mail size={16} style={{ color: "#51787C" }} className="shrink-0" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@facility.com"
                    className="bg-transparent outline-none text-sm w-full"
                    style={{ fontFamily: "'Inter', sans-serif", color: "#0F2C2E" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium text-white transition-all disabled:opacity-60 hover:brightness-110 active:scale-[0.98]"
                style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#028090" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send Code <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ------------------------- Step 2: OTP ------------------------- */
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  style={{ fontFamily: "'Inter', sans-serif", color: "#0F2C2E" }}
                >
                  One-Time Code
                </label>
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{
                    border: "1px solid #D8ECEA",
                    backgroundColor: "#EEF7F6",
                  }}
                >
                  <KeyRound size={16} style={{ color: "#51787C" }} className="shrink-0" />
                  <input
                    ref={otpInputRef}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="bg-transparent outline-none text-sm w-full tracking-[0.35em] font-semibold"
                    style={{ fontFamily: "'Inter', sans-serif", color: "#0F2C2E" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium text-white transition-all disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
                style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#028090" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Verify & Continue
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || cooldown > 0}
                  className="text-xs font-medium transition-colors disabled:opacity-50"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#028090",
                  }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setOtp("");
                  }}
                  className="text-xs font-medium"
                  style={{ fontFamily: "'Inter', sans-serif", color: "#51787C" }}
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}

          {step === "email" && (
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                style={{ fontFamily: "'Inter', sans-serif", color: "#51787C" }}
              >
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          )}

          {step === "otp" && (
            <div
              className="mt-6 flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "#02724F",
                backgroundColor: "#DFF7F1",
                border: "1px solid #B9E9D9",
              }}
            >
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              <span>
                The code expires in 10 minutes. After verifying, you'll be able to set a new password.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
