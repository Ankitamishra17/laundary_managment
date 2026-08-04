import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";

// Super Admin Layout
import SuperAdminLayout from "../layouts/SuperAdminLayout";

// Super Admin Pages
import Dashboard from "../pages/superAdmin/Dashboard";
import Shops from "../pages/superAdmin/Shops";
import Subscriptions from "../pages/superAdmin/Subscriptions";
import Reports from "../pages/superAdmin/Reports";
import Settings from "../pages/superAdmin/Settings";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Super Admin Routes */}
        <Route path="/super" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="shops" element={<Shops />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Route>




        

        {/* 404 */}
        
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
