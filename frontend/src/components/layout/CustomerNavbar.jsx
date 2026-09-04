// import { useEffect, useRef, useState } from "react";
// import { Link, NavLink, useNavigate } from "react-router-dom";
// import {
//   Shirt,
//   Home as HomeIcon,
//   Sparkles,
//   ClipboardList,
//   User,
//   PackageSearch,
//   LogOut,
//   Menu,
//   X,
//   ChevronDown,
//   MapPin,
//   History,
//   Loader2,
//   Star,
//   ShieldAlert,
// } from "lucide-react";
// import Avatar from "./Avatar";
// import NotificationBell from "./NotificationBell";
// import { useAuth } from "../../context/AuthContext";
// import { useTenant } from "../../context/TenantContext";
// import { getMyOrders } from "../../api/orderApi";
// import { ACTIVE_STATUSES } from "../../utils/orderStatus";

// const colors = {
//   bgDark: "#05282A",
//   primaryTeal: "#028090",
//   seafoam: "#00A896",
//   mint: "#02C39A",
//   bgLight: "#FFFFFF",
//   cardTint: "#EEF7F6",
//   cardBorder: "#D8ECEA",
//   textDark: "#0F2C2E",
//   textMuted: "#5C7A78",
// };

// const NAV_LINKS = [
//   { label: "Home", to: "/", icon: HomeIcon },
//   { label: "Services", to: "/customer/services", icon: Sparkles },
//   { label: "My Orders", to: "/customer/orders", icon: ClipboardList },
// ];

// export default function CustomerNavbar() {
//   const { user, logout } = useAuth();
//   const { brand } = useTenant();
//   const navigate = useNavigate();
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [tracking, setTracking] = useState(false);
//   const profileRef = useRef(null);

//   // Close the profile dropdown when clicking outside it
//   useEffect(() => {
//     const onClick = (e) => {
//       if (profileRef.current && !profileRef.current.contains(e.target)) {
//         setProfileOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", onClick);
//     return () => document.removeEventListener("mousedown", onClick);
//   }, []);

//   const closeMenus = () => {
//     setProfileOpen(false);
//     setMenuOpen(false);
//   };

//   const handleLogout = () => {
//     closeMenus();
//     logout();
//     // Back to the website — the navbar returns to the Login state.
//     navigate("/");
//   };

//   // "Track Order" jumps straight into the tracking page of the most recent
//   // active order; if nothing is in progress, fall back to the orders list.
//   const handleTrackOrder = async () => {
//     closeMenus();
//     setTracking(true);
//     try {
//       const res = await getMyOrders();
//       const active = (res.data || []).filter((o) =>
//         ACTIVE_STATUSES.includes(o.status),
//       );
//       if (active.length > 0) {
//         navigate(`/customer/orders/${active[0].id}`);
//       } else {
//         navigate("/customer/orders");
//       }
//     } catch {
//       navigate("/customer/orders");
//     } finally {
//       setTracking(false);
//     }
//   };

//   const userName = user?.name || "Customer";

//   // Tenant branding — the shop's own name / logo / colors (never hardcoded).
//   const brandName = brand?.name || "WashFlow";
//   const brandPrimary = brand?.primaryColor || "#028090";
//   const brandSecondary = brand?.secondaryColor || "#02C39A";
//   const brandLogo = brand?.logo || null;

//   const dropdownItems = [
//     { label: "My Profile", icon: User, to: "/customer/profile" },
//     { label: "My Orders", icon: ClipboardList, to: "/customer/orders" },
//     { label: "Track Order", icon: PackageSearch, action: "track" },
//     { label: "My Reviews", icon: Star, to: "/customer/reviews" },
//     { label: "My Complaints", icon: ShieldAlert, to: "/customer/complaints" },
//     { label: "Addresses", icon: MapPin, to: "/customer/addresses" },
//     { label: "Order History", icon: History, to: "/customer/orders" },
//   ];

//   const linkClass = ({ isActive }) =>
//     `flex items-center gap-2 text-sm font-medium rounded-lg px-3.5 py-2 transition-colors ${
//       isActive ? "text-white" : "text-white/75 hover:text-white hover:bg-white/10"
//     }`;

