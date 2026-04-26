import { Router } from "express";
import { requireAuth, getCurrentUser } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.use(requireAuth);

const TASK_INCLUDE = {
  createdBy: { select: { username: true } },
  lastEditedBy: { select: { username: true } },
} as const;

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

router.delete("/:id", async (req, res) => {
  const user = getCurrentUser(req);
  const project = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: user.id } });
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get("/:id/tasks", async (req, res) => {
  const user = getCurrentUser(req);
  const project = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: user.id } });
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.id },
    include: TASK_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  res.json(tasks.map(serializeTask));
});

router.post("/:id/tasks", async (req, res) => {
  const user = getCurrentUser(req);
  const project = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: user.id } });
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const { title, description } = req.body as { title?: string; description?: string };
  if (!title?.trim()) { res.status(400).json({ error: "title required" }); return; }
  const task = await prisma.task.create({
    data: { title: title.trim(), description: description?.trim() ?? null, projectId: req.params.id, createdById: user.id },
    include: TASK_INCLUDE,
  });
  res.status(201).json(serializeTask(task));
});

function serializeTask(task: any) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    projectId: task.projectId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdBy: task.createdBy?.username ?? null,
    lastEditedBy: task.lastEditedBy?.username ?? null,
  };
}

export default router;
