import api from "./axios";

// ============================================
// GET ALL EMPLOYEES
// GET /api/admin/employees
// ============================================

export const getEmployees = async () => {
  const response = await api.get("/admin/employees");
  return response.data;
};

// ============================================
// GET SINGLE EMPLOYEE
// GET /api/admin/employees/:id
// ============================================

export const getEmployeeById = async (id) => {
  const response = await api.get(`/admin/employees/${id}`);
  return response.data;
};

export default {
  getEmployees,
  getEmployeeById,
};