//   return (
//     <header
//       className="sticky top-0 z-50 shadow-sm"
//       style={{
//         backgroundColor: colors.bgDark,
//         fontFamily: "'Inter', sans-serif",
//         borderBottom: `1px solid ${colors.primaryTeal}44`,
//       }}
//     >
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
//         .cn-menu-item { background-color: #FFFFFF; }
//         .cn-menu-item:hover { background-color: ${colors.cardTint}; }
//       `}</style>

//       <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-16">
//         {/* Left: mobile hamburger + logo */}
//         <div className="flex items-center gap-2 min-w-0">
//           <button
//             className="lg:hidden text-white/80 hover:text-white flex-shrink-0"
//             onClick={() => setMenuOpen((v) => !v)}
//             aria-label="Toggle menu"
//           >
//             {menuOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>

//           <Link to="/customer" onClick={closeMenus} className="flex items-center gap-2.5">
//             {brandLogo ? (
//               <img
//                 src={brandLogo}
//                 alt={`${brandName} logo`}
//                 className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
//               />
//             ) : (
//               <div
//                 className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
//                 style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})` }}
//               >
//                 <Shirt size={17} color="#FFFFFF" />
//               </div>
//             )}
//             <span
//               className="text-lg tracking-tight text-white truncate"
//               style={{ fontFamily: "'Libre Baskerville', serif" }}
//             >
//               {brandName}
//             </span>
//           </Link>
//         </div>

//         {/* Center: nav links (desktop) */}
//         <nav className="hidden lg:flex items-center gap-1">
//           {NAV_LINKS.map((l) => (
//             <NavLink key={l.to} to={l.to} end className={linkClass}>
//               <l.icon size={16} />
//               {l.label}
//             </NavLink>
//           ))}
//           <NavLink
//             to="/customer/new-order"
//             className={({ isActive }) =>
//               `flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 text-white shadow-lg transition-all hover:brightness-110 ${
//                 isActive ? "ring-2 ring-[#02C39A]/60" : ""
//               }`
//             }
//             style={{ background: `linear-gradient(95deg, ${brandPrimary}, ${brandSecondary})` }}
//           >
//             <Sparkles size={15} /> New order
//           </NavLink>
//         </nav>

//         {/* Right: notifications + profile dropdown */}
//         <div className="flex items-center gap-1">
//           <NotificationBell dark />
//         </div>
//         <div className="relative flex-shrink-0" ref={profileRef}>
//           <button
//             onClick={() => setProfileOpen((v) => !v)}
//             className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/10"
//             aria-haspopup="true"
//             aria-expanded={profileOpen}
//           >
//             <Avatar user={user} className="w-9 h-9 text-xs" />
//             <div className="hidden sm:block text-left leading-tight">
//               <div className="text-sm font-medium text-white truncate max-w-[140px]">
//                 {userName}
//               </div>
//               <div className="text-[11px]" style={{ color: "#8FB3B0" }}>
//                 Customer
//               </div>
//             </div>
//             <ChevronDown
//               size={15}
//               className="hidden sm:block transition-transform text-white/60"
//               style={{ transform: profileOpen ? "rotate(180deg)" : "none" }}
//             />
//           </button>

