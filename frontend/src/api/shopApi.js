import api from "./axios";

/**
 * ===============================
 * PUBLIC — LIST ACTIVE SHOPS
 * GET /api/shops/public
 * ===============================
 */
export const getPublicShops = async () => {
  try {
    const { data } = await api.get("/shops/public");
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to fetch laundries.",
      }
    );
  }
};

/**
 * ===============================
 * PUBLIC — GET SHOP BY SLUG
 * GET /api/shops/slug/:slug
 *
 * Example:
 * getShopBySlug("amisha-laundry")
 * ===============================
 */
export const getShopBySlug = async (slug) => {
  try {
    const { data } = await api.get(`/shops/slug/${encodeURIComponent(slug)}`);

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to find this laundry.",
      }
    );
  }
};

/**
 * ===============================
 * PUBLIC — ACTIVE SERVICES OF ONE SHOP
 * GET /api/shops/public/:id/services
 * ===============================
 */
export const getPublicShopServices = async (shopId) => {
  try {
    const { data } = await api.get(`/shops/public/${shopId}/services`);

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to fetch services.",
      }
    );
  }
};

/**
 * ===============================
 * CUSTOMER — MY SHOP CONTEXT
 * GET /api/shops/context
 * Returns { shop, services }
 * ===============================
 */
export const getMyShopContext = async () => {
  try {
    const { data } = await api.get("/shops/context");
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to load the laundry.",
      }
    );
  }
};

/**
 * ===============================
 * CREATE SHOP
 * POST /api/shops
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
 * GET /api/shops
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
 * GET /api/shops/:id
 *
 * Admin / Super Admin use
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
 * PUT /api/shops/:id
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
 * DELETE /api/shops/:id
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
 *
 * NOTE:
 * This requires the backend route:
 * PUT /api/shops/:id/renew
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
 *
 * NOTE:
 * This requires the backend route:
 * PATCH /api/shops/:id/status
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
