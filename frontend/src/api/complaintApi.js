import api from "./axios";

export const submitComplaint = async (payload) => {
  const { data } = await api.post("/complaints", payload);
  return data;
};

export const getMyComplaints = async () => {
  const { data } = await api.get("/complaints/mine");
  return data;
};

export const customerReplyToComplaint = async (id, message) => {
  const { data } = await api.post(`/complaints/${id}/reply`, { message });
  return data;
};

export const getShopComplaints = async (params = {}) => {
  const { data } = await api.get("/complaints", { params });
  return data;
};

export const getComplaintStats = async () => {
  const { data } = await api.get("/complaints/stats");
  return data;
};

export const updateComplaintStatus = async (id, status) => {
  const { data } = await api.patch(`/complaints/${id}/status`, { status });
  return data;
};

export const assignComplaint = async (id, employee_id) => {
  const { data } = await api.patch(`/complaints/${id}/assign`, { employee_id });
  return data;
};

export const adminReplyToComplaint = async (id, message) => {
  const { data } = await api.post(`/complaints/${id}/reply`, { message });
  return data;
};

const complaintApi = {
  submitComplaint,
  getMyComplaints,
  customerReplyToComplaint,
  getShopComplaints,
  getComplaintStats,
  updateComplaintStatus,
  assignComplaint,
  adminReplyToComplaint,
};

export default complaintApi;
