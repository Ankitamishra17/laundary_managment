// import React, { useEffect, useRef, useState } from "react";
// import { Link, useNavigate, useParams  } from "react-router-dom";
// import { motion, useInView } from "framer-motion";
// import useReveal from '../../hooks/useReveal'
// import Avatar from "../../components/layout/Avatar";
// import { useAuth } from "../../context/AuthContext";
// import { getMyOrders } from "../../api/orderApi";
// import { ACTIVE_STATUSES } from "../../utils/orderStatus";

// import {
//   Shirt,
//   Sparkles,
//   Droplets,
//   Wind,
//   BedDouble,
//   Crown,
//   Star,
//   Truck,
//   ShieldCheck,
//   Leaf,
//   Clock,
//   CreditCard,
//   MapPin,
//   ArrowRight,
//   Check,
//   PhoneCall,
//   Mail,
//   Timer,
//   Quote,
//   Menu,
//   X,
//   RefreshCw,
//   Bell,
//   History,
//   ChevronDown,
//   ClipboardList,
//   PackageSearch,
//   User as UserIcon,
//   LogOut,
//   LayoutGrid,
//   Loader2,
// } from "lucide-react";

// // Where each role's main screen lives — used by the logged-in navbar dropdown.
// function roleHome(role) {
//   switch (role) {
//     case "super_admin":
//       return "/super/dashboard";
//     case "admin":
//       return "/admin/dashboard";
//     case "employee":
//       return "/employee/dashboard";
//     default:
//       return "/";
//   }
// }

// // ------------------------------------------------------------
// // DESIGN TOKENS — unchanged from the original palette
// // ------------------------------------------------------------
// const colors = {
//   bgDark: "#05282A",
//   panelDark: "#0B3B3E",
//   primaryTeal: "#028090",
//   seafoam: "#00A896",
//   mint: "#02C39A",
//   gold: "#C9A24B",
//   bgLight: "#FFFFFF",
//   cardTint: "#EEF7F6",
//   cardBorder: "#D8ECEA",
//   textDark: "#0F2C2E",
//   textMuted: "#5C7A78",
// };

// // ------------------------------------------------------------
// // COUNTER — animates a number counting up when it scrolls into view.
// // Supports suffixes/prefixes: <Counter value="4.9" suffix="★" />
// // ------------------------------------------------------------
// function Counter({ value, suffix = "", duration = 1500 }) {
//   const ref = useRef(null);
//   const inView = useInView(ref, { once: true, margin: "-40px" });
//   const [display, setDisplay] = useState("0");

//   useEffect(() => {
//     if (!inView) return;
//     const numeric = parseFloat(String(value));
//     if (Number.isNaN(numeric)) {
//       setDisplay(String(value));
//       return;
//     }
//     let raf;
//     const start = performance.now();
//     const tick = (now) => {
//       const p = Math.min(1, (now - start) / duration);
//       const eased = 1 - Math.pow(1 - p, 3);
//       const current = numeric * eased;
//       setDisplay(
//         current >= 10
//           ? Math.round(current).toLocaleString("en-IN")
//           : current.toFixed(1),
//       );
//       if (p < 1) raf = requestAnimationFrame(tick);
//       else setDisplay(String(numeric));
//     };
//     raf = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(raf);
//   }, [inView, value, duration]);

//   return (
//     <span ref={ref}>
//       {display}
//       {suffix}
//     </span>
//   );
// }

// // ------------------------------------------------------------
// // PARTNER MARQUEE — scrolling strip of partner laundries
// // ------------------------------------------------------------
// const partnerNames = [
//   "Amisha Laundry",
//   "Sky Wash",
//   "Drain & Dry",
//   "Fresh Fold",
//   "Bubble & Suds",
//   "Sparkle Care",
//   "Urban Clean",
//   "Silk Touch",
// ];

// function PartnerMarquee() {
//   const row = [...partnerNames, ...partnerNames]; // duplicated for seamless loop
//   return (
//     <div
//       className="wf-marquee overflow-hidden border-t border-white/10 py-5 select-none"
//       style={{ backgroundColor: colors.bgDark }}
//       aria-label="Partner laundries"
//     >
//       <div className="wf-marquee-track flex w-max items-center gap-12 px-6">
//         {row.map((name, i) => (
//           <span
//             key={`${name}-${i}`}
//             className="flex items-center gap-2.5 text-sm font-semibold whitespace-nowrap"
//             style={{ color: "rgba(255,255,255,0.45)" }}
//           >
//             <Clip size={14} color={colors.mint} />
//             {name}
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ------------------------------------------------------------
// // FAQ — interactive accordion
// // ------------------------------------------------------------
// const faqs = [
//   {
//     q: "How fast is pickup after I book?",
//     a: "You choose a pickup slot at checkout — usually within 2–4 hours. Same-day pickup is free on all plans, and our riders send a live notification the moment they're on the way.",
//   },
//   {
//     q: "What happens if my clothes get damaged?",
//     a: "Every order is insured. If a piece comes back damaged or a stain doesn't lift after treatment, we redo it free or refund the item's value — no questions asked.",
//   },
//   {
//     q: "Can I track my order live?",
//     a: "Yes — every order updates in real time from pickup to delivery. You'll see exactly which stage it's in (washing, drying, ironing, out for delivery) on your dashboard and get notified at every step.",
//   },
//   {
//     q: "Do you handle delicate fabrics like silk or wool?",
//     a: "Absolutely. Delicates are sorted separately and cleaned with fabric-specific gentle processes. Add the Premium Care service for hand-finishing and stain treatment.",
//   },
//   {
//     q: "How do I pay?",
//     a: "Pay online with any card or UPI, or pay in cash at delivery. We never charge hidden fees — the price you see at booking is the price you pay.",
//   },
// ];

// function Faq() {
//   const [open, setOpen] = useState(0);
//   return (
//     <section id="faq" className="py-20 sm:py-28" style={{ backgroundColor: colors.cardTint }}>
//       <div className="max-w-3xl mx-auto px-5 sm:px-8">
//         <SectionHeading
//           tag="Questions, answered"
//           title="Frequently asked questions"
//           sub="Everything you need to know before your first pickup — tap a question to expand it."
//         />
//         <div className="space-y-3.5">
//           {faqs.map((f, i) => {
//             const isOpen = open === i;
//             return (
//               <Reveal key={f.q} delay={i * 60}>
//                 <div
//                   className="rounded-2xl border transition-all duration-300 overflow-hidden"
//                   style={{
//                     backgroundColor: colors.bgLight,
//                     borderColor: isOpen ? colors.primaryTeal : colors.cardBorder,
//                     boxShadow: isOpen ? "0 12px 32px rgba(5,40,42,0.08)" : "none",
//                   }}
//                 >
//                   <button
//                     onClick={() => setOpen(isOpen ? -1 : i)}
//                     aria-expanded={isOpen}
//                     className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4.5 text-left"
//                     style={{ paddingTop: 18, paddingBottom: 18 }}
//                   >
//                     <span className="text-sm sm:text-base font-semibold" style={{ color: colors.textDark }}>
//                       {f.q}
//                     </span>
//                     <span
//                       className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300"
//                       style={{
//                         backgroundColor: isOpen ? colors.primaryTeal : colors.cardTint,
//                         transform: isOpen ? "rotate(180deg)" : "none",
//                       }}
//                     >
//                       <ChevronDown size={14} color={isOpen ? "#FFFFFF" : colors.primaryTeal} />
//                     </span>
//                   </button>
//                   <div
//                     className="grid transition-all duration-300 ease-out"
//                     style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
//                   >
//                     <div className="overflow-hidden">
//                       <p
//                         className="px-5 sm:px-6 pb-5 text-sm leading-relaxed"
//                         style={{ color: colors.textMuted }}
//                       >
//                         {f.a}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </Reveal>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // REVEAL — scroll-triggered fade/slide-up, built on useReveal hook
// // (no separate Reveal.js file — defined locally here)
// // ------------------------------------------------------------
// const Reveal = ({ as: Tag = 'div', delay = 0, className = '', children }) => {
//   const [ref, visible] = useReveal();
//   return (
//     <Tag
//       ref={ref}
//       className={`transition-all duration-700 ease-out ${
//         visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7'
//       } ${className}`}
//       style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
//     >
//       {children}
//     </Tag>
//   );
// };

// const Eyebrow = ({ children, tone = "light" }) => (
//   <span
//     className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full"
//     style={{
//       backgroundColor: tone === "light" ? `${colors.mint}17` : `${colors.mint}22`,
//       color: tone === "light" ? colors.primaryTeal : colors.mint,
//     }}
//   >
//     <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.mint }} />
//     {children}
//   </span>
// );

// const SectionHeading = ({ tag, tone = "light", title, sub }) => (
//   <Reveal className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
//     <Eyebrow tone={tone}>{tag}</Eyebrow>
//     <h2
//       className="mt-5 text-3xl sm:text-4xl lg:text-[2.65rem] leading-[1.15]"
//       style={{
//         color: tone === "light" ? colors.textDark : "#FFFFFF",
//         fontFamily: "'Libre Baskerville', serif",
//       }}
//     >
//       {title}
//     </h2>
//     {sub && (
//       <p
//         className="mt-4 text-sm sm:text-base leading-relaxed"
//         style={{ color: tone === "light" ? colors.textMuted : "#A9C9C6" }}
//       >
//         {sub}
//       </p>
//     )}
//   </Reveal>
// );

// const TagCard = ({ children, dark = false, holeBg, className = "", style = {} }) => {
//   const hole = holeBg || (dark ? colors.panelDark : colors.bgLight);
//   const edge = dark ? "rgba(255,255,255,0.22)" : colors.cardBorder;
//   return (
//     <div
//       className={`relative rounded-[22px] ${className}`}
//       style={{
//         backgroundColor: dark ? colors.panelDark : colors.bgLight,
//         border: `1.5px dashed ${edge}`,
//         ...style,
//       }}
//     >
//       <span
//         aria-hidden="true"
//         className="absolute w-3.5 h-3.5 rounded-full"
//         style={{
//           top: "-8px",
//           left: "26px",
//           backgroundColor: hole,
//           border: `1.5px dashed ${edge}`,
//         }}
//       />
//       {children}
//     </div>
//   );
// };

// const Clip = ({ size = 20, color = colors.mint }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
//     <path d="M8 2v6M16 2v6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
//     <rect x="6" y="7" width="12" height="14" rx="4" stroke={color} strokeWidth="1.8" />
//     <path d="M12 7v14" stroke={color} strokeWidth="1.4" strokeDasharray="1.5 2.5" />
//   </svg>
// );

// // ------------------------------------------------------------
// // NAVBAR
// // ------------------------------------------------------------
// function Navbar() {
//   const [scrolled, setScrolled] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [tracking, setTracking] = useState(false);
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 24);
//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   const links = [
//     { label: "Services", href: "#services" },
//     { label: "How it works", href: "#how" },
//     { label: "Live tracking", href: "#features" },
//     { label: "Why us", href: "#why" },
//     { label: "Pricing", href: "#pricing" },
//     { label: "FAQ", href: "#faq" },
//   ];

//   const handleLogout = () => {
//     setProfileOpen(false);
//     setMenuOpen(false);
//     logout();
//     navigate("/");
//   };

//   // Jump straight into the tracking page of the most recent active order.
//   const handleTrackOrder = async () => {
//     setProfileOpen(false);
//     setMenuOpen(false);
//     setTracking(true);
//     try {
//       const res = await getMyOrders();
//       const active = (res.data || []).filter((o) => ACTIVE_STATUSES.includes(o.status));
//       navigate(active.length > 0 ? `/customer/orders/${active[0].id}` : "/customer/orders");
//     } catch {
//       navigate("/customer/orders");
//     } finally {
//       setTracking(false);
//     }
//   };
//   const { slug } = useParams();

// const loginUrl = slug ? `/shop/${slug}/login` : "/login";
// const signupUrl = slug ? `/shop/${slug}/signup` : "/signup";

