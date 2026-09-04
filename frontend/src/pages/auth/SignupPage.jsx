import React, { useState, useCallback, useRef, useEffect } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { registerUser } from "../../api/authApi";
import api from "../../api/axios";
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

// ============================================================
// COLORS
// ============================================================

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

// ============================================================
// SIGNUP PAGE
// ============================================================

export default function SignupPage() {
  const { slug } = useParams();

  const navigate = useNavigate();

  const { login } = useAuth();

  // ==========================================================
  // SHOP STATE
  // ==========================================================

  const [shop, setShop] = useState(null);

  const [shopLoading, setShopLoading] = useState(true);

  const [shopError, setShopError] = useState("");

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    city: "",
  });

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // TOAST STATE
  // ==========================================================

  const [toasts, setToasts] = useState([]);

  const toastId = useRef(0);

  // ==========================================================
  // LOAD SHOP USING SLUG
  //
  // URL:
  //
  // /laundry-shop/signup
  //
  // useParams():
  //
  // slug = "laundry-shop"
  // ==========================================================

  useEffect(() => {
    const loadShop = async () => {
      // ------------------------------------------------------
      // SLUG VALIDATION
      // ------------------------------------------------------

      if (!slug) {
        setShop(null);

        setShopError("Please open the signup page from a valid laundry shop.");

        setShopLoading(false);

        return;
      }

      try {
        setShopLoading(true);

        setShopError("");

        setShop(null);

        // ----------------------------------------------------
        // GET SHOP BY SLUG
        // ----------------------------------------------------

        const response = await api.get(
          `/shops/slug/${encodeURIComponent(slug)}`,
        );

        // ----------------------------------------------------
        // CHECK RESPONSE
        // ----------------------------------------------------

        if (response.data?.success && response.data?.data) {
          setShop(response.data.data);
        } else {
          setShopError(
            response.data?.message || "This laundry shop is not available.",
          );
        }
      } catch (error) {
        console.error("Shop load error:", error);

        setShopError(
          error.response?.data?.message ||
            "This laundry shop could not be found.",
        );
      } finally {
        setShopLoading(false);
      }
    };

    loadShop();
  }, [slug]);

  // ==========================================================
  // REMOVE TOAST
  // ==========================================================

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // ==========================================================
  // SHOW TOAST
  // ==========================================================

  const showToast = useCallback(
    (message, type = "success") => {
      const id = ++toastId.current;

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
        },
      ]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast],
  );

  // ==========================================================
  // FORM UPDATE
  // ==========================================================

  const update = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  // ==========================================================
  // HANDLE CUSTOMER SIGNUP
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // --------------------------------------------------------
    // SHOP VALIDATION
    // --------------------------------------------------------

    if (!slug || !shop) {
      showToast("Shop information is not available.", "error");

      return;
    }

    // --------------------------------------------------------
    // NAME VALIDATION
    // --------------------------------------------------------

    if (!form.name.trim()) {
      showToast("Please enter your full name.", "error");

      return;
    }

    // --------------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------------

    if (!form.email.trim()) {
      showToast("Please enter your email address.", "error");

      return;
    }

    // --------------------------------------------------------
    // PHONE VALIDATION
    // --------------------------------------------------------

    if (!form.phone.trim()) {
      showToast("Please enter your phone number.", "error");

      return;
    }

    // --------------------------------------------------------
    // PASSWORD VALIDATION
    // --------------------------------------------------------

    if (!form.password) {
      showToast("Please enter a password.", "error");

      return;
    }

    if (form.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");

      return;
    }

    try {
      setSubmitting(true);

      // ======================================================
      // IMPORTANT
      //
      // DO NOT SEND:
      //
      // shopId: shop.id
      //
      // SEND:
      //
      // slug
      //
      // Backend will resolve:
      //
      // slug -> Shop -> shop.id
      // ======================================================

      const payload = {
        name: form.name.trim(),

        email: form.email.trim().toLowerCase(),

        phone: form.phone.trim(),

        password: form.password,

        address: form.address.trim() || null,

        city: form.city.trim() || null,

        // ⭐ VERY IMPORTANT
        slug: slug.trim().toLowerCase(),
      };

      console.log("Customer Signup Payload:", payload);

      // ======================================================
      // REGISTER CUSTOMER
      // ======================================================

      const response = await registerUser(payload);

      console.log("Customer Signup Response:", response);

      // ======================================================
      // SUCCESS
      // ======================================================

      if (response?.success) {
        // ----------------------------------------------------
        // SAVE LOGIN
        // ----------------------------------------------------

        if (response.user && response.token) {
          login(response.user, response.token);
        }

        // ----------------------------------------------------
        // SAVE SHOP
        // ----------------------------------------------------

        if (response.shop) {
          localStorage.setItem("shop", JSON.stringify(response.shop));
        }

        // ----------------------------------------------------
        // SUCCESS TOAST
        // ----------------------------------------------------

        showToast(
          `Account created successfully! Welcome to ${
            shop.name || "our laundry"
          }.`,
          "success",
        );

        // ----------------------------------------------------
        // REDIRECT
        //
        // Keep customer inside the same shop.
        // ----------------------------------------------------

        setTimeout(() => {
          navigate(`/${slug}/dashboard`);
        }, 900);

        return;
      }

      // ======================================================
      // API RETURNED ERROR
      // ======================================================

      showToast(
        response?.message || "Sign up failed. Please try again.",
        "error",
      );
    } catch (error) {
      console.error("Registration error:", error);

      showToast(
        error.response?.data?.message ||
          error.message ||
          "Sign up failed. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // INPUT CLASS
  // ==========================================================

  const inputClass =
    "su-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none";

  // ==========================================================
  // LOADING
  // ==========================================================

  if (shopLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          backgroundColor: colors.bgLight,

          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-4 animate-spin mx-auto"
            style={{
              borderColor: `${colors.primaryTeal} transparent ${colors.primaryTeal} ${colors.primaryTeal}`,
            }}
          />

          <p
            className="mt-4 text-sm"
            style={{
              color: colors.textMuted,
            }}
          >
            Loading shop...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // SHOP NOT FOUND
  // ==========================================================

  if (shopError || !shop) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          backgroundColor: colors.bgLight,

          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="w-full max-w-md text-center">
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "#FDEDEC",
            }}
          >
            <AlertCircle size={28} color="#E0645C" />
          </div>

          <h1
            className="mt-5 text-2xl"
            style={{
              color: colors.textDark,

              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            Shop not found
          </h1>

          <p
            className="mt-3 text-sm"
            style={{
              color: colors.textMuted,
            }}
          >
            {shopError ||
              "The laundry shop you are trying to access does not exist."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 px-5 py-3 rounded-xl text-sm font-semibold text-white"
            style={{
              backgroundColor: colors.primaryTeal,
            }}
          >
            Go to home
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row"
      style={{
        fontFamily: "'Inter', sans-serif",

        backgroundColor: colors.bgLight,
      }}
    >
      {/* ======================================================
          CUSTOM CSS
      ====================================================== */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

        .su-input {
          border-color: ${colors.cardBorder};
          background-color: ${colors.cardTint};
          color: ${colors.textDark};

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background-color 0.15s ease;
        }

        .su-input:focus {
          outline: none;

          border-color:
            ${colors.primaryTeal};

          box-shadow:
            0 0 0 3px rgba(
              2,
              128,
              144,
              0.14
            );

          background-color:
            #FFFFFF;
        }

        .su-btn-primary {
          background:
            linear-gradient(
              95deg,
              ${colors.primaryTeal},
              ${colors.mint}
            );

          transition:
            filter 0.15s ease,
            transform 0.15s ease;
        }

        .su-btn-primary:hover:not(:disabled) {
          filter: brightness(1.06);

          transform:
            translateY(-1px);
        }

        .su-btn-primary:disabled {
          opacity: 0.6;

          cursor:
            not-allowed;
        }

        .su-link {
          color:
            ${colors.primaryTeal};

          transition:
            color 0.15s ease;
        }

        .su-link:hover {
          color:
            ${colors.mint};
        }

        @keyframes su-toast-in {
          from {
            opacity: 0;
            transform:
              translateY(-10px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .su-toast {
          animation:
            su-toast-in
            0.2s
            ease-out;
        }
      `}</style>

      {/* ======================================================
          TOASTS
      ====================================================== */}

      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 w-[calc(100%-2.5rem)] max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="su-toast flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl"
            style={{
              backgroundColor: colors.bgDark,

              border: `1px solid ${
                toast.type === "success" ? colors.mint : "#E0645C"
              }55`,
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor:
                  toast.type === "success" ? `${colors.mint}26` : "#E0645C26",
              }}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={15} color={colors.mint} />
              ) : (
                <AlertCircle size={15} color="#E0645C" />
              )}
            </div>

            <p
              className="text-sm flex-1 leading-snug"
              style={{
                color: "#FFFFFF",
              }}
            >
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0"
              aria-label="Dismiss notification"
              style={{
                color: "#8FB3B0",
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* ======================================================
          LEFT BRAND PANEL
      ====================================================== */}

      <div
        className="relative overflow-hidden hidden lg:flex lg:w-[44%] flex-col justify-between px-12 py-14 xl:px-16"
        style={{
          backgroundColor: colors.bgDark,
        }}
      >
        {/* Decorative circles */}

        <div
          className="absolute -top-20 -right-24 w-72 h-72 rounded-full"
          style={{
            backgroundColor: colors.panelDark,

            opacity: 0.7,
          }}
        />

        <div
          className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full"
          style={{
            backgroundColor: colors.panelDark,

            opacity: 0.5,
          }}
        />

        {/* Brand */}

        <div className="relative z-10">
          <Link to={`/${slug}`} className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: shop.primaryColor || colors.primaryTeal,
              }}
            >
              {shop.logo ? (
                <img
                  src={shop.logo}
                  alt={shop.name || "Shop"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shirt size={20} color="#FFFFFF" />
              )}
            </div>

            <span
              className="text-sm tracking-[0.2em] uppercase"
              style={{
                color: colors.mint,

                fontWeight: 600,
              }}
            >
              {shop.name}
            </span>
          </Link>

          <h1
            className="mt-12 text-4xl xl:text-5xl leading-tight"
            style={{
              color: "#FFFFFF",

              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            Fresh laundry,
            <br />
            zero effort.
          </h1>

          <p
            className="mt-5 text-base max-w-sm leading-relaxed"
            style={{
              color: "#A9C9C6",
            }}
          >
            Create your account with {shop.name} and book, track and manage your
            laundry orders from one place.
          </p>
        </div>

        {/* Perks */}

        <div className="relative z-10 mt-10 space-y-4">
          {[
            {
              icon: Droplets,
              text: "Premium wash, dry & fold care",
            },
            {
              icon: Wind,
              text: "Same-day pickup & delivery",
            },
            {
              icon: Sparkles,
              text: "Live order tracking",
            },
          ].map((perk) => (
            <div key={perk.text} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${colors.mint}22`,
                }}
              >
                <perk.icon size={16} color={colors.mint} />
              </div>

              <span
                className="text-sm"
                style={{
                  color: "#C8E3E0",
                }}
              >
                {perk.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================
          RIGHT FORM
      ====================================================== */}

      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-lg">
          {/* MOBILE BACK */}

          <Link
            to={`/${slug}`}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium mb-6"
            style={{
              color: colors.primaryTeal,
            }}
          >
            <ArrowLeft size={14} />
            Back to {shop.name}
          </Link>

          {/* SHOP NAME */}

          <span
            className="text-xs tracking-[0.2em] uppercase"
            style={{
              color: colors.mint,

              fontWeight: 600,
            }}
          >
            {shop.name}
          </span>

          {/* HEADING */}

          <h2
            className="mt-3 text-3xl"
            style={{
              color: colors.textDark,

              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            Create your account
          </h2>

          <p
            className="mt-2 text-sm leading-relaxed"
            style={{
              color: colors.textMuted,
            }}
          >
            Create your account and start ordering from {shop.name}.
          </p>

          {/* ==================================================
              FORM
          ================================================== */}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* NAME */}

            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium mb-1.5"
                style={{
                  color: colors.textDark,
                }}
              >
                Full name *
              </label>

              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{
                    color: colors.textMuted,
                  }}
                />

                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="e.g. Richa Sharma"
                  className={inputClass}
                />
              </div>
            </div>

            {/* EMAIL + PHONE */}

            <div className="grid sm:grid-cols-2 gap-4">
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium mb-1.5"
                  style={{
                    color: colors.textDark,
                  }}
                >
                  Email address *
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{
                      color: colors.textMuted,
                    }}
                  />

                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@email.com"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* PHONE */}

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium mb-1.5"
                  style={{
                    color: colors.textDark,
                  }}
                >
                  Phone number *
                </label>

                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{
                      color: colors.textMuted,
                    }}
                  />

                  <input
                    id="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="9876543210"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium mb-1.5"
                style={{
                  color: colors.textDark,
                }}
              >
                Password *
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{
                    color: colors.textMuted,
                  }}
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update("password")}
                  placeholder="At least 6 characters"
                  className="su-input w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{
                    color: colors.textMuted,
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* ADDRESS + CITY */}

            <div className="grid sm:grid-cols-2 gap-4">
              {/* ADDRESS */}

              <div>
                <label
                  htmlFor="address"
                  className="block text-xs font-medium mb-1.5"
                  style={{
                    color: colors.textDark,
                  }}
                >
                  Address
                </label>

                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{
                      color: colors.textMuted,
                    }}
                  />

                  <input
                    id="address"
                    type="text"
                    autoComplete="street-address"
                    value={form.address}
                    onChange={update("address")}
                    placeholder="Flat, street, area"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* CITY */}

              <div>
                <label
                  htmlFor="city"
                  className="block text-xs font-medium mb-1.5"
                  style={{
                    color: colors.textDark,
                  }}
                >
                  City
                </label>

                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{
                      color: colors.textMuted,
                    }}
                  />

                  <input
                    id="city"
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={update("city")}
                    placeholder="e.g. Noida"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              disabled={submitting || shopLoading}
              className="su-btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg mt-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* ==================================================
              LOGIN SECTION
          ================================================== */}

          <div className="mt-7 flex items-center gap-3">
            <div
              className="h-px flex-1"
              style={{
                backgroundColor: colors.cardBorder,
              }}
            />

            <span
              className="text-[11px] uppercase tracking-wider"
              style={{
                color: colors.textMuted,
              }}
            >
              Already a member?
            </span>

            <div
              className="h-px flex-1"
              style={{
                backgroundColor: colors.cardBorder,
              }}
            />
          </div>

          <p
            className="mt-5 text-center text-xs"
            style={{
              color: colors.textMuted,
            }}
          >
            Have an account?{" "}
            <Link to={`/${slug}/login`} className="su-link font-medium">
              Sign in instead
            </Link>
            <span
              className="mx-1.5"
              style={{
                color: colors.cardBorder,
              }}
            >
              •
            </span>
            <Link to={`/${slug}`} className="su-link font-medium">
              Back to {shop.name}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
