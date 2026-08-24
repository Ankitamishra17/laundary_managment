import api from "./axios";

/* =====================================================
   CREATE PAYMENT
   POST /api/payments
   ===================================================== */

export const createPayment = async (paymentData) => {
  try {
    const { data } = await api.post("/payments", paymentData);

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to create payment.",
      }
    );
  }
};

/* =====================================================
   CREATE SUPPLIER PAYMENT
   POST /api/payments/supplier
   ===================================================== */

export const createSupplierPayment = async (paymentData) => {
  try {
    const { data } = await api.post("/payments/supplier", paymentData);

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to create supplier payment.",
      }
    );
  }
};

/* =====================================================
   GET ALL PAYMENTS
   GET /api/payments
   ===================================================== */

export const getPayments = async (params = {}) => {
  try {
    const { data } = await api.get("/payments", {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch payments.",
      }
    );
  }
};

/* =====================================================
   GET PAYMENT BY ID
   GET /api/payments/:id
   ===================================================== */

export const getPaymentById = async (id) => {
  try {
    const { data } = await api.get(`/payments/${id}`);

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch payment.",
      }
    );
  }
};

/* =====================================================
   UPDATE PAYMENT
   PUT /api/payments/:id
   ===================================================== */

export const updatePayment = async (id, paymentData) => {
  try {
    const { data } = await api.put(`/payments/${id}`, paymentData);

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to update payment.",
      }
    );
  }
};

/* =====================================================
   CANCEL PAYMENT
   PATCH /api/payments/:id/cancel
   ===================================================== */

export const cancelPayment = async (id) => {
  try {
    const { data } = await api.patch(`/payments/${id}/cancel`);

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to cancel payment.",
      }
    );
  }
};

/* =====================================================
   CUSTOMER PAYMENTS
   GET /api/payments/customer/:customerId
   ===================================================== */

export const getCustomerPayments = async (customerId, params = {}) => {
  try {
    const { data } = await api.get(`/payments/customer/${customerId}`, {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch customer payments.",
      }
    );
  }
};

/* =====================================================
   SUPPLIER PAYMENTS
   GET /api/payments/supplier/:supplierId
   ===================================================== */

export const getSupplierPayments = async (supplierId, params = {}) => {
  try {
    const { data } = await api.get(`/payments/supplier/${supplierId}`, {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch supplier payments.",
      }
    );
  }
};

/* =====================================================
   EMPLOYEE / SALARY PAYMENTS
   GET /api/payments/employee/:employeeId
   ===================================================== */

export const getEmployeePayments = async (employeeId, params = {}) => {
  try {
    const { data } = await api.get(`/payments/employee/${employeeId}`, {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch employee payments.",
      }
    );
  }
};

/* =====================================================
   SUBSCRIPTION PAYMENTS
   GET /api/payments/subscriptions
   ===================================================== */

export const getSubscriptionPayments = async (params = {}) => {
  try {
    const { data } = await api.get("/payments/subscriptions", {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch subscription payments.",
      }
    );
  }
};

/* =====================================================
   PAYMENT DASHBOARD
   GET /api/payments/dashboard
   ===================================================== */

export const getPaymentDashboard = async (params = {}) => {
  try {
    const { data } = await api.get("/payments/dashboard", {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch payment dashboard.",
      }
    );
  }
};

/* =====================================================
   PAYMENT SUMMARY
   GET /api/payments/summary
   ===================================================== */

export const getPaymentSummary = async (params = {}) => {
  try {
    const { data } = await api.get("/payments/summary", {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch payment summary.",
      }
    );
  }
};

/* =====================================================
   PAYMENT REPORT
   GET /api/payments/report
   ===================================================== */

export const getPaymentReport = async (params = {}) => {
  try {
    const { data } = await api.get("/payments/report", {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch payment report.",
      }
    );
  }
};

/* =====================================================
   FILTER PAYMENTS
   GET /api/payments
   ===================================================== */

export const filterPayments = async (filters = {}) => {
  try {
    const { data } = await api.get("/payments", {
      params: filters,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to filter payments.",
      }
    );
  }
};

/* =====================================================
   DEFAULT EXPORT
   ===================================================== */

const paymentApi = {
  createPayment,
  createSupplierPayment,

  getPayments,
  getPaymentById,

  updatePayment,
  cancelPayment,

  getCustomerPayments,
  getSupplierPayments,
  getEmployeePayments,
  getSubscriptionPayments,

  getPaymentDashboard,
  getPaymentSummary,
  getPaymentReport,

  filterPayments,
};

export default paymentApi;
