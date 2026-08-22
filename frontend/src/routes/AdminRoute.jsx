import { Route, Navigate } from "react-router-dom";

// Layout
import AdminLayout from "../layouts/AdminLayout";

// Admin Pages
import Dashboard from "../pages/admin/Dashboard";
import Orders from "../pages/admin/Orders";
import Employees from "../pages/admin/Employees";
import Tasks from "../pages/admin/Tasks";
import Services from "../pages/admin/Services";

import Inventory from "../pages/admin/Inventory";

// Inventory Pages
import StockInOut from "../pages/admin/inventory/StockInOut";
import Suppliers from "../pages/admin/inventory/Suppliers";
import Purchase from "../pages/admin/inventory/Purchase";
import LowStockAlerts from "../pages/admin/inventory/LowStockAlerts";

// Attendance
import Attendance from "../pages/admin/Attendance";
import DailyAttendance from "../pages/admin/DailyAttendance";
import AttendanceReports from "../pages/admin/AttendanceReports";

// payment pages
// =====================================================
// PAYMENT PAGES
// =====================================================

import PaymentDashboard from "../pages/admin/PaymentDashboard";
import AllTransactions from "../pages/admin/payment/AllTransactions";
import CustomerPayments from "../pages/admin/payment/CustomerPayments";
import SupplierPayments from "../pages/admin/payment/SupplierPayments";
import SalaryPayments from "../pages/admin/payment/SalaryPayments";
import PaymentReports from "../pages/admin/payment/PaymentReports";
// import Refunds from "../pages/admin/payment/Refunds";

// Other Admin Pages
import Payroll from "../pages/admin/Payroll";
import Reports from "../pages/admin/Reports";
import Settings from "../pages/admin/Settings";
import Profile from "../pages/admin/Profile";

// =====================================================
// ADMIN ROUTES
// =====================================================

const AdminRoute = (
  <Route path="/admin" element={<AdminLayout />}>
    {/* /admin → /admin/dashboard */}
    <Route index element={<Navigate to="dashboard" replace />} />

    {/* Dashboard */}
    <Route path="dashboard" element={<Dashboard />} />

    {/* Orders */}
    <Route path="orders" element={<Orders />} />

    {/* Employees */}
    <Route path="employees" element={<Employees />} />

    {/* Tasks */}
    <Route path="tasks" element={<Tasks />} />

    {/* Services */}
    <Route path="services" element={<Services />} />

    {/* =================================================
        INVENTORY
    ================================================= */}

    <Route path="inventory" element={<Inventory />} />

    <Route path="inventory/stock" element={<StockInOut />} />

    <Route path="inventory/suppliers" element={<Suppliers />} />

    <Route path="inventory/purchases" element={<Purchase />} />
    <Route path="inventory/low-stock" element={<LowStockAlerts />} />

    {/* =================================================
        ATTENDANCE
    ================================================= */}

    <Route path="attendance" element={<Attendance />} />

    <Route path="attendance/daily" element={<DailyAttendance />} />

    <Route path="attendance/reports" element={<AttendanceReports />} />

    {/* =================================================
        PAYROLL
    ================================================= */}

    <Route path="payroll" element={<Payroll />} />

    {/* =================================================
        PAYMENTS
    ================================================= */}

    {/* <Route path="payments" element={<Payments />} /> */}
    {/* =================================================
    PAYMENTS
================================================= */}

    {/* =================================================
    PAYMENTS
================================================= */}

    {/* /admin/payments → /admin/payments/dashboard */}

    <Route
      path="payments"
      element={<Navigate to="/admin/payments/dashboard" replace />}
    />

    {/* Payment Dashboard */}

    <Route path="payments/dashboard" element={<PaymentDashboard />} />

    {/* All Transactions */}

    <Route path="payments/transactions" element={<AllTransactions />} />

    {/* Customer Payments */}

    <Route path="payments/customer" element={<CustomerPayments />} />

    {/* Supplier Payments */}

    <Route path="payments/supplier" element={<SupplierPayments />} />

    {/* Salary Payments */}

    <Route path="payments/salary" element={<SalaryPayments />} />

    {/* Payment Reports */}

    <Route path="payments/reports" element={<PaymentReports />} />
    {/* Refunds */}

    {/* <Route path="payments/refunds" element={<Refunds />} /> */}

    {/* Payment Reports */}

    <Route path="payments/reports" element={<PaymentReports />} />

    {/* =================================================
        REPORTS
    ================================================= */}

    <Route path="reports" element={<Reports />} />

    {/* =================================================
        SETTINGS
    ================================================= */}

    <Route path="settings" element={<Settings />} />

    <Route path="settings/profile" element={<Profile />} />
  </Route>
);

export default AdminRoute;
