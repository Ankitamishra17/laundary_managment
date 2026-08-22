import { Route, Navigate } from "react-router-dom";

import CustomerLayout from "../layouts/CustomerLayout";

import Services from "../pages/customer/Services";
import NewOrder from "../pages/customer/NewOrder";
import MyOrders from "../pages/customer/MyOrders";
import OrderDetails from "../pages/customer/OrderDetails";
import Addresses from "../pages/customer/Addresses";
import Profile from "../pages/customer/Profile";

const CustomerRoute = (
  <Route path="/customer" element={<CustomerLayout />}>
    {/* The website home page (/) is the customer's home — there is no
        separate dashboard. */}
    <Route index element={<Navigate to="/" replace />} />

    <Route path="services" element={<Services />} />
    <Route path="new-order" element={<NewOrder />} />
    <Route path="orders" element={<MyOrders />} />
    <Route path="orders/:id" element={<OrderDetails />} />
    <Route path="addresses" element={<Addresses />} />
    <Route path="profile" element={<Profile />} />

    {/* Old dashboard URL — keep bookmarks working */}
    <Route path="dashboard" element={<Navigate to="/" replace />} />
  </Route>
);

export default CustomerRoute;
