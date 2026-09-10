import sequelize from "../config/database.js";

// sequelize.sync() only creates tables that don't exist yet — it never adds
// columns to an already-created table. This helper adds any new columns the
// code expects, checking information_schema first so it's safe to run on
// every boot (no-op once the columns exist).
const REQUIRED_COLUMNS = {
  users: [
    // Customer / admin profile image (uploads/avatars/...)
    { name: "avatar", ddl: "VARCHAR(255) NULL" },
    // Soft-delete gate — "deleted" users are blocked from login and API
    { name: "isDeleted", ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
    // Password reset OTP (stored in plain — verified server-side only)
    { name: "resetOtp", ddl: "VARCHAR(255) NULL" },
    // OTP expiry timestamp
    { name: "resetOtpExpires", ddl: "DATETIME NULL" },
  ],
  employees: [
    // Soft-delete gate — "inactive" employees are blocked from login and API
    { name: "status", ddl: "ENUM('active','inactive') NOT NULL DEFAULT 'active'" },
    { name: "is_phone_verified", ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
    { name: "email_otp", ddl: "VARCHAR(255) NULL" },
    { name: "email_otp_expires", ddl: "DATETIME NULL" },
    { name: "phone_otp", ddl: "VARCHAR(255) NULL" },
    { name: "phone_otp_expires", ddl: "DATETIME NULL" },
  ],
  shops: [
    // Subscription plan (Free / Basic / Pro / Premium) with backend limits
    { name: "planName", ddl: "VARCHAR(50) NOT NULL DEFAULT 'Basic'" },
    // Tenant branding — each shop gets its own logo / favicon / brand colors
    { name: "logo", ddl: "VARCHAR(255) NULL" },
    { name: "favicon", ddl: "VARCHAR(255) NULL" },
    { name: "primaryColor", ddl: "VARCHAR(50) NULL" },
    { name: "secondaryColor", ddl: "VARCHAR(50) NULL" },
    // Customer-facing URL slug (e.g. /neha-laundry)
    { name: "slug", ddl: "VARCHAR(255) NULL" },
  ],
  orders: [
    // Customer order flow — pickup & delivery details
    { name: "pickup_address", ddl: "TEXT NULL" },
    { name: "delivery_address", ddl: "TEXT NULL" },
    { name: "delivery_note", ddl: "TEXT NULL" },
  ],
  order_items: [
    // Optional customer-supplied clothes label, e.g. "Shirt" / "Pant"
    { name: "item_label", ddl: "VARCHAR(150) NULL" },
  ],
  tasks: [
    // Lifecycle timestamps — track when a task started and completed
    { name: "started_at", ddl: "DATETIME NULL" },
    { name: "completed_at", ddl: "DATETIME NULL" },
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

  // Customers can now sign up without choosing a laundry, so their default
  // shop must be nullable. sync() won't alter an existing column, so migrate
  // it here (idempotent).
  const [custShopCols] = await sequelize.query(
    `SELECT IS_NULLABLE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'shopId'`,
  );
  if (custShopCols.length > 0 && custShopCols[0].IS_NULLABLE !== "YES") {
    await sequelize.query(
      "ALTER TABLE `customers` MODIFY COLUMN `shopId` INTEGER NULL",
    );
    console.log("  + updated customers.shopId to be nullable");
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

  // ============================================================
  // Services — fully dynamic catalog
  // ============================================================
  // category used to be a fixed ENUM; the shop admin can now enter any
  // category (Washing, Dry Cleaning, Shoe Cleaning, ...) so widen it to a
  // plain VARCHAR. No-op once it's already a string.
  const [svcCatRows] = await sequelize.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'category'`,
  );
  const svcCatType = svcCatRows[0]?.COLUMN_TYPE || "";
  if (svcCatType.toLowerCase().startsWith("enum")) {
    await sequelize.query(
      "ALTER TABLE `services` MODIFY COLUMN `category` VARCHAR(150) NOT NULL",
    );
    console.log("  + widened services.category to VARCHAR");
  }

  // pricingType is the customer-facing unit list. Old DBs were created with
  // ('Per Item','Per Kg','Fixed Price'); migrate to the full unit list and
  // remap the legacy "Fixed Price" value so the ALTER doesn't blank rows.
  const [svcTypeRows] = await sequelize.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'pricingType'`,
  );
  const svcType = svcTypeRows[0]?.COLUMN_TYPE || "";
  if (svcType && !svcType.includes("Per Piece")) {
    await sequelize.query(
      "UPDATE `services` SET `pricingType` = 'Fixed' WHERE `pricingType` = 'Fixed Price'",
    );
    await sequelize.query(
      "ALTER TABLE `services` MODIFY COLUMN `pricingType` ENUM('Per Kg','Per Piece','Per Pair','Per Item','Fixed') NOT NULL",
    );
    console.log("  + updated services.pricingType unit list");
  }

  // ============================================================
  // Tasks — unique constraint to prevent duplicate assignments
  // Must include shop_id for multi-tenant isolation.
  // ============================================================
  const [taskIdxRows] = await sequelize.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks'
       AND INDEX_NAME = 'unique_shop_order_task_employee'`
  );
  if (taskIdxRows.length === 0) {
    await sequelize.query(
      `ALTER TABLE tasks
       ADD UNIQUE INDEX unique_shop_order_task_employee
       (shop_id, order_id, task_type, employee_id)`
    );
    console.log("  + added unique index tasks(shop_id, order_id, task_type, employee_id)");
  }
}
