import { Route } from "react-router-dom";

import CustomerLayout from "../layouts/CustomerLayout";

// IMPORTANT:

import Dashboard from "../pages/customer/Dashboard";

import Services from "../pages/customer/Services";
import NewOrder from "../pages/customer/NewOrder";
import MyOrders from "../pages/customer/MyOrders";
import OrderDetails from "../pages/customer/OrderDetails";
import Addresses from "../pages/customer/Addresses";
import Profile from "../pages/customer/Profile";
import MyReviews from "../pages/customer/MyReviews";
import MyComplaints from "../pages/customer/MyComplaints";
import MyInvoices from "../pages/customer/MyInvoices";

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

    {/* Only if invoice feature is required */}
    <Route
      path="invoices"
      element={<MyInvoices />}
    />

    <Route
      path="invoices/:id"
      element={<MyInvoices />}
    />
  </Route>
  
);

export default CustomerRoute;