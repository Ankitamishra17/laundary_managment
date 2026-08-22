import api from "./axios";

/** Fetch the logged-in customer's profile record (address, city, default laundry). */
export const getMyCustomerProfile = async () => {
  const response = await api.get("/customers/me");
  return response.data;
};

/** Admin — list customers of the logged-in shop (optional search term). */
export const getShopCustomers = async (params = {}) => {
  const response = await api.get("/customers", { params });
  return response.data;
};
