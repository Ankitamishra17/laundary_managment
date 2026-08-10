import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import inventoryTransactionRoutes from "./routes/inventoryTransaction.routes.js";
import supplierRoutes from "./routes/supplier.routes.js"


const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/inventory-transactions",inventoryTransactionRoutes);
app.use("/api/suppliers", supplierRoutes);


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: " Laundry Management Successfully Runnig.......",
  });
});





export default app;
