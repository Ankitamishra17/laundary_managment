import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import serviceRoutes from "./routes/service.routes.js";



const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/services", serviceRoutes);


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: " Laundry Management Successfully Runnig.......",
  });
});





export default app;
