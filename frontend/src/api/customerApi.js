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

// ============================================================
// Customer — Address CRUD
// ============================================================

/** Fetch all saved addresses (default first, then newest). */
export const getAddresses = async () => {
  const response = await api.get("/customer/address");
  return response.data;
};

/** Fetch a single address by ID. */
export const getAddressById = async (id) => {
  const response = await api.get(`/customer/address/${id}`);
  return response.data;
};

/** Add a new address. */
export const addAddress = async (payload) => {
  const response = await api.post("/customer/address", payload);
  return response.data;
};

/** Update an existing address. */
export const updateAddress = async (id, payload) => {
  const response = await api.put(`/customer/address/${id}`, payload);
  return response.data;
};

/** Delete an address. */
export const deleteAddress = async (id) => {
  const response = await api.delete(`/customer/address/${id}`);
  return response.data;
};

/** Set an address as the default. */
export const setDefaultAddress = async (id) => {
  const response = await api.patch(`/customer/address/${id}/default`);
  return response.data;
};
