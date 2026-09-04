

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public / Auth Pages
import LandingPage from "../pages/landing/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import CreatePassword from "../pages/auth/CreatePassword";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// Role Routes
import SuperAdminRoute from "./SuperAdminRoute";
import AdminRoute from "./AdminRoute";
import EmployeeRoute from "./EmployeeRoute";
import CustomerRoute from "./CustomerRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PLATFORM HOME
            ===================================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* =====================================================
            PLATFORM AUTH
            ===================================================== */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

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

        {/* =====================================================
            SHOP PUBLIC LANDING

            /abc
            /xyz
            /fresh-laundry
            ===================================================== */}

        <Route
          path="/:slug"
          element={<LandingPage />}
        />

        {/* =====================================================
            SHOP LOGIN

            /abc/login
            ===================================================== */}

        <Route
          path="/:slug/login"
          element={<LoginPage />}
        />

        {/* =====================================================
            SHOP SIGNUP

            /abc/signup
            ===================================================== */}

        <Route
          path="/:slug/signup"
          element={<SignupPage />}
        />

        {/* =====================================================
            SHOP FORGOT PASSWORD

            /abc/forgot-password
            ===================================================== */}

        <Route
          path="/:slug/forgot-password"
          element={<ForgotPassword />}
        />

        {/* =====================================================
            SHOP RESET PASSWORD

            /abc/reset-password
            ===================================================== */}

        <Route
          path="/:slug/reset-password"
          element={<ResetPassword />}
        />

        {/* =====================================================
            SUPER ADMIN
            ===================================================== */}

        {SuperAdminRoute}

        {/* =====================================================
            ADMIN
            ===================================================== */}

        {AdminRoute}

        {/* =====================================================
            EMPLOYEE
            ===================================================== */}

        {EmployeeRoute}

        {/* =====================================================
            CUSTOMER

            /:slug/dashboard
            /:slug/services
            /:slug/new-order
            /:slug/orders
            etc.
            ===================================================== */}

        {CustomerRoute}

        {/* =====================================================
            404
            ===================================================== */}

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <h1 className="text-2xl font-semibold text-gray-700">
                404 - Page Not Found
              </h1>
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
