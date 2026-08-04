import api from "./axios";

/**
 * ===============================
 * CREATE SHOP
 * ===============================
 */
export const createShop = async (shopData) => {
  try {
    const { data } = await api.post("/shops", shopData);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to create shop.",
      }
    );
  }
};

/**
 * ===============================
 * GET ALL SHOPS
 * ===============================
 */
export const getShops = async (params = {}) => {
  try {
    const { data } = await api.get("/shops", {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to fetch shops.",
      }
    );
  }
};

/**
 * ===============================
 * GET SHOP BY ID
 * ===============================
 */
export const getShopById = async (id) => {
  try {
    const { data } = await api.get(`/shops/${id}`);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to fetch shop.",
      }
    );
  }
};

/**
 * ===============================
 * UPDATE SHOP
 * ===============================
 */
export const updateShop = async (id, shopData) => {
  try {
    const { data } = await api.put(`/shops/${id}`, shopData);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to update shop.",
      }
    );
  }
};

/**
 * ===============================
 * DELETE SHOP
 * ===============================
 */
export const deleteShop = async (id) => {
  try {
    const { data } = await api.delete(`/shops/${id}`);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to delete shop.",
      }
    );
  }
};

/**
 * ===============================
 * RENEW SUBSCRIPTION
 * ===============================
 */
export const renewSubscription = async (id, payload) => {
  try {
    const { data } = await api.put(`/shops/${id}/renew`, payload);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to renew subscription.",
      }
    );
  }
};

/**
 * ===============================
 * ACTIVATE / DEACTIVATE SHOP
 * ===============================
 */
export const toggleShopStatus = async (id) => {
  try {
    const { data } = await api.patch(`/shops/${id}/status`);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to change shop status.",
      }
    );
  }
};