import api from "./axios";

// Create Purchase
export const createPurchase = async (purchaseData) => {
  try {
    const { data } = await api.post("/purchases", purchaseData);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to create purchase.",
      }
    );
  }
};

// Get all purchases
export const getPurchases = async (params = {}) => {
  try {
    const { data } = await api.get("/purchases", {
      params,
    });
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch purchases.",
      }
    );
  }
};

// Get purchase by ID
export const getPurchaseById = async (id) => {
  try {
    const { data } = await api.get(`/purchases/${id}`);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch purchase.",
      }
    );
  }
};

// Update purchase
export const updatePurchase = async (id, purchaseData) => {
  try {
    const { data } = await api.put(
      `/purchases/${id}`,
      purchaseData
    );
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to update purchase.",
      }
    );
  }
};

// Cancel purchase
export const cancelPurchase = async (id) => {
  try {
    const { data } = await api.patch(
      `/purchases/${id}/cancel`
    );
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to cancel purchase.",
      }
    );
  }
};

// Delete purchase
export const deletePurchase = async (id) => {
  try {
    const { data } = await api.delete(`/purchases/${id}`);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to delete purchase.",
      }
    );
  }
};

// Purchases by supplier
export const getPurchasesBySupplier = async (
  supplierId,
  params = {}
) => {
  try {
    const { data } = await api.get(
      `/purchases/supplier/${supplierId}`,
      {
        params,
      }
    );

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch supplier purchases.",
      }
    );
  }
};