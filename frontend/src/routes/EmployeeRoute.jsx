import { Route, Navigate } from "react-router-dom";

import EmployeeLayout from "../layouts/EmployeeLayout";

import Dashboard from "../pages/employee/Dashboard";
import AssignedPickups from "../pages/employee/AssignedPickups";
import MyDeliveries from "../pages/employee/MyDeliveries";
import MyTasks from "../pages/employee/MyTasks";
import MyAttendance from "../pages/employee/MyAttendance";
import MyLeave from "../pages/employee/MyLeave";
import MyProfile from "../pages/employee/MyProfile";
import VerifyEmail from "../pages/employee/VerifyEmail";
import Customers from "../pages/employee/Customers";
import Notifications from "../pages/employee/Notifications";
import OrdersInProcess from "../pages/employee/OrdersInProcess";
import CompletedOrders from "../pages/employee/CompletedOrders";
import MyComplaints from "../pages/employee/MyComplaints";

// ============================================================
// EMPLOYEE ROUTES
// ============================================================
//
// Base URL:
//
// /:slug/employee
//
// Example:
//
// /fresh/employee
//
// Dashboard:
//
// /fresh/employee/dashboard
//
// Only authenticated employees belonging to the shop should
// be allowed by EmployeeLayout.
// ============================================================

const EmployeeRoute = (
  <Route path="/:slug/employee" element={<EmployeeLayout />}>
    {/* ========================================================
        DEFAULT EMPLOYEE PAGE

        /fresh/employee

        Redirects to:

        /fresh/employee/dashboard
       ======================================================== */}

    <Route index element={<Navigate to="dashboard" replace />} />

    {/* ========================================================
        DASHBOARD
       ======================================================== */}

    <Route path="dashboard" element={<Dashboard />} />

    {/* ========================================================
        PICKUPS
       ======================================================== */}

    <Route path="pickups" element={<AssignedPickups />} />

    {/* ========================================================
        DELIVERIES
       ======================================================== */}

    <Route path="deliveries" element={<MyDeliveries />} />

    {/* ========================================================
        MY TASKS
       ======================================================== */}

    <Route path="mytask" element={<MyTasks />} />

    {/* ========================================================
        ORDERS IN PROCESS
       ======================================================== */}

    <Route path="orders-in-process" element={<OrdersInProcess />} />

    {/* ========================================================
        COMPLETED ORDERS
       ======================================================== */}

    <Route path="completed-orders" element={<CompletedOrders />} />

    {/* ========================================================
        CUSTOMERS
       ======================================================== */}

    <Route path="customers" element={<Customers />} />

    {/* ========================================================
        NOTIFICATIONS
       ======================================================== */}

    <Route path="notifications" element={<Notifications />} />

    {/* ========================================================
        ATTENDANCE
       ======================================================== */}

    <Route path="attendance" element={<MyAttendance />} />

    {/* ========================================================
        LEAVES
       ======================================================== */}

    <Route path="leaves" element={<MyLeave />} />

    {/* ========================================================
        COMPLAINTS
       ======================================================== */}

    <Route path="complaints" element={<MyComplaints />} />

    {/* ========================================================
        PROFILE
       ======================================================== */}

    <Route path="profile" element={<MyProfile />} />

    {/* ========================================================
        OLD PROFILE URL
        Kept for compatibility
       ======================================================== */}

    <Route path="myProfile" element={<MyProfile />} />

    {/* ========================================================
        VERIFY EMAIL
       ======================================================== */}

    <Route path="verifyEmail" element={<VerifyEmail />} />
  </Route>
);

export default EmployeeRoute;
