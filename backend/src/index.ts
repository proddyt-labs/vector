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

// --- Internal widget endpoints (Gate only, no public access) ---
app.get("/internal/widget/projects", async (req, res) => {
  const gateId = req.query.gateId as string;
  if (!gateId) { res.status(400).json({ error: "gateId required" }); return; }
  const { prisma } = await import("./lib/prisma.js");
  const user = await prisma.user.findUnique({ where: { gateId } });
  if (!user) { res.json([]); return; }
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(projects);
});

app.get("/internal/widget/projects/:id/tasks", async (req, res) => {
  const gateId = req.query.gateId as string;
  if (!gateId) { res.status(400).json({ error: "gateId required" }); return; }
  const { prisma } = await import("./lib/prisma.js");
  const user = await prisma.user.findUnique({ where: { gateId } });
  if (!user) { res.json([]); return; }
  const project = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: user.id } });
  if (!project) { res.status(404).json({ error: "not_found" }); return; }
  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.id, status: { not: "CANCELLED" } },
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(tasks);
});

app.patch("/internal/widget/tasks/:id", async (req, res) => {
  const gateId = req.query.gateId as string;
  if (!gateId) { res.status(400).json({ error: "gateId required" }); return; }
  const { status } = req.body as { status?: string };
  const VALID = ["BACKLOG", "IN_PROGRESS", "DONE", "CANCELLED"];
  if (!status || !VALID.includes(status)) { res.status(400).json({ error: "invalid status" }); return; }
  const { prisma } = await import("./lib/prisma.js");
  const user = await prisma.user.findUnique({ where: { gateId } });
  if (!user) { res.status(404).json({ error: "user_not_found" }); return; }
  const task = await prisma.task.findFirst({ where: { id: req.params.id, project: { ownerId: user.id } } });
  if (!task) { res.status(404).json({ error: "not_found" }); return; }
  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: { status, lastEditedById: user.id },
    select: { id: true, status: true },
  });
  res.json(updated);
});

app.listen(PORT, () => {
  console.log(`[Vector API] running on port ${PORT}`);
});