//   const customerMenu = [
//     { label: "My Profile", icon: UserIcon, to: "/customer/profile" },
//     { label: "My Orders", icon: ClipboardList, to: "/customer/orders" },
//     { label: "Track Order", icon: PackageSearch, action: "track" },
//     { label: "Addresses", icon: MapPin, to: "/customer/addresses" },
//     { label: "Order History", icon: History, to: "/customer/orders" },
//   ];

//   return (
//     <header
//       className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
//       style={{
//         backgroundColor: scrolled ? "rgba(5,40,42,0.92)" : "transparent",
//         backdropFilter: scrolled ? "blur(12px)" : "none",
//         boxShadow: scrolled ? "0 8px 30px rgba(5,40,42,0.18)" : "none",
//       }}
//     >
//       <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4">
//         <Link to="/" className="flex items-center gap-2.5">
        
//           <span
//             className="text-lg tracking-tight"
//             style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}
//           >
//             WashFlow
//           </span>
//         </Link>

//         <div className="hidden lg:flex items-center gap-8">
//           {links.map((l) => (
            
//         <a      key={l.href}
//               href={l.href}
//               className="text-sm font-medium transition-colors hover:text-[#02C39A]"
//               style={{ color: "rgba(255,255,255,0.82)" }}
//             >
//               {l.label}
//             </a>
//           ))}
//         </div>

//         {/* Right side — Sign in when logged out, profile when logged in */}
//         <div className="hidden lg:flex items-center gap-3">
//           {!user ? (
//             <>
//               <Link
//                 to={loginUrl}
//                 className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
//                 style={{ color: "#FFFFFF" }}
//               >
//                 Sign in
//               </Link>
//               <Link
//                  to={signupUrl}
//                 className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow-lg transition-all hover:brightness-110"
//                 style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
//               >
//                 Get started <ArrowRight size={15} />
//               </Link>
//             </>
//           ) : (
//             <div className="relative">
//               <button
//                 onClick={() => setProfileOpen((v) => !v)}
//                 className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
//                 aria-haspopup="true"
//                 aria-expanded={profileOpen}
//               >
//                 <Avatar user={user} className="w-9 h-9 text-xs" />
//                 <span className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
//                   {(user.name || "User").split(" ")[0]}
//                 </span>
//                 <ChevronDown
//                   size={15}
//                   className="transition-transform"
//                   style={{ color: "rgba(255,255,255,0.6)", transform: profileOpen ? "rotate(180deg)" : "none" }}
//                 />
//               </button>

//               {profileOpen && (
//                 <>
//                   <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
//                   <div
//                     className="absolute right-0 mt-2 w-64 z-50 rounded-2xl overflow-hidden"
//                     style={{
//                       backgroundColor: "#FFFFFF",
//                       border: `1px solid ${colors.cardBorder}`,
//                       boxShadow: "0 24px 60px -12px rgba(5,40,42,0.35)",
//                     }}
//                   >
//                     {/* User header */}
//                     <div
//                       className="px-4 py-3 border-b"
//                       style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}
//                     >
//                       <div className="flex items-center gap-3">
//                         <Avatar user={user} className="w-10 h-10 text-sm" />
//                         <div className="min-w-0">
//                           <div className="text-sm font-semibold truncate" style={{ color: colors.textDark }}>{user.name || "User"}</div>
//                           <div className="text-[11px] truncate" style={{ color: colors.textMuted }}>{user.email || ""}</div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="py-1.5">
//                       {user.role === "customer" ? (
//                         <>
//                           {customerMenu.map((item) =>
//                             item.action === "track" ? (
//                               <button
//                                 key={item.label}
//                                 onClick={handleTrackOrder}
//                                 disabled={tracking}
//                                 className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#EEF7F6] text-left"
//                                 style={{ color: colors.textDark }}
//                               >
//                                 <span
//                                   className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//                                   style={{ backgroundColor: `${colors.seafoam}12` }}
//                                 >
//                                   <item.icon size={15} style={{ color: colors.seafoam }} />
//                                 </span>
//                                 {item.label}
//                                 {tracking && <Loader2 size={14} className="animate-spin ml-auto" />}
//                               </button>
//                             ) : (
//                               <Link
//                                 key={item.label}
//                                 to={item.to}
//                                 onClick={() => setProfileOpen(false)}
//                                 className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#EEF7F6]"
//                                 style={{ color: colors.textDark }}
//                               >
//                                 <span
//                                   className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//                                   style={{ backgroundColor: `${colors.primaryTeal}12` }}
//                                 >
//                                   <item.icon size={15} style={{ color: colors.primaryTeal }} />
//                                 </span>
//                                 {item.label}
//                               </Link>
//                             ),
//                           )}
//                         </>
//                       ) : (
//                         <Link
//                           to={roleHome(user.role)}
//                           onClick={() => setProfileOpen(false)}
//                           className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#EEF7F6]"
//                           style={{ color: colors.textDark }}
//                         >
//                           <span
//                             className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//                             style={{ backgroundColor: `${colors.primaryTeal}12` }}
//                           >
//                             <LayoutGrid size={15} style={{ color: colors.primaryTeal }} />
//                           </span>
//                           Go to Dashboard
//                         </Link>
//                       )}
//                     </div>

//                     <div className="mx-3 h-px" style={{ backgroundColor: colors.cardBorder }} />

//                     <div className="py-1.5">
//                       <button
//                         onClick={handleLogout}
//                         className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#EEF7F6] text-left"
//                         style={{ color: "#C0392B" }}
//                       >
//                         <span
//                           className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
//                           style={{ backgroundColor: "#FBE9E8" }}
//                         >
//                           <LogOut size={15} style={{ color: "#E0645C" }} />
//                         </span>
//                         Logout
//                       </button>
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>
//           )}
//         </div>

//         <button
//           className="lg:hidden text-white"
//           onClick={() => setMenuOpen((v) => !v)}
//           aria-label="Toggle menu"
//         >
//           {menuOpen ? <X size={24} /> : <Menu size={24} />}
//         </button>
//       </nav>

//       {menuOpen && (
//         <div className="lg:hidden px-5 pb-6 pt-2 space-y-1" style={{ backgroundColor: colors.bgDark }}>
//           {links.map((l) => (
            
//            <a   key={l.href}
//               href={l.href}
//               onClick={() => setMenuOpen(false)}
//               className="block py-2.5 text-sm font-medium"
//               style={{ color: "rgba(255,255,255,0.85)" }}
//             >
//               {l.label}
//             </a>
//           ))}

//           {!user ? (
//             <div className="flex gap-3 pt-3">
//               <Link
//                 to="/login"
//                 className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-xl border"
//                 style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.25)" }}
//               >
//                 Sign in
//               </Link>
//               <Link
//                 to="/signup"
//                 className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-xl text-white"
//                 style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
//               >
//                 Get started
//               </Link>
//             </div>
//           ) : user.role === "customer" ? (
//             <div className="pt-3 space-y-1">
//               {customerMenu.map((item) => (
//                 <Link
//                   key={item.label}
//                   to={item.to}
//                   onClick={() => setMenuOpen(false)}
//                   className="block py-2.5 text-sm font-medium"
//                   style={{ color: "rgba(255,255,255,0.85)" }}
//                 >
//                   {item.label}
//                 </Link>
//               ))}
//               <button
//                 onClick={handleTrackOrder}
//                 disabled={tracking}
//                 className="block w-full text-left py-2.5 text-sm font-medium"
//                 style={{ color: "rgba(255,255,255,0.85)" }}
//               >
//                 Track Order
//               </button>
//               <button
//                 onClick={handleLogout}
//                 className="block w-full text-left py-2.5 text-sm font-medium"
//                 style={{ color: "#E0645C" }}
//               >
//                 Logout
//               </button>
//             </div>
//           ) : (
//             <div className="flex gap-3 pt-3">
//               <Link
//                 to={roleHome(user.role)}
//                 onClick={() => setMenuOpen(false)}
//                 className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-xl border"
//                 style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.25)" }}
//               >
//                 Go to Dashboard
//               </Link>
//               <button
//                 onClick={handleLogout}
//                 className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-xl"
//                 style={{ color: "#E0645C", border: "1px solid rgba(224,100,92,0.5)" }}
//               >
//                 Logout
//               </button>
//             </div>
//           )}
//         </div>
//       )}
//     </header>
//   );
// }

// // ------------------------------------------------------------
// // HERO
// // ------------------------------------------------------------
// function Hero() {
//   const { user } = useAuth();

//   const steps = [
//     { icon: Droplets, label: "Washing" },
//     { icon: Wind, label: "Drying" },
//     { icon: Sparkles, label: "Ready" },
//   ];

//   return (
//     <section className="relative overflow-hidden" style={{ backgroundColor: colors.bgDark }}>
//       <div
//         className="absolute -top-40 -right-32 w-[34rem] h-[34rem] rounded-full"
//         style={{ backgroundColor: colors.panelDark, opacity: 0.75 }}
//       />
//       <div
//         className="absolute -bottom-48 -left-24 w-[30rem] h-[30rem] rounded-full"
//         style={{ backgroundColor: colors.panelDark, opacity: 0.45 }}
//       />
//       <div
//         className="absolute top-1/4 left-1/2 w-72 h-72 rounded-full blur-3xl"
//         style={{ backgroundColor: `${colors.mint}22` }}
//       />

//       <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-32 lg:pt-40 pb-20 lg:pb-28 grid lg:grid-cols-2 gap-16 lg:gap-10 items-center">
//         <div>
//           <motion.div
//             initial={{ opacity: 0, y: 18 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6 }}
//           >
//             <Eyebrow tone="dark">4.9/5 from 2,300+ loads done right</Eyebrow>
//           </motion.div>

//           <motion.h1
//             initial={{ opacity: 0, y: 24 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7, delay: 0.1 }}
//             className="mt-6 text-4xl sm:text-5xl xl:text-6xl leading-[1.1]"
//             style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}
//           >
//             Laundry, done
//             <br />
//             <span
//               style={{
//                 background: "linear-gradient(90deg, #02C39A, #00A896, #028090)",
//                 WebkitBackgroundClip: "text",
//                 WebkitTextFillColor: "transparent",
//               }}
//             >
//               beautifully fresh.
//             </span>
//           </motion.h1>

//           <motion.p
//             initial={{ opacity: 0, y: 24 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7, delay: 0.2 }}
//             className="mt-6 text-base sm:text-lg leading-relaxed max-w-lg"
//             style={{ color: "#A9C9C6" }}
//           >
//             Book online in under a minute. We pick up, wash, dry &amp; fold your
//             clothes with premium care — and deliver them back to your door,
//             fresh and on time.
//           </motion.p>

//           <motion.div
//             initial={{ opacity: 0, y: 24 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7, delay: 0.3 }}
//             className="mt-9 flex flex-wrap items-center gap-4"
//           >
//             <Link
//               to={user?.role === "customer" ? "/customer/new-order" : "/signup"}
//               className="flex items-center gap-2 text-sm sm:text-base font-semibold px-6 sm:px-7 py-3.5 rounded-xl text-white shadow-xl transition-all hover:brightness-110 hover:-translate-y-0.5"
//               style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
//             >
//               {user?.role === "customer" ? "Place an order" : "Order laundry now"} <ArrowRight size={17} />
//             </Link>
//             {!user && (
//               <Link
//                 to="/login"
//                 className="flex items-center gap-2 text-sm sm:text-base font-semibold px-6 sm:px-7 py-3.5 rounded-xl transition-colors"
//                 style={{ color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.25)" }}
//               >
//                 Sign in
//               </Link>
//             )}
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.8, delay: 0.45 }}
//             className="mt-10 flex flex-wrap gap-x-8 gap-y-4"
//           >
//             {[
//               { icon: Timer, text: "24h avg. turnaround" },
//               { icon: Truck, text: "Free pickup & delivery" },
//               { icon: ShieldCheck, text: "100% quality guarantee" },
//             ].map((f) => (
//               <div key={f.text} className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: "#A9C9C6" }}>
//                 <f.icon size={16} color={colors.mint} />
//                 {f.text}
//               </div>
//             ))}
//           </motion.div>
//         </div>

