import { Router } from "express";
import { requireAuth, getCurrentUser } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const VALID_STATUSES = ["BACKLOG", "IN_PROGRESS", "DONE", "CANCELLED"] as const;

const router = Router();

router.use(requireAuth);

router.patch("/:id", async (req, res) => {
  const user = getCurrentUser(req);
  const { status, title, description } = req.body as { status?: string; title?: string; description?: string };

  const task = await prisma.task.findFirst({
    where: { id: req.params.id, project: { ownerId: user.id } },
  });
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  const data: Record<string, unknown> = { lastEditedById: user.id };

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
      return;
    }
    data.status = status;
  }
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description.trim() || null;

  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data,
    include: {
      createdBy: { select: { username: true } },
      lastEditedBy: { select: { username: true } },
    },
  });

  res.json({
    id: updated.id,
    title: updated.title,
    description: updated.description,
    status: updated.status,
    projectId: updated.projectId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    createdBy: updated.createdBy?.username ?? null,
    lastEditedBy: updated.lastEditedBy?.username ?? null,
  });
});

router.delete("/:id", async (req, res) => {
  const user = getCurrentUser(req);
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, project: { ownerId: user.id } },
  });
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  await prisma.task.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
