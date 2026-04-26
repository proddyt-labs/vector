import { Router } from "express";
import { requireAuth, getCurrentUser } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const user = getCurrentUser(req);
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      taskCount: p._count.tasks,
      createdAt: p.createdAt,
    }))
  );
});

router.post("/", async (req, res) => {
  const user = getCurrentUser(req);
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "name required" });
    return;
  }
  const project = await prisma.project.create({
    data: { name: name.trim(), description: description?.trim() ?? null, ownerId: user.id },
  });
  res.status(201).json({ id: project.id, name: project.name, description: project.description });
});

router.get("/:id/tasks", async (req, res) => {
  const user = getCurrentUser(req);
  const project = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: user.id } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(tasks);
});

router.post("/:id/tasks", async (req, res) => {
  const user = getCurrentUser(req);
  const project = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: user.id } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const { title, description } = req.body as { title?: string; description?: string };
  if (!title?.trim()) {
    res.status(400).json({ error: "title required" });
    return;
  }
  const task = await prisma.task.create({
    data: { title: title.trim(), description: description?.trim() ?? null, projectId: req.params.id },
  });
  res.status(201).json(task);
});

export default router;
