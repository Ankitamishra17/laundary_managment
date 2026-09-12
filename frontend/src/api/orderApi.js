import api from "./axios";

/**
 * Place a new order as a customer. The customer's own shopId is used
 * server-side; the payload keeps it for compatibility.
 * payload: { shopId, pickupDate, pickupTime, pickupAddress,
 *            deliveryAddress, deliveryDate, deliveryNote,
 *            items: [{ serviceId, quantity, itemLabel }] }
 */
export const createOrder = async (payload) => {
  const response = await api.post("/orders", payload);
  return response.data;
};

/** Fetch the logged-in customer's orders (newest first). */
export const getMyOrders = async () => {
  const response = await api.get("/orders/mine");
  return response.data;
};

/** Fetch a single order that belongs to the logged-in customer. */
export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

/** Cancel a pending order. */
export const cancelOrder = async (id) => {
  const response = await api.patch(`/orders/${id}/cancel`);
  return response.data;
};

/** Admin — all orders of the logged-in shop (optional status filter). */
export const getShopOrders = async (params = {}) => {
  const response = await api.get("/orders", { params });
  return response.data;
};

/** Admin — quick order stats for the logged-in shop. */
export const getOrderStats = async () => {
  const response = await api.get("/orders/stats");
  return response.data;
};

/** Admin — update an order's status. */
export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

/** Admin — update an order's payment status. */
export const updateOrderPaymentStatus = async (id, payment_status) => {
  const response = await api.patch(`/orders/${id}/payment`, { payment_status });
  return response.data;
};

/** Customer — reorder a delivered order. */
export const reorderOrder = async (id) => {
  const response = await api.post(`/orders/${id}/reorder`);
  return response.data;
};
