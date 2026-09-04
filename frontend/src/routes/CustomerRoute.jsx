// import { Route, Navigate } from "react-router-dom";

// import CustomerLayout from "../layouts/CustomerLayout";

// import Services from "../pages/customer/Services";
// import NewOrder from "../pages/customer/NewOrder";
// import MyOrders from "../pages/customer/MyOrders";
// import OrderDetails from "../pages/customer/OrderDetails";
// import Addresses from "../pages/customer/Addresses";
// import Profile from "../pages/customer/Profile";
// import MyReviews from "../pages/customer/MyReviews";
// import MyComplaints from "../pages/customer/MyComplaints";

// const CustomerRoute = (
//   <Route path="/customer" element={<CustomerLayout />}>
//     {/* The website home page (/) is the customer's home — there is no
//         separate dashboard. */}
//     <Route index element={<Navigate to="/" replace />} />

//     <Route path="services" element={<Services />} />
//     <Route path="new-order" element={<NewOrder />} />
//     <Route path="orders" element={<MyOrders />} />
//     <Route path="orders/:id" element={<OrderDetails />} />
//     <Route path="addresses" element={<Addresses />} />
//     <Route path="profile" element={<Profile />} />
//     <Route path="reviews" element={<MyReviews />} />
//     <Route path="complaints" element={<MyComplaints />} />

//     {/* Old dashboard URL — keep bookmarks working */}
//     <Route path="dashboard" element={<Navigate to="/" replace />} />
//   </Route>
// );

// export default CustomerRoute;



import { Route } from "react-router-dom";

import CustomerLayout from "../layouts/CustomerLayout";

// IMPORTANT:
// Aapke project me file ka naam Dashboard.jsx hai
import Dashboard from "../pages/customer/Dashboard";

import Services from "../pages/customer/Services";
import NewOrder from "../pages/customer/NewOrder";
import MyOrders from "../pages/customer/MyOrders";
import OrderDetails from "../pages/customer/OrderDetails";
import Addresses from "../pages/customer/Addresses";
import Profile from "../pages/customer/Profile";
import MyReviews from "../pages/customer/MyReviews";
import MyComplaints from "../pages/customer/MyComplaints";

const CustomerRoute = (
  <Route
    path="/:slug"
    element={<CustomerLayout />}
  >
    {/* =====================================================
        CUSTOMER DASHBOARD

        Example:
        /abc/dashboard
        /xyz/dashboard
        ===================================================== */}
    <Route
      path="dashboard"
      element={<Dashboard />}
    />

    {/* =====================================================
        SERVICES

        /abc/services
        ===================================================== */}
    <Route
      path="services"
      element={<Services />}
    />

    {/* =====================================================
        NEW ORDER

        /abc/new-order
        ===================================================== */}
    <Route
      path="new-order"
      element={<NewOrder />}
    />

    {/* =====================================================
        MY ORDERS

        /abc/orders
        ===================================================== */}
    <Route
      path="orders"
      element={<MyOrders />}
    />

    {/* =====================================================
        ORDER DETAILS

        /abc/orders/123
        ===================================================== */}
    <Route
      path="orders/:id"
      element={<OrderDetails />}
    />

    {/* =====================================================
        ADDRESSES

        /abc/addresses
        ===================================================== */}
    <Route
      path="addresses"
      element={<Addresses />}
    />

    {/* =====================================================
        PROFILE

        /abc/profile
        ===================================================== */}
    <Route
      path="profile"
      element={<Profile />}
    />

    {/* =====================================================
        REVIEWS

        /abc/reviews
        ===================================================== */}
    <Route
      path="reviews"
      element={<MyReviews />}
    />

    {/* =====================================================
        COMPLAINTS

        /abc/complaints
        ===================================================== */}
    <Route
      path="complaints"
      element={<MyComplaints />}
    />
  </Route>
);

export default CustomerRoute;