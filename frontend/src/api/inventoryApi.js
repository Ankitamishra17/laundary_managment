import api from "./axios";

// Get all inventory items
export const getInventoryItems = async () => {
  const response = await api.get("/inventory");

  return response.data;
};

// Get single inventory item
export const getInventoryItemById = async (id) => {
  const response = await api.get(`/inventory/${id}`);

  return response.data;
};

// Create inventory item
export const createInventoryItem = async (data) => {
  const response = await api.post("/inventory", data);

  return response.data;
};

// Update inventory item
export const updateInventoryItem = async (id, data) => {
  const response = await api.put(`/inventory/${id}`, data);

  return response.data;
};

// Delete inventory item
export const deleteInventoryItem = async (id) => {
  const response = await api.delete(`/inventory/${id}`);

  return response.data;
};

//Low Stock Item
export const getLowStockItems = async () => {
  const response = await api.get("/inventory/low-stock");

  return response.data;
};