//           {profileOpen && (
//             <div
//               className="absolute right-0 mt-2 w-64 z-50 rounded-2xl overflow-hidden"
//               style={{
//                 backgroundColor: "#FFFFFF",
//                 border: `1px solid ${colors.cardBorder}`,
//                 boxShadow: "0 24px 60px -12px rgba(5,40,42,0.35)",
//               }}
//             >
//               {/* User header */}
//               <div
//                 className="px-4 py-3 border-b"
//                 style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}
//               >
//                 <div className="flex items-center gap-3">
//                   <Avatar user={user} className="w-10 h-10 text-sm" />
//                   <div className="min-w-0">
//                     <div className="text-sm font-semibold truncate" style={{ color: colors.textDark }}>
//                       {userName}
//                     </div>
//                     <div className="text-[11px] truncate" style={{ color: colors.textMuted }}>
//                       {user?.email || "Customer account"}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="py-1.5">
//                 {dropdownItems.map((item) =>
//                   item.action === "track" ? (
//                     <button
//                       key={item.label}
//                       className="cn-menu-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
//                       style={{ color: colors.textDark }}
//                       onClick={handleTrackOrder}
//                       disabled={tracking}
//                     >
//                       <span
//                         className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//                         style={{ backgroundColor: `${colors.seafoam}12` }}
//                       >
//                         <item.icon size={15} style={{ color: colors.seafoam }} />
//                       </span>
//                       {item.label}
//                       {tracking && <Loader2 size={14} className="animate-spin ml-auto" />}
//                     </button>
//                   ) : (
//                     <button
//                       key={item.label}
//                       className="cn-menu-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
//                       style={{ color: colors.textDark }}
//                       onClick={() => {
//                         setProfileOpen(false);
//                         navigate(item.to);
//                       }}
//                     >
//                       <span
//                         className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//                         style={{ backgroundColor: `${colors.primaryTeal}12` }}
//                       >
//                         <item.icon size={15} style={{ color: colors.primaryTeal }} />
//                       </span>
//                       {item.label}
//                     </button>
//                   ),
//                 )}
//               </div>

//               <div className="mx-3 h-px" style={{ backgroundColor: colors.cardBorder }} />

//               <div className="py-1.5">
//                 <button
//                   onClick={handleLogout}
//                   className="cn-menu-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
//                   style={{ color: "#C0392B" }}
//                 >
//                   <span
//                     className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//                     style={{ backgroundColor: "#FBE9E8" }}
//                   >
//                     <LogOut size={15} style={{ color: "#E0645C" }} />
//                   </span>
//                   Logout
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Mobile drawer */}
//       {menuOpen && (
//         <div className="lg:hidden px-4 pb-5 pt-2 space-y-1" style={{ backgroundColor: colors.bgDark }}>
//           {NAV_LINKS.map((l) => (
//             <NavLink
//               key={l.to}
//               to={l.to}
//               end
//               onClick={closeMenus}
//               className={({ isActive }) =>
//                 `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
//                   isActive
//                     ? "bg-[#028090] text-white font-medium"
//                     : "text-white/75 hover:bg-white/10 hover:text-white"
//                 }`
//               }
//             >
//               <l.icon size={17} />
//               {l.label}
//             </NavLink>
//           ))}

//           <NavLink
//             to="/customer/new-order"
//             onClick={closeMenus}
//             className={({ isActive }) =>
//               `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition-all ${
//                 isActive ? "ring-2 ring-[#02C39A]/60" : ""
//               }`
//             }
//             style={{ background: `linear-gradient(95deg, ${brandPrimary}, ${brandSecondary})` }}
//           >
//             <Sparkles size={17} /> New order
//           </NavLink>

//           <div className="pt-3 mt-2 border-t" style={{ borderColor: `${colors.primaryTeal}44` }}>
//             <button
//               onClick={() => {
//                 setMenuOpen(false);
//                 navigate("/customer/profile");
//               }}
//               className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
//             >
//               <User size={17} /> My Profile
//             </button>
//             <button
//               onClick={() => {
//                 setMenuOpen(false);
//                 navigate("/customer/orders");
//               }}
//               className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
//             >
//               <ClipboardList size={17} /> My Orders
//             </button>
//             <button
//               onClick={handleTrackOrder}
//               disabled={tracking}
//               className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
//             >
//               <PackageSearch size={17} /> Track Order
//             </button>
//             <button
//               onClick={() => {
//                 setMenuOpen(false);
//                 navigate("/customer/reviews");
//               }}
//               className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
//             >
//               <Star size={17} /> My Reviews
//             </button>
//             <button
//               onClick={() => {
//                 setMenuOpen(false);
//                 navigate("/customer/complaints");
//               }}
//               className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
//             >
//               <ShieldAlert size={17} /> My Complaints
//             </button>
//             <button
//               onClick={() => {
//                 setMenuOpen(false);
//                 navigate("/customer/addresses");
//               }}
//               className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
//             >
//               <MapPin size={17} /> Addresses
//             </button>
//             <button
//               onClick={() => {
//                 setMenuOpen(false);
//                 navigate("/customer/orders");
//               }}
//               className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
//             >
//               <History size={17} /> Order History
//             </button>
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10"
//               style={{ color: "#E0645C" }}
//             >
//               <LogOut size={17} /> Logout
//             </button>
//           </div>
//         </div>
//       )}
//     </header>
//   );
// }


