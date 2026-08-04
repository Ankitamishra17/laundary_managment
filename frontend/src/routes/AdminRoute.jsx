import { Route, Routes,Navigate, BrowserRouter } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";

import Dashboard from "../pages/admin/Dashboard";
import Orders from "../pages/admin/Orders";
import Customers from "../pages/admin/Customers";
import Employees from "../pages/admin/Employees";
import Tasks from "../pages/admin/Tasks";
import Services from "../pages/admin/Services";

import Inventory from "../pages/admin/Inventory";
// import Stock from "../pages/admin/Stock";
// import Suppliers from "../pages/admin/Suppliers";
// import Purchases from "../pages/admin/Purchases";
// import LowStock from "../pages/admin/LowStock";

import Attendance from "../pages/admin/Attendance";
// import AttendanceReport from "../pages/admin/AttendanceReport";

import Payroll from "../pages/admin/Payroll";

import Payments from "../pages/admin/Payments";
// import PaymentHistory from "../pages/admin/PaymentHistory";
// import PendingPayments from "../pages/admin/PendingPayments";
// import Refunds from "../pages/admin/Refunds";

import Reports from "../pages/admin/Reports";

import Settings from "../pages/admin/Settings";
import Profile from "../pages/admin/Profile";

const AdminRoute = () => {
  return (
    <BrowserRouter>
      <Routes>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />

      <Route path="dashboard" element={<Dashboard />} />

      <Route path="orders" element={<Orders />} />

      <Route path="customers" element={<Customers />} />

      <Route path="employees" element={<Employees />} />

      <Route path="tasks" element={<Tasks />} />

      <Route path="services" element={<Services />} />

      {/* Inventory */}
      <Route path="inventory" element={<Inventory />} />
      {/* <Route path="inventory/stock" element={<Stock />} />
      <Route path="inventory/suppliers" element={<Suppliers />} />
      <Route path="inventory/purchases" element={<Purchases />} />
      <Route path="inventory/low-stock" element={<LowStock />} /> */}

      {/* Attendance */}
      <Route path="attendance" element={<Attendance />} />
      {/* <Route
        path="attendance/reports"
        element={<AttendanceReport />}
      /> */}

      {/* Payroll */}
      <Route path="payroll" element={<Payroll />} />

      {/* Payments */}
      <Route path="payments" element={<Payments />} />
      {/* <Route
        path="payments/history"
        element={<PaymentHistory />}
      />
      <Route
        path="payments/pending"
        element={<PendingPayments />}
      />
      <Route
        path="payments/refunds"
        element={<Refunds />}
      /> */}

      {/* Reports */}
      <Route path="reports" element={<Reports />} />

      {/* Settings */}
      <Route path="settings" element={<Settings />} />
      <Route
        path="settings/profile"
        element={<Profile />}
      />
    </Route>
    </Routes>
    </BrowserRouter>
  );
};

export default AdminRoute;