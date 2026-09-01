import api from "./axios";

export const submitReview = async (payload) => {
  const { data } = await api.post("/reviews", payload);
  return data;
};

export const getMyReviews = async () => {
  const { data } = await api.get("/reviews/mine");
  return data;
};

export const deleteMyReview = async (id) => {
  const { data } = await api.delete(`/reviews/${id}`);
  return data;
};

export const getShopReviews = async () => {
  const { data } = await api.get("/reviews");
  return data;
};

export const getReviewStats = async () => {
  const { data } = await api.get("/reviews/stats");
  return data;
};

export const replyToReview = async (id, reply) => {
  const { data } = await api.post(`/reviews/${id}/reply`, { reply });
  return data;
};

const reviewApi = {
  submitReview,
  getMyReviews,
  deleteMyReview,
  getShopReviews,
  getReviewStats,
  replyToReview,
};

export default reviewApi;
