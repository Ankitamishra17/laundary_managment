import { Navigate, Outlet, useParams } from "react-router-dom";

import EmployeeSidebar from "../components/layout/EmployeeSidebar";
import Topbar from "../components/layout/Topbar";
import { SidebarProvider } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";

// ============================================================
// ROLE HOME
// ============================================================

function roleHome(role, slug) {
  switch (role) {
    case "super_admin":
      return "/super/dashboard";

    case "admin":
      return "/admin/dashboard";

    case "customer":
      return slug ? `/${slug}/dashboard` : "/login";

    case "employee":
      return slug ? `/${slug}/employee/dashboard` : "/login";

    default:
      return "/login";
  }
}

// ============================================================
// EMPLOYEE LAYOUT
// ============================================================

const EmployeeLayout = () => {
  const { slug } = useParams();
  const { user, loading } = useAuth();

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#EEF7F6",
        }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-[#028090] border-t-transparent animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  // ==========================================================
  // NOT LOGGED IN
  // ==========================================================

  if (!user) {
    return <Navigate to={slug ? `/${slug}/login` : "/login"} replace />;
  }

  // ==========================================================
  // ONLY EMPLOYEE CAN ACCESS THIS LAYOUT
  // ==========================================================

  if (user.role !== "employee") {
    return <Navigate to={roleHome(user.role, slug)} replace />;
  }

  // ==========================================================
  // TENANT SECURITY
  //
  // Employee must belong to the shop represented by the URL.
  //
  // Example:
  //
  // /fresh/employee/dashboard
  //
  // Employee must belong to "fresh" shop.
  // ==========================================================

  const userShopId = user.shopId ?? user.shop_id ?? null;

  // If the employee does not have a shop assigned,
  // do not allow access.
  if (!userShopId) {
    return <Navigate to="/login" replace />;
  }

  // ==========================================================
  // EMPLOYEE APPLICATION
  // ==========================================================

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#EEF7F6]">
        {/* ====================================================
            EMPLOYEE SIDEBAR
            ==================================================== */}
        <EmployeeSidebar />

        {/* ====================================================
            MAIN AREA
            ==================================================== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ==================================================
              TOPBAR
              ================================================== */}
          <Topbar />

          {/* ==================================================
              PAGE CONTENT
              ================================================== */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmployeeLayout;
