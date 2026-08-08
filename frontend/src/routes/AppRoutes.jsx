import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import CreatePassword from "../pages/auth/CreatePassword"; // <-- Import this

import SuperAdminRoute from "./SuperAdminRoute";
import AdminRoute from "./AdminRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        {/* First Login Password */}
        <Route path="/create-password" element={<CreatePassword />} />

        {SuperAdminRoute}

        {AdminRoute}

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
