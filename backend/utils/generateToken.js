import jwt from "jsonwebtoken";

// type: "user" (users table — super_admin/admin/customer) or "employee" (employees table)
const generateToken = (user, type = "user") => {
  return jwt.sign(
    {
      id: user.id,
      shopId: user.shopId ?? user.shop_id ?? null,
      role: user.role,
      type,
    },
    process.env.JWT_SECRET,
    {
      // Fallback keeps tokens working even if JWT_EXPIRES_IN is unset on a
      // fresh setup. Set to 30 days in .env to reduce forced re-logins.
      expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    }
  );
};

export default generateToken;
