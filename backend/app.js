import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { swaggerUi, swaggerDocs } from "./openapi/index.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bloodLabRoutes from "./routes/bloodLabRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173,http://localhost,http://127.0.0.1")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api/auth", authRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/facility", facilityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blood-lab", bloodLabRoutes);
app.use("/api/hospital", hospitalRoutes);

export default app;
