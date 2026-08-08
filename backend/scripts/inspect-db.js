import dotenv from "dotenv";
dotenv.config();

import sequelize from "../config/database.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Employee from "../models/Employee.js";
import "../models/index.js";

async function main() {
  await sequelize.authenticate();
  console.log("== DB CONNECTED ==");

  // Show actual column schema of relevant tables
  const [userCols] = await sequelize.query("SHOW COLUMNS FROM users");
  console.log("\n== USERS TABLE COLUMNS ==");
  for (const c of userCols) console.log(c.Field, "|", c.Type, "| default:", c.Default);

  const [shopCols] = await sequelize.query("SHOW COLUMNS FROM shops");
  console.log("\n== SHOPS TABLE COLUMNS ==");
  for (const c of shopCols) console.log(c.Field, "|", c.Type, "| default:", c.Default);

  const [empCols] = await sequelize.query("SHOW COLUMNS FROM employees");
  console.log("\n== EMPLOYEES TABLE COLUMNS ==");
  for (const c of empCols) console.log(c.Field, "|", c.Type, "| default:", c.Default);

  const users = await User.findAll({ attributes: ["id", "name", "email", "role", "isActive", "shopId"] });
  console.log("\n== USERS ==");
  for (const u of users) console.log(JSON.stringify(u.toJSON()));

  const shops = await Shop.findAll({ attributes: ["id", "shopCode", "name", "email", "subscriptionStatus", "isActive"] });
  console.log("\n== SHOPS ==");
  for (const s of shops) console.log(JSON.stringify(s.toJSON()));

  const employees = await Employee.findAll({ attributes: ["id", "name", "email", "designation", "status", "shop_id"] });
  console.log("\n== EMPLOYEES ==");
  for (const e of employees) console.log(JSON.stringify(e.toJSON()));

  await sequelize.close();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
