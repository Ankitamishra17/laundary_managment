import api from "./axios";

export const submitComplaint = async (payload, imageFile) => {
  if (imageFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        formData.append(key, val);
      }
    });
    formData.append("image", imageFile);
    const { data } = await api.post("/complaints", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
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
  const { data } = await api.post(`/complaints/${id}/admin-reply`, { message });
  return data;
};

// Employee complaint APIs
export const getMyAssignedComplaints = async () => {
  const { data } = await api.get("/complaints/my-assigned");
  return data;
};

export const resolveComplaint = async (id, resolution_note) => {
  const { data } = await api.patch(`/complaints/${id}/resolve`, { resolution_note });
  return data;
};

export const employeeReplyToComplaint = async (id, message) => {
  const { data } = await api.post(`/complaints/${id}/employee-reply`, { message });
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
  getMyAssignedComplaints,
  resolveComplaint,
  employeeReplyToComplaint,
};

export default complaintApi;
