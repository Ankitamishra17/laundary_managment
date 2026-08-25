// import React, { useState, useCallback, useRef, useEffect } from "react";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import { loginUser } from "../../api/authApi";
// import { useAuth } from "../../context/AuthContext";
// import {
//   Shirt,
//   Mail,
//   Lock,
//   Eye,
//   EyeOff,
//   CheckCircle2,
//   Droplets,
//   Wind,
//   ArrowRight,
//   Gauge,
//   AlertCircle,
//   X,
// } from "lucide-react";

// const colors = {
//   bgDark: "#05282A",
//   panelDark: "#0B3B3E",
//   primaryTeal: "#028090",
//   seafoam: "#00A896",
//   mint: "#02C39A",
//   bgLight: "#FFFFFF",
//   cardTint: "#EEF7F6",
//   cardBorder: "#D8ECEA",
//   textDark: "#0F2C2E",
//   textMuted: "#5C7A78",
// };

// export default function LaundryLoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [remember, setRemember] = useState(true);
//   const [toasts, setToasts] = useState([]);
//   const toastId = useRef(0);
//   const sessionNoticeShown = useRef(false);
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   // Show a friendly notice when the user was bounced back here because their
//   // session expired (redirected by the 401 handler in api/session.js).
//   useEffect(() => {
//     if (sessionNoticeShown.current) return;
//     const params = new URLSearchParams(window.location.search);
//     if (params.get("session") === "expired") {
//       sessionNoticeShown.current = true;
//       showToast("Your session has expired. Please log in again.", "error");
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const removeToast = useCallback((id) => {
//     setToasts((prev) => prev.filter((t) => t.id !== id));
//   }, []);

//   const showToast = useCallback(
//     (message, type = "success") => {
//       const id = ++toastId.current;
//       setToasts((prev) => [...prev, { id, message, type }]);
//       setTimeout(() => removeToast(id), 3500);
//     },
//     [removeToast],
//   );

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!email || !password) {
//       showToast("Please enter your email and password.", "error");
//       return;
//     }

//     try {
//       const response = await loginUser({
//         email,
//         password,
//       });

//       if (response.success) {
//         login(response.user, response.token);

//         showToast("Login successful!", "success");

//         // Only Admin must create a new password
//         if (response.user.role === "admin" && response.mustChangePassword) {
//           navigate("/create-password");
//           return;
//         }

//         switch (response.user.role) {
//           case "super_admin":
//             navigate("/super/dashboard");
//             break;

//           case "admin":
//             navigate("/admin/dashboard");
//             break;

//           case "employee":
//             navigate("/employee/dashboard");
//             break;

//           case "customer":
//             // Customers stay on the same website — the navbar now shows
//             // their profile instead of the Login button.
//             navigate("/");
//             break;

//           default:
//             showToast("Unknown user role.", "error");
//         }
//       }
//     } catch (error) {
//       showToast(error.response?.data?.message || "Login failed", "error");
//     }
//   };

//   return (
//     <div
//       className="min-h-screen w-full flex flex-col lg:flex-row"
//       style={{
//         fontFamily: "'Inter', sans-serif",
//         backgroundColor: colors.bgLight,
//       }}
//     >
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
//         .lp-input {
//           transition: border-color 0.15s ease, box-shadow 0.15s ease;
//           border-color: ${colors.cardBorder};
//         }
//         .lp-input:focus {
//           outline: none;
//           border-color: ${colors.primaryTeal};
//           box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.14);
//         }
//         .lp-btn-primary {
//           background: linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint});
//           transition: filter 0.15s ease, transform 0.15s ease;
//         }
//         .lp-btn-primary:hover {
//           filter: brightness(1.06);
//           transform: translateY(-1px);
//         }
//         .lp-link {
//           color: ${colors.primaryTeal};
//           transition: color 0.15s ease;
//         }
//         .lp-link:hover {
//           color: ${colors.mint};
//         }
//         .lp-checkbox:checked {
//           background-color: ${colors.primaryTeal};
//           border-color: ${colors.primaryTeal};
//         }
//         @keyframes lp-toast-in {
//           from { opacity: 0; transform: translateY(-10px) scale(0.98); }
//           to { opacity: 1; transform: translateY(0) scale(1); }
//         }
//         .lp-toast {
//           animation: lp-toast-in 0.2s ease-out;
//         }
//       `}</style>

//       {/* TOAST CONTAINER */}
//       <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 w-[calc(100%-2.5rem)] max-w-sm">
//         {toasts.map((t) => (
//           <div
//             key={t.id}
//             className="lp-toast flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl"
//             style={{
//               backgroundColor: colors.bgDark,
//               border: `1px solid ${t.type === "success" ? colors.mint : "#E0645C"}55`,
//               fontFamily: "'Inter', sans-serif",
//             }}
//           >
//             <div
//               className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
//               style={{
//                 backgroundColor:
//                   t.type === "success" ? `${colors.mint}26` : "#E0645C26",
//               }}
//             >
//               {t.type === "success" ? (
//                 <CheckCircle2 size={15} color={colors.mint} />
//               ) : (
//                 <AlertCircle size={15} color="#E0645C" />
//               )}
//             </div>
//             <p
//               className="text-sm flex-1 leading-snug"
//               style={{ color: "#FFFFFF" }}
//             >
//               {t.message}
//             </p>
//             <button
//               onClick={() => removeToast(t.id)}
//               aria-label="Dismiss notification"
//               style={{ color: "#8FB3B0" }}
//               className="flex-shrink-0"
//             >
//               <X size={15} />
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* LEFT / HERO PANEL */}
//       <div
//         className="relative overflow-hidden hidden lg:flex lg:w-[46%] flex-col justify-between px-12 py-14 xl:px-16"
//         style={{ backgroundColor: colors.bgDark }}
//       >
//         {/* decorative corner circles */}
//         <div
//           className="absolute -top-20 -right-24 w-72 h-72 rounded-full"
//           style={{ backgroundColor: colors.panelDark, opacity: 0.7 }}
//         />
//         <div
//           className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full"
//           style={{ backgroundColor: colors.panelDark, opacity: 0.5 }}
//         />

//         <div className="relative z-10">
//           <div className="flex items-center gap-3">
//             <div
//               className="w-11 h-11 rounded-full flex items-center justify-center"
//               style={{ backgroundColor: colors.primaryTeal }}
//             >
//               <Shirt size={20} color="#FFFFFF" strokeWidth={2} />
//             </div>
//             <span
//               className="text-sm tracking-[0.2em] uppercase"
//               style={{
//                 color: colors.mint,
//                 fontFamily: "'Inter', sans-serif",
//                 fontWeight: 600,
//               }}
//             >
//               Laundry OS
//             </span>
//           </div>

//           <h1
//             className="mt-12 text-4xl xl:text-5xl leading-tight"
//             style={{
//               color: "#FFFFFF",
//               fontFamily: "'Libre Baskerville', serif",
//             }}
//           >
//             Every load,
//             <br />
//             tracked to the door.
//           </h1>
//           <p
//             className="mt-5 text-base max-w-sm leading-relaxed"
//             style={{ color: "#A9C9C6" }}
//           >
//             Sign in to manage pickups, wash cycles, and deliveries across every
//             facility from one dashboard.
//           </p>
//         </div>

//         {/* Mock ticket card - signature element */}
//         <div className="relative z-10 mt-10">
//           <div
//             className="rounded-2xl p-5 shadow-2xl"
//             style={{
//               backgroundColor: colors.panelDark,
//               border: `1px solid ${colors.primaryTeal}55`,
//             }}
//           >
//             <div className="flex items-center justify-between">
//               <span
//                 className="text-sm"
//                 style={{
//                   color: "#FFFFFF",
//                   fontFamily: "'Libre Baskerville', serif",
//                 }}
//               >
//                 Ticket #A-2481
//               </span>
//               <span
//                 className="flex items-center gap-1 text-xs font-medium"
//                 style={{ color: colors.mint }}
//               >
//                 <CheckCircle2 size={14} /> Ready
//               </span>
//             </div>

//             <div className="mt-5 flex items-center gap-2">
//               {[
//                 { icon: Droplets, label: "Washing", color: colors.primaryTeal },
//                 { icon: Wind, label: "Drying", color: colors.seafoam },
//                 { icon: CheckCircle2, label: "Ready", color: colors.mint },
//               ].map((stage, i) => (
//                 <React.Fragment key={stage.label}>
//                   <div className="flex flex-col items-center gap-1.5">
//                     <div
//                       className="w-8 h-8 rounded-full flex items-center justify-center"
//                       style={{ backgroundColor: stage.color }}
//                     >
//                       <stage.icon size={14} color="#FFFFFF" />
//                     </div>
//                     <span className="text-[10px]" style={{ color: "#A9C9C6" }}>
//                       {stage.label}
//                     </span>
//                   </div>
//                   {i < 2 && (
//                     <div
//                       className="flex-1 h-px mb-4"
//                       style={{ backgroundColor: colors.mint }}
//                     />
//                   )}
//                 </React.Fragment>
//               ))}
//             </div>
//           </div>

//           {/* stats row */}
//           <div className="mt-8 grid grid-cols-3 gap-4">
//             {[
//               {
//                 icon: Droplets,
//                 value: "128",
//                 label: "Orders today",
//                 color: colors.primaryTeal,
//               },
//               {
//                 icon: Gauge,
//                 value: "99.2%",
//                 label: "On-time rate",
//                 color: colors.seafoam,
//               },
//               {
//                 icon: Wind,
//                 value: "24",
//                 label: "Machines active",
//                 color: colors.mint,
//               },
//             ].map((stat) => (
//               <div key={stat.label}>
//                 <div
//                   className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
//                   style={{ backgroundColor: `${stat.color}26` }}
//                 >
//                   <stat.icon size={15} color={stat.color} />
//                 </div>
//                 <div
//                   className="text-lg"
//                   style={{
//                     color: "#FFFFFF",
//                     fontFamily: "'Libre Baskerville', serif",
//                   }}
//                 >
//                   {stat.value}
//                 </div>
//                 <div className="text-[11px]" style={{ color: "#8FB3B0" }}>
//                   {stat.label}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* MOBILE TOP BANNER */}
//       <div
//         className="flex lg:hidden items-center gap-3 px-6 py-6"
//         style={{ backgroundColor: colors.bgDark }}
//       >
//         <div
//           className="w-10 h-10 rounded-full flex items-center justify-center"
//           style={{ backgroundColor: colors.primaryTeal }}
//         >
//           <Shirt size={18} color="#FFFFFF" />
//         </div>
//         <span
//           className="text-sm tracking-[0.2em] uppercase"
//           style={{ color: colors.mint, fontWeight: 600 }}
//         >
//           Laundry OS
//         </span>
//       </div>

//       {/* RIGHT / FORM PANEL */}
//       <div
//         className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16"
//         style={{ backgroundColor: colors.bgLight }}
//       >
//         <div className="w-full max-w-sm">
//           <span
//             className="text-xs tracking-[0.2em] uppercase"
//             style={{ color: colors.mint, fontWeight: 600 }}
//           >
//             Facility Sign In
//           </span>
//           <h2
//             className="mt-3 text-3xl"
//             style={{
//               color: colors.textDark,
//               fontFamily: "'Libre Baskerville', serif",
//             }}
//           >
//             Welcome back
//           </h2>
//           <p
//             className="mt-2 text-sm leading-relaxed"
//             style={{ color: colors.textMuted }}
//           >
//             Sign in to your laundry management dashboard to continue.
//           </p>

//           <form onSubmit={handleSubmit} className="mt-8 space-y-5">
//             <div>
//               <label
//                 htmlFor="email"
//                 className="block text-xs font-medium mb-1.5"
//                 style={{ color: colors.textDark }}
//               >
//                 Email address
//               </label>
//               <div className="relative">
//                 <Mail
//                   size={16}
//                   className="absolute left-3.5 top-1/2 -translate-y-1/2"
//                   style={{ color: colors.textMuted }}
//                 />
//                 <input
//                   id="email"
//                   type="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="you@facility.com"
//                   className="lp-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm"
//                   style={{
//                     backgroundColor: colors.cardTint,
//                     color: colors.textDark,
//                   }}
//                 />
//               </div>
//             </div>

//             <div>
//               <div className="flex items-center justify-between mb-1.5">
//                 <label
//                   htmlFor="password"
//                   className="block text-xs font-medium"
//                   style={{ color: colors.textDark }}
//                 >
//                   Password
//                 </label>
//                 <Link to="/forgot-password" className="lp-link text-xs font-medium">
//                   Forgot password?
//                 </Link>
//               </div>
//               <div className="relative">
//                 <Lock
//                   size={16}
//                   className="absolute left-3.5 top-1/2 -translate-y-1/2"
//                   style={{ color: colors.textMuted }}
//                 />
//                 <input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter your password"
//                   className="lp-input w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm"
//                   style={{
//                     backgroundColor: colors.cardTint,
//                     color: colors.textDark,
//                   }}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((v) => !v)}
//                   className="absolute right-3.5 top-1/2 -translate-y-1/2"
//                   style={{ color: colors.textMuted }}
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                   {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                 </button>
//               </div>
//             </div>

//             <label className="flex items-center gap-2 cursor-pointer select-none">
//               <input
//                 type="checkbox"
//                 checked={remember}
//                 onChange={(e) => setRemember(e.target.checked)}
//                 className="lp-checkbox w-4 h-4 rounded appearance-none border cursor-pointer"
//                 style={{ borderColor: colors.cardBorder }}
//               />
//               <span className="text-xs" style={{ color: colors.textMuted }}>
//                 Keep me signed in on this device
//               </span>
//             </label>

//             <button
//               type="submit"
//               className="lp-btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg"
//             >
//               Sign in
//               <ArrowRight size={16} />
//             </button>
//           </form>

//           <div className="mt-8 flex items-center gap-3">
//             <div
//               className="h-px flex-1"
//               style={{ backgroundColor: colors.cardBorder }}
//             />
//             <span
//               className="text-[11px] uppercase tracking-wider"
//               style={{ color: colors.textMuted }}
//             >
//               Need access
//             </span>
//             <div
//               className="h-px flex-1"
//               style={{ backgroundColor: colors.cardBorder }}
//             />
//           </div>

//           <p
//             className="mt-5 text-center text-xs leading-relaxed"
//             style={{ color: colors.textMuted }}
//           >
//             Don't have an account?{" "}
//             <Link to="/signup" className="lp-link font-medium">
//               Create one free
//             </Link>
//             <span className="mx-1.5" style={{ color: colors.cardBorder }}>•</span>
//             <Link to="/" className="lp-link font-medium">
//               Visit our site
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import api from "../../api/axios";
import { loginUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

import {
  Shirt,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Droplets,
  Wind,
  ArrowRight,
  Gauge,
  AlertCircle,
  X,
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

export default function LaundryLoginPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // If slug exists, this is a shop/customer login page
  const isShopLogin = Boolean(slug);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(isShopLogin);

  const [toasts, setToasts] = useState([]);

  const toastId = useRef(0);
  const sessionNoticeShown = useRef(false);

  // ============================================================
  // TOAST
  // ============================================================

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

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
      }, 3500);
    },
    [removeToast],
  );

  // ============================================================
  // GET SHOP FROM SLUG
  // GET /api/shops/slug/:slug
  // ============================================================

  useEffect(() => {
    const loadShop = async () => {
      // Normal admin login page
      if (!isShopLogin) {
        setShop(null);
        setShopLoading(false);
        return;
      }

      try {
        setShopLoading(true);

        const response = await api.get(`/shops/slug/${slug}`);

        if (response.data?.success) {
          setShop(response.data.data);
        } else {
          setShop(null);
          showToast("Shop not found.", "error");
        }
      } catch (error) {
        console.error("Get Shop Error:", error);

        setShop(null);

        showToast(
          error.response?.data?.message ||
            "This shop could not be found.",
          "error",
        );
      } finally {
        setShopLoading(false);
      }
    };

    loadShop();
  }, [slug, isShopLogin, showToast]);

  // ============================================================
  // SESSION EXPIRED NOTICE
  // ============================================================

  useEffect(() => {
    if (sessionNoticeShown.current) return;

    const params = new URLSearchParams(location.search);

    if (params.get("session") === "expired") {
      sessionNoticeShown.current = true;

      showToast(
        "Your session has expired. Please log in again.",
        "error",
      );
    }
  }, [location.search, showToast]);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast(
        "Please enter your email and password.",
        "error",
      );
      return;
    }

    // Shop URL is invalid
    if (isShopLogin && !shop) {
      showToast(
        "This shop is not available. Please check the link.",
        "error",
      );
      return;
    }

    try {
      const response = await loginUser({
        email,
        password,
      });

      if (!response?.success) {
        showToast(
          response?.message || "Login failed.",
          "error",
        );
        return;
      }

      const loggedInUser = response.user;

      // ========================================================
      // SHOP LOGIN
      //
      // Example:
      // /shop/tester/login
      //
      // Only customers of "tester" can login here.
      // ========================================================

      if (isShopLogin) {
        // Admin / Employee / Super Admin cannot use customer shop login
        if (loggedInUser.role !== "customer") {
          showToast(
            "This login page is only for customers of this shop.",
            "error",
          );
          return;
        }

        // Security check:
        // Customer's shopId must match current shop ID
        if (Number(loggedInUser.shopId) !== Number(shop.id)) {
          showToast(
            `Your account does not belong to ${shop.name}.`,
            "error",
          );
          return;
        }

        // Save auth only after shop verification succeeds
        login(loggedInUser, response.token, remember);

        showToast(
          `Welcome back to ${shop.name}!`,
          "success",
        );

        // Customer dashboard
        setTimeout(() => {
          navigate("/customer/dashboard");
        }, 400);

        return;
      }

      // ========================================================
      // NORMAL PLATFORM LOGIN
      //
      // /login
      // ========================================================

      // Optional:
      // Don't allow customer on the main admin/platform login page
      if (loggedInUser.role === "customer") {
        showToast(
          "Please use your shop's customer login page.",
          "error",
        );
        return;
      }

      // Save login
      login(loggedInUser, response.token, remember);

      showToast("Login successful!", "success");

      // ========================================================
      // ADMIN FIRST LOGIN
      // ========================================================

      if (
        loggedInUser.role === "admin" &&
        response.mustChangePassword
      ) {
        setTimeout(() => {
          navigate("/create-password");
        }, 400);

        return;
      }

      // ========================================================
      // ROLE REDIRECT
      // ========================================================

      setTimeout(() => {
        switch (loggedInUser.role) {
          case "super_admin":
            navigate("/super/dashboard");
            break;

          case "admin":
            navigate("/admin/dashboard");
            break;

          case "employee":
            navigate("/employee/dashboard");
            break;

          default:
            showToast(
              "Unknown user role.",
              "error",
            );
        }
      }, 400);
    } catch (error) {
      console.error("Login Error:", error);

      showToast(
        error.response?.data?.message ||
          "Login failed. Please check your credentials.",
        "error",
      );
    }
  };

  // ============================================================
  // DYNAMIC CONTENT
  // ============================================================

  const brandName = isShopLogin
    ? shop?.name || "Laundry"
    : "Laundry OS";

  const pageLabel = isShopLogin
    ? `${brandName} Customer Sign In`
    : "Facility Sign In";

  const heading = isShopLogin
    ? "Welcome back"
    : "Welcome back";

  const description = isShopLogin
    ? `Sign in to ${brandName} to place orders and track your laundry.`
    : "Sign in to your laundry management dashboard to continue.";

  const signupPath = isShopLogin
    ? `/shop/${slug}/signup`
    : "/signup";

  const forgotPasswordPath = isShopLogin
    ? `/shop/${slug}/forgot-password`
    : "/forgot-password";

  const visitSitePath = isShopLogin
    ? `/shop/${slug}`
    : "/";

  // ============================================================
  // LOADING SHOP
  // ============================================================

  if (isShopLogin && shopLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: colors.bgLight,
          color: colors.textDark,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 mx-auto rounded-full border-4 border-t-transparent animate-spin"
            style={{
              borderColor: colors.primaryTeal,
              borderTopColor: "transparent",
            }}
          />

          <p className="mt-4 text-sm">
            Loading shop...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // INVALID SHOP
  // ============================================================

  if (isShopLogin && !shop) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          backgroundColor: colors.bgLight,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="max-w-md w-full text-center">
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "#E0645C20",
            }}
          >
            <AlertCircle
              size={28}
              color="#E0645C"
            />
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
            This shop link is invalid or the shop is no longer active.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            style={{
              backgroundColor: colors.primaryTeal,
            }}
          >
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: colors.bgLight,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

        .lp-input {
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
          border-color: ${colors.cardBorder};
        }

        .lp-input:focus {
          outline: none;
          border-color: ${colors.primaryTeal};
          box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.14);
        }

        .lp-btn-primary {
          background: linear-gradient(
            95deg,
            ${colors.primaryTeal},
            ${colors.mint}
          );
          transition:
            filter 0.15s ease,
            transform 0.15s ease;
        }

        .lp-btn-primary:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }

        .lp-link {
          color: ${colors.primaryTeal};
          transition: color 0.15s ease;
        }

        .lp-link:hover {
          color: ${colors.mint};
        }

        .lp-checkbox:checked {
          background-color: ${colors.primaryTeal};
          border-color: ${colors.primaryTeal};
        }

        @keyframes lp-toast-in {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .lp-toast {
          animation: lp-toast-in 0.2s ease-out;
        }
      `}</style>

      {/* ====================================================== */}
      {/* TOASTS */}
      {/* ====================================================== */}

      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 w-[calc(100%-2.5rem)] max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="lp-toast flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl"
            style={{
              backgroundColor: colors.bgDark,
              border: `1px solid ${
                toast.type === "success"
                  ? colors.mint
                  : "#E0645C"
              }55`,
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor:
                  toast.type === "success"
                    ? `${colors.mint}26`
                    : "#E0645C26",
              }}
            >
              {toast.type === "success" ? (
                <CheckCircle2
                  size={15}
                  color={colors.mint}
                />
              ) : (
                <AlertCircle
                  size={15}
                  color="#E0645C"
                />
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
              aria-label="Dismiss notification"
              className="flex-shrink-0"
              style={{
                color: "#8FB3B0",
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* ====================================================== */}
      {/* LEFT HERO */}
      {/* ====================================================== */}

      <div
        className="relative overflow-hidden hidden lg:flex lg:w-[46%] flex-col justify-between px-12 py-14 xl:px-16"
        style={{
          backgroundColor: colors.bgDark,
        }}
      >
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

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: colors.primaryTeal,
              }}
            >
              {isShopLogin && shop?.logo ? (
                <img
                  src={shop.logo}
                  alt={brandName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shirt
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2}
                />
              )}
            </div>

            <span
              className="text-sm tracking-[0.2em] uppercase"
              style={{
                color: colors.mint,
                fontWeight: 600,
              }}
            >
              {brandName}
            </span>
          </div>

          <h1
            className="mt-12 text-4xl xl:text-5xl leading-tight"
            style={{
              color: "#FFFFFF",
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            Every load,
            <br />
            tracked to the door.
          </h1>

          <p
            className="mt-5 text-base max-w-sm leading-relaxed"
            style={{
              color: "#A9C9C6",
            }}
          >
            {isShopLogin
              ? `Sign in to ${brandName} and manage your laundry orders from pickup to delivery.`
              : "Sign in to manage pickups, wash cycles, and deliveries across every facility from one dashboard."}
          </p>
        </div>

        <div className="relative z-10 mt-10">
          <div
            className="rounded-2xl p-5 shadow-2xl"
            style={{
              backgroundColor: colors.panelDark,
              border: `1px solid ${colors.primaryTeal}55`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-sm"
                style={{
                  color: "#FFFFFF",
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                Ticket #A-2481
              </span>

              <span
                className="flex items-center gap-1 text-xs font-medium"
                style={{
                  color: colors.mint,
                }}
              >
                <CheckCircle2 size={14} />
                Ready
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2">
              {[
                {
                  icon: Droplets,
                  label: "Washing",
                  color: colors.primaryTeal,
                },
                {
                  icon: Wind,
                  label: "Drying",
                  color: colors.seafoam,
                },
                {
                  icon: CheckCircle2,
                  label: "Ready",
                  color: colors.mint,
                },
              ].map((stage, index) => {
                const Icon = stage.icon;

                return (
                  <React.Fragment key={stage.label}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: stage.color,
                        }}
                      >
                        <Icon
                          size={14}
                          color="#FFFFFF"
                        />
                      </div>

                      <span
                        className="text-[10px]"
                        style={{
                          color: "#A9C9C6",
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>

                    {index < 2 && (
                      <div
                        className="flex-1 h-px mb-4"
                        style={{
                          backgroundColor: colors.mint,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              {
                icon: Droplets,
                value: "128",
                label: "Orders today",
                color: colors.primaryTeal,
              },
              {
                icon: Gauge,
                value: "99.2%",
                label: "On-time rate",
                color: colors.seafoam,
              },
              {
                icon: Wind,
                value: "24",
                label: "Machines active",
                color: colors.mint,
              },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                    style={{
                      backgroundColor: `${stat.color}26`,
                    }}
                  >
                    <Icon
                      size={15}
                      color={stat.color}
                    />
                  </div>

                  <div
                    className="text-lg"
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "'Libre Baskerville', serif",
                    }}
                  >
                    {stat.value}
                  </div>

                  <div
                    className="text-[11px]"
                    style={{
                      color: "#8FB3B0",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* MOBILE HEADER */}
      {/* ====================================================== */}

      <div
        className="flex lg:hidden items-center gap-3 px-6 py-6"
        style={{
          backgroundColor: colors.bgDark,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: colors.primaryTeal,
          }}
        >
          {isShopLogin && shop?.logo ? (
            <img
              src={shop.logo}
              alt={brandName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Shirt
              size={18}
              color="#FFFFFF"
            />
          )}
        </div>

        <span
          className="text-sm tracking-[0.2em] uppercase"
          style={{
            color: colors.mint,
            fontWeight: 600,
          }}
        >
          {brandName}
        </span>
      </div>

      {/* ====================================================== */}
      {/* LOGIN FORM */}
      {/* ====================================================== */}

      <div
        className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16"
        style={{
          backgroundColor: colors.bgLight,
        }}
      >
        <div className="w-full max-w-sm">
          <span
            className="text-xs tracking-[0.2em] uppercase"
            style={{
              color: colors.mint,
              fontWeight: 600,
            }}
          >
            {pageLabel}
          </span>

          <h2
            className="mt-3 text-3xl"
            style={{
              color: colors.textDark,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            {heading}
          </h2>

          <p
            className="mt-2 text-sm leading-relaxed"
            style={{
              color: colors.textMuted,
            }}
          >
            {description}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium mb-1.5"
                style={{
                  color: colors.textDark,
                }}
              >
                Email address
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
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  className="lp-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm"
                  style={{
                    backgroundColor: colors.cardTint,
                    color: colors.textDark,
                  }}
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium"
                  style={{
                    color: colors.textDark,
                  }}
                >
                  Password
                </label>

                <Link
                  to={forgotPasswordPath}
                  className="lp-link text-xs font-medium"
                >
                  Forgot password?
                </Link>
              </div>

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
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  className="lp-input w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm"
                  style={{
                    backgroundColor: colors.cardTint,
                    color: colors.textDark,
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{
                    color: colors.textMuted,
                  }}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* REMEMBER */}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(e.target.checked)
                }
                className="lp-checkbox w-4 h-4 rounded appearance-none border cursor-pointer"
                style={{
                  borderColor: colors.cardBorder,
                }}
              />

              <span
                className="text-xs"
                style={{
                  color: colors.textMuted,
                }}
              >
                Keep me signed in on this device
              </span>
            </label>

            {/* SUBMIT */}

            <button
              type="submit"
              className="lp-btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg"
            >
              Sign in
              <ArrowRight size={16} />
            </button>
          </form>

          {/* DIVIDER */}

          <div className="mt-8 flex items-center gap-3">
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
              Need access
            </span>

            <div
              className="h-px flex-1"
              style={{
                backgroundColor: colors.cardBorder,
              }}
            />
          </div>

          {/* FOOTER LINKS */}

          <p
            className="mt-5 text-center text-xs leading-relaxed"
            style={{
              color: colors.textMuted,
            }}
          >
            Don't have an account?{" "}

            <Link
              to={signupPath}
              className="lp-link font-medium"
            >
              Create one free
            </Link>

            <span
              className="mx-1.5"
              style={{
                color: colors.cardBorder,
              }}
            >
              •
            </span>

            <Link
              to={visitSitePath}
              className="lp-link font-medium"
            >
              Visit our site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}