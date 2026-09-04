import api from "./axios";

/**
 * Generate an invoice for an order.
 * POST /api/invoices/generate/:orderId
 */
export const generateInvoice = async (orderId, data = {}) => {
  const response = await api.post(`/invoices/generate/${orderId}`, data);
  return response.data;
};

/**
 * Get the logged-in customer's invoices.
 * GET /api/invoices/my
 */
export const getMyInvoices = async () => {
  const response = await api.get("/invoices/my");
  return response.data;
};

/**
 * Get all invoices for admin's shop (with optional filters).
 * GET /api/invoices/admin
 */
export const getAdminInvoices = async (params = {}) => {
  const response = await api.get("/invoices/admin", { params });
  return response.data;
};

/**
 * Get all tenant invoices (super admin only).
 * GET /api/invoices/all
 */
export const getAllTenantInvoices = async (params = {}) => {
  const response = await api.get("/invoices/all", { params });
  return response.data;
};

/**
 * Get a single invoice by ID.
 * GET /api/invoices/:id
 */
export const getInvoiceById = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

/**
 * Update invoice details (admin only).
 * PATCH /api/invoices/:id
 */
export const updateInvoice = async (id, data = {}) => {
  const response = await api.patch(`/invoices/${id}`, data);
  return response.data;
};

/**
 * Mark an invoice as paid (admin only).
 * PATCH /api/invoices/:id/pay
 */
export const payInvoice = async (id, data = {}) => {
  const response = await api.patch(`/invoices/${id}/pay`, data);
  return response.data;
};

/**
 * Get invoice statistics for admin dashboard.
 * GET /api/invoices/stats
 */
export const getInvoiceStats = async () => {
  const response = await api.get("/invoices/stats");
  return response.data;
};
