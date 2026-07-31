import bcrypt from "bcrypt";
import User from "../models/User.js";

const seedSuperAdmin = async () => {
  try {
    // Check if Super Admin already exists
    const existingAdmin = await User.findOne({
      where: {
        role: "super_admin",
      },
    });

    if (existingAdmin) {
      console.log(" Super Admin already exists.");
      return;
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      10
    );

    // Create Super Admin
    await User.create({
      name: process.env.SUPER_ADMIN_NAME,
      email: process.env.SUPER_ADMIN_EMAIL,
      phone: process.env.SUPER_ADMIN_PHONE,
      password: hashedPassword,
      role: "super_admin",
      shopId: null,
      isActive: true,
    });

    console.log(" Super Admin created successfully.");
  } catch (error) {
    console.error(" Super Admin Seeder Error:", error.message);
  }
};

export default seedSuperAdmin;