//         {/* Right — hero visual with floating live cards */}
//         <motion.div
//           initial={{ opacity: 0, scale: 0.94, y: 20 }}
//           animate={{ opacity: 1, scale: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.35 }}
//           className="relative hidden sm:block"
//         >
//           {/* soft glow behind the photo */}
//           <div
//             className="absolute -inset-8 rounded-[48px] blur-3xl"
//             style={{ background: "linear-gradient(135deg, rgba(2,195,154,0.28), rgba(2,128,144,0.12))" }}
//           />

//           {/* framed photo */}
//           <div
//             className="relative rounded-[36px] p-2.5"
//             style={{ background: "linear-gradient(135deg, rgba(2,195,154,0.55), rgba(2,128,144,0.22))" }}
//           >
//             <div className="rounded-[28px] overflow-hidden shadow-2xl">
//               <img
//                 src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=80"
//                 alt="Freshly washed and folded laundry"
//                 className="w-full h-[420px] lg:h-[500px] object-cover"
//                 loading="eager"
//               />
//               {/* subtle bottom scrim for the caption */}
//               <div
//                 className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[11px] font-semibold backdrop-blur"
//                 style={{ backgroundColor: "rgba(5,40,42,0.7)", color: "#7EE8CC", border: "1px solid rgba(2,195,154,0.35)" }}
//               >
//                 ✨ Fresh from the fold — delivered in 24h
//               </div>
//             </div>
//           </div>

//           {/* floating: live order card */}
//           <div
//             className="wf-float absolute -left-6 top-12 w-52 sm:w-60 rounded-2xl p-4 shadow-2xl pointer-events-none"
//             style={{ backgroundColor: "rgba(255,255,255,0.96)", border: `1px solid ${colors.cardBorder}` }}
//           >
//             <div className="flex items-center justify-between">
//               <span className="text-[11px] font-bold" style={{ color: colors.textDark }}>Order #V-2481</span>
//               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.mint}1A`, color: colors.seafoam }}>
//                 In progress
//               </span>
//             </div>
//             <div className="mt-3 h-1.5 rounded-full" style={{ backgroundColor: colors.cardTint }}>
//               <div
//                 className="h-full w-[64%] rounded-full"
//                 style={{ background: "linear-gradient(90deg, #028090, #02C39A)" }}
//               />
//             </div>
//             <div className="mt-2 flex justify-between text-[10px]" style={{ color: colors.textMuted }}>
//               <span>Picked up</span>
//               <span className="font-bold" style={{ color: colors.seafoam }}>Washing</span>
//               <span>Delivered</span>
//             </div>
//           </div>

//           {/* floating: rating card */}
//           <div
//             className="wf-float-slow absolute -bottom-7 left-8 rounded-2xl p-4 shadow-2xl pointer-events-none"
//             style={{ backgroundColor: "rgba(255,255,255,0.96)", border: `1px solid ${colors.cardBorder}` }}
//           >
//             <div className="flex items-center gap-3">
//               <div
//                 className="w-10 h-10 rounded-full flex items-center justify-center"
//                 style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
//               >
//                 <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
//               </div>
//               <div>
//                 <div className="text-base font-bold" style={{ color: colors.textDark }}>4.9/5</div>
//                 <div className="text-[10px]" style={{ color: colors.textMuted }}>2,300+ happy customers</div>
//               </div>
//             </div>
//           </div>

//           {/* floating: delivery chip */}
//           <div
//             className="wf-float absolute -right-3 top-1/3 rounded-2xl px-4 py-3 shadow-2xl pointer-events-none"
//             style={{ backgroundColor: "rgba(5,40,42,0.92)", border: "1px solid rgba(2,195,154,0.4)" }}
//           >
//             <div className="flex items-center gap-2.5">
//               <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.mint}1F` }}>
//                 <Truck size={14} color={colors.mint} />
//               </div>
//               <div>
//                 <div className="text-[11px] font-bold text-white">Delivering today</div>
//                 <div className="text-[10px]" style={{ color: "#8FB3B0" }}>ETA 2:30 PM · Free</div>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       {/* Stats — animated count-up */}
//       <div className="relative border-t" style={{ borderColor: `${colors.primaryTeal}33`, backgroundColor: colors.bgDark }}>
//         <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
//           {[
//             { value: "50", suffix: "K+", label: "Orders delivered" },
//             { value: "120", suffix: "+", label: "Partner laundries" },
//             { value: "4.9", suffix: "★", label: "Average rating" },
//             { value: "24", suffix: "h", label: "Avg. turnaround" },
//           ].map((s, i) => (
//             <Reveal key={s.label} delay={i * 80} className="text-center">
//               <div className="text-2xl sm:text-3xl" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
//                 <Counter value={s.value} suffix={s.suffix} />
//               </div>
//               <div className="mt-1.5 text-xs sm:text-sm" style={{ color: "#8FB3B0" }}>{s.label}</div>
//             </Reveal>
//           ))}
//         </div>
//       </div>

//       {/* Partner marquee */}
//       <PartnerMarquee />
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // SERVICES — priced tags
// // ------------------------------------------------------------
// const services = [
//   { icon: Droplets, name: "Wash & Fold", desc: "Machine wash, tumble dry and neatly folded. Perfect for everyday clothes.", price: "₹80", unit: "per kg", color: colors.primaryTeal },
//   { icon: Wind, name: "Wash & Iron", desc: "Washed and pressed to perfection — crisp lines on every shirt and trouser.", price: "₹99", unit: "per kg", color: colors.seafoam },
//   { icon: Sparkles, name: "Dry Cleaning", desc: "Gentle chemical cleaning for suits, silk, wool and delicate fabrics.", price: "₹149", unit: "per item", color: colors.mint },
//   { icon: Shirt, name: "Ironing & Pressing", desc: "Professional steam pressing that removes every wrinkle and crease.", price: "₹25", unit: "per item", color: colors.primaryTeal },
//   { icon: BedDouble, name: "Bedding & Household", desc: "Comforters, curtains and towels washed large-scale with extra care.", price: "₹120", unit: "per item", color: colors.seafoam },
//   { icon: Crown, name: "Premium Care", desc: "Stain treatment, fabric softener and hand-finishing for special pieces.", price: "₹199", unit: "per item", color: colors.mint },
// ];

// function Services() {
//   const { user } = useAuth();

//   return (
//     <section id="services" className="py-20 sm:py-28" style={{ backgroundColor: colors.bgLight }}>
//       <div className="max-w-7xl mx-auto px-5 sm:px-8">
//         <SectionHeading
//           tag="Price tags, no fine print"
//           title="Everything your clothes need"
//           sub="From everyday wash & fold to luxury dry cleaning — every service comes tagged with its price up front."
//         />

//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 pt-2">
//           {services.map((s, i) => (
//             <Reveal key={s.name} delay={(i % 3) * 80}>
//               <TagCard className="group h-full p-6 sm:p-7 pt-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
//                 <div className="flex items-start justify-between">
//                   <div
//                     className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
//                     style={{ backgroundColor: `${s.color}1F` }}
//                   >
//                     <s.icon size={22} color={s.color} />
//                   </div>
//                   <span className="text-right">
//                     <span className="block text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>{s.price}</span>
//                     <span className="text-[11px]" style={{ color: colors.textMuted }}>{s.unit}</span>
//                   </span>
//                 </div>
//                 <h3 className="mt-5 text-lg font-semibold" style={{ color: colors.textDark }}>{s.name}</h3>
//                 <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.textMuted }}>{s.desc}</p>
//                 <Link
//                   to={user?.role === "customer" ? "/customer/new-order" : "/signup"}
//                   className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:gap-2.5"
//                   style={{ color: colors.primaryTeal }}
//                 >
//                   Book now <ArrowRight size={15} />
//                 </Link>
//               </TagCard>
//             </Reveal>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // HOW IT WORKS — the clothesline
// // ------------------------------------------------------------
// const howSteps = [
//   { icon: CreditCard, title: "Book online", desc: "Pick your services and a pickup slot — takes under a minute." },
//   { icon: Truck, title: "We pick up", desc: "Our rider collects your bag from your doorstep, right on schedule." },
//   { icon: Droplets, title: "Wash, dry & fold", desc: "Premium detergents, careful sorting and spotless finishing." },
//   { icon: Sparkles, title: "Delivered fresh", desc: "Back at your door, neatly packed and smelling amazing." },
// ];

// function HowItWorks() {
//   return (
//     <section id="how" className="py-20 sm:py-28 relative overflow-hidden" style={{ backgroundColor: colors.cardTint }}>
//       <div className="absolute -top-32 right-0 w-96 h-96 rounded-full" style={{ backgroundColor: `${colors.mint}14` }} />
//       <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
//         <SectionHeading
//           tag="One line, four stops"
//           title="Fresh laundry in 4 easy steps"
//           sub="You never have to visit a laundromat again — just follow the line."
//         />

//         <div className="relative">
//           <div
//             className="hidden md:block absolute top-[38px] left-0 right-0 h-px"
//             style={{ backgroundImage: `linear-gradient(90deg, ${colors.primaryTeal} 0, ${colors.primaryTeal} 6px, transparent 6px, transparent 14px)`, backgroundSize: "14px 1px" }}
//           />
//           <div
//             className="md:hidden absolute top-0 bottom-0 left-[19px] w-px"
//             style={{ backgroundImage: `linear-gradient(180deg, ${colors.primaryTeal} 0, ${colors.primaryTeal} 6px, transparent 6px, transparent 14px)`, backgroundSize: "1px 14px" }}
//           />

//           <div className="grid md:grid-cols-4 gap-8 md:gap-6">
//             {howSteps.map((s, i) => (
//               <Reveal key={s.title} delay={i * 100} className="relative pl-14 md:pl-0">
//                 <div className="md:flex md:flex-col md:items-start">
//                   <div
//                     className="absolute md:relative left-0 md:left-auto top-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white shrink-0"
//                     style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
//                   >
//                     {i + 1}
//                   </div>
//                   <div className="mt-0 md:mt-5 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primaryTeal}1F` }}>
//                     <s.icon size={19} color={colors.primaryTeal} />
//                   </div>
//                   <h3 className="mt-4 text-base font-semibold" style={{ color: colors.textDark }}>{s.title}</h3>
//                   <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.textMuted }}>{s.desc}</p>
//                 </div>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // APP FEATURES / LIVE TRACKING
// // ------------------------------------------------------------
// const items = [
//   {
//     icon: MapPin,
//     title: "Real-time order tracking",
//     desc: "Every stage of your order updates live, from pickup to the final fold.",
//   },
//   {
//     icon: Bell,
//     title: "Smart notifications",
//     desc: "A gentle nudge the moment your order is picked up, ready, or on its way back.",
//   },
//   {
//     icon: History,
//     title: "Order history, saved",
//     desc: "Reorder your usual wash in one tap — your preferences are always remembered.",
//   },
//   {
//     icon: ShieldCheck,
//     title: "Verified local partners",
//     desc: "Every laundry on WashFlow is vetted for quality, hygiene and reliability.",
//   },
// ];

// function AppFeatures() {
//   return (
//     <section className="py-24 md:py-[120px] border-y" style={{ backgroundColor: colors.cardTint, borderColor: colors.cardBorder }} id="features">
//       <div className="max-w-[1180px] mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-14 lg:gap-[70px] items-center">
//         <Reveal>
//           <span
//             className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
//             style={{ color: colors.seafoam }}
//           >
//             Built for customers
//           </span>
//           <h2
//             className="mt-4 mb-9 text-[26px] sm:text-[32px] lg:text-[36px] leading-[1.2]"
//             style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
//           >
//             Everything you need to never think about laundry day again.
//           </h2>
//           <div className="flex flex-col">
//             {items.map((it, i) => {
//               const Icon = it.icon;
//               return (
//                 <div
//                   key={it.title}
//                   className="flex gap-5 py-6 px-1.5"
//                   style={i < items.length - 1 ? { borderBottom: `1px solid ${colors.cardBorder}` } : {}}
//                 >
//                   <div
//                     className="flex-shrink-0 w-[46px] h-[46px] rounded-xl flex items-center justify-center"
//                     style={{ backgroundColor: colors.bgLight, border: `1px solid ${colors.cardBorder}` }}
//                   >
//                     <Icon size={22} color={colors.primaryTeal} strokeWidth={1.8} />
//                   </div>
//                   <div>
//                     <h3 className="text-[17px] font-bold mb-1.5" style={{ color: colors.textDark }}>{it.title}</h3>
//                     <p className="text-[14.5px] leading-[1.6]" style={{ color: colors.textMuted }}>{it.desc}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </Reveal>

