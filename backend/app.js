import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import adminEmployeeRoutes from "./routes/adminEmployee.routes.js";
import taskRoutes from "./routes/task.routes.js";
import profileRoutes from "./routes/profile.route.js";
import verificationRoutes from "./routes/verification.js";
import attendanceRoutes from "./routes/attendance.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/uploads", express.static(path.join(process.cwd(),"uploads"))

)

app.use("/api/auth", authRoutes);
app.use("/api/auth", verificationRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/admin/employees", adminEmployeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: " Laundry Management Successfully Runnig.......",
  });
});

export default app;
