import { Route, Navigate } from "react-router-dom";

import SuperAdminLayout from "../layouts/SuperAdminLayout";

import Dashboard from "../pages/superAdmin/Dashboard";
import Shops from "../pages/superAdmin/Shops";
import Subscriptions from "../pages/superAdmin/Subscriptions";
import Reports from "../pages/superAdmin/Reports";
import Settings from "../pages/superAdmin/Settings";

const SuperAdminRoute = (
  <Route path="/super" element={<SuperAdminLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />

    <Route path="dashboard" element={<Dashboard />} />
    <Route path="shops" element={<Shops />} />
    <Route path="subscriptions" element={<Subscriptions />} />
    <Route path="reports" element={<Reports />} />
    <Route path="settings" element={<Settings />} />
  </Route>
);

export default SuperAdminRoute;