//         <Reveal delay={120}>
//           <div
//             className="mx-auto w-[250px] sm:w-[290px] rounded-[36px] p-3.5"
//             style={{
//               background: `linear-gradient(135deg, ${colors.bgDark}, ${colors.panelDark})`,
//               boxShadow: "0 40px 80px -20px rgba(5,40,42,0.45), 0 0 0 1px rgba(2,128,144,0.15)",
//             }}
//           >
//             <div className="bg-white rounded-[24px] overflow-hidden min-h-[440px] sm:min-h-[520px] px-4.5 py-5.5">
//               <div className="flex justify-between items-center mb-5">
//                 <div>
//                   <div className="text-[12px]" style={{ color: colors.textMuted }}>Good evening,</div>
//                   <div className="text-[16px]" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>Riya</div>
//                 </div>
//                 <img
//                   src="https://i.pravatar.cc/60?img=47"
//                   alt="Riya's profile"
//                   className="w-[30px] h-[30px] rounded-full object-cover"
//                   style={{ border: `1px solid ${colors.cardBorder}` }}
//                   loading="lazy"
//                 />
//               </div>

//               <div
//                 className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full mb-4"
//                 style={{ backgroundColor: `${colors.mint}1A`, color: colors.seafoam }}
//               >
//                 <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: colors.mint }} />
//                 Order #V-2481 · In progress
//               </div>

//               <div className="rounded-2xl p-4 mb-3.5" style={{ border: `1px solid ${colors.cardBorder}` }}>
//                 <div className="flex justify-between items-center mb-2.5">
//                   <span className="text-[13px] font-bold" style={{ color: colors.textDark }}>Wash &amp; Fold</span>
//                   <span className="text-[11.5px]" style={{ color: colors.textMuted }}>6 items</span>
//                 </div>
//                 <span className="text-[11.5px]" style={{ color: colors.textMuted }}>Sunshine Laundry Co.</span>
//                 <div className="h-[5px] rounded-md overflow-hidden mt-2" style={{ backgroundColor: colors.cardTint }}>
//                   <span
//                     className="block h-full w-[64%] rounded-md"
//                     style={{ background: `linear-gradient(90deg, ${colors.primaryTeal}, ${colors.mint})` }}
//                   />
//                 </div>
//                 <div className="flex justify-between items-center mt-2">
//                   <span className="text-[11.5px]" style={{ color: colors.textMuted }}>Picked up</span>
//                   <span className="text-[11.5px] font-bold" style={{ color: colors.seafoam }}>Drying</span>
//                   <span className="text-[11.5px]" style={{ color: colors.textMuted }}>Delivered</span>
//                 </div>
//               </div>

//               <div className="rounded-2xl p-4 mb-3.5" style={{ border: `1px solid ${colors.cardBorder}` }}>
//                 <div className="flex justify-between items-center">
//                   <span className="text-[13px] font-bold" style={{ color: colors.textDark }}>Dry Cleaning</span>
//                   <span className="text-[11.5px] font-bold" style={{ color: colors.mint }}>Delivered ✓</span>
//                 </div>
//               </div>

//               <div className="rounded-2xl p-4" style={{ border: `1px solid ${colors.cardBorder}` }}>
//                 <div className="flex justify-between items-center">
//                   <span className="text-[13px] font-bold" style={{ color: colors.textDark }}>Iron Only</span>
//                   <span className="text-[11.5px]" style={{ color: colors.textMuted }}>Scheduled · Tomorrow</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </Reveal>
//       </div>
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // WHY US
// // ------------------------------------------------------------
// const features = [
//   { icon: ShieldCheck, title: "Quality guaranteed", desc: "Not happy with a single piece? We redo it free. Simple as that." },
//   { icon: Clock, title: "Always on time", desc: "98.6% on-time delivery record, backed by live order tracking." },
//   { icon: Leaf, title: "Eco-friendly care", desc: "Skin-friendly, biodegradable detergents and energy-efficient machines." },
//   { icon: MapPin, title: "Doorstep service", desc: "Free pickup and delivery, every time — no minimum order." },
//   { icon: RefreshCw, title: "Live tracking", desc: "Follow your order from pickup to delivery on your dashboard." },
//   { icon: CreditCard, title: "Simple payments", desc: "Pay online or at delivery. Transparent pricing on every item." },
// ];

// function WhyUs() {
//   return (
//     <section id="why" className="py-20 sm:py-28" style={{ backgroundColor: colors.bgLight }}>
//       <div className="max-w-7xl mx-auto px-5 sm:px-8">
//         <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
//           <div>
//             <Reveal>
//               <Eyebrow>Why WashFlow</Eyebrow>
//               <h2
//                 className="mt-5 text-3xl sm:text-4xl leading-[1.15]"
//                 style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
//               >
//                 More than a laundry — it's a promise of freshness
//               </h2>
//               <p className="mt-5 text-sm sm:text-base leading-relaxed" style={{ color: colors.textMuted }}>
//                 We obsess over the details others skip: fabric-specific washing,
//                 careful sorting by colour and material, gentle detergents, and a
//                 final inspection before every delivery.
//               </p>
//             </Reveal>
//             <Reveal delay={100}>
//               <div className="mt-8 relative overflow-hidden rounded-2xl shadow-lg">
//                 <img
//                   src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=900&q=80"
//                   alt="Clothes hanging fresh from the wash"
//                   className="w-full h-56 sm:h-64 object-cover"
//                   loading="lazy"
//                 />
//                 <div
//                   className="absolute inset-0"
//                   style={{ background: "linear-gradient(135deg, rgba(5,40,42,0.92), rgba(2,128,144,0.72))" }}
//                 />
//                 <div className="absolute inset-0 flex items-center gap-5 p-6">
//                   <div
//                     className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
//                     style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
//                   >
//                     <Quote size={20} color="#FFFFFF" />
//                   </div>
//                   <p className="text-sm leading-relaxed" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
//                     "I haven't touched a washing machine in 14 months. WashFlow just works."
//                   </p>
//                 </div>
//               </div>
//             </Reveal>
//           </div>

//           <div className="grid sm:grid-cols-2 gap-5">
//             {features.map((f, i) => (
//               <Reveal key={f.title} delay={(i % 2) * 80}>
//                 <div
//                   className="h-full rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
//                   style={{ backgroundColor: colors.cardTint, borderColor: colors.cardBorder }}
//                 >
//                   <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.mint}22` }}>
//                     <f.icon size={19} color={colors.seafoam} />
//                   </div>
//                   <h3 className="mt-4 text-base font-semibold" style={{ color: colors.textDark }}>{f.title}</h3>
//                   <p className="mt-1.5 text-sm leading-relaxed" style={{ color: colors.textMuted }}>{f.desc}</p>
//                 </div>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // TESTIMONIALS
// // ------------------------------------------------------------
// const testimonials = [
//   { name: "Ananya Sharma", city: "Bengaluru", img: "https://i.pravatar.cc/80?img=47", text: "The pickup is always on time and my clothes smell incredible. The dashboard tracking is a game changer — I always know exactly where my order is.", rating: 5 },
//   { name: "Rohit Mehta", city: "Mumbai", img: "https://i.pravatar.cc/80?img=12", text: "I'm a busy consultant who travels weekly. Same-day service means I always have crisp shirts for meetings. Worth every rupee.", rating: 5 },
//   { name: "Priya Nair", city: "Pune", img: "https://i.pravatar.cc/80?img=32", text: "They handled my silk sarees with so much care. Dry cleaning results are flawless and delivery is always fresh and neatly packed.", rating: 5 },
// ];

// function Testimonials() {
//   return (
//     <section className="py-20 sm:py-28 relative overflow-hidden" style={{ backgroundColor: colors.bgDark }}>
//       <div className="absolute -top-40 left-1/3 w-96 h-96 rounded-full" style={{ backgroundColor: colors.panelDark, opacity: 0.6 }} />
//       <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
//         <Reveal className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
//           <Eyebrow tone="dark">Loved by customers</Eyebrow>
//           <h2 className="mt-5 text-3xl sm:text-4xl leading-[1.15]" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
//             Don't take our word for it
//           </h2>
//         </Reveal>

//         <div className="grid md:grid-cols-3 gap-6">
//           {testimonials.map((t, i) => (
//             <Reveal key={t.name} delay={i * 100}>
//               <div
//                 className="h-full rounded-2xl p-6 sm:p-7"
//                 style={{ backgroundColor: colors.panelDark, border: `1px solid ${colors.primaryTeal}44` }}
//               >
//                 <div className="flex gap-1">
//                   {Array.from({ length: t.rating }).map((_, s) => (
//                     <Star key={s} size={15} color={colors.mint} fill={colors.mint} />
//                   ))}
//                 </div>
//                 <p className="mt-4 text-sm leading-relaxed" style={{ color: "#C8E3E0" }}>
//                   "{t.text}"
//                 </p>
//                 <div className="mt-6 flex items-center gap-3">
//                   <img
//                     src={t.img}
//                     alt={t.name}
//                     loading="lazy"
//                     className="w-10 h-10 rounded-full object-cover"
//                     style={{ border: "2px solid rgba(2,195,154,0.5)" }}
//                   />
//                   <div>
//                     <div className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{t.name}</div>
//                     <div className="text-xs" style={{ color: "#8FB3B0" }}>{t.city}</div>
//                   </div>
//                 </div>
//               </div>
//             </Reveal>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // PRICING — plan tags
// // ------------------------------------------------------------
// const plans = [
//   { name: "Essentials", price: "₹199", period: "/month", desc: "For individuals who want the basics handled.", features: ["10 kg wash & fold / month", "Free doorstep pickup", "48-hour turnaround", "Live order tracking"], popular: false },
//   { name: "Family", price: "₹399", period: "/month", desc: "The most-loved plan for busy households.", features: ["25 kg wash & fold / month", "Priority same-day pickup", "24-hour turnaround", "Free stain treatment", "Free delivery, always"], popular: true },
//   { name: "Premium", price: "₹699", period: "/month", desc: "For those who want everything, unlimited.", features: ["Up to 50 kg / month", "Dedicated service manager", "Same-day express service", "Premium fabric care", "Free dry cleaning (2 items)"], popular: false },
// ];

// function Pricing() {
//   const { user } = useAuth();

//   return (
//     <section id="pricing" className="py-20 sm:py-28" style={{ backgroundColor: colors.bgLight }}>
//       <div className="max-w-7xl mx-auto px-5 sm:px-8">
//         <SectionHeading
//           tag="Every plan, tagged"
//           title="Simple plans, zero hidden fees"
//           sub="Start with a pay-per-order plan or subscribe and save. Cancel anytime."
//         />

