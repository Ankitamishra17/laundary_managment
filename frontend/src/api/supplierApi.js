import api from "./axios";

// Get suppliers
export const getSuppliers = async () => {
  const response = await api.get("/suppliers");

  return response.data;
};

// Get supplier
export const getSupplierById = async (id) => {
  const response = await api.get(`/suppliers/${id}`);

  return response.data;
};

// Create supplier
export const createSupplier = async (data) => {
  const response = await api.post(
    "/suppliers",
    data
  );

  return response.data;
};

// Update supplier
export const updateSupplier = async (id, data) => {
  const response = await api.put(
    `/suppliers/${id}`,
    data
  );

  return response.data;
};

// Delete supplier
export const deleteSupplier = async (id) => {
  const response = await api.delete(
    `/suppliers/${id}`
  );

  return response.data;
};