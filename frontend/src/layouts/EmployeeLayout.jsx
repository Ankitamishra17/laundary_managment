import { Navigate, Outlet } from "react-router-dom";
import EmployeeSidebar from "../components/layout/EmployeeSidebar";
import Topbar from "../components/layout/Topbar";
import { SidebarProvider } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";

// Route guard — only logged-in employees may enter.
function roleHome(role) {
  switch (role) {
    case "super_admin":
      return "/super/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "customer":
      return "/";
    default:
      return "/login";
  }
}

const EmployeeLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#EEF7F6" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#028090] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "employee") return <Navigate to={roleHome(user.role)} replace />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#EEF7F6]">
        {" "}
        {/* Sidebar */}
        <EmployeeSidebar/>
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <Topbar />
          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmployeeLayout;