//         <div className="grid md:grid-cols-3 gap-7 lg:gap-8 items-stretch max-w-5xl mx-auto pt-2">
//           {plans.map((p, i) => (
//             <Reveal key={p.name} delay={i * 100}>
//               <TagCard
//                 dark={p.popular}
//                 holeBg={p.popular ? colors.bgDark : colors.bgLight}
//                 className="relative h-full p-7 sm:p-8 pt-9 flex flex-col transition-all duration-300 hover:-translate-y-1.5"
//                 style={p.popular ? { boxShadow: "0 24px 60px rgba(5,40,42,0.28)" } : {}}
//               >
//                 {p.popular && (
//                   <span
//                     className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full text-white"
//                     style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
//                   >
//                     Most popular
//                   </span>
//                 )}
//                 <h3 className="text-lg font-semibold" style={{ color: p.popular ? "#FFFFFF" : colors.textDark }}>{p.name}</h3>
//                 <p className="mt-1.5 text-xs leading-relaxed" style={{ color: p.popular ? "#8FB3B0" : colors.textMuted }}>{p.desc}</p>
//                 <div className="mt-5 flex items-baseline gap-1">
//                   <span className="text-3xl sm:text-4xl" style={{ color: p.popular ? colors.mint : colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>{p.price}</span>
//                   <span className="text-sm" style={{ color: p.popular ? "#8FB3B0" : colors.textMuted }}>{p.period}</span>
//                 </div>
//                 <ul className="mt-6 space-y-3 flex-1">
//                   {p.features.map((f) => (
//                     <li key={f} className="flex items-start gap-2.5 text-sm">
//                       <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: p.popular ? `${colors.mint}26` : `${colors.mint}1A` }}>
//                         <Check size={11} color={colors.mint} />
//                       </span>
//                       <span style={{ color: p.popular ? "#C8E3E0" : colors.textDark }}>{f}</span>
//                     </li>
//                   ))}
//                 </ul>
//                 <Link
//                   to={user?.role === "customer" ? "/customer/new-order" : "/signup"}
//                   className="mt-8 w-full text-center text-sm font-semibold py-3 rounded-xl transition-all hover:brightness-110"
//                   style={{
//                     backgroundColor: p.popular ? "#028090" : colors.cardTint,
//                     color: p.popular ? "#FFFFFF" : colors.primaryTeal,
//                     border: p.popular ? "none" : `1px solid ${colors.cardBorder}`,
//                   }}
//                 >
//                   {user?.role === "customer" ? "Book this plan" : `Choose ${p.name}`}
//                 </Link>
//               </TagCard>
//             </Reveal>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // CTA BANNER
// // ------------------------------------------------------------
// function CtaBanner() {
//   const { user } = useAuth();

//   return (
//     <section className="px-5 sm:px-8 pb-20 sm:pb-28" style={{ backgroundColor: colors.bgLight }}>
//       <div className="max-w-7xl mx-auto">
//         <Reveal>
//           <div
//             className="relative overflow-hidden rounded-3xl px-8 py-14 sm:px-14 sm:py-20 text-center"
//             style={{ background: "linear-gradient(120deg, #05282A, #0B3B3E 55%, #028090)" }}
//           >
//             <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full" style={{ backgroundColor: `${colors.mint}1F` }} />
//             <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full" style={{ backgroundColor: `${colors.primaryTeal}33` }} />
//             <div className="relative">
//               <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
//                 Ready for effortlessly
//                 <br />
//                 fresh laundry?
//               </h2>
//               <p className="mt-5 text-sm sm:text-base max-w-md mx-auto leading-relaxed" style={{ color: "#A9C9C6" }}>
//                 Create your free account in 30 seconds and schedule your first
//                 pickup today.
//               </p>
//               <div className="mt-9 flex flex-wrap justify-center gap-4">
//                 <Link
//                   to={user?.role === "customer" ? "/customer/new-order" : "/signup"}
//                   className="flex items-center gap-2 text-sm sm:text-base font-semibold px-7 py-3.5 rounded-xl text-white shadow-xl transition-all hover:brightness-110 hover:-translate-y-0.5"
//                   style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
//                 >
//                   {user?.role === "customer" ? "Place an order" : "Create free account"} <ArrowRight size={17} />
//                 </Link>
//                 {!user && (
//                   <Link
//                     to="/login"
//                     className="flex items-center gap-2 text-sm sm:text-base font-semibold px-7 py-3.5 rounded-xl transition-colors"
//                     style={{ color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.3)" }}
//                   >
//                     Sign in
//                   </Link>
//                 )}
//               </div>
//             </div>
//           </div>
//         </Reveal>
//       </div>
//     </section>
//   );
// }

// // ------------------------------------------------------------
// // FOOTER
// // ------------------------------------------------------------
// function Footer() {
//   return (
//     <footer style={{ backgroundColor: colors.bgDark }}>
//       <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
//         <div>
//           <div className="flex items-center gap-2.5">
//             <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}>
//               <Clip size={16} color="#FFFFFF" />
//             </div>
//             <span className="text-lg" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>WashFlow</span>
//           </div>
//           <p className="mt-4 text-sm leading-relaxed" style={{ color: "#8FB3B0" }}>
//             Premium laundry pickup &amp; delivery, powered by trusted local
//             laundries. Fresh clothes, zero effort.
//           </p>
//         </div>

//         <div>
//           <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.mint }}>Company</h4>
//           <ul className="mt-4 space-y-2.5">
//             {["About us", "Careers", "Partner with us", "Press"].map((l) => (
//               <li key={l}>
//                 <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: "#A9C9C6" }}>{l}</a>
//               </li>
//             ))}
//           </ul>
//         </div>

//         <div>
//           <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.mint }}>Support</h4>
//           <ul className="mt-4 space-y-2.5">
//             {["Help centre", "Track my order", "Refund policy", "Terms & privacy"].map((l) => (
//               <li key={l}>
//                 <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: "#A9C9C6" }}>{l}</a>
//               </li>
//             ))}
//           </ul>
//         </div>

//         <div>
//           <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.mint }}>Contact</h4>
//           <ul className="mt-4 space-y-3 text-sm" style={{ color: "#A9C9C6" }}>
//             <li className="flex items-center gap-2.5"><PhoneCall size={15} color={colors.mint} /> 1800-123-4567</li>
//             <li className="flex items-center gap-2.5"><Mail size={15} color={colors.mint} /> hello@washflow.app</li>
//             <li className="flex items-start gap-2.5"><MapPin size={15} color={colors.mint} className="mt-0.5" /> Serving 120+ laundries across India</li>
//           </ul>
//         </div>
//       </div>

//       <div className="border-t" style={{ borderColor: `${colors.primaryTeal}33` }}>
//         <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
//           <span className="text-xs" style={{ color: "#8FB3B0" }}>© {new Date().getFullYear()} WashFlow. All rights reserved.</span>
//           <span className="text-xs" style={{ color: "#8FB3B0" }}>Made with <span style={{ color: colors.mint }}>♥</span> for cleaner wardrobes</span>
//         </div>
//       </div>
//     </footer>
//   );
// }

// // ------------------------------------------------------------
// // PAGE
// // ------------------------------------------------------------
// export default function LandingPage() {
//   return (
//     <div style={{ fontFamily: "'Inter', sans-serif" }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
//         html { scroll-padding-top: 90px; }

//         @keyframes wf-sway {
//           0%, 100% { transform: rotate(-1.4deg); }
//           50% { transform: rotate(1.4deg); }
//         }
//         @keyframes wf-float {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(-10px); }
//         }
//         @keyframes wf-float-slow {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(8px); }
//         }
//         @keyframes wf-marquee {
//           0% { transform: translateX(0); }
//           100% { transform: translateX(-50%); }
//         }
//         .wf-sway { animation: wf-sway 6s ease-in-out infinite; transform-origin: top center; }
//         .wf-float { animation: wf-float 5s ease-in-out infinite; will-change: transform; }
//         .wf-float-slow { animation: wf-float-slow 6s ease-in-out infinite; will-change: transform; }
//         .wf-marquee-track { animation: wf-marquee 32s linear infinite; will-change: transform; }
//         .wf-marquee:hover .wf-marquee-track { animation-play-state: paused; }

//         @media (prefers-reduced-motion: reduce) {
//           .wf-sway, .wf-float, .wf-float-slow, .wf-marquee-track { animation: none !important; }
//         }

//         a:focus-visible, button:focus-visible {
//           outline: 2px solid #028090;
//           outline-offset: 2px;
//         }
//       `}</style>

//       <Navbar />
//       <Hero />
//       <Services />
//       <HowItWorks />
//       <AppFeatures />
//       <WhyUs />
//       <Testimonials />
//       <Pricing />
//       <Faq />
//       <CtaBanner />
//       <Footer />
//     </div>
//   );
// }




import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import useReveal from '../../hooks/useReveal'
import Avatar from "../../components/layout/Avatar";
import { useAuth } from "../../context/AuthContext";
import { getMyOrders } from "../../api/orderApi";
import { ACTIVE_STATUSES } from "../../utils/orderStatus";

import {
  Shirt,
  Sparkles,
  Droplets,
  Wind,
  BedDouble,
  Crown,
  Star,
  Truck,
  ShieldCheck,
  Leaf,
  Clock,
  CreditCard,
  MapPin,
  ArrowRight,
  Check,
  PhoneCall,
  Mail,
  Timer,
  Quote,
  Menu,
  X,
  RefreshCw,
  Bell,
  History,
  ChevronDown,
  ClipboardList,
  PackageSearch,
  User as UserIcon,
  LogOut,
  LayoutGrid,
  Loader2,
} from "lucide-react";

// Where each role's main screen lives — used by the logged-in navbar dropdown.
function roleHome(role) {
  switch (role) {
    case "super_admin":
      return "/super/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "employee":
      return "/employee/dashboard";
    default:
      return "/";
  }
}

// Builds a slug-aware auth path. On the platform landing page (`/`, no slug),
// falls back to the generic /login and /signup routes. On a shop landing page
// (`/shop/:slug`), keeps the visitor inside that shop's auth flow.
function authPath(slug, page) {
  return slug ? `/shop/${slug}/${page}` : `/${page}`;
}

