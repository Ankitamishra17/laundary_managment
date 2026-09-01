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
   CREATE EMPLOYEE SALARY PAYMENT
   POST /api/payments/employee
   ===================================================== */

export const createEmployeePayment = async (paymentData) => {
  try {
    const { data } = await api.post("/payments/employee", paymentData);
    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to create employee salary payment.",
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
   EMPLOYEE PAYMENTS
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
// Get Employee Payroll 

export const getEmployeePayrolls = async (employeeId, params = {}) => {
  try {
    const { data } = await api.get(`/payrolls/employee/${employeeId}`, {
      params,
    });

    return data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch employee payrolls.",
      }
    );
  }
};

/* =====================================================
   PAYMENT REPORT
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
   DEFAULT EXPORT
   ===================================================== */

const paymentApi = {
  createPayment,
  createEmployeePayment,
  createSupplierPayment,

  getPayments,
  getPaymentById,

  updatePayment,
  cancelPayment,

  getCustomerPayments,
  getSupplierPayments,
  getEmployeePayments,

  getEmployeePayrolls,
  getSubscriptionPayments,

  getPaymentDashboard,
  getPaymentSummary,
  getPaymentReport,
};

export default paymentApi;
