import api from "./axios";

// Get all services
export const getServices = async (params) => {
  const response = await api.get("/services", { params });
  return response.data;
};

// Get service by id
export const getServiceById = async (id) => {
  const response = await api.get(`/services/${id}`);
  return response.data;
};

// Create service
export const createService = async (data) => {
  const response = await api.post("/services", data);
  return response.data;
};

// Update service
export const updateService = async (id, data) => {
  const response = await api.put(`/services/${id}`, data);
  return response.data;
};

// Delete service
export const deleteService = async (id) => {
  const response = await api.delete(`/services/${id}`);
  return response.data;
};

// Toggle Active / Inactive
export const toggleServiceStatus = async (id) => {
  const response = await api.patch(`/services/${id}/status`);
  return response.data;
};