// ------------------------------------------------------------
// DESIGN TOKENS — unchanged from the original palette
// ------------------------------------------------------------
const colors = {
  bgDark: "#05282A",
  panelDark: "#0B3B3E",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  gold: "#C9A24B",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

// ------------------------------------------------------------
// COUNTER — animates a number counting up when it scrolls into view.
// Supports suffixes/prefixes: <Counter value="4.9" suffix="★" />
// ------------------------------------------------------------
function Counter({ value, suffix = "", duration = 1500 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const numeric = parseFloat(String(value));
    if (Number.isNaN(numeric)) {
      setDisplay(String(value));
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = numeric * eased;
      setDisplay(
        current >= 10
          ? Math.round(current).toLocaleString("en-IN")
          : current.toFixed(1),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(String(numeric));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

// ------------------------------------------------------------
// PARTNER MARQUEE — scrolling strip of partner laundries
// ------------------------------------------------------------
const partnerNames = [
  "Amisha Laundry",
  "Sky Wash",
  "Drain & Dry",
  "Fresh Fold",
  "Bubble & Suds",
  "Sparkle Care",
  "Urban Clean",
  "Silk Touch",
];

function PartnerMarquee() {
  const row = [...partnerNames, ...partnerNames]; // duplicated for seamless loop
  return (
    <div
      className="wf-marquee overflow-hidden border-t border-white/10 py-5 select-none"
      style={{ backgroundColor: colors.bgDark }}
      aria-label="Partner laundries"
    >
      <div className="wf-marquee-track flex w-max items-center gap-12 px-6">
        {row.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="flex items-center gap-2.5 text-sm font-semibold whitespace-nowrap"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <Clip size={14} color={colors.mint} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// FAQ — interactive accordion
// ------------------------------------------------------------
const faqs = [
  {
    q: "How fast is pickup after I book?",
    a: "You choose a pickup slot at checkout — usually within 2–4 hours. Same-day pickup is free on all plans, and our riders send a live notification the moment they're on the way.",
  },
  {
    q: "What happens if my clothes get damaged?",
    a: "Every order is insured. If a piece comes back damaged or a stain doesn't lift after treatment, we redo it free or refund the item's value — no questions asked.",
  },
  {
    q: "Can I track my order live?",
    a: "Yes — every order updates in real time from pickup to delivery. You'll see exactly which stage it's in (washing, drying, ironing, out for delivery) on your dashboard and get notified at every step.",
  },
  {
    q: "Do you handle delicate fabrics like silk or wool?",
    a: "Absolutely. Delicates are sorted separately and cleaned with fabric-specific gentle processes. Add the Premium Care service for hand-finishing and stain treatment.",
  },
  {
    q: "How do I pay?",
    a: "Pay online with any card or UPI, or pay in cash at delivery. We never charge hidden fees — the price you see at booking is the price you pay.",
  },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-20 sm:py-28" style={{ backgroundColor: colors.cardTint }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <SectionHeading
          tag="Questions, answered"
          title="Frequently asked questions"
          sub="Everything you need to know before your first pickup — tap a question to expand it."
        />
        <div className="space-y-3.5">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 60}>
                <div
                  className="rounded-2xl border transition-all duration-300 overflow-hidden"
                  style={{
                    backgroundColor: colors.bgLight,
                    borderColor: isOpen ? colors.primaryTeal : colors.cardBorder,
                    boxShadow: isOpen ? "0 12px 32px rgba(5,40,42,0.08)" : "none",
                  }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4.5 text-left"
                    style={{ paddingTop: 18, paddingBottom: 18 }}
                  >
                    <span className="text-sm sm:text-base font-semibold" style={{ color: colors.textDark }}>
                      {f.q}
                    </span>
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                      style={{
                        backgroundColor: isOpen ? colors.primaryTeal : colors.cardTint,
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}
                    >
                      <ChevronDown size={14} color={isOpen ? "#FFFFFF" : colors.primaryTeal} />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="px-5 sm:px-6 pb-5 text-sm leading-relaxed"
                        style={{ color: colors.textMuted }}
                      >
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// REVEAL — scroll-triggered fade/slide-up, built on useReveal hook
// (no separate Reveal.js file — defined locally here)
// ------------------------------------------------------------
const Reveal = ({ as: Tag = 'div', delay = 0, className = '', children }) => {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7'
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  );
};

const Eyebrow = ({ children, tone = "light" }) => (
  <span
    className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full"
    style={{
      backgroundColor: tone === "light" ? `${colors.mint}17` : `${colors.mint}22`,
      color: tone === "light" ? colors.primaryTeal : colors.mint,
    }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.mint }} />
    {children}
  </span>
);

const SectionHeading = ({ tag, tone = "light", title, sub }) => (
  <Reveal className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
    <Eyebrow tone={tone}>{tag}</Eyebrow>
    <h2
      className="mt-5 text-3xl sm:text-4xl lg:text-[2.65rem] leading-[1.15]"
      style={{
        color: tone === "light" ? colors.textDark : "#FFFFFF",
        fontFamily: "'Libre Baskerville', serif",
      }}
    >
      {title}
    </h2>
    {sub && (
      <p
        className="mt-4 text-sm sm:text-base leading-relaxed"
        style={{ color: tone === "light" ? colors.textMuted : "#A9C9C6" }}
      >
        {sub}
      </p>
    )}
  </Reveal>
);

const TagCard = ({ children, dark = false, holeBg, className = "", style = {} }) => {
  const hole = holeBg || (dark ? colors.panelDark : colors.bgLight);
  const edge = dark ? "rgba(255,255,255,0.22)" : colors.cardBorder;
  return (
    <div
      className={`relative rounded-[22px] ${className}`}
      style={{
        backgroundColor: dark ? colors.panelDark : colors.bgLight,
        border: `1.5px dashed ${edge}`,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute w-3.5 h-3.5 rounded-full"
        style={{
          top: "-8px",
          left: "26px",
          backgroundColor: hole,
          border: `1.5px dashed ${edge}`,
        }}
      />
      {children}
    </div>
  );
};

const Clip = ({ size = 20, color = colors.mint }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 2v6M16 2v6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <rect x="6" y="7" width="12" height="14" rx="4" stroke={color} strokeWidth="1.8" />
    <path d="M12 7v14" stroke={color} strokeWidth="1.4" strokeDasharray="1.5 2.5" />
  </svg>
);

// ------------------------------------------------------------
// NAVBAR
// ------------------------------------------------------------
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tracking, setTracking] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Services", href: "#services" },
    { label: "How it works", href: "#how" },
    { label: "Live tracking", href: "#features" },
    { label: "Why us", href: "#why" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const handleLogout = () => {
    setProfileOpen(false);
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  // Jump straight into the tracking page of the most recent active order.
  const handleTrackOrder = async () => {
    setProfileOpen(false);
    setMenuOpen(false);
    setTracking(true);
    try {
      const res = await getMyOrders();
      const active = (res.data || []).filter((o) => ACTIVE_STATUSES.includes(o.status));
      navigate(active.length > 0 ? `/customer/orders/${active[0].id}` : "/customer/orders");
    } catch {
      navigate("/customer/orders");
    } finally {
      setTracking(false);
    }
  };

  const loginUrl = authPath(slug, "login");
  const signupUrl = authPath(slug, "signup");

  const customerMenu = [
    { label: "My Profile", icon: UserIcon, to: "/customer/profile" },
    { label: "My Orders", icon: ClipboardList, to: "/customer/orders" },
    { label: "Track Order", icon: PackageSearch, action: "track" },
    { label: "Addresses", icon: MapPin, to: "/customer/addresses" },
    { label: "Order History", icon: History, to: "/customer/orders" },
  ];

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(5,40,42,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 8px 30px rgba(5,40,42,0.18)" : "none",
      }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4">
        <Link to="/" className="flex items-center gap-2.5">
        
          <span
            className="text-lg tracking-tight"
            style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}
          >
            WashFlow
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            
        <a      key={l.href}
              href={l.href}
              className="text-sm font-medium transition-colors hover:text-[#02C39A]"
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right side — Sign in when logged out, profile when logged in */}
        <div className="hidden lg:flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to={loginUrl}
                className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "#FFFFFF" }}
              >
                Sign in
              </Link>
              <Link
                 to={signupUrl}
                className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow-lg transition-all hover:brightness-110"
                style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
              >
                Get started <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                <Avatar user={user} className="w-9 h-9 text-xs" />
                <span className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                  {(user.name || "User").split(" ")[0]}
                </span>
                <ChevronDown
                  size={15}
                  className="transition-transform"
                  style={{ color: "rgba(255,255,255,0.6)", transform: profileOpen ? "rotate(180deg)" : "none" }}
                />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div
                    className="absolute right-0 mt-2 w-64 z-50 rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: `1px solid ${colors.cardBorder}`,
                      boxShadow: "0 24px 60px -12px rgba(5,40,42,0.35)",
                    }}
                  >
                    {/* User header */}
                    <div
                      className="px-4 py-3 border-b"
                      style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar user={user} className="w-10 h-10 text-sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: colors.textDark }}>{user.name || "User"}</div>
                          <div className="text-[11px] truncate" style={{ color: colors.textMuted }}>{user.email || ""}</div>
                        </div>
                      </div>
                    </div>

                    <div className="py-1.5">
                      {user.role === "customer" ? (
                        <>
                          {customerMenu.map((item) =>
                            item.action === "track" ? (
                              <button
                                key={item.label}
                                onClick={handleTrackOrder}
                                disabled={tracking}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#EEF7F6] text-left"
                                style={{ color: colors.textDark }}
                              >
                                <span
                                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${colors.seafoam}12` }}
                                >
                                  <item.icon size={15} style={{ color: colors.seafoam }} />
                                </span>
                                {item.label}
                                {tracking && <Loader2 size={14} className="animate-spin ml-auto" />}
                              </button>
                            ) : (
                              <Link
                                key={item.label}
                                to={item.to}
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#EEF7F6]"
                                style={{ color: colors.textDark }}
                              >
                                <span
                                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${colors.primaryTeal}12` }}
                                >
                                  <item.icon size={15} style={{ color: colors.primaryTeal }} />
                                </span>
                                {item.label}
                              </Link>
                            ),
                          )}
                        </>
                      ) : (
                        <Link
                          to={roleHome(user.role)}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#EEF7F6]"
                          style={{ color: colors.textDark }}
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${colors.primaryTeal}12` }}
                          >
                            <LayoutGrid size={15} style={{ color: colors.primaryTeal }} />
                          </span>
                          Go to Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="mx-3 h-px" style={{ backgroundColor: colors.cardBorder }} />

                    <div className="py-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#EEF7F6] text-left"
                        style={{ color: "#C0392B" }}
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#FBE9E8" }}
                        >
                          <LogOut size={15} style={{ color: "#E0645C" }} />
                        </span>
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button
          className="lg:hidden text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="lg:hidden px-5 pb-6 pt-2 space-y-1" style={{ backgroundColor: colors.bgDark }}>
          {links.map((l) => (
            
           <a   key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {l.label}
            </a>
          ))}

          {!user ? (
            <div className="flex gap-3 pt-3">
              <Link
                to={loginUrl}
                className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-xl border"
                style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.25)" }}
              >
                Sign in
              </Link>
              <Link
                to={signupUrl}
                className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-xl text-white"
                style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
              >
                Get started
              </Link>
            </div>
          ) : user.role === "customer" ? (
            <div className="pt-3 space-y-1">
              {customerMenu.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleTrackOrder}
                disabled={tracking}
                className="block w-full text-left py-2.5 text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                Track Order
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2.5 text-sm font-medium"
                style={{ color: "#E0645C" }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-3">
              <Link
                to={roleHome(user.role)}
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-xl border"
                style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.25)" }}
              >
                Go to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-xl"
                style={{ color: "#E0645C", border: "1px solid rgba(224,100,92,0.5)" }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

// ------------------------------------------------------------
// HERO
// ------------------------------------------------------------
function Hero() {
  const { user } = useAuth();
  const { slug } = useParams();

  const steps = [
    { icon: Droplets, label: "Washing" },
    { icon: Wind, label: "Drying" },
    { icon: Sparkles, label: "Ready" },
  ];

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: colors.bgDark }}>
      <div
        className="absolute -top-40 -right-32 w-[34rem] h-[34rem] rounded-full"
        style={{ backgroundColor: colors.panelDark, opacity: 0.75 }}
      />
      <div
        className="absolute -bottom-48 -left-24 w-[30rem] h-[30rem] rounded-full"
        style={{ backgroundColor: colors.panelDark, opacity: 0.45 }}
      />
      <div
        className="absolute top-1/4 left-1/2 w-72 h-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.mint}22` }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-32 lg:pt-40 pb-20 lg:pb-28 grid lg:grid-cols-2 gap-16 lg:gap-10 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Eyebrow tone="dark">4.9/5 from 2,300+ loads done right</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-4xl sm:text-5xl xl:text-6xl leading-[1.1]"
            style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}
          >
            Laundry, done
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #02C39A, #00A896, #028090)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              beautifully fresh.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg leading-relaxed max-w-lg"
            style={{ color: "#A9C9C6" }}
          >
            Book online in under a minute. We pick up, wash, dry &amp; fold your
            clothes with premium care — and deliver them back to your door,
            fresh and on time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to={
                user?.role === "customer"
                  ? "/customer/new-order"
                  : authPath(slug, "signup")
              }
              className="flex items-center gap-2 text-sm sm:text-base font-semibold px-6 sm:px-7 py-3.5 rounded-xl text-white shadow-xl transition-all hover:brightness-110 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              {user?.role === "customer" ? "Place an order" : "Order laundry now"} <ArrowRight size={17} />
            </Link>
            {!user && (
              <Link
                to={authPath(slug, "login")}
                className="flex items-center gap-2 text-sm sm:text-base font-semibold px-6 sm:px-7 py-3.5 rounded-xl transition-colors"
                style={{ color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                Sign in
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 flex flex-wrap gap-x-8 gap-y-4"
          >
            {[
              { icon: Timer, text: "24h avg. turnaround" },
              { icon: Truck, text: "Free pickup & delivery" },
              { icon: ShieldCheck, text: "100% quality guarantee" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: "#A9C9C6" }}>
                <f.icon size={16} color={colors.mint} />
                {f.text}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — hero visual with floating live cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative hidden sm:block"
        >
          {/* soft glow behind the photo */}
          <div
            className="absolute -inset-8 rounded-[48px] blur-3xl"
            style={{ background: "linear-gradient(135deg, rgba(2,195,154,0.28), rgba(2,128,144,0.12))" }}
          />

          {/* framed photo */}
          <div
            className="relative rounded-[36px] p-2.5"
            style={{ background: "linear-gradient(135deg, rgba(2,195,154,0.55), rgba(2,128,144,0.22))" }}
          >
            <div className="rounded-[28px] overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=80"
                alt="Freshly washed and folded laundry"
                className="w-full h-[420px] lg:h-[500px] object-cover"
                loading="eager"
              />
              {/* subtle bottom scrim for the caption */}
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[11px] font-semibold backdrop-blur"
                style={{ backgroundColor: "rgba(5,40,42,0.7)", color: "#7EE8CC", border: "1px solid rgba(2,195,154,0.35)" }}
              >
                ✨ Fresh from the fold — delivered in 24h
              </div>
            </div>
          </div>

          {/* floating: live order card */}
          <div
            className="wf-float absolute -left-6 top-12 w-52 sm:w-60 rounded-2xl p-4 shadow-2xl pointer-events-none"
            style={{ backgroundColor: "rgba(255,255,255,0.96)", border: `1px solid ${colors.cardBorder}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold" style={{ color: colors.textDark }}>Order #V-2481</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.mint}1A`, color: colors.seafoam }}>
                In progress
              </span>
            </div>
            <div className="mt-3 h-1.5 rounded-full" style={{ backgroundColor: colors.cardTint }}>
              <div
                className="h-full w-[64%] rounded-full"
                style={{ background: "linear-gradient(90deg, #028090, #02C39A)" }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px]" style={{ color: colors.textMuted }}>
              <span>Picked up</span>
              <span className="font-bold" style={{ color: colors.seafoam }}>Washing</span>
              <span>Delivered</span>
            </div>
          </div>

          {/* floating: rating card */}
          <div
            className="wf-float-slow absolute -bottom-7 left-8 rounded-2xl p-4 shadow-2xl pointer-events-none"
            style={{ backgroundColor: "rgba(255,255,255,0.96)", border: `1px solid ${colors.cardBorder}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
              >
                <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
              </div>
              <div>
                <div className="text-base font-bold" style={{ color: colors.textDark }}>4.9/5</div>
                <div className="text-[10px]" style={{ color: colors.textMuted }}>2,300+ happy customers</div>
              </div>
            </div>
          </div>

          {/* floating: delivery chip */}
          <div
            className="wf-float absolute -right-3 top-1/3 rounded-2xl px-4 py-3 shadow-2xl pointer-events-none"
            style={{ backgroundColor: "rgba(5,40,42,0.92)", border: "1px solid rgba(2,195,154,0.4)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.mint}1F` }}>
                <Truck size={14} color={colors.mint} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white">Delivering today</div>
                <div className="text-[10px]" style={{ color: "#8FB3B0" }}>ETA 2:30 PM · Free</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats — animated count-up */}
      <div className="relative border-t" style={{ borderColor: `${colors.primaryTeal}33`, backgroundColor: colors.bgDark }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: "50", suffix: "K+", label: "Orders delivered" },
            { value: "120", suffix: "+", label: "Partner laundries" },
            { value: "4.9", suffix: "★", label: "Average rating" },
            { value: "24", suffix: "h", label: "Avg. turnaround" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="text-center">
              <div className="text-2xl sm:text-3xl" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1.5 text-xs sm:text-sm" style={{ color: "#8FB3B0" }}>{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Partner marquee */}
      <PartnerMarquee />
    </section>
  );
}

// ------------------------------------------------------------
// SERVICES — priced tags
// ------------------------------------------------------------
const services = [
  { icon: Droplets, name: "Wash & Fold", desc: "Machine wash, tumble dry and neatly folded. Perfect for everyday clothes.", price: "₹80", unit: "per kg", color: colors.primaryTeal },
  { icon: Wind, name: "Wash & Iron", desc: "Washed and pressed to perfection — crisp lines on every shirt and trouser.", price: "₹99", unit: "per kg", color: colors.seafoam },
  { icon: Sparkles, name: "Dry Cleaning", desc: "Gentle chemical cleaning for suits, silk, wool and delicate fabrics.", price: "₹149", unit: "per item", color: colors.mint },
  { icon: Shirt, name: "Ironing & Pressing", desc: "Professional steam pressing that removes every wrinkle and crease.", price: "₹25", unit: "per item", color: colors.primaryTeal },
  { icon: BedDouble, name: "Bedding & Household", desc: "Comforters, curtains and towels washed large-scale with extra care.", price: "₹120", unit: "per item", color: colors.seafoam },
  { icon: Crown, name: "Premium Care", desc: "Stain treatment, fabric softener and hand-finishing for special pieces.", price: "₹199", unit: "per item", color: colors.mint },
];

function Services() {
  const { user } = useAuth();
  const { slug } = useParams();

  return (
    <section id="services" className="py-20 sm:py-28" style={{ backgroundColor: colors.bgLight }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeading
          tag="Price tags, no fine print"
          title="Everything your clothes need"
          sub="From everyday wash & fold to luxury dry cleaning — every service comes tagged with its price up front."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 pt-2">
          {services.map((s, i) => (
            <Reveal key={s.name} delay={(i % 3) * 80}>
              <TagCard className="group h-full p-6 sm:p-7 pt-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${s.color}1F` }}
                  >
                    <s.icon size={22} color={s.color} />
                  </div>
                  <span className="text-right">
                    <span className="block text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>{s.price}</span>
                    <span className="text-[11px]" style={{ color: colors.textMuted }}>{s.unit}</span>
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold" style={{ color: colors.textDark }}>{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.textMuted }}>{s.desc}</p>
                <Link
                  to={
                    user?.role === "customer"
                      ? "/customer/new-order"
                      : authPath(slug, "signup")
                  }
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:gap-2.5"
                  style={{ color: colors.primaryTeal }}
                >
                  Book now <ArrowRight size={15} />
                </Link>
              </TagCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// HOW IT WORKS — the clothesline
// ------------------------------------------------------------
const howSteps = [
  { icon: CreditCard, title: "Book online", desc: "Pick your services and a pickup slot — takes under a minute." },
  { icon: Truck, title: "We pick up", desc: "Our rider collects your bag from your doorstep, right on schedule." },
  { icon: Droplets, title: "Wash, dry & fold", desc: "Premium detergents, careful sorting and spotless finishing." },
  { icon: Sparkles, title: "Delivered fresh", desc: "Back at your door, neatly packed and smelling amazing." },
];

function HowItWorks() {
  return (
    <section id="how" className="py-20 sm:py-28 relative overflow-hidden" style={{ backgroundColor: colors.cardTint }}>
      <div className="absolute -top-32 right-0 w-96 h-96 rounded-full" style={{ backgroundColor: `${colors.mint}14` }} />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeading
          tag="One line, four stops"
          title="Fresh laundry in 4 easy steps"
          sub="You never have to visit a laundromat again — just follow the line."
        />

        <div className="relative">
          <div
            className="hidden md:block absolute top-[38px] left-0 right-0 h-px"
            style={{ backgroundImage: `linear-gradient(90deg, ${colors.primaryTeal} 0, ${colors.primaryTeal} 6px, transparent 6px, transparent 14px)`, backgroundSize: "14px 1px" }}
          />
          <div
            className="md:hidden absolute top-0 bottom-0 left-[19px] w-px"
            style={{ backgroundImage: `linear-gradient(180deg, ${colors.primaryTeal} 0, ${colors.primaryTeal} 6px, transparent 6px, transparent 14px)`, backgroundSize: "1px 14px" }}
          />

          <div className="grid md:grid-cols-4 gap-8 md:gap-6">
            {howSteps.map((s, i) => (
              <Reveal key={s.title} delay={i * 100} className="relative pl-14 md:pl-0">
                <div className="md:flex md:flex-col md:items-start">
                  <div
                    className="absolute md:relative left-0 md:left-auto top-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
                  >
                    {i + 1}
                  </div>
                  <div className="mt-0 md:mt-5 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primaryTeal}1F` }}>
                    <s.icon size={19} color={colors.primaryTeal} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold" style={{ color: colors.textDark }}>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.textMuted }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// APP FEATURES / LIVE TRACKING
// ------------------------------------------------------------
const items = [
  {
    icon: MapPin,
    title: "Real-time order tracking",
    desc: "Every stage of your order updates live, from pickup to the final fold.",
  },
  {
    icon: Bell,
    title: "Smart notifications",
    desc: "A gentle nudge the moment your order is picked up, ready, or on its way back.",
  },
  {
    icon: History,
    title: "Order history, saved",
    desc: "Reorder your usual wash in one tap — your preferences are always remembered.",
  },
  {
    icon: ShieldCheck,
    title: "Verified local partners",
    desc: "Every laundry on WashFlow is vetted for quality, hygiene and reliability.",
  },
];

function AppFeatures() {
  return (
    <section className="py-24 md:py-[120px] border-y" style={{ backgroundColor: colors.cardTint, borderColor: colors.cardBorder }} id="features">
      <div className="max-w-[1180px] mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-14 lg:gap-[70px] items-center">
        <Reveal>
          <span
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: colors.seafoam }}
          >
            Built for customers
          </span>
          <h2
            className="mt-4 mb-9 text-[26px] sm:text-[32px] lg:text-[36px] leading-[1.2]"
            style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
          >
            Everything you need to never think about laundry day again.
          </h2>
          <div className="flex flex-col">
            {items.map((it, i) => {
              const Icon = it.icon;
              return (
                <div
                  key={it.title}
                  className="flex gap-5 py-6 px-1.5"
                  style={i < items.length - 1 ? { borderBottom: `1px solid ${colors.cardBorder}` } : {}}
                >
                  <div
                    className="flex-shrink-0 w-[46px] h-[46px] rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: colors.bgLight, border: `1px solid ${colors.cardBorder}` }}
                  >
                    <Icon size={22} color={colors.primaryTeal} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold mb-1.5" style={{ color: colors.textDark }}>{it.title}</h3>
                    <p className="text-[14.5px] leading-[1.6]" style={{ color: colors.textMuted }}>{it.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div
            className="mx-auto w-[250px] sm:w-[290px] rounded-[36px] p-3.5"
            style={{
              background: `linear-gradient(135deg, ${colors.bgDark}, ${colors.panelDark})`,
              boxShadow: "0 40px 80px -20px rgba(5,40,42,0.45), 0 0 0 1px rgba(2,128,144,0.15)",
            }}
          >
            <div className="bg-white rounded-[24px] overflow-hidden min-h-[440px] sm:min-h-[520px] px-4.5 py-5.5">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <div className="text-[12px]" style={{ color: colors.textMuted }}>Good evening,</div>
                  <div className="text-[16px]" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>Riya</div>
                </div>
                <img
                  src="https://i.pravatar.cc/60?img=47"
                  alt="Riya's profile"
                  className="w-[30px] h-[30px] rounded-full object-cover"
                  style={{ border: `1px solid ${colors.cardBorder}` }}
                  loading="lazy"
                />
              </div>

              <div
                className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full mb-4"
                style={{ backgroundColor: `${colors.mint}1A`, color: colors.seafoam }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: colors.mint }} />
                Order #V-2481 · In progress
              </div>

              <div className="rounded-2xl p-4 mb-3.5" style={{ border: `1px solid ${colors.cardBorder}` }}>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[13px] font-bold" style={{ color: colors.textDark }}>Wash &amp; Fold</span>
                  <span className="text-[11.5px]" style={{ color: colors.textMuted }}>6 items</span>
                </div>
                <span className="text-[11.5px]" style={{ color: colors.textMuted }}>Sunshine Laundry Co.</span>
                <div className="h-[5px] rounded-md overflow-hidden mt-2" style={{ backgroundColor: colors.cardTint }}>
                  <span
                    className="block h-full w-[64%] rounded-md"
                    style={{ background: `linear-gradient(90deg, ${colors.primaryTeal}, ${colors.mint})` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[11.5px]" style={{ color: colors.textMuted }}>Picked up</span>
                  <span className="text-[11.5px] font-bold" style={{ color: colors.seafoam }}>Drying</span>
                  <span className="text-[11.5px]" style={{ color: colors.textMuted }}>Delivered</span>
                </div>
              </div>

              <div className="rounded-2xl p-4 mb-3.5" style={{ border: `1px solid ${colors.cardBorder}` }}>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold" style={{ color: colors.textDark }}>Dry Cleaning</span>
                  <span className="text-[11.5px] font-bold" style={{ color: colors.mint }}>Delivered ✓</span>
                </div>
              </div>

              <div className="rounded-2xl p-4" style={{ border: `1px solid ${colors.cardBorder}` }}>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold" style={{ color: colors.textDark }}>Iron Only</span>
                  <span className="text-[11.5px]" style={{ color: colors.textMuted }}>Scheduled · Tomorrow</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// WHY US
// ------------------------------------------------------------
const features = [
  { icon: ShieldCheck, title: "Quality guaranteed", desc: "Not happy with a single piece? We redo it free. Simple as that." },
  { icon: Clock, title: "Always on time", desc: "98.6% on-time delivery record, backed by live order tracking." },
  { icon: Leaf, title: "Eco-friendly care", desc: "Skin-friendly, biodegradable detergents and energy-efficient machines." },
  { icon: MapPin, title: "Doorstep service", desc: "Free pickup and delivery, every time — no minimum order." },
  { icon: RefreshCw, title: "Live tracking", desc: "Follow your order from pickup to delivery on your dashboard." },
  { icon: CreditCard, title: "Simple payments", desc: "Pay online or at delivery. Transparent pricing on every item." },
];

function WhyUs() {
  return (
    <section id="why" className="py-20 sm:py-28" style={{ backgroundColor: colors.bgLight }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <Reveal>
              <Eyebrow>Why WashFlow</Eyebrow>
              <h2
                className="mt-5 text-3xl sm:text-4xl leading-[1.15]"
                style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
              >
                More than a laundry — it's a promise of freshness
              </h2>
              <p className="mt-5 text-sm sm:text-base leading-relaxed" style={{ color: colors.textMuted }}>
                We obsess over the details others skip: fabric-specific washing,
                careful sorting by colour and material, gentle detergents, and a
                final inspection before every delivery.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-8 relative overflow-hidden rounded-2xl shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=900&q=80"
                  alt="Clothes hanging fresh from the wash"
                  className="w-full h-56 sm:h-64 object-cover"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, rgba(5,40,42,0.92), rgba(2,128,144,0.72))" }}
                />
                <div className="absolute inset-0 flex items-center gap-5 p-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
                  >
                    <Quote size={20} color="#FFFFFF" />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
                    "I haven't touched a washing machine in 14 months. WashFlow just works."
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 2) * 80}>
                <div
                  className="h-full rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ backgroundColor: colors.cardTint, borderColor: colors.cardBorder }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.mint}22` }}>
                    <f.icon size={19} color={colors.seafoam} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold" style={{ color: colors.textDark }}>{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: colors.textMuted }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// TESTIMONIALS
// ------------------------------------------------------------
const testimonials = [
  { name: "Ananya Sharma", city: "Bengaluru", img: "https://i.pravatar.cc/80?img=47", text: "The pickup is always on time and my clothes smell incredible. The dashboard tracking is a game changer — I always know exactly where my order is.", rating: 5 },
  { name: "Rohit Mehta", city: "Mumbai", img: "https://i.pravatar.cc/80?img=12", text: "I'm a busy consultant who travels weekly. Same-day service means I always have crisp shirts for meetings. Worth every rupee.", rating: 5 },
  { name: "Priya Nair", city: "Pune", img: "https://i.pravatar.cc/80?img=32", text: "They handled my silk sarees with so much care. Dry cleaning results are flawless and delivery is always fresh and neatly packed.", rating: 5 },
];

function Testimonials() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden" style={{ backgroundColor: colors.bgDark }}>
      <div className="absolute -top-40 left-1/3 w-96 h-96 rounded-full" style={{ backgroundColor: colors.panelDark, opacity: 0.6 }} />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <Eyebrow tone="dark">Loved by customers</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl leading-[1.15]" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
            Don't take our word for it
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div
                className="h-full rounded-2xl p-6 sm:p-7"
                style={{ backgroundColor: colors.panelDark, border: `1px solid ${colors.primaryTeal}44` }}
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} size={15} color={colors.mint} fill={colors.mint} />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "#C8E3E0" }}>
                  "{t.text}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={t.img}
                    alt={t.name}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover"
                    style={{ border: "2px solid rgba(2,195,154,0.5)" }}
                  />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{t.name}</div>
                    <div className="text-xs" style={{ color: "#8FB3B0" }}>{t.city}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// PRICING — plan tags
// ------------------------------------------------------------
const plans = [
  { name: "Essentials", price: "₹199", period: "/month", desc: "For individuals who want the basics handled.", features: ["10 kg wash & fold / month", "Free doorstep pickup", "48-hour turnaround", "Live order tracking"], popular: false },
  { name: "Family", price: "₹399", period: "/month", desc: "The most-loved plan for busy households.", features: ["25 kg wash & fold / month", "Priority same-day pickup", "24-hour turnaround", "Free stain treatment", "Free delivery, always"], popular: true },
  { name: "Premium", price: "₹699", period: "/month", desc: "For those who want everything, unlimited.", features: ["Up to 50 kg / month", "Dedicated service manager", "Same-day express service", "Premium fabric care", "Free dry cleaning (2 items)"], popular: false },
];

function Pricing() {
  const { user } = useAuth();
  const { slug } = useParams();

  return (
    <section id="pricing" className="py-20 sm:py-28" style={{ backgroundColor: colors.bgLight }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeading
          tag="Every plan, tagged"
          title="Simple plans, zero hidden fees"
          sub="Start with a pay-per-order plan or subscribe and save. Cancel anytime."
        />

        <div className="grid md:grid-cols-3 gap-7 lg:gap-8 items-stretch max-w-5xl mx-auto pt-2">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <TagCard
                dark={p.popular}
                holeBg={p.popular ? colors.bgDark : colors.bgLight}
                className="relative h-full p-7 sm:p-8 pt-9 flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                style={p.popular ? { boxShadow: "0 24px 60px rgba(5,40,42,0.28)" } : {}}
              >
                {p.popular && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full text-white"
                    style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
                  >
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold" style={{ color: p.popular ? "#FFFFFF" : colors.textDark }}>{p.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: p.popular ? "#8FB3B0" : colors.textMuted }}>{p.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl" style={{ color: p.popular ? colors.mint : colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>{p.price}</span>
                  <span className="text-sm" style={{ color: p.popular ? "#8FB3B0" : colors.textMuted }}>{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: p.popular ? `${colors.mint}26` : `${colors.mint}1A` }}>
                        <Check size={11} color={colors.mint} />
                      </span>
                      <span style={{ color: p.popular ? "#C8E3E0" : colors.textDark }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={
                    user?.role === "customer"
                      ? "/customer/new-order"
                      : authPath(slug, "signup")
                  }
                  className="mt-8 w-full text-center text-sm font-semibold py-3 rounded-xl transition-all hover:brightness-110"
                  style={{
                    backgroundColor: p.popular ? "#028090" : colors.cardTint,
                    color: p.popular ? "#FFFFFF" : colors.primaryTeal,
                    border: p.popular ? "none" : `1px solid ${colors.cardBorder}`,
                  }}
                >
                  {user?.role === "customer" ? "Book this plan" : `Choose ${p.name}`}
                </Link>
              </TagCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// CTA BANNER
// ------------------------------------------------------------
function CtaBanner() {
  const { user } = useAuth();
  const { slug } = useParams();

  return (
    <section className="px-5 sm:px-8 pb-20 sm:pb-28" style={{ backgroundColor: colors.bgLight }}>
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl px-8 py-14 sm:px-14 sm:py-20 text-center"
            style={{ background: "linear-gradient(120deg, #05282A, #0B3B3E 55%, #028090)" }}
          >
            <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full" style={{ backgroundColor: `${colors.mint}1F` }} />
            <div className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full" style={{ backgroundColor: `${colors.primaryTeal}33` }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>
                Ready for effortlessly
                <br />
                fresh laundry?
              </h2>
              <p className="mt-5 text-sm sm:text-base max-w-md mx-auto leading-relaxed" style={{ color: "#A9C9C6" }}>
                Create your free account in 30 seconds and schedule your first
                pickup today.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <Link
                  to={
                    user?.role === "customer"
                      ? "/customer/new-order"
                      : authPath(slug, "signup")
                  }
                  className="flex items-center gap-2 text-sm sm:text-base font-semibold px-7 py-3.5 rounded-xl text-white shadow-xl transition-all hover:brightness-110 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
                >
                  {user?.role === "customer" ? "Place an order" : "Create free account"} <ArrowRight size={17} />
                </Link>
                {!user && (
                  <Link
                    to={authPath(slug, "login")}
                    className="flex items-center gap-2 text-sm sm:text-base font-semibold px-7 py-3.5 rounded-xl transition-colors"
                    style={{ color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------
function Footer() {
  return (
    <footer style={{ backgroundColor: colors.bgDark }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}>
              <Clip size={16} color="#FFFFFF" />
            </div>
            <span className="text-lg" style={{ color: "#FFFFFF", fontFamily: "'Libre Baskerville', serif" }}>WashFlow</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#8FB3B0" }}>
            Premium laundry pickup &amp; delivery, powered by trusted local
            laundries. Fresh clothes, zero effort.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.mint }}>Company</h4>
          <ul className="mt-4 space-y-2.5">
            {["About us", "Careers", "Partner with us", "Press"].map((l) => (
              <li key={l}>
                <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: "#A9C9C6" }}>{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.mint }}>Support</h4>
          <ul className="mt-4 space-y-2.5">
            {["Help centre", "Track my order", "Refund policy", "Terms & privacy"].map((l) => (
              <li key={l}>
                <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: "#A9C9C6" }}>{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.mint }}>Contact</h4>
          <ul className="mt-4 space-y-3 text-sm" style={{ color: "#A9C9C6" }}>
            <li className="flex items-center gap-2.5"><PhoneCall size={15} color={colors.mint} /> 1800-123-4567</li>
            <li className="flex items-center gap-2.5"><Mail size={15} color={colors.mint} /> hello@washflow.app</li>
            <li className="flex items-start gap-2.5"><MapPin size={15} color={colors.mint} className="mt-0.5" /> Serving 120+ laundries across India</li>
          </ul>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: `${colors.primaryTeal}33` }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs" style={{ color: "#8FB3B0" }}>© {new Date().getFullYear()} WashFlow. All rights reserved.</span>
          <span className="text-xs" style={{ color: "#8FB3B0" }}>Made with <span style={{ color: colors.mint }}>♥</span> for cleaner wardrobes</span>
        </div>
      </div>
    </footer>
  );
}

// ------------------------------------------------------------
// PAGE
// ------------------------------------------------------------
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        html { scroll-padding-top: 90px; }

        @keyframes wf-sway {
          0%, 100% { transform: rotate(-1.4deg); }
          50% { transform: rotate(1.4deg); }
        }
        @keyframes wf-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes wf-float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes wf-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .wf-sway { animation: wf-sway 6s ease-in-out infinite; transform-origin: top center; }
        .wf-float { animation: wf-float 5s ease-in-out infinite; will-change: transform; }
        .wf-float-slow { animation: wf-float-slow 6s ease-in-out infinite; will-change: transform; }
        .wf-marquee-track { animation: wf-marquee 32s linear infinite; will-change: transform; }
        .wf-marquee:hover .wf-marquee-track { animation-play-state: paused; }

        @media (prefers-reduced-motion: reduce) {
          .wf-sway, .wf-float, .wf-float-slow, .wf-marquee-track { animation: none !important; }
        }

        a:focus-visible, button:focus-visible {
          outline: 2px solid #028090;
          outline-offset: 2px;
        }
      `}</style>

      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <AppFeatures />
      <WhyUs />
      <Testimonials />
      <Pricing />
      <Faq />
      <CtaBanner />
      <Footer />
    </div>
  );
}