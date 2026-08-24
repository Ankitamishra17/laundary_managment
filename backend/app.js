import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import serviceRoutes from "./routes/service.routes.js";
<<<<<<< HEAD
=======
import subscriptionRoutes from "./routes/subscription.routes.js";
import superadminReportRoutes from "./routes/superadminReport.routes.js";

import inventoryRoutes from "./routes/inventory.routes.js";
import inventoryTransactionRoutes from "./routes/inventoryTransaction.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";

>>>>>>> ankita
import adminEmployeeRoutes from "./routes/adminEmployee.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import taskRoutes from "./routes/task.routes.js";
import profileRoutes from "./routes/profile.route.js";
import verificationRoutes from "./routes/verification.js";
import attendanceRoutes from "./routes/attendance.routes.js";
<<<<<<< HEAD
import inventoryRoutes from "./routes/inventory.routes.js";
import inventoryTransactionRoutes from "./routes/inventoryTransaction.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import orderRoutes from "./routes/order.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
=======
import subscriptionNotificationRoutes from "./routes/subscriptionNotification.routes.js";
>>>>>>> ankita

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/auth", verificationRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/services", serviceRoutes);
<<<<<<< HEAD
=======
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/super/subscription-notifications",subscriptionNotificationRoutes,);
app.use("/api/superadmin/reports",superadminReportRoutes);

app.use("/api/inventory", inventoryRoutes);
app.use("/api/inventory-transactions", inventoryTransactionRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/payroll", payrollRoutes);

>>>>>>> ankita
app.use("/api/admin/employees", adminEmployeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/attendance", attendanceRoutes);
<<<<<<< HEAD
app.use("/api/inventory", inventoryRoutes);
app.use("/api/inventory-transactions",inventoryTransactionRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/notifications", notificationRoutes);
=======
>>>>>>> ankita

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: " Laundry Management Successfully Running.......",
  });
});

export default app;
