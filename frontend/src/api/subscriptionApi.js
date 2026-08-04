import api from "./axios";

/**
 * ==============================
 * Create Subscription
 * POST /subscriptions
 * ==============================
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const { data } = await api.post(
      "/subscriptions",
      subscriptionData
    );

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to create subscription.",
      }
    );
  }
};

/**
 * ==============================
 * Get All Subscriptions
 * GET /subscriptions
 * ==============================
 */
export const getSubscriptions = async () => {
  try {
    const { data } = await api.get("/subscriptions");

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch subscriptions.",
      }
    );
  }
};

/**
 * ==============================
 * Get Subscription By ID
 * GET /subscriptions/:id
 * ==============================
 */
export const getSubscriptionById = async (id) => {
  try {
    const { data } = await api.get(`/subscriptions/${id}`);

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Subscription not found.",
      }
    );
  }
};

/**
 * ==============================
 * Get Shop Subscription History
 * GET /subscriptions/shop/:shopId
 * ==============================
 */
export const getShopSubscriptions = async (shopId) => {
  try {
    const { data } = await api.get(
      `/subscriptions/shop/${shopId}`
    );

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch subscription history.",
      }
    );
  }
};

/**
 * ==============================
 * Renew Subscription
 * PUT /subscriptions/:id/renew
 * ==============================
 */
export const renewSubscription = async (id, payload) => {
  try {
    const { data } = await api.put(
      `/subscriptions/${id}/renew`,
      payload
    );

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to renew subscription.",
      }
    );
  }
};

/**
 * Cancel Subscription
 * PUT /subscriptions/:id/cancel
 */
export const cancelSubscription = async (id) => {
  try {
    const { data } = await api.put(
      `/subscriptions/${id}/cancel`
    );

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to cancel subscription.",
      }
    );
  }
};