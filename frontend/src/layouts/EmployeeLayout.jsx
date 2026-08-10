import { Outlet } from "react-router-dom";
import EmployeeSidebar from "../components/layout/EmployeeSidebar";
import Topbar from "../components/layout/Topbar";
import { SidebarProvider } from "../context/SidebarContext";

const EmployeeLayout = () => {
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
