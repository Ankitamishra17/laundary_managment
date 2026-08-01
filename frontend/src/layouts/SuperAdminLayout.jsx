import { Outlet } from "react-router-dom";
import SuperSidebar from "../components/layout/SuperSidebar";
import Topbar from "../components/layout/Topbar";
import { SidebarProvider } from "../context/SidebarContext";

const SuperAdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#EEF7F6]">
        {" "}
        {/* Sidebar */}
        <SuperSidebar />
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <Topbar />

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminLayout;
