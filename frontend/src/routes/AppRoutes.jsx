// import { BrowserRouter, Routes, Route } from "react-router-dom";

// // Marketing / Auth Pages
// import LandingPage from "../pages/landing/LandingPage";
// import LoginPage from "../pages/auth/LoginPage";
// import SignupPage from "../pages/auth/SignupPage";
// import CreatePassword from "../pages/auth/CreatePassword";
// import ForgotPassword from "../pages/auth/ForgotPassword";
// import ResetPassword from "../pages/auth/ResetPassword";

// // Route Groups
// import SuperAdminRoute from "./SuperAdminRoute";
// import AdminRoute from "./AdminRoute";
// import EmployeeRoute from "./EmployeeRoute";
// import CustomerRoute from "./CustomerRoute";

// export default function AppRoutes() {
//   return (
//     <BrowserRouter>
//       <Routes>

//         {/* Landing page — customers discover the service here */}
//         <Route path="/" element={<LandingPage />} />

//         {/* Authentication */}
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/signup" element={<SignupPage />} />

//         {/* First Login Password */}
//         <Route path="/create-password" element={<CreatePassword />} />

//         {/* Forgot / Reset Password */}
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password" element={<ResetPassword />} />

//         {/* Role-based route groups */}
//         {SuperAdminRoute}
//         {AdminRoute}
//         {EmployeeRoute}
//         {CustomerRoute}

//         {/* 404 */}
//         <Route path="*" element={<h1>404 - Page Not Found</h1>} />
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

        {/* Platform main website */}
        <Route path="/" element={<LandingPage />} />

        {/* Platform / staff login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Generic customer signup */}
        <Route path="/signup" element={<SignupPage />} />

        {/* ============================================
            SHOP CUSTOMER WEBSITE
           ============================================ */}

        {/* Sneha shop example: /shop/tester */}
        <Route path="/shop/:slug" element={<LandingPage />} />

        {/* Customer login for a specific shop */}
        <Route
          path="/shop/:slug/login"
          element={<LoginPage />}
        />

        {/* Customer signup for a specific shop */}
        <Route
          path="/shop/:slug/signup"
          element={<SignupPage />}
        />

        {/* Shop-specific customer auth */}
        <Route
          path="/shop/:slug/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/shop/:slug/reset-password"
          element={<ResetPassword />}
        />

        {/* Other auth */}
        <Route
          path="/create-password"
          element={<CreatePassword />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Role dashboards */}
        {SuperAdminRoute}
        {AdminRoute}
        {EmployeeRoute}
        {CustomerRoute}

        <Route
          path="*"
          element={<h1>404 - Page Not Found</h1>}
        />
      </Routes>
    </BrowserRouter>
  );
}