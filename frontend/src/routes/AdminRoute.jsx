import { Route, Navigate } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";

import Dashboard from "../pages/admin/Dashboard";
import Orders from "../pages/admin/Orders";
// import Customers from "../pages/admin/Customers";
// import Employees from "../pages/admin/Employees";
// import Tasks from "../pages/admin/Tasks";
import Services from "../pages/admin/Services";
import Inventory from "../pages/admin/Inventory";
// import Attendance from "../pages/admin/Attendance";
import Payroll from "../pages/admin/Payroll";
import Payments from "../pages/admin/Payments";
import Reports from "../pages/admin/Reports";
import Settings from "../pages/admin/Settings";
import Profile from "../pages/admin/Profile";

import StockInOut from "../pages/admin/inventory/StockInOut";
import Suppliers from "../pages/admin/inventory/Suppliers";
import PurchaseHistory from "../pages/admin/inventory/PurchaseHistory";
import LowStockAlerts from "../pages/admin/inventory/LowStockAlerts";

const AdminRoute = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />

    <Route path="dashboard" element={<Dashboard />} />

    <Route path="orders" element={<Orders />} />

    {/* <Route path="customers" element={<Customers />} /> */}

    {/* <Route path="employees" element={<Employees />} /> */}

    {/* <Route path="tasks" element={<Tasks />} /> */}

    <Route path="services" element={<Services />} />

    <Route path="inventory" element={<Inventory />} />
    <Route path="inventory/stock" element={<StockInOut />} />

    <Route path="inventory/suppliers" element={<Suppliers />} />

    <Route path="inventory/purchases" element={<PurchaseHistory />} />

    <Route path="inventory/low-stock" element={<LowStockAlerts />} />

    {/* <Route path="attendance" element={<Attendance />} /> */}

    <Route path="payroll" element={<Payroll />} />

    <Route path="payments" element={<Payments />} />

    <Route path="reports" element={<Reports />} />

    <Route path="settings" element={<Settings />} />

    <Route path="settings/profile" element={<Profile />} />
  </Route>
);

export default AdminRoute;
