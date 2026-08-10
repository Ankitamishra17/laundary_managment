import sequelize from "../config/database.js";

// sequelize.sync() only creates tables that don't exist yet — it never adds
// columns to an already-created table. This helper adds any new columns the
// code expects, checking information_schema first so it's safe to run on
// every boot (no-op once the columns exist).
const REQUIRED_COLUMNS = {
  employees: [
    // Soft-delete gate — "inactive" employees are blocked from login and API
    { name: "status", ddl: "ENUM('active','inactive') NOT NULL DEFAULT 'active'" },
    { name: "is_phone_verified", ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
    { name: "email_otp", ddl: "VARCHAR(255) NULL" },
    { name: "email_otp_expires", ddl: "DATETIME NULL" },
    { name: "phone_otp", ddl: "VARCHAR(255) NULL" },
    { name: "phone_otp_expires", ddl: "DATETIME NULL" },
  ],
};

export async function ensureSchema() {
  for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
    const [rows] = await sequelize.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}'`,
    );
    const existing = new Set(rows.map((r) => r.COLUMN_NAME));

    for (const col of cols) {
      if (existing.has(col.name)) continue;
      await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col.name}\` ${col.ddl}`);
      console.log(`  + added column ${table}.${col.name}`);
    }
  }

  // If the users table was created before the model added the "super_admin"
  // role, the role ENUM rejects it and the super admin seeder silently fails
  // — which looks like "super admin login broken". sync() never alters an
  // existing column, so we migrate it here (idempotent).
  const [roleRows] = await sequelize.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
  );
  const roleType = roleRows[0]?.COLUMN_TYPE || "";
  if (roleType && !roleType.includes("super_admin")) {
    await sequelize.query(
      "ALTER TABLE `users` MODIFY COLUMN `role` ENUM('super_admin','admin','employee','customer') NOT NULL DEFAULT 'customer'",
    );
    console.log("  + updated users.role enum to include super_admin");
  }
}
