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
import MyPayroll from "../pages/employee/MyPayroll";

const EmployeeRoute = (
  <Route path="/employee" element={<EmployeeLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />

    <Route path="dashboard" element={<Dashboard />} />
    <Route path="pickups" element={<AssignedPickups />} />
    <Route path="deliveries" element={<MyDeliveries />} />
    <Route path="mytask" element={<MyTasks />} />
    <Route path="orders-in-process" element={<OrdersInProcess />} />
    <Route path="completed-orders" element={<CompletedOrders />} />
    <Route path="customers" element={<Customers />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="attendance" element={<MyAttendance />} />
    <Route path="leaves" element={<MyLeave />} />
    <Route path="complaints" element={<MyComplaints />} />
    <Route path="payroll" element={<MyPayroll />} />
    <Route path="payroll/:id" element={<MyPayroll />} />
    <Route path="profile" element={<MyProfile />} />
    <Route path="myProfile" element={<MyProfile />} />
    <Route path="verifyEmail" element={<VerifyEmail />} />
  </Route>
);

export default EmployeeRoute;
