import api from "./axios";

// ==========================================
// GET ALL PAYROLLS
// GET /api/payroll
// ==========================================

export const getPayrolls = async () => {
  const response = await api.get("/payroll");
  return response.data;
};

// ==========================================
// GET SINGLE PAYROLL
// GET /api/payroll/:id
// ==========================================

export const getPayrollById = async (id) => {
  const response = await api.get(`/payroll/${id}`);
  return response.data;
};

// ==========================================
// GET EMPLOYEE PAYROLLS
// GET /api/payroll/employee/:employeeId
// ==========================================

export const getEmployeePayrolls = async (employeeId) => {
  const response = await api.get(
    `/payroll/employee/${employeeId}`
  );

  return response.data;
};

// ==========================================
// CREATE PAYROLL
// POST /api/payroll
// ==========================================

export const createPayroll = async (data) => {
  const response = await api.post("/payroll", data);
  return response.data;
};

// ==========================================
// UPDATE PAYROLL
// PUT /api/payroll/:id
// ==========================================

export const updatePayroll = async (id, data) => {
  const response = await api.put(`/payroll/${id}`, data);
  return response.data;
};

// ==========================================
// CANCEL PAYROLL
// PATCH /api/payroll/:id/cancel
// ==========================================

export const cancelPayroll = async (id, data = {}) => {
  const response = await api.patch(
    `/payroll/${id}/cancel`,
    data
  );

  return response.data;
};

// ==========================================
// GET MY PAYROLLS (Employee)
// GET /api/payroll/my
// ==========================================

export const getMyPayrolls = async () => {
  const response = await api.get("/payroll/my");
  return response.data;
};

// ==========================================
// GET MY PAYROLL BY ID (Employee)
// GET /api/payroll/my/:id
// ==========================================

export const getMyPayrollById = async (id) => {
  const response = await api.get(`/payroll/my/${id}`);
  return response.data;
};

// ==========================================
// MARK PAYROLL AS PAID (Admin)
// PATCH /api/payroll/:id/mark-paid
// ==========================================

export const markPayrollPaid = async (id, data = {}) => {
  const response = await api.patch(`/payroll/${id}/mark-paid`, data);
  return response.data;
};
