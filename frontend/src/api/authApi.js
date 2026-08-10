import api from "./axios";

// Login
export const loginUser = async (loginData) => {
  const response = await api.post("/auth/login", loginData);
  return response.data;
};

// Create Password (First Login)
export const createPassword = async (passwordData) => {
  const response = await api.post("/auth/create-password", passwordData);
  return response.data;
};
// Logout
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