import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Shirt,
  Home as HomeIcon,
  Sparkles,
  ClipboardList,
  User,
  PackageSearch,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MapPin,
  History,
  Loader2,
  Star,
  ShieldAlert,
} from "lucide-react";

import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";

import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { getMyOrders } from "../../api/orderApi";
import { ACTIVE_STATUSES } from "../../utils/orderStatus";

const colors = {
  bgDark: "#05282A",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

export default function CustomerNavbar() {
  const { user, logout } = useAuth();
  const { brand } = useTenant();

  const { slug } = useParams();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tracking, setTracking] = useState(false);

  const profileRef = useRef(null);

  /*
   * -----------------------------------------
   * CLOSE PROFILE DROPDOWN ON OUTSIDE CLICK
   * -----------------------------------------
   */
  useEffect(() => {
    const onClick = (e) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  /*
   * -----------------------------------------
   * CLOSE MENUS
   * -----------------------------------------
   */
  const closeMenus = () => {
    setProfileOpen(false);
    setMenuOpen(false);
  };

  /*
   * -----------------------------------------
   * LOGOUT
   * -----------------------------------------
   *
   * Customer logout ke baad same shop ke
   * landing page par jayega.
   *
   * /abc/dashboard
   *      ↓
   * /abc
   */
  const handleLogout = () => {
    closeMenus();

    logout();

    if (slug) {
      navigate(`/${slug}`);
    } else {
      navigate("/");
    }
  };

  /*
   * -----------------------------------------
   * TRACK ORDER
   * -----------------------------------------
   */
  const handleTrackOrder = async () => {
    closeMenus();
    setTracking(true);

    try {
      const res = await getMyOrders();

      const orders = res?.data || [];

      const active = orders.filter((order) =>
        ACTIVE_STATUSES.includes(order.status)
      );

      if (active.length > 0) {
        navigate(`/${slug}/orders/${active[0].id}`);
      } else {
        navigate(`/${slug}/orders`);
      }
    } catch (error) {
      console.error("Track order error:", error);

      navigate(`/${slug}/orders`);
    } finally {
      setTracking(false);
    }
  };

  /*
   * -----------------------------------------
   * BRAND
   * -----------------------------------------
   */
  const userName = user?.name || "Customer";

  const brandName = brand?.name || "WashFlow";

  const brandPrimary =
    brand?.primaryColor || "#028090";

  const brandSecondary =
    brand?.secondaryColor || "#02C39A";

  const brandLogo = brand?.logo || null;

  /*
   * -----------------------------------------
   * NAVIGATION LINKS
   * -----------------------------------------
   *
   * IMPORTANT:
   * Never use /customer/... here.
   *
   * Current shop slug is used.
   *
   * Example:
   * slug = abc
   *
   * /abc
   * /abc/services
   * /abc/orders
   */
  const NAV_LINKS = [
    {
      label: "Home",
      to: `/${slug}`,
      icon: HomeIcon,
    },
    {
      label: "Services",
      to: `/${slug}/services`,
      icon: Sparkles,
    },
    {
      label: "My Orders",
      to: `/${slug}/orders`,
      icon: ClipboardList,
    },
  ];

  /*
   * -----------------------------------------
   * PROFILE DROPDOWN
   * -----------------------------------------
   */
  const dropdownItems = [
    {
      label: "My Profile",
      icon: User,
      to: `/${slug}/profile`,
    },
    {
      label: "My Orders",
      icon: ClipboardList,
      to: `/${slug}/orders`,
    },
    {
      label: "Track Order",
      icon: PackageSearch,
      action: "track",
    },
    {
      label: "My Reviews",
      icon: Star,
      to: `/${slug}/reviews`,
    },
    {
      label: "My Complaints",
      icon: ShieldAlert,
      to: `/${slug}/complaints`,
    },
    {
      label: "Addresses",
      icon: MapPin,
      to: `/${slug}/addresses`,
    },
    {
      label: "Order History",
      icon: History,
      to: `/${slug}/orders`,
    },
  ];

  /*
   * -----------------------------------------
   * NAV LINK CLASS
   * -----------------------------------------
   */
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 text-sm font-medium rounded-lg px-3.5 py-2 transition-colors ${
      isActive
        ? "text-white"
        : "text-white/75 hover:text-white hover:bg-white/10"
    }`;

  return (
    <header
      className="sticky top-0 z-50 shadow-sm"
      style={{
        backgroundColor: colors.bgDark,
        fontFamily: "'Inter', sans-serif",
        borderBottom: `1px solid ${colors.primaryTeal}44`,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

        .cn-menu-item {
          background-color: #FFFFFF;
        }

        .cn-menu-item:hover {
          background-color: ${colors.cardTint};
        }
      `}</style>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-16">

        {/* =====================================
            LEFT: MOBILE MENU + LOGO
           ===================================== */}

        <div className="flex items-center gap-2 min-w-0">

          <button
            className="lg:hidden text-white/80 hover:text-white flex-shrink-0"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

          {/* SHOP HOME */}
          <Link
            to={`/${slug}`}
            onClick={closeMenus}
            className="flex items-center gap-2.5"
          >
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={`${brandName} logo`}
                className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})`,
                }}
              >
                <Shirt
                  size={17}
                  color="#FFFFFF"
                />
              </div>
            )}

            <span
              className="text-lg tracking-tight text-white truncate"
              style={{
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              {brandName}
            </span>
          </Link>
        </div>

        {/* =====================================
            CENTER DESKTOP NAV
           ===================================== */}

        <nav className="hidden lg:flex items-center gap-1">

          {NAV_LINKS.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.label}
                to={link.to}
                end
                className={linkClass}
              >
                <Icon size={16} />
                {link.label}
              </NavLink>
            );
          })}

          {/* NEW ORDER */}

          <NavLink
            to={`/${slug}/new-order`}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 text-white shadow-lg transition-all hover:brightness-110 ${
                isActive
                  ? "ring-2 ring-[#02C39A]/60"
                  : ""
              }`
            }
            style={{
              background: `linear-gradient(95deg, ${brandPrimary}, ${brandSecondary})`,
            }}
          >
            <Sparkles size={15} />

            New order
          </NavLink>
        </nav>

        {/* =====================================
            RIGHT SIDE
           ===================================== */}

        <div className="flex items-center gap-2">

          {/* Notification */}

          <NotificationBell dark />

          {/* Profile */}

          <div
            className="relative flex-shrink-0"
            ref={profileRef}
          >
            <button
              onClick={() =>
                setProfileOpen((v) => !v)
              }
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/10"
              aria-haspopup="true"
              aria-expanded={profileOpen}
            >
              <Avatar
                user={user}
                className="w-9 h-9 text-xs"
              />

              <div className="hidden sm:block text-left leading-tight">

                <div className="text-sm font-medium text-white truncate max-w-[140px]">
                  {userName}
                </div>

                <div
                  className="text-[11px]"
                  style={{
                    color: "#8FB3B0",
                  }}
                >
                  Customer
                </div>

              </div>

              <ChevronDown
                size={15}
                className="hidden sm:block transition-transform text-white/60"
                style={{
                  transform: profileOpen
                    ? "rotate(180deg)"
                    : "none",
                }}
              />
            </button>

            {/* =================================
                PROFILE DROPDOWN
               ================================= */}

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-64 z-50 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow:
                    "0 24px 60px -12px rgba(5,40,42,0.35)",
                }}
              >

                {/* USER HEADER */}

                <div
                  className="px-4 py-3 border-b"
                  style={{
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.bgLight,
                  }}
                >
                  <div className="flex items-center gap-3">

                    <Avatar
                      user={user}
                      className="w-10 h-10 text-sm"
                    />

                    <div className="min-w-0">

                      <div
                        className="text-sm font-semibold truncate"
                        style={{
                          color: colors.textDark,
                        }}
                      >
                        {userName}
                      </div>

                      <div
                        className="text-[11px] truncate"
                        style={{
                          color: colors.textMuted,
                        }}
                      >
                        {user?.email ||
                          "Customer account"}
                      </div>

                    </div>
                  </div>
                </div>

                {/* MENU */}

                <div className="py-1.5">

                  {dropdownItems.map((item) => {

                    const Icon = item.icon;

                    if (item.action === "track") {
                      return (
                        <button
                          key={item.label}
                          className="cn-menu-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
                          style={{
                            color: colors.textDark,
                          }}
                          onClick={handleTrackOrder}
                          disabled={tracking}
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${colors.seafoam}12`,
                            }}
                          >
                            <Icon
                              size={15}
                              style={{
                                color: colors.seafoam,
                              }}
                            />
                          </span>

                          {item.label}

                          {tracking && (
                            <Loader2
                              size={14}
                              className="animate-spin ml-auto"
                            />
                          )}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={item.label}
                        className="cn-menu-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
                        style={{
                          color: colors.textDark,
                        }}
                        onClick={() => {
                          setProfileOpen(false);
                          navigate(item.to);
                        }}
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${colors.primaryTeal}12`,
                          }}
                        >
                          <Icon
                            size={15}
                            style={{
                              color: colors.primaryTeal,
                            }}
                          />
                        </span>

                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* SEPARATOR */}

                <div
                  className="mx-3 h-px"
                  style={{
                    backgroundColor:
                      colors.cardBorder,
                  }}
                />

                {/* LOGOUT */}

                <div className="py-1.5">

                  <button
                    onClick={handleLogout}
                    className="cn-menu-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left"
                    style={{
                      color: "#C0392B",
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: "#FBE9E8",
                      }}
                    >
                      <LogOut
                        size={15}
                        style={{
                          color: "#E0645C",
                        }}
                      />
                    </span>

                    Logout
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================
          MOBILE DRAWER
         ===================================== */}

      {menuOpen && (
        <div
          className="lg:hidden px-4 pb-5 pt-2 space-y-1"
          style={{
            backgroundColor: colors.bgDark,
          }}
        >

          {/* Main links */}

          {NAV_LINKS.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.label}
                to={link.to}
                end
                onClick={closeMenus}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[#028090] text-white font-medium"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={17} />

                {link.label}
              </NavLink>
            );
          })}

          {/* NEW ORDER */}

          <NavLink
            to={`/${slug}/new-order`}
            onClick={closeMenus}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition-all ${
                isActive
                  ? "ring-2 ring-[#02C39A]/60"
                  : ""
              }`
            }
            style={{
              background: `linear-gradient(95deg, ${brandPrimary}, ${brandSecondary})`,
            }}
          >
            <Sparkles size={17} />

            New order
          </NavLink>

          {/* MOBILE PROFILE LINKS */}

          <div
            className="pt-3 mt-2 border-t"
            style={{
              borderColor: `${colors.primaryTeal}44`,
            }}
          >

            {/* Profile */}

            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(`/${slug}/profile`);
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              <User size={17} />

              My Profile
            </button>

            {/* Orders */}

            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(`/${slug}/orders`);
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              <ClipboardList size={17} />

              My Orders
            </button>

            {/* Track */}

            <button
              onClick={handleTrackOrder}
              disabled={tracking}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              <PackageSearch size={17} />

              Track Order
            </button>

            {/* Reviews */}

            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(`/${slug}/reviews`);
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              <Star size={17} />

              My Reviews
            </button>

            {/* Complaints */}

            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(`/${slug}/complaints`);
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              <ShieldAlert size={17} />

              My Complaints
            </button>

            {/* Addresses */}

            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(`/${slug}/addresses`);
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              <MapPin size={17} />

              Addresses
            </button>

            {/* Order History */}

            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(`/${slug}/orders`);
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              <History size={17} />

              Order History
            </button>

            {/* Logout */}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10"
              style={{
                color: "#E0645C",
              }}
            >
              <LogOut size={17} />

              Logout
            </button>

          </div>
        </div>
      )}
    </header>
  );
}