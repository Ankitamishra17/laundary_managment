import { Navigate, Outlet, useParams } from "react-router-dom";

import CustomerNavbar from "../components/layout/CustomerNavbar";
import { useAuth } from "../context/AuthContext";
import { TenantProvider } from "../context/TenantContext";

function roleHome(role) {
  switch (role) {
    case "super_admin":
      return "/super/dashboard";

    case "admin":
      return "/admin/dashboard";

    case "employee":
      return "/employee/dashboard";

    default:
      return "/login";
  }
}

const CustomerLayout = () => {
  const { user, loading } = useAuth();
  const { slug } = useParams();

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "#EEF7F6",
        }}
      >
        <div
          className="
            w-8
            h-8
            rounded-full
            border-2
            border-[#028090]
            border-t-transparent
            animate-spin
          "
        />
      </div>
    );
  }

  // =====================================================
  // CUSTOMER NOT LOGGED IN
  //
  // /abc/dashboard
  //       ↓
  // /abc/login
  // =====================================================

  if (!user) {
    return (
      <Navigate
        to={slug ? `/${slug}/login` : "/login"}
        replace
      />
    );
  }

  // =====================================================
  // WRONG ROLE
  // =====================================================

  if (user.role !== "customer") {
    return (
      <Navigate
        to={roleHome(user.role)}
        replace
      />
    );
  }

  // =====================================================
  // CUSTOMER APPLICATION
  // =====================================================

  return (
    <TenantProvider>
      <div
        className="min-h-screen flex flex-col bg-[#EEF7F6]"
        data-shop-slug={slug}
      >
        <CustomerNavbar />

        <main
          className="
            flex-1
            w-full
            max-w-7xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            py-6
            sm:py-8
          "
        >
          <Outlet />
        </main>
      </div>
    </TenantProvider>
  );
};

export default CustomerLayout;