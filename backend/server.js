import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import sequelize from "./config/database.js";
import "./models/index.js";
import superAdminSeeder from "./seeders/superAdminSeeder.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Check database connection
    await sequelize.authenticate();
    console.log(" Database Connected Successfully");

    // Create tables if they don't exist
    // await sequelize.sync({ alter: true });
    await sequelize.sync();

    console.log(" Tables synchronized successfully");

    await superAdminSeeder();
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
