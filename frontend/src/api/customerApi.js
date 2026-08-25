import api from "./axios";

/** Fetch the logged-in customer's profile */
export const getMyCustomerProfile = async () => {
  const response = await api.get("/customers/me");
  return response.data;
};

/** Admin / Employee / Super Admin — list customers */
export const getShopCustomers = async (params = {}) => {
  const response = await api.get("/customers", {
    params,
  });

  return response.data;
};

/** Admin / Employee / Super Admin — get one customer by ID */
export const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);

  return response.data;
};
