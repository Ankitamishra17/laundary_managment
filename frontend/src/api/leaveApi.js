import api from "./axios";

export const applyLeave = async (payload) => {
  const { data } = await api.post("/leaves", payload);
  return data;
};

export const getMyLeaves = async () => {
  const { data } = await api.get("/leaves/mine");
  return data;
};

export const getShopLeaves = async (params = {}) => {
  const { data } = await api.get("/leaves", { params });
  return data;
};

export const getLeaveStats = async () => {
  const { data } = await api.get("/leaves/stats");
  return data;
};

export const reviewLeave = async (id, payload) => {
  const { data } = await api.patch(`/leaves/${id}`, payload);
  return data;
};

const leaveApi = {
  applyLeave,
  getMyLeaves,
  getShopLeaves,
  getLeaveStats,
  reviewLeave,
};

export default leaveApi;
