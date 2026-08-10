import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage";
import CreatePassword from "../pages/auth/CreatePassword";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// Route Groups
import SuperAdminRoute from "./SuperAdminRoute";
import AdminRoute from "./AdminRoute";
import EmployeeRoute from "./EmployeeRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />

        {/* First Login Password */}
        <Route path="/create-password" element={<CreatePassword />} />

        {/* Forgot / Reset Password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Role-based route groups */}
        {SuperAdminRoute}
        {AdminRoute}
        {EmployeeRoute}

        {/* 404 */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}