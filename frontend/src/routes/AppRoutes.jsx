// // import { BrowserRouter, Routes, Route } from "react-router-dom";

// // // Marketing / Auth Pages
// // import LandingPage from "../pages/landing/LandingPage";
// // import LoginPage from "../pages/auth/LoginPage";
// // import SignupPage from "../pages/auth/SignupPage";
// // import CreatePassword from "../pages/auth/CreatePassword";
// // import ForgotPassword from "../pages/auth/ForgotPassword";
// // import ResetPassword from "../pages/auth/ResetPassword";

// // // Route Groups
// // import SuperAdminRoute from "./SuperAdminRoute";
// // import AdminRoute from "./AdminRoute";
// // import EmployeeRoute from "./EmployeeRoute";
// // import CustomerRoute from "./CustomerRoute";

// // export default function AppRoutes() {
// //   return (
// //     <BrowserRouter>
// //       <Routes>

// //         {/* Landing page — customers discover the service here */}
// //         <Route path="/" element={<LandingPage />} />

// //         {/* Authentication */}
// //         <Route path="/login" element={<LoginPage />} />
// //         <Route path="/signup" element={<SignupPage />} />

// //         {/* First Login Password */}
// //         <Route path="/create-password" element={<CreatePassword />} />

// //         {/* Forgot / Reset Password */}
// //         <Route path="/forgot-password" element={<ForgotPassword />} />
// //         <Route path="/reset-password" element={<ResetPassword />} />

// //         {/* Role-based route groups */}
// //         {SuperAdminRoute}
// //         {AdminRoute}
// //         {EmployeeRoute}
// //         {CustomerRoute}

// //         {/* 404 */}
// //         <Route path="*" element={<h1>404 - Page Not Found</h1>} />
// //       </Routes>
// //     </BrowserRouter>
// //   );
// // }

// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import LandingPage from "../pages/landing/LandingPage";
// import LoginPage from "../pages/auth/LoginPage";
// import SignupPage from "../pages/auth/SignupPage";
// import CreatePassword from "../pages/auth/CreatePassword";
// import ForgotPassword from "../pages/auth/ForgotPassword";
// import ResetPassword from "../pages/auth/ResetPassword";

// import SuperAdminRoute from "./SuperAdminRoute";
// import AdminRoute from "./AdminRoute";
// import EmployeeRoute from "./EmployeeRoute";
// import CustomerRoute from "./CustomerRoute";

// export default function AppRoutes() {
//   return (
//     <BrowserRouter>
//       <Routes>

//         {/* Platform main website */}
//         <Route path="/" element={<LandingPage />} />

//         {/* Platform / staff login */}
//         <Route path="/login" element={<LoginPage />} />

//         {/* Generic customer signup */}
//         <Route path="/signup" element={<SignupPage />} />

//         {/* ============================================
//             SHOP CUSTOMER WEBSITE
//            ============================================ */}

//         {/* Sneha shop example: /shop/tester */}
//         <Route path="/shop/:slug" element={<LandingPage />} />

//         {/* Customer login for a specific shop */}
//         <Route
//           path="/shop/:slug/login"
//           element={<LoginPage />}
//         />

//         {/* Customer signup for a specific shop */}
//         <Route
//           path="/shop/:slug/signup"
//           element={<SignupPage />}
//         />

//         {/* Shop-specific customer auth */}
//         <Route
//           path="/shop/:slug/forgot-password"
//           element={<ForgotPassword />}
//         />

//         <Route
//           path="/shop/:slug/reset-password"
//           element={<ResetPassword />}
//         />

//         {/* Other auth */}
//         <Route
//           path="/create-password"
//           element={<CreatePassword />}
//         />

//         <Route
//           path="/forgot-password"
//           element={<ForgotPassword />}
//         />

//         <Route
//           path="/reset-password"
//           element={<ResetPassword />}
//         />

//         {/* Role dashboards */}
//         {SuperAdminRoute}
//         {AdminRoute}
//         {EmployeeRoute}
//         {CustomerRoute}

//         <Route
//           path="*"
//           element={<h1>404 - Page Not Found</h1>}
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }

import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/landing/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import CreatePassword from "../pages/auth/CreatePassword";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import SuperAdminRoute from "./SuperAdminRoute";
import AdminRoute from "./AdminRoute";
import EmployeeRoute from "./EmployeeRoute";
import CustomerRoute from "./CustomerRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================
            PLATFORM MAIN WEBSITE
           ============================================ */}

        <Route path="/" element={<LandingPage />} />

        {/* ============================================
            SUPER ADMIN / PLATFORM AUTH
           ============================================ */}

        {/* Optional: use this only for super admin */}
        <Route path="/login" element={<LoginPage />} />

        <Route path="/signup" element={<SignupPage />} />

        <Route path="/create-password" element={<CreatePassword />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ============================================
            SHOP-SPECIFIC PUBLIC WEBSITE

            Examples:
            /fresh-laundry
            /fresh-laundry/login
            /fresh-laundry/signup

            SAME LOGIN:
            customer + admin + employee
           ============================================ */}

        {/* Shop landing page */}
        <Route path="/:slug" element={<LandingPage />} />

        {/* Shop login - Customer / Admin / Employee */}
        <Route path="/:slug/login" element={<LoginPage />} />

        {/* Shop customer signup */}
        <Route path="/:slug/signup" element={<SignupPage />} />

        {/* Shop forgot password */}
        <Route path="/:slug/forgot-password" element={<ForgotPassword />} />

        {/* Shop reset password */}
        <Route path="/:slug/reset-password" element={<ResetPassword />} />

        {/* ============================================
            ROLE DASHBOARDS
           ============================================ */}

        {SuperAdminRoute}
        {AdminRoute}
        {EmployeeRoute}
        {CustomerRoute}

        {/* ============================================
            404
           ============================================ */}

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
