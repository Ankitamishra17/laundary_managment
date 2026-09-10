import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import sequelize from "./config/database.js";
import "./models/index.js";
import { ensureSchema } from "./utils/ensureSchema.js";
import superAdminSeeder from "./seeders/superAdminSeeder.js";
import seedDefaultServices from "./seeders/defaultServicesSeeder.js";
import { startSubscriptionExpiryJob } from "./jobs/subscriptionExpiry.job.js";



const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Check database connection
    await sequelize.authenticate();
    console.log(" Database Connected Successfully");

    // Create tables if they don't exist (must run first so the tables exist
    // before ensureSchema tries to alter them on a fresh database)
    // await sequelize.sync({ alter: true });
    await sequelize.sync();

    // Add any new columns to already-created tables (idempotent)
    await ensureSchema();

    console.log(" Tables synchronized successfully");

    await superAdminSeeder();

    // Give every shop with no catalog the standard services so customers
    // can order the full range (wash, iron, dry clean, ...).
    await seedDefaultServices();

    // Start subscription expiry notification job
    startSubscriptionExpiryJob();

    // Start server
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(" Database Connection Failed");
    console.error(error.message);
  }
};

startServer();
