import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";

// Super Admin Layout
import EmployeeLayout from "../layouts/EmployeeLayout";

// Super Admin Pages
import Dashboard from "../pages/employee/Dashboard";
import MyTasks from "../pages/employee/MyTasks";
import VerifyEmail from "../pages/employee/VerifyEmail";
import MyProfile from "../pages/employee/MyProfile";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/*Employee Routes */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />

          <Route path="mytask" element ={<MyTasks/>}/>

          <Route path="myProfile" element = {<MyProfile/>}/>

         <Route path="verifyEmail" element={<VerifyEmail />} />

        </Route>


        {/* 404 */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
