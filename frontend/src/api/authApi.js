// import api from "./axios";

// // Customer sign-up (creates account, returns token + user)
// export const registerUser = async (signupData) => {
//   const response = await api.post("/auth/register", signupData);
//   return response.data;
// };

// // Login
// export const loginUser = async (loginData) => {
//   const response = await api.post("/auth/login", loginData);
//   return response.data;
// };

// // Create Password (First Login)
// export const createPassword = async (passwordData) => {
//   const response = await api.post("/auth/create-password", passwordData);
//   return response.data;
// };
// // Forgot Password — request a reset OTP by email
// export const forgotPassword = async (email) => {
//   const response = await api.post("/auth/forgot-password", { email });
//   return response.data;
// };

// // Verify the reset OTP — returns a short-lived reset token on success
// export const verifyResetOtp = async (email, otp) => {
//   const response = await api.post("/auth/verify-reset-otp", { email, otp });
//   return response.data;
// };

// // Set the new password using the reset token
// export const resetPassword = async (token, newPassword, confirmPassword) => {
//   const response = await api.post("/auth/reset-password", {
//     token,
//     newPassword,
//     confirmPassword,
//   });
//   return response.data;
// };

// // Logout
// export const logoutUser = () => {
//   localStorage.removeItem("token");
//   localStorage.removeItem("user");
// };


import api from "./axios";

// ============================================================
// CUSTOMER SIGN UP
// Creates account and returns token + user
// ============================================================

export const registerUser = async (signupData) => {
  const response = await api.post(
    "/auth/register",
    signupData
  );

  return response.data;
};

// ============================================================
// GLOBAL LOGIN
// Super Admin / Admin
//
// POST /api/auth/login
// ============================================================

export const loginUser = async (loginData) => {
  const response = await api.post(
    "/auth/login",
    loginData
  );

  return response.data;
};

// ============================================================
// SHOP LOGIN
// Customer / Employee
//
// POST /api/auth/shop/:slug/login
//
// Example:
// /api/auth/shop/my-laundry/login
// ============================================================

export const shopLoginUser = async (
  slug,
  loginData
) => {
  const response = await api.post(
    `/auth/shop/${encodeURIComponent(slug)}/login`,
    loginData
  );

  return response.data;
};

// ============================================================
// CREATE / CHANGE PASSWORD
// First Login / Logged-in User
//
// POST /api/auth/create-password
// ============================================================

export const createPassword = async (
  passwordData
) => {
  const response = await api.post(
    "/auth/create-password",
    passwordData
  );

  return response.data;
};

// ============================================================
// FORGOT PASSWORD
//
// slug is optional.
//
// Admin:
// forgotPassword(email)
//
// Customer:
// forgotPassword(email, slug)
// ============================================================

export const forgotPassword = async (
  email,
  slug = null
) => {
  const response = await api.post(
    "/auth/forgot-password",
    {
      email,
      ...(slug ? { slug } : {}),
    }
  );

  return response.data;
};

// ============================================================
// VERIFY RESET OTP
//
// Customer:
// verifyResetOtp(email, otp, slug)
//
// Admin:
// verifyResetOtp(email, otp)
// ============================================================

export const verifyResetOtp = async (
  email,
  otp,
  slug = null
) => {
  const response = await api.post(
    "/auth/verify-reset-otp",
    {
      email,
      otp,
      ...(slug ? { slug } : {}),
    }
  );

  return response.data;
};

// ============================================================
// RESET PASSWORD
//
// New backend expects:
// email
// otp
// newPassword
// confirmPassword
// slug (optional)
// ============================================================

export const resetPassword = async (
  email,
  otp,
  newPassword,
  confirmPassword,
  slug = null
) => {
  const response = await api.post(
    "/auth/reset-password",
    {
      email,
      otp,
      newPassword,
      confirmPassword,
      ...(slug ? { slug } : {}),
    }
  );

  return response.data;
};

// ============================================================
// GET CURRENT USER
//
// GET /api/auth/me
// ============================================================

export const getMe = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

// ============================================================
// LOGOUT
// ============================================================

export const logoutUser = async () => {
  try {
    // Optional backend logout
    await api.post("/auth/logout");
  } catch (error) {
    // Even if backend logout fails,
    // local authentication should still be removed.
    console.warn(
      "Logout API failed:",
      error?.response?.data?.message ||
        error?.message
    );
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
