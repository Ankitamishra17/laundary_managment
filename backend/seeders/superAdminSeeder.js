import bcrypt from "bcrypt";
import User from "../models/User.js";

const seedSuperAdmin = async () => {
  try {
    const {
      SUPER_ADMIN_EMAIL,
      SUPER_ADMIN_PASSWORD,
      SUPER_ADMIN_NAME,
      SUPER_ADMIN_PHONE,
    } = process.env;

    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
      console.error(
        " Super Admin Seeder skipped: SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD are not set in .env"
      );
      return;
    }

    // Check by login email — the seeder must guarantee the email in .env
    // can actually log in. (Checking by role only would skip creation when a
    // super_admin exists under a different email, silently breaking login.)
    const existingAdmin = await User.findOne({
      where: { email: SUPER_ADMIN_EMAIL },
    });

    if (existingAdmin) {
      if (existingAdmin.role !== "super_admin") {
        console.warn(
          ` Super Admin Seeder: ${SUPER_ADMIN_EMAIL} already exists but has role "${existingAdmin.role}" — super admin login will not work for this email.`
        );
        return;
      }
      if (!existingAdmin.isActive) {
        console.warn(
          ` Super Admin Seeder: ${SUPER_ADMIN_EMAIL} exists but is deactivated (isActive=false). Reactivate it in the users table to allow login.`
        );
        return;
      }
      console.log(" Super Admin already exists.");
      return;
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    // Create Super Admin
    await User.create({
      name: SUPER_ADMIN_NAME || "Super Admin",
      email: SUPER_ADMIN_EMAIL,
      phone: SUPER_ADMIN_PHONE || null,
      password: hashedPassword,
      role: "super_admin",
      shopId: null,
      isActive: true,
      // Super admins sign in directly to the dashboard — don't force the
      // "create a new password" flow on them.
      mustChangePassword: false,
    });

    console.log(" Super Admin created successfully.");
  } catch (error) {
    console.error(" Super Admin Seeder Error:", error.message);
  }
};

export default seedSuperAdmin;