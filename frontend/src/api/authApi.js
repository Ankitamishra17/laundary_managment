import api from "./axios";

// Customer sign-up (creates account, returns token + user)
export const registerUser = async (signupData) => {
  const response = await api.post("/auth/register", signupData);
  return response.data;
};

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
// Forgot Password — request a reset OTP by email
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

// Verify the reset OTP — returns a short-lived reset token on success
export const verifyResetOtp = async (email, otp) => {
  const response = await api.post("/auth/verify-reset-otp", { email, otp });
  return response.data;
};

// Set the new password using the reset token
export const resetPassword = async (token, newPassword, confirmPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    newPassword,
    confirmPassword,
  });
  return response.data;
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
