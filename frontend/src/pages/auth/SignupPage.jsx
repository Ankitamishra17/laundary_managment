import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import { getPublicShops } from "../../api/shopApi";
import { useAuth } from "../../context/AuthContext";
import {
  Shirt,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Droplets,
  Wind,
  Sparkles,
  ArrowRight,
  MapPin,
  Phone,
  AlertCircle,
  X,
  ArrowLeft,
} from "lucide-react";

const colors = {
  bgDark: "#05282A",
  panelDark: "#0B3B3E",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

export default function SignupPage() {
  // Customers visit a specific laundry's website, so the laundry is passed
  // in the URL (?shopId=1 or ?shop=Washflow) and the account is created
  // linked to that shop — the customer is never asked to choose one.
  const deepLinkRaw = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("shopId") || params.get("shop") || "";
  })();
  const numericDeepLink = Number(deepLinkRaw);
  const [deepLinkShopId, setDeepLinkShopId] = useState(
    deepLinkRaw && Number.isFinite(numericDeepLink) ? numericDeepLink : null,
  );

  // Non-numeric deep links (e.g. ?shop=Washflow) resolve to the shop id
  // from the public shop list so the param is never silently dropped.
  useEffect(() => {
    if (deepLinkShopId || !deepLinkRaw || Number.isFinite(numericDeepLink)) return;
    (async () => {
      try {
        const res = await getPublicShops();
        if (!res.success) return;
        const wanted = String(deepLinkRaw).toLowerCase();
        const found = res.data.find(
          (s) =>
            String(s.name).toLowerCase() === wanted ||
            String(s.shopCode).toLowerCase() === wanted,
        );
        if (found) setDeepLinkShopId(found.id);
      } catch {
        /* best-effort — signup still works, account just won't be linked */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    city: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success") => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.password) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (form.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await registerUser(
        deepLinkShopId ? { ...form, shopId: deepLinkShopId } : form,
      );

      if (response.success) {
        login(response.user, response.token);
        showToast("Account created! Welcome to WashFlow 🎉", "success");
        setTimeout(() => navigate("/"), 900);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Sign up failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "su-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none";

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row"
      style={{ fontFamily: "'Inter', sans-serif", backgroundColor: colors.bgLight }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .su-input { border-color: ${colors.cardBorder}; background-color: ${colors.cardTint}; color: ${colors.textDark}; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .su-input:focus { outline: none; border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.14); background-color: #FFFFFF; }
        .su-btn-primary { background: linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint}); transition: filter 0.15s ease, transform 0.15s ease; }
        .su-btn-primary:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
        .su-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .su-link { color: ${colors.primaryTeal}; transition: color 0.15s ease; }
        .su-link:hover { color: ${colors.mint}; }
        @keyframes su-toast-in { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .su-toast { animation: su-toast-in 0.2s ease-out; }
      `}</style>

      {/* TOASTS */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 w-[calc(100%-2.5rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="su-toast flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl"
            style={{ backgroundColor: colors.bgDark, border: `1px solid ${t.type === "success" ? colors.mint : "#E0645C"}55` }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: t.type === "success" ? `${colors.mint}26` : "#E0645C26" }}>
              {t.type === "success" ? <CheckCircle2 size={15} color={colors.mint} /> : <AlertCircle size={15} color="#E0645C" />}
            </div>
            <p className="text-sm flex-1 leading-snug" style={{ color: "#FFFFFF" }}>{t.message}</p>
            <button onClick={() => removeToast(t.id)} aria-label="Dismiss" style={{ color: "#8FB3B0" }} className="flex-shrink-0">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* LEFT / BRAND PANEL */}
      <div
        className="relative overflow-hidden hidden lg:flex lg:w-[44%] flex-col justify-between px-12 py-14 xl:px-16"
        style={{ backgroundColor: colors.bgDark }}
      >
        <div className="absolute -top-20 -right-24 w-72 h-72 rounded-full" style={{ backgroundColor: colors.panelDark, opacity: 0.7 }} />
        <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full" style={{ backgroundColor: colors.panelDark, opacity: 0.5 }} />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primaryTeal }}>
              <Shirt size={20} color="#FFFFFF" strokeWidth={2} />
            </div>
            <span className="text-sm tracking-[0.2em] uppercase" style={{ color: colors.mint, fontWeight: 600 }}>
              WashFlow
            </span>
          </Link>

          <h1 className="mt-12 text-4xl xl:text-5xl leading-tight" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
            Fresh laundry,
            <br />
            zero effort.
          </h1>
          <p className="mt-5 text-base max-w-sm leading-relaxed" style={{ color: "#A9C9C6" }}>
            Join thousands of customers who never think about laundry again.
            Book, track and receive — all from one dashboard.
          </p>
        </div>

        {/* perks */}
        <div className="relative z-10 mt-10 space-y-4">
          {[
            { icon: Droplets, text: "Premium wash, dry & fold care" },
            { icon: Wind, text: "Same-day pickup & delivery" },
            { icon: Sparkles, text: "Live tracking from door to door" },
          ].map((p) => (
            <div key={p.text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.mint}22` }}>
                <p.icon size={16} color={colors.mint} />
              </div>
              <span className="text-sm" style={{ color: "#C8E3E0" }}>{p.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT / FORM */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-lg">
          <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium mb-6" style={{ color: colors.primaryTeal }}>
            <ArrowLeft size={14} /> Back to home
          </Link>

          <span className="text-xs tracking-[0.2em] uppercase" style={{ color: colors.mint, fontWeight: 600 }}>
            Create your account
          </span>
          <h2 className="mt-3 text-3xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
            Join WashFlow
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
            {deepLinkShopId
              ? "Create your account in seconds — you're all set with your laundry."
              : "Create your account in seconds and start ordering."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Full name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                <input id="name" type="text" required value={form.name} onChange={update("name")} placeholder="e.g. Ananya Sharma" className={inputClass} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* email */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Email address *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                  <input id="email" type="email" required value={form.email} onChange={update("email")} placeholder="you@email.com" className={inputClass} />
                </div>
              </div>
              {/* phone */}
              <div>
                <label htmlFor="phone" className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Phone number *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                  <input id="phone" type="tel" required value={form.phone} onChange={update("phone")} placeholder="98765 43210" className={inputClass} />
                </div>
              </div>
            </div>

            {/* password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={update("password")}
                  placeholder="At least 6 characters"
                  className="su-input w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm outline-none"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* address */}
              <div>
                <label htmlFor="address" className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Address</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                  <input id="address" type="text" value={form.address} onChange={update("address")} placeholder="Flat, street, area" className={inputClass} />
                </div>
              </div>
              {/* city */}
              <div>
                <label htmlFor="city" className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>City</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                  <input id="city" type="text" value={form.city} onChange={update("city")} placeholder="e.g. Bengaluru" className={inputClass} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="su-btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg mt-2">
              {submitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: colors.cardBorder }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: colors.textMuted }}>Already a member?</span>
            <div className="h-px flex-1" style={{ backgroundColor: colors.cardBorder }} />
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: colors.textMuted }}>
            Have an account?{" "}
            <Link to="/login" className="su-link font-medium">Sign in instead</Link>
            <span className="mx-1.5" style={{ color: colors.cardBorder }}>•</span>
            <Link to="/" className="su-link font-medium">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
