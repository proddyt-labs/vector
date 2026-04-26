import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "vector", ts: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/tasks", tasksRoutes);

app.listen(PORT, () => {
  console.log(`[Vector API] running on port ${PORT}`);
});
