import api from "./axios";

// =====================================================
// GET COMPLETE ADMIN DASHBOARD DATA
// GET /api/admin/dashboard
// =====================================================

export const getAdminDashboard = async () => {
  try {
    const response = await api.get("/admin/dashboard");

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching admin dashboard:",
      error.response?.data || error.message,
    );

    throw error;
  }
};
