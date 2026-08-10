import api from "./axios";

// Get transaction history
export const getInventoryTransactions = async () => {
  const response = await api.get("/inventory-transactions");
  return response.data;
};

// Stock In
export const createStockIn = async (data) => {
  const response = await api.post(
    "/inventory-transactions/stock-in",
    data
  );

  return response.data;
};

// Stock Out
export const createStockOut = async (data) => {
  const response = await api.post(
    "/inventory-transactions/stock-out",
    data
  );

  return response.data;
};

// Purchase History
export const getPurchaseHistory = async () => {
  const response = await api.get(
    "/inventory-transactions/purchases"
  );

  return response.data